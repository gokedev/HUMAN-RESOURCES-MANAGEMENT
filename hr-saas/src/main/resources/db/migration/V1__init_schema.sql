DO $$
BEGIN
    -- Create extension if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Create companies table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
        CREATE TABLE companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(150) NOT NULL,
            slug VARCHAR(150) NOT NULL UNIQUE,
            industry VARCHAR(100),
            country VARCHAR(100),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
    END IF;

    -- Create departments table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE TABLE departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            UNIQUE (company_id, name)
        );
    END IF;

    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            email VARCHAR(200) NOT NULL,
            password_hash VARCHAR(255),
            role VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(30),
            job_title VARCHAR(120),
            department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
            manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
            date_of_hire DATE,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            UNIQUE (company_id, email)
        );
    END IF;

    -- Create indexes for users and departments if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
    END IF;

    -- Create invitations table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invitations') THEN
        CREATE TABLE invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            accepted_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT now()
        );
    END IF;

    -- Create leave_requests table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
        CREATE TABLE leave_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            leave_type VARCHAR(30) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
            reviewed_at TIMESTAMP,
            review_note TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
    END IF;

    -- Create indexes for leave_requests if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leave_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_leave_company ON leave_requests(company_id);
        CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
    END IF;

    -- Create attendance_records table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') THEN
        CREATE TABLE attendance_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            work_date DATE NOT NULL,
            check_in TIMESTAMP,
            check_out TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            UNIQUE (employee_id, work_date)
        );
    END IF;

    -- Create index for attendance_records if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') THEN
        CREATE INDEX IF NOT EXISTS idx_attendance_company ON attendance_records(company_id);
    END IF;

    -- Create refresh_tokens table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refresh_tokens') THEN
        CREATE TABLE refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            revoked BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT now()
        );
    END IF;
END $$;
