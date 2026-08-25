// config.js - Silven Tec System

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA'; // Sua chave anon (mantenha secreta no repo)

// Chaves do Mercado Pago (MODO TESTE - Não use as produtivas ainda!)
const MP_PUBLIC_KEY = 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; 
const MP_ACCESS_TOKEN = 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentRole = null;
