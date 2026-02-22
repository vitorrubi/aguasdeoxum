package handlers

import (
	"encoding/json"
	"net/http"

	"aguasdeoxum/backend/internal/db"
)

type Visitor struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

func GetVisitorByPhone(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		http.Error(w, "phone is required", http.StatusBadRequest)
		return
	}

	var v Visitor
	err := db.Pool.QueryRow(r.Context(),
		"SELECT id, name, phone FROM visitors WHERE phone = $1", phone,
	).Scan(&v.ID, &v.Name, &v.Phone)

	if err != nil {
		http.Error(w, "visitor not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(v)
}

func CreateVisitor(w http.ResponseWriter, r *http.Request) {
	var v Visitor
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	err := db.Pool.QueryRow(r.Context(),
		"INSERT INTO visitors (name, phone) VALUES ($1, $2) RETURNING id, name, phone",
		v.Name, v.Phone,
	).Scan(&v.ID, &v.Name, &v.Phone)

	if err != nil {
		http.Error(w, "could not create visitor", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(v)
}
