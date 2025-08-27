-- Remove date_of_birth completely and update all references to use age

-- Step 1: Drop the existing trigger that references date_of_birth
DROP TRIGGER IF EXISTS calculate_profile_completion_trigger ON users;

-- Step 2: Drop the function that references date_of_birth
DROP FUNCTION IF EXISTS calculate_profile_completion();

-- Step 3: Remove date_of_birth column from users table
ALTER TABLE users DROP COLUMN IF EXISTS date_of_birth;

-- Step 4: Add age column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 1 AND age <= 120);

-- Step 5: Recreate the profile completion function to use age instead of date_of_birth
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_percentage INTEGER := 0;
BEGIN
    -- Basic info (30%)
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
        completion_percentage := completion_percentage + 15;
    END IF;
    
    IF NEW.age IS NOT NULL THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    IF NEW.gender IS NOT NULL THEN
        completion_percentage := completion_percentage + 5;
    END IF;
    
    -- Profile details (40%)
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
        completion_percentage := completion_percentage + 20;
    END IF;
    
    IF NEW.location IS NOT NULL AND NEW.location != '' THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    -- Verification (30%)
    IF NEW.is_verified = TRUE THEN
        completion_percentage := completion_percentage + 30;
    END IF;
    
    NEW.profile_completion_percentage := completion_percentage;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Recreate the trigger for profile completion calculation
CREATE TRIGGER calculate_profile_completion_trigger 
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Step 7: Add comment to document the change
COMMENT ON COLUMN users.age IS 'User age in years (1-120)';

-- Step 8: Update any existing users to have a default age if needed
-- UPDATE users SET age = 25 WHERE age IS NULL;

-- Step 9: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('age', 'date_of_birth')
ORDER BY column_name;
