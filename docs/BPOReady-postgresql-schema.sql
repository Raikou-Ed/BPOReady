-- BPOReady PostgreSQL schema generated from BPOReady-improved-erd.dbml
-- Run this after creating an empty PostgreSQL database.

BEGIN;

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'applicant');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE session_status AS ENUM ('in_progress', 'submitted', 'evaluated', 'abandoned');
CREATE TYPE interview_type AS ENUM ('initial', 'final');
CREATE TYPE call_type AS ENUM ('inbound', 'outbound');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'applicant',
    status user_status NOT NULL DEFAULT 'active',
    assigned_level difficulty_level,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX users_role_idx ON users (role);
CREATE INDEX users_status_idx ON users (status);

CREATE TABLE paragraphs (
    id BIGSERIAL PRIMARY KEY,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX paragraphs_difficulty_idx ON paragraphs (difficulty);
CREATE INDEX paragraphs_active_idx ON paragraphs (is_active);

CREATE TABLE interview_questions (
    id BIGSERIAL PRIMARY KEY,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    interview_type interview_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX interview_questions_type_idx ON interview_questions (interview_type);

CREATE TABLE scoring_standards (
    id BIGSERIAL PRIMARY KEY,
    managed_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    level difficulty_level NOT NULL,
    min_score NUMERIC(5,2) NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    max_score NUMERIC(5,2) NOT NULL CHECK (max_score >= 0 AND max_score <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (max_score >= min_score),
    UNIQUE (level, is_active)
);

CREATE TABLE pre_assessments (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    paragraph_id BIGINT NOT NULL REFERENCES paragraphs(id) ON DELETE RESTRICT,
    recording_path VARCHAR(500),
    diagnostic_score NUMERIC(5,2) CHECK (diagnostic_score >= 0 AND diagnostic_score <= 100),
    placed_level difficulty_level,
    status session_status NOT NULL DEFAULT 'in_progress',
    taken_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP
);
CREATE INDEX pre_assessments_applicant_idx ON pre_assessments (applicant_id);

CREATE TABLE paragraph_reading_sessions (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    paragraph_id BIGINT NOT NULL REFERENCES paragraphs(id) ON DELETE RESTRICT,
    recording_path VARCHAR(500),
    mime_type VARCHAR(100),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    status session_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);
CREATE INDEX reading_sessions_applicant_idx ON paragraph_reading_sessions (applicant_id);
CREATE INDEX reading_sessions_paragraph_idx ON paragraph_reading_sessions (paragraph_id);

CREATE TABLE paragraph_feedback (
    id BIGSERIAL PRIMARY KEY,
    reading_session_id BIGINT NOT NULL UNIQUE REFERENCES paragraph_reading_sessions(id) ON DELETE CASCADE,
    filler_word_count INTEGER NOT NULL DEFAULT 0 CHECK (filler_word_count >= 0),
    filler_words JSONB,
    clarity_score NUMERIC(5,2) CHECK (clarity_score >= 0 AND clarity_score <= 100),
    confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    pacing_score NUMERIC(5,2) CHECK (pacing_score >= 0 AND pacing_score <= 100),
    volume_score NUMERIC(5,2) CHECK (volume_score >= 0 AND volume_score <= 100),
    grammar_score NUMERIC(5,2) CHECK (grammar_score >= 0 AND grammar_score <= 100),
    feedback_text TEXT,
    suggestions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE communication_exercises (
    id BIGSERIAL PRIMARY KEY,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    target_flaw VARCHAR(100) NOT NULL,
    exercise_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    exercise_content TEXT NOT NULL,
    difficulty difficulty_level,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercise_attempts (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    exercise_id BIGINT NOT NULL REFERENCES communication_exercises(id) ON DELETE RESTRICT,
    response_text TEXT,
    recording_path VARCHAR(500),
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    status session_status NOT NULL DEFAULT 'in_progress',
    feedback TEXT,
    taken_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX exercise_attempts_applicant_idx ON exercise_attempts (applicant_id);

CREATE TABLE mock_interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    interview_type interview_type NOT NULL,
    overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    status session_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);

CREATE TABLE mock_interview_answers (
    id BIGSERIAL PRIMARY KEY,
    mock_session_id BIGINT NOT NULL REFERENCES mock_interview_sessions(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES interview_questions(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL CHECK (question_order > 0),
    answer_text TEXT,
    recording_path VARCHAR(500),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    UNIQUE (mock_session_id, question_order)
);

CREATE TABLE mock_interview_feedback (
    id BIGSERIAL PRIMARY KEY,
    mock_session_id BIGINT NOT NULL UNIQUE REFERENCES mock_interview_sessions(id) ON DELETE CASCADE,
    filler_word_count INTEGER NOT NULL DEFAULT 0 CHECK (filler_word_count >= 0),
    filler_words JSONB,
    clarity_score NUMERIC(5,2) CHECK (clarity_score >= 0 AND clarity_score <= 100),
    confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    pacing_score NUMERIC(5,2) CHECK (pacing_score >= 0 AND pacing_score <= 100),
    volume_score NUMERIC(5,2) CHECK (volume_score >= 0 AND volume_score <= 100),
    grammar_score NUMERIC(5,2) CHECK (grammar_score >= 0 AND grammar_score <= 100),
    answer_quality_score NUMERIC(5,2) CHECK (answer_quality_score >= 0 AND answer_quality_score <= 100),
    feedback_text TEXT,
    suggestions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE call_scenarios (
    id BIGSERIAL PRIMARY KEY,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    call_type call_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    scenario_brief TEXT NOT NULL,
    difficulty difficulty_level,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenario_dialogues (
    id BIGSERIAL PRIMARY KEY,
    scenario_id BIGINT NOT NULL REFERENCES call_scenarios(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
    speaker_role VARCHAR(50) NOT NULL,
    transcript_text TEXT NOT NULL,
    audio_file_path VARCHAR(500),
    UNIQUE (scenario_id, sequence_order)
);

CREATE TABLE call_simulation_sessions (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scenario_id BIGINT NOT NULL REFERENCES call_scenarios(id) ON DELETE RESTRICT,
    overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    status session_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);

CREATE TABLE call_simulation_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES call_simulation_sessions(id) ON DELETE CASCADE,
    user_audio_path VARCHAR(500),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    empathy_score NUMERIC(5,2) CHECK (empathy_score >= 0 AND empathy_score <= 100),
    resolution_score NUMERIC(5,2) CHECK (resolution_score >= 0 AND resolution_score <= 100),
    clarity_score NUMERIC(5,2) CHECK (clarity_score >= 0 AND clarity_score <= 100),
    ai_feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_reports (
    id BIGSERIAL PRIMARY KEY,
    applicant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    generated_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(100) NOT NULL,
    overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    remarks TEXT,
    generation_type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (generation_type IN ('automatic', 'manual')),
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
