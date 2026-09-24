-- ==============================================================================
-- GitHub Guardian - Supabase Free Tier Schema
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Table: Maintenance Runs Log
CREATE TABLE IF NOT EXISTS guardian_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INT DEFAULT 0,
    account TEXT NOT NULL,
    prs_evaluated INT DEFAULT 0,
    prs_merged INT DEFAULT 0,
    prs_rebased INT DEFAULT 0,
    forks_synced INT DEFAULT 0,
    forks_up_to_date INT DEFAULT 0,
    forks_conflicts INT DEFAULT 0,
    secrets_flagged INT DEFAULT 0,
    repos_hardened INT DEFAULT 0,
    summary_report JSONB
);

-- 2. Table: Pull Request Tracking
CREATE TABLE IF NOT EXISTS pr_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT NOT NULL,
    pr_number INT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    html_url TEXT,
    state TEXT NOT NULL DEFAULT 'open',
    action_taken TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repo_name, pr_number)
);

-- 3. Table: Fork Sync Tracking
CREATE TABLE IF NOT EXISTS fork_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT NOT NULL UNIQUE,
    default_branch TEXT NOT NULL DEFAULT 'main',
    upstream_parent TEXT,
    sync_status TEXT NOT NULL, -- 'synced', 'up_to_date', 'conflict', 'error'
    message TEXT,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: Secret Leakage Audit
CREATE TABLE IF NOT EXISTS secret_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT NOT NULL,
    file_path TEXT,
    secret_type TEXT NOT NULL,
    masked_value TEXT NOT NULL,
    risk_level TEXT DEFAULT 'HIGH', -- 'CRITICAL', 'HIGH', 'MEDIUM', 'RESOLVED'
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: Security Posture Matrix
CREATE TABLE IF NOT EXISTS security_posture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT NOT NULL UNIQUE,
    vulnerability_alerts_enabled BOOLEAN DEFAULT FALSE,
    automated_fixes_enabled BOOLEAN DEFAULT FALSE,
    open_cve_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE guardian_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fork_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_posture ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated / anon users for dashboard display
CREATE POLICY "Allow public read access to guardian runs" ON guardian_runs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pr records" ON pr_records FOR SELECT USING (true);
CREATE POLICY "Allow public read access to fork records" ON fork_records FOR SELECT USING (true);
CREATE POLICY "Allow public read access to secret audits" ON secret_audits FOR SELECT USING (true);
CREATE POLICY "Allow public read access to security posture" ON security_posture FOR SELECT USING (true);
