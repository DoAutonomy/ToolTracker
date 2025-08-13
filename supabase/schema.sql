-- Tool Tracker Database Schema
-- This file should be executed in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    finished BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tools table
CREATE TABLE tools (
    tool_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tin VARCHAR(255) UNIQUE NOT NULL, -- Tool identification number (barcode)
    tool_type VARCHAR(255) NOT NULL,
    date_added DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job to Tool assignment junction table
CREATE TABLE job_to_tool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(tool_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_job_to_tool_job_id ON job_to_tool(job_id);
CREATE INDEX idx_job_to_tool_tool_id ON job_to_tool(tool_id);
CREATE INDEX idx_job_to_tool_returned_at ON job_to_tool(returned_at);
CREATE INDEX idx_tools_tin ON tools(tin);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_finished ON jobs(finished);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at 
    BEFORE UPDATE ON tools 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Useful database views
-- View for currently assigned tools
CREATE VIEW currently_assigned_tools AS
SELECT 
    t.tool_id,
    t.tin,
    t.tool_type,
    j.job_id,
    j.company,
    jtt.assigned_at
FROM tools t
JOIN job_to_tool jtt ON t.tool_id = jtt.tool_id
JOIN jobs j ON jtt.job_id = j.job_id
WHERE jtt.returned_at IS NULL;

-- View for missing tools (assigned to finished jobs but not returned)
CREATE VIEW missing_tools AS
SELECT 
    t.tool_id,
    t.tin,
    t.tool_type,
    j.job_id,
    j.company,
    j.end_date,
    jtt.assigned_at,
    CURRENT_DATE - j.end_date AS days_overdue
FROM tools t
JOIN job_to_tool jtt ON t.tool_id = jtt.tool_id
JOIN jobs j ON jtt.job_id = j.job_id
WHERE jtt.returned_at IS NULL 
AND j.finished = TRUE;

-- View for available tools
CREATE VIEW available_tools AS
SELECT 
    t.tool_id,
    t.tin,
    t.tool_type,
    t.date_added
FROM tools t
LEFT JOIN job_to_tool jtt ON t.tool_id = jtt.tool_id AND jtt.returned_at IS NULL
WHERE jtt.tool_id IS NULL;

-- Insert some sample data for testing
INSERT INTO jobs (company, start_date, end_date, finished) VALUES 
('ABC Construction', '2024-01-15', '2024-02-15', TRUE),
('XYZ Builders', '2024-02-01', NULL, FALSE),
('Smith & Co', '2024-01-20', '2024-02-20', TRUE);

INSERT INTO tools (tin, tool_type) VALUES 
('TIN001', 'Drill'),
('TIN002', 'Hammer'),
('TIN003', 'Screwdriver'),
('TIN004', 'Level'),
('TIN005', 'Tape Measure');

-- Insert some sample assignments
INSERT INTO job_to_tool (job_id, tool_id) VALUES 
((SELECT job_id FROM jobs WHERE company = 'XYZ Builders' LIMIT 1), 
 (SELECT tool_id FROM tools WHERE tin = 'TIN001' LIMIT 1)),
((SELECT job_id FROM jobs WHERE company = 'XYZ Builders' LIMIT 1), 
 (SELECT tool_id FROM tools WHERE tin = 'TIN002' LIMIT 1));