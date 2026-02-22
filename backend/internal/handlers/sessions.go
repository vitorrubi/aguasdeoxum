package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"aguasdeoxum/backend/internal/db"
)

type Session struct {
	ID                          string     `json:"id"`
	OpenedAt                    time.Time  `json:"opened_at"`
	ClosedAt                    *time.Time `json:"closed_at"`
	ConsultationTicketsAvailable int        `json:"consultation_tickets_available"`
	ConsultationTicketsUsed      int        `json:"consultation_tickets_used"`
}

func GetActiveSession(w http.ResponseWriter, r *http.Request) {
	var s Session
	err := db.Pool.QueryRow(r.Context(),
		`SELECT id, opened_at, closed_at, consultation_tickets_available, consultation_tickets_used
		 FROM sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1`,
	).Scan(&s.ID, &s.OpenedAt, &s.ClosedAt, &s.ConsultationTicketsAvailable, &s.ConsultationTicketsUsed)

	if err != nil {
		http.Error(w, "no active session", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(s)
}

func CreateSession(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ConsultationTicketsAvailable int `json:"consultation_tickets_available"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	var s Session
	err := db.Pool.QueryRow(r.Context(),
		`INSERT INTO sessions (consultation_tickets_available) VALUES ($1)
		 RETURNING id, opened_at, closed_at, consultation_tickets_available, consultation_tickets_used`,
		body.ConsultationTicketsAvailable,
	).Scan(&s.ID, &s.OpenedAt, &s.ClosedAt, &s.ConsultationTicketsAvailable, &s.ConsultationTicketsUsed)

	if err != nil {
		http.Error(w, "could not create session", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

func CloseSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var s Session
	err := db.Pool.QueryRow(r.Context(),
		`UPDATE sessions SET closed_at = NOW() WHERE id = $1
		 RETURNING id, opened_at, closed_at, consultation_tickets_available, consultation_tickets_used`,
		id,
	).Scan(&s.ID, &s.OpenedAt, &s.ClosedAt, &s.ConsultationTicketsAvailable, &s.ConsultationTicketsUsed)

	if err != nil {
		http.Error(w, "could not close session", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(s)
}
