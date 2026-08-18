# Fix for Flyway Schema History Table Missing Error

## Error
```
Found non-empty schema(s) "public" but no schema history table. Use baseline() or set baselineOnMigrate to true to initialize the schema history table.
```

## Cause
The database schema is not empty (contains tables) but Flyway's schema history table is missing. This can happen if:
1. The database was initialized without Flyway (e.g., by Hibernate or manual SQL)
2. Flyway was previously configured incorrectly
3. The schema history table was accidentally dropped

## Solution
Set `baselineOnMigrate: true` in the Flyway configuration. This tells Flyway to:
1. Create the schema history table
2. Baseline the existing schema (assign it a baseline version)
3. Apply any pending migrations with versions higher than the baseline

## Changes Made
In `hr-saas\src\main\resources\application.yml`:
```yaml
flyway:
  enabled: true
  url: ${DB_URL}
  user: ${DB_USERNAME}
  password: ${DB_PASSWORD}
  baseline-on-migrate: true  # Changed from false
  locations: classpath:db/migration
```

## Why This Works
- Flyway 9.22.0 (current version in pom.xml) supports this configuration
- The existing schema (including tables from previous incomplete runs) will be baselined
- Our migration scripts (V1__init_schema.sql, V2__password_reset_tokens.sql, V3__add_missing_indexes.sql) will be applied as needed
- V1 will be skipped if it matches the baseline version (which is 1 by default)
- V2 and V3 will be applied to bring the schema up to date

## Verification
After this change, Flyway should:
1. Initialize successfully
2. Create the schema history table
3. Baseline the existing public schema
4. Apply V2 and V3 migrations (if V1 is considered baselined)
5. Allow the application to start with a consistent schema state

Note: If the database is completely empty, baselineOnMigrate: true will still work - it will just not find any existing schema to baseline and will apply all migrations from V1 onward.