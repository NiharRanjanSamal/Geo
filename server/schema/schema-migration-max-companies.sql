-- Add max_companies to tenant table
-- NULL = unlimited. Set a number to restrict how many companies a tenant can create.
ALTER TABLE tenant ADD COLUMN max_companies INT UNSIGNED DEFAULT NULL AFTER subscription_tier;
