import { createClient } from '@supabase/supabase-js';

// Adicionamos valores de fallback para que a aplicação não quebre com a "tela branca"
// caso o arquivo .env (com as chaves do Supabase) ainda não tenha sido criado pelo usuário.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjUzMzY4MTIsImV4cCI6MTkzMDkxNjgxMn0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
