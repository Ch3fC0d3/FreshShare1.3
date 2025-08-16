-- PostgreSQL Schema for FreshShare Fastify Backend
-- This script creates the necessary tables for the FreshShare application

-- Create Database (if not exists)
-- Note: In cPanel you'll need to create the database through the UI first
-- This is just for reference
-- CREATE DATABASE freshshare;

-- Connect to the database
-- \c freshshare;

-- Labels Table
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  label_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);

-- Packs Table
CREATE TABLE IF NOT EXISTS packs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  label_id INTEGER REFERENCES labels(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  pack_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_packs_user_id ON packs(user_id);
CREATE INDEX IF NOT EXISTS idx_packs_label_id ON packs(label_id);

-- Pack Items Table
CREATE TABLE IF NOT EXISTS pack_items (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE,
  item_data JSONB NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id ON pack_items(pack_id);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  settings_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Add sample data for testing (optional)
-- INSERT INTO labels (user_id, label_data)
-- VALUES ('test-user-id', '{"name": "Sample Label", "description": "This is a sample label"}'::jsonb);

-- INSERT INTO packs (user_id, label_id, pack_data)
-- VALUES ('test-user-id', 1, '{"name": "Sample Pack", "description": "This is a sample pack"}'::jsonb);

-- INSERT INTO pack_items (pack_id, item_data)
-- VALUES (1, '{"name": "Sample Item", "description": "This is a sample item", "expiry": "2025-12-31"}'::jsonb);
