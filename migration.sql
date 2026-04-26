-- Migration to add role column to users table
-- Run this SQL manually in your database or update your migration system

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Update existing users to have 'admin' role if needed
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Create device_tokens table for FCM
CREATE TABLE IF NOT EXISTS device_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(device_token)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_device_token_unique ON device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active ON device_tokens(user_id, is_active);