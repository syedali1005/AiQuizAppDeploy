-- Update existing type check constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_question_type;
ALTER TABLE questions ADD CONSTRAINT valid_question_type 
  CHECK (type IN ('multiple-choice', 'true-false', 'short-answer', 'text')); 

-- Remove website upload related columns
ALTER TABLE questions DROP COLUMN IF EXISTS allowed_file_types;
ALTER TABLE questions DROP COLUMN IF EXISTS max_file_size;

-- Update the first question's type to 'text'
UPDATE questions 
SET type = 'text',
    question = 'Please provide your company website URL:'
WHERE id = 1; 