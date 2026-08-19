-- Payroll module: add base_salary to users, create payslips table

ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2);

CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pay_period_month INT NOT NULL,
    pay_period_year INT NOT NULL,
    gross_salary NUMERIC(12,2) NOT NULL,
    unpaid_leave_days INT NOT NULL DEFAULT 0,
    unpaid_leave_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_deduction NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12,2) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payslip_period UNIQUE (company_id, employee_id, pay_period_month, pay_period_year)
);

CREATE INDEX IF NOT EXISTS idx_payslips_company ON payslips(company_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(company_id, pay_period_year, pay_period_month);
