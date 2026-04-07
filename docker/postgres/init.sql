-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create application user with limited privileges
-- (superuser erp_user handles migrations, app uses erp_app_user for queries)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_app_user') THEN
    CREATE ROLE erp_app_user WITH LOGIN PASSWORD 'erp_app_pass';
  END IF;
END
$$;

-- Set up default settings
ALTER DATABASE erp_db SET timezone TO 'America/Sao_Paulo';
