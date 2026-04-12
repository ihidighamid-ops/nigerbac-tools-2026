-- ============================================
-- SCHEMA SUPABASE - NigerBac Tools 2026
-- Colle ce code dans l'éditeur SQL de Supabase
-- ============================================

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance TEXT,
  ecole TEXT NOT NULL,
  serie TEXT NOT NULL,
  ville TEXT NOT NULL,
  telephone TEXT UNIQUE NOT NULL,
  code_acces TEXT,
  code_anonyme TEXT UNIQUE,
  paye BOOLEAN DEFAULT FALSE,
  recu_url TEXT,
  inscrit_le TIMESTAMPTZ DEFAULT NOW(),
  pdf_count INTEGER DEFAULT 0
);

-- Table PDFs partagés
CREATE TABLE IF NOT EXISTS pdfs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  pages INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table messages La Flamme Nigérienne
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  code_anonyme TEXT NOT NULL,
  contenu TEXT,
  type TEXT DEFAULT 'texte',
  media_url TEXT,
  envoye_le TIMESTAMPTZ DEFAULT NOW()
);

-- Activer Realtime pour les messages (pour le chat en temps réel)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_telephone ON users(telephone);
CREATE INDEX IF NOT EXISTS idx_messages_envoye_le ON messages(envoye_le);
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON pdfs(user_id);
