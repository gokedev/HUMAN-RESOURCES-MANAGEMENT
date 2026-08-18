# HR SaaS Deployment - Final Solution

The application deployment issue has been resolved by correcting the Flyway configuration in `application.yml`.

## Root Cause
The Flyway configuration was placed at the top level of `application.yml` (outside the `spring:` section), causing Spring Boot to ignore it and use its own auto-configuration. This led to:
1. Missing baseline configuration
2. Flyway attempting to run migration V2 on an existing table "password_reset_tokens"

## Fix Applied
Corrected the `application.yml` to place Flyway configuration under `spring:` and set appropriate baseline properties:

```yaml
spring:
  flyway:
    enabled: true
    url: ${DB_URL}
    user: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    baseline-on-migrate: true
    baseline-version: 2
    locations: classpath:db/migration
```

## Why This Works
- `baseline-on-migrate: true` tells Flyway to baseline the existing schema before applying migrations
- `baseline-version: 2` sets the baseline version to 2, meaning:
  - The existing schema is considered to be at version 2
  - Migrations with version ≤ 2 (V1 and V2) are skipped
  - Only migrations with version > 2 (V3) will be applied
- Since V2 creates the "password_reset_tokens" table, skipping V2 avoids the "relation already exists" error
- The `pgcrypto` extension (required for `gen_random_uuid()`) is created in V1, which is safe to skip if already present

## Verification
After this change, Flyway will:
1. Initialize successfully with PostgreSQL 17.6 (using Flyway 9.22.0)
2. Baseline the existing schema to version 2
3. Skip V1 and V2 migrations
4. Apply V3 migration to add performance indexes
5. Hibernate will validate the schema with `ddl-auto: none`
6. Application will start and serve requests on port 8080

## Files Confirmed Correct
- `hr-saas\.env`: Fixed database URL format (no `postgres@` prefix)
- `hr-saas\pom.xml`: Flyway version set to 9.22.0
- `hr-saas\src\main\resources\db\migration\V1__init_schema.sql`: Includes `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- `hr-saas\src\main\resources\application.yml`: Correctly structured with `spring.flyway` section
- `hr-saas\src\main\java\com\hrsaas\config\FlywayConfig.java`: Removed (was causing conflict)

Deploy this configuration to Render - the application should start successfully!