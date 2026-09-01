// CONFIGURAÇÃO SUPABASE (Substitua pelas suas chaves reais)
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- NAVEGAÇÃO ---
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden-section'));
    document.getElementById(id).classList.remove('hidden-section');
    
    if(id === 'admin-panel') loadProjects();
}

function checkClientToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        loadClientData(token);
    } else {
        // Se não tem token, pede para digitar (simulação simples)
        const inputToken = prompt("Digite seu Token de Acesso (ou cole o link completo):");
        if(inputToken) {
            // Tenta extrair token se colou URL inteira
            const cleanToken = inputToken.split('token=')[1] || inputToken;
            window.location.href = `?token=${cleanToken}`;
        }
    }
}

// --- ADMINISTRAÇÃO ---
async function loginAdmin() {
    const pass = document.getElementById('adminPass').value;
    // Busca hash no banco (conforme configurado anteriormente)
    const { data } = await supabase.from('system_config').select('config_value').eq('config_key', 'admin_password_hash').single();
    
    // Gera hash SHA-256 da senha digitada
    const msgBuffer = new TextEncoder().encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (data && hashHex === data.config_value) {
        sessionStorage.setItem('isAdmin', 'true');
        showSection('admin-panel');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    showSection('home');
}

async function createProject() {
    const client = document.getElementById('newClient').value;
    const title = document.getElementById('newTitle').value;
    const value = document.getElementById('newValue').value;

    if(!client || !title || !value) return alert("Preencha todos os campos!");

    // Gera token aleatório curto
    const token = Math.random().toString(36).substring(2, 10);

    const { error } = await supabase.from('projects').insert([{
        client_name: client,
        title: title,
        total_value: value,
        access_token: token,
        status: 'em_andamento'
    }]);

    if (error) {
        alert("Erro ao criar: " + error.message);
    } else {
        alert(`Projeto criado! Token do cliente: ${token}`);
        document.getElementById('newClient').value = '';
        document.getElementById('newTitle').value = '';
        document.getElementById('newValue').value = '';
        loadProjects();
    }
}

async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('projectsList');
    list.innerHTML = '';

    if(error) {
        list.innerHTML = `<p class="text-red-400">Erro ao carregar: ${error.message}</p>`;
        return;
    }

    data.forEach(p => {
        const link = `${window.location.origin}${window.location.pathname}?token=${p.access_token}`;
        list.innerHTML += `
            <div class="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-white">${p.title}</h3>
                    <p class="text-sm text-slate-400">${p.client_name} - R$ ${p.total_value}</p>
                    <p class="text-xs text-cyan-500 mt-1 select-all">Link: ${link}</p>
                </div>
                <span class="text-xs bg-slate-800 px-2 py-1 rounded text-emerald-400">${p.status}</span>
            </div>
        `;
    });
}

// --- ÁREA DO CLIENTE ---
let currentProjectId = null;

async function loadClientData(token) {
    showSection('client-area');
    const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();

    if (error || !data) {
        document.getElementById('clientTitle').innerText = "Projeto não encontrado";
        return;
    }

    currentProjectId = data.id;
    document.getElementById('clientTitle').innerText = data.title;
    document.getElementById('clientName').innerText = `Olá, ${data.client_name}`;
    document.getElementById('clientStatus').innerText = data.status;
    document.getElementById('clientDeadline').innerText = data.deadline ? new Date(data.deadline).toLocaleDateString() : 'A definir';
}

async function generatePayment() {
    if(!currentProjectId) return;
    
    // NOTA: Em site estático (GitHub Pages), NÃO podemos chamar API interna segura.
    // Solução: Redirecionar direto para checkout do MP ou usar um backend externo.
    // Aqui simulamos a geração. Para produção real no GitHub Pages, 
    // você precisaria de um webhook ou serviço de terceiros.
    
    alert("Em ambiente GitHub Pages puro, a geração de PIX requer um backend.\n\nPara teste na Vercel, integre a rota /api/payments.");
    
    // Exemplo de como seria o link direto se você tivesse um link de pagamento salvo no banco:
    // window.open('https://mpago.la/xyz', '_blank');
}

// Verifica se já está logado ao carregar
if(sessionStorage.getItem('isAdmin')) {
    showSection('admin-panel');
}
