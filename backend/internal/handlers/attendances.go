package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"aguasdeoxum/backend/internal/db"
)

type Attendance struct {
	ID         string    `json:"id"`
	VisitorID  string    `json:"visitor_id"`
	SessionID  string    `json:"session_id"`
	TicketType string    `json:"ticket_type"`
	CreatedAt  time.Time `json:"created_at"`
	Visitor    *Visitor  `json:"visitor,omitempty"`
}

func CreateAttendance(w http.ResponseWriter, r *http.Request) {
	var body struct {
		VisitorID  string `json:"visitor_id"`
		SessionID  string `json:"session_id"`
		TicketType string `json:"ticket_type"` // none | pass | consultation
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// Verificar duplicata na sessão
	var exists bool
	db.Pool.QueryRow(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM attendances WHERE visitor_id=$1 AND session_id=$2)",
		body.VisitorID, body.SessionID,
	).Scan(&exists)
	if exists {
		http.Error(w, "visitor already registered in this session", http.StatusConflict)
		return
	}

	if body.TicketType == "consultation" {
		// Verificar se recebeu ficha de consulta nos últimos 7 dias
		var recentConsultation bool
		db.Pool.QueryRow(r.Context(),
			`SELECT EXISTS(
				SELECT 1 FROM attendances
				WHERE visitor_id=$1 AND ticket_type='consultation'
				AND created_at >= NOW() - INTERVAL '7 days'
			)`, body.VisitorID,
		).Scan(&recentConsultation)
		if recentConsultation {
			http.Error(w, "visitor already received consultation ticket this week", http.StatusUnprocessableEntity)
			return
		}

		// Verificar disponibilidade de fichas
		var available, used int
		db.Pool.QueryRow(r.Context(),
			"SELECT consultation_tickets_available, consultation_tickets_used FROM sessions WHERE id=$1",
			body.SessionID,
		).Scan(&available, &used)
		if used >= available {
			http.Error(w, "no consultation tickets available", http.StatusUnprocessableEntity)
			return
		}

		// Incrementar fichas usadas
		db.Pool.Exec(r.Context(),
			"UPDATE sessions SET consultation_tickets_used = consultation_tickets_used + 1 WHERE id=$1",
			body.SessionID,
		)
	}

	var a Attendance
	err := db.Pool.QueryRow(r.Context(),
		`INSERT INTO attendances (visitor_id, session_id, ticket_type)
		 VALUES ($1, $2, $3) RETURNING id, visitor_id, session_id, ticket_type, created_at`,
		body.VisitorID, body.SessionID, body.TicketType,
	).Scan(&a.ID, &a.VisitorID, &a.SessionID, &a.TicketType, &a.CreatedAt)

	if err != nil {
		http.Error(w, "could not register attendance", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

func GetAttendanceHistory(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		http.Error(w, "phone is required", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(r.Context(),
		`SELECT a.id, a.visitor_id, a.session_id, a.ticket_type, a.created_at,
		        v.name, v.phone
		 FROM attendances a
		 JOIN visitors v ON v.id = a.visitor_id
		 WHERE v.phone = $1
		 ORDER BY a.created_at DESC`, phone,
	)
	if err != nil {
		http.Error(w, "could not fetch history", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	result := []Attendance{}
	for rows.Next() {
		var a Attendance
		var v Visitor
		rows.Scan(&a.ID, &a.VisitorID, &a.SessionID, &a.TicketType, &a.CreatedAt, &v.Name, &v.Phone)
		a.Visitor = &v
		result = append(result, a)
	}

	json.NewEncoder(w).Encode(result)
}

func GetSessionAttendances(w http.ResponseWriter, r *http.Request) {
	sessionID := r.PathValue("id")

	rows, err := db.Pool.Query(r.Context(),
		`SELECT a.id, a.visitor_id, a.session_id, a.ticket_type, a.created_at,
		        v.name, v.phone
		 FROM attendances a
		 JOIN visitors v ON v.id = a.visitor_id
		 WHERE a.session_id = $1
		 ORDER BY a.created_at DESC`, sessionID,
	)
	if err != nil {
		http.Error(w, "could not fetch attendances", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	result := []Attendance{}
	for rows.Next() {
		var a Attendance
		var v Visitor
		rows.Scan(&a.ID, &a.VisitorID, &a.SessionID, &a.TicketType, &a.CreatedAt, &v.Name, &v.Phone)
		a.Visitor = &v
		result = append(result, a)
	}

	json.NewEncoder(w).Encode(result)
}
