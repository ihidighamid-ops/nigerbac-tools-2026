// db/supabase.js - Base de données Supabase (permanente, cloud)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_KEY manquants dans les variables d\'environnement !');
  console.error('👉 Crée un projet sur https://supabase.com et configure ces variables sur Render.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = supabase;
