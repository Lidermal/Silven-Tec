// config.js - Silven Tec System

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA'; // Sua chave anon (mantenha secreta no repo)

// Chaves do Mercado Pago (MODO TESTE - Não use as produtivas ainda!)
const MP_PUBLIC_KEY = 'APP_USR-025b97bb-4376-49c3-9c7d-0b8197019152'; 
const MP_ACCESS_TOKEN = 'APP_USR-2603778772369473-082518-4b24b2f7adac8c5ad06c5bd22761eab8-3640423751';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentRole = null;
