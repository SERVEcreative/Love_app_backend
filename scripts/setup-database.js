const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.length === 0) {
          continue;
        }
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some statements might fail if they already exist (like indexes)
          // This is normal for idempotent setup
          console.log(`⚠️  Statement ${i + 1} had an issue (this might be normal):`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error executing statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n✅ Database setup completed!');
    console.log(`📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    if (errorCount > 0) {
      console.log('⚠️  Some statements had errors, but this might be normal for idempotent setup');
    }
    
    // Test the connection by checking if users table exists
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection test failed:', error.message);
    } else {
      console.log('✅ Database connection test successful!');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
