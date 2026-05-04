// ================================================
// FISCHER METHOD — config.js
// ================================================
var SUPABASE_URL = 'https://hqjdqvtfcphjxrzlijay.supabase.co';
var SUPABASE_KEY = 'sb_publishable_8Z9ZziTfEk9plxE3GJBVZA_b-gyiXvD';

// E-mail do personal (Matheus) — unico com acesso admin
var PERSONAL_EMAIL = 'matheusfischerpersonal@gmail.com';

// Cliente Supabase — usa nome diferente para nao conflitar com o SDK
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
