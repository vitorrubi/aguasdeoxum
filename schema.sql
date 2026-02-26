CREATE TABLE visitors (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at                      TIMESTAMPTZ,
  consultation_tickets_available INT NOT NULL,
  consultation_tickets_used      INT NOT NULL DEFAULT 0,
  gira                           TEXT NOT NULL
);

CREATE TABLE attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  UUID NOT NULL REFERENCES visitors(id),
  session_id  UUID NOT NULL REFERENCES sessions(id),
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('none', 'pass', 'consultation')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visitor_id, session_id)
);

-- MIGRATION: Se você já rodou o schema acima no Supabase antes de adicionar a Gira, 
-- rode apenas essa linha no SQL Editor para atualizar a tabela:
-- ALTER TABLE sessions ADD COLUMN gira TEXT NOT NULL DEFAULT 'Esquerda';
