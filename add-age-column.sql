-- Add age column to users table
ALTER TABLE users ADD COLUMN age INTEGER CHECK (age >= 1 AND age <= 120);

-- Optional: Remove date_of_birth column if you want to completely replace it
-- ALTER TABLE users DROP COLUMN date_of_birth;

-- Update existing users to have a default age if needed
-- UPDATE users SET age = 25 WHERE age IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN users.age IS 'User age in years (1-120)';
