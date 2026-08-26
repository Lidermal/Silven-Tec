// --- ESTADO E INICIALIZAÇÃO ---
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica sessão existente
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await initApp(session.user);

    // Listener para login/logout
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') initApp(session.user);
        if (event === 'SIGNED_OUT') location.reload();
    });

    // Bind do formulário
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
});

// --- AUTENTICAÇÃO ---
async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    btn.innerText = 'Processando...';
    btn.disabled = true;

    let res;
    if (isLoginMode) {
        res = await supabase.auth.signInWithPassword({ email, password });
    } else {
        res = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { full_name: email.split('@')[0] } }
        });
    }

    btn.innerText = isLoginMode ? 'Entrar no Painel' : 'Criar Conta';
    btn.disabled = false;

    if (res.error) {
        alert(res.error.message);
    } else if (!isLoginMode) {
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
        toggleAuthMode();
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Entrar no Painel' : 'Criar Conta';
    document.getElementById('auth-toggle').innerText = isLoginMode ? 'Não tem conta? Solicitar acesso' : 'Já tem conta? Fazer login';
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// --- ROTEAMENTO E DASHBOARD ---
async function initApp(user) {
    currentUser = user;
    
    // Busca perfil e role
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    currentRole = profile?.role || 'client';
    
    document.getElementById('user-name').innerText = profile?.full_name || user.email;
    
    // Troca de tela
    document.getElementById('auth-screen').classList.replace('active', 'hidden');
    document.getElementById('app-screen').classList.replace('hidden', 'active');
    
    renderSidebar();
    navigateTo('dashboard');
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const items = currentRole === 'admin' ? [
        { id: 'dashboard', icon: '', label: 'Visão Geral' },
        { id: 'projects', icon: '', label: 'Projetos' },
        { id: 'finance', icon: '💰', label: 'Financeiro' },
        { id: 'clients', icon: '👥', label: 'Clientes' }
    ] : [
        { id: 'my-projects', icon: '📁', label: 'Meus Projetos' },
        { id: 'invoices', icon: '🧾', label: 'Faturas' }
    ];

    nav.innerHTML = items.map(i => `
        <button onclick="navigateTo('${i.id}')" id="nav-${i.id}">
            ${i.icon} ${i.label}
        </button>
    `).join('');
}

function navigateTo(page) {
    // Atualiza menu ativo
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${page}`)?.classList.add('active');
    
    const title = document.getElementById('page-title');
    const content = document.getElementById('main-content');
    
    // Roteamento simples
    if (page === 'dashboard') {
        title.innerText = 'Visão Geral';
        content.innerHTML = `<div class="grid">
            <div class="card"><h3>Projetos Ativos</h3><p class="big-number">Carregando...</p></div>
            <div class="card"><h3>Faturamento Mês</h3><p class="big-number">R$ 0,00</p></div>
        </div>`;
        loadStats();
    } 
    else if (page === 'projects') {
        title.innerText = 'Gerenciar Projetos';
        content.innerHTML = '<button class="btn-primary" style="width:auto; margin-bottom:20px" onclick="addProject()">+ Novo Projeto</button><div id="projects-list"></div>';
        loadProjects();
    }
    else {
        title.innerText = page.charAt(0).toUpperCase() + page.slice(1);
        content.innerHTML = '<div class="card">Em desenvolvimento...</div>';
    }
}

// --- FUNÇÕES DE DADOS (SUPABASE) ---
async function loadStats() {
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    document.querySelector('.big-number').innerText = count || 0;
}

async function loadProjects() {
    const { data } = await supabase.from('projects').select('*, profiles(full_name)').order('created_at', { ascending: false });
    const list = document.getElementById('projects-list');
    
    if (!data || data.length === 0) {
        list.innerHTML = '<p>Nenhum projeto encontrado.</p>';
        return;
    }

    list.innerHTML = `<table class="data-table">
        <thead><tr><th>Projeto</th><th>Cliente</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>${data.map(p => `
            <tr>
                <td><strong>${p.name}</strong><br><small>${p.url || 'Sem URL'}</small></td>
                <td>${p.profiles?.full_name || 'N/A'}</td>
                <td><span class="badge">${p.status}</span></td>
                <td><button class="btn-sm">Editar</button></td>
            </tr>
        `).join('')}</tbody>
    </table>`;
}

async function addProject() {
    const name = prompt('Nome do Projeto:');
    if (!name) return;
    
    // Para teste, pega o primeiro cliente que encontrar ou usa null
    const { error } = await supabase.from('projects').insert({ name, client_id: currentUser.id });
    if (error) alert(error.message);
    else loadProjects();
}
