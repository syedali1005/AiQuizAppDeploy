-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "quiz_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id"),
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP,
  "current_question_index" INTEGER NOT NULL DEFAULT 0,
  "time_remaining" INTEGER NOT NULL DEFAULT 1800,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "score" INTEGER,
  "category_scores" JSONB DEFAULT '{}',
  "user_name" TEXT,
  "company_name" TEXT,
  "email" TEXT,
  "contact_number" TEXT
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" SERIAL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "options" JSONB,
  "correct_answer" TEXT NOT NULL,
  "explanation" TEXT,
  "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "quiz_results" (
  "id" SERIAL PRIMARY KEY,
  "session_id" INTEGER NOT NULL REFERENCES "quiz_sessions"("id"),
  "total_questions" INTEGER NOT NULL,
  "correct_answers" INTEGER NOT NULL,
  "overall_score" INTEGER NOT NULL,
  "category_breakdown" JSONB NOT NULL,
  "ai_efficiency_score" INTEGER NOT NULL,
  "completed_at" TIMESTAMP NOT NULL
);

-- Update the questions table with the latest department options
UPDATE "questions" 
SET "options" = '["Sales", "Marketing", "HR", "Operations", "Customer Support", "Finance", "Strategy/Leadership"]'
WHERE "category" = 'Department Focus' 
AND "question" LIKE '%department(s)%benefit most%';

-- Add Finance Department questions
INSERT INTO "questions" ("category", "type", "question", "options", "correct_answer", "explanation", "order")
VALUES 
('Finance Department', 'multiple-choice-multiple', 'Which of the following tasks take up the most time in your team?', 
'["Invoice generation & tracking", "Data entry and reconciliation", "Payroll processing", "Budgeting & forecasting", "Financial reporting", "Tax calculations and compliance", "Vendor payment management"]',
'', 'Understanding time-consuming finance tasks', 100),

('Finance Department', 'multiple-choice', 'How do you currently manage your accounting workflows?',
'["Fully manual (Excel, paper, etc.)", "Semi-automated (using software but with manual checks)", "Mostly automated (only exceptions handled manually)", "Fully automated"]',
'', 'Assessing current automation level', 101),

('Finance Department', 'multiple-choice-multiple', 'What accounting software/tools do you use?',
'["QuickBooks", "Xero", "Zoho Books", "Tally", "SAP", "Microsoft Excel", "Other (Please specify)"]',
'', 'Understanding current tools', 102),

('Finance Department', 'multiple-choice', 'How often do you face data mismatches or reconciliation issues?',
'["Daily", "Weekly", "Monthly", "Rarely"]',
'', 'Identifying pain points', 103),

('Finance Department', 'multiple-choice-multiple', 'Would you benefit from real-time dashboards for:',
'["Cash flow analysis", "Profit & loss tracking", "Budget variance", "Department-wise expense breakdown", "All of the above"]',
'', 'Assessing dashboard needs', 104),

('Finance Department', 'multiple-choice', 'Do you manually verify large transaction volumes or rely on automation?',
'["Fully manual verification", "Rule-based automation (e.g., macros or filters)", "AI-assisted anomaly detection", "Not sure"]',
'', 'Understanding verification process', 105),

('Finance Department', 'multiple-choice-multiple', 'Are you currently using or exploring AI tools for:',
'["Fraud detection", "Predictive cash flow", "Automated reconciliation", "AI financial assistant/chatbot", "None"]',
'', 'Assessing AI adoption', 106),

('Finance Department', 'multiple-choice', 'If AI could save you 50%+ time in repetitive tasks, how likely are you to adopt it?',
'["Very likely", "Somewhat likely", "Neutral", "Not interested"]',
'', 'Gauging AI interest', 107),

('Finance Department', 'multiple-choice', 'What is your biggest challenge in automating your finance operations?',
'["Budget constraints", "Lack of technical know-how", "Data privacy/security concerns", "Integration with existing systems", "Other (please specify)"]',
'', 'Understanding automation barriers', 108),

('Finance Department', 'multiple-choice', 'Would you like a free consultation to identify automation opportunities in your finance department?',
'["Yes", "No", "Maybe, send more info"]',
'', 'Consultation interest', 109); 