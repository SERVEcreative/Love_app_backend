// Manual Config Update for Supabase Service Role
// Add this to your config/supabase.js file

// Add this line after the existing supabase client creation:
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// And update the module.exports to include supabaseAdmin:
module.exports = {
  supabase,
  supabaseAdmin,  // Add this line
  testConnection
};
