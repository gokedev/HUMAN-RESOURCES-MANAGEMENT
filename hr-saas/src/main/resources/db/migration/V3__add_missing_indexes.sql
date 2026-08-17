-- Add missing indexes for performance optimization

-- Index for users.email (used in login and password reset)
CREATE INDEX idx_users_email ON users(email);

-- Index for users.department_id (used in department-based queries)
CREATE INDEX idx_users_department ON users(department_id);

-- Index for users.manager_id (used in org chart queries)
CREATE INDEX idx_users_manager ON users(manager_id);

-- Composite index for refresh_tokens (used in token validation)
CREATE INDEX idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, revoked, expires_at);

-- Composite index for password_reset_tokens (used in token validation)
CREATE INDEX idx_password_reset_tokens_token_used ON password_reset_tokens(token, used_at, expires_at);

-- Index for invitations.token (for faster lookup)
CREATE INDEX idx_invitations_token ON invitations(token);

-- Index for companies.slug (for faster login lookup)
CREATE INDEX idx_companies_slug ON companies(slug);
