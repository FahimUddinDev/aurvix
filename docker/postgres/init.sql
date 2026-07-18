-- Enable pgcrypto for NID encryption and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy patient search
