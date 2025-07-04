ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS contact_number TEXT; 