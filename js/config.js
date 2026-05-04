// ================================================
// FISCHER METHOD — config.js
// ================================================
const SUPABASE_URL = 'https://hqjdqvtfcphjxrzlijay.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8Z9ZziTfEk9plxE3GJBVZA_b-gyiXvD';

// E-mail do personal (Matheus) — unico com acesso de admin
const PERSONAL_EMAIL = 'matheusfischerpersonal@gmail.com';

// Cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
