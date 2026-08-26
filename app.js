// app.js - Versão Funcional Imediata
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) {
        alert('Erro: Supabase não inicializado.');
        return;
    }
    const supabase = window.supabaseClient;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await initApp(session.user, supabase);
    } catch (err) {
        console.error('Erro sessão:', err);
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') initApp(session.user, supabase);
        if (event === 'SIGNED_OUT') window.location.reload();
    });

    document.getElementById('auth-form').addEventListener('submit', (e) => handleAuth(e, supabase));
});

async function handleAuth(e, supabase) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    btn.innerText = 'Entrando...';
    btn.disabled = true;

    try {
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

        if (res.error) throw res.error;
        if (!isLoginMode) alert('Cadastro feito! Verifique seu e-mail.');
    } catch (err) {
        alert(err.message);
    } finally {
        btn.innerText = isLoginMode ? 'Entrar no Painel' : 'Criar Conta';
        btn.disabled = false;
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Entrar no Painel' : 'Criar Conta';
    document.getElementById('auth-toggle').innerText = isLoginMode 
        ? 'Não tem conta? Solicitar acesso' 
        : 'Já tem conta? Fazer login';
}

async function logout() {
    await window.supabaseClient.auth.signOut();
    window.location.reload();
}

async function initApp(user, supabase) {
    currentUser = user;
    
    // Busca perfil SEM medo de RLS
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
    currentRole = profile?.role || 'client';
    document.getElementById('user-name').innerText = profile?.full_name || user.email;
    
    // Transição de tela
    document.getElementById('auth-screen').classList.replace('active', 'hidden');
    document.getElementById('app-screen').classList.replace('hidden', 'active');
    
    renderSidebar();
    navigateTo('dashboard', supabase);
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const items = currentRole === 'admin' ? [
        { id: 'dashboard', label: '📊 Visão Geral' },
        { id: 'projects', label: '🚀 Projetos' },
        { id: 'finance', label: '💰 Financeiro' }
    ] : [
        { id: 'my-projects', label: '📁 Meus Projetos' },
        { id: 'invoices', label: '🧾 Faturas' }
    ];

    nav.innerHTML = items.map(i => `
        <button onclick="navigateTo('${i.id}', window.supabaseClient)" id="nav-${i.id}">${i.label}</button>
    `).join('');
}

async function navigateTo(page, supabase) {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${page}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const title = document.getElementById('page-title');
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading">Carregando...</div>';
    
    if (page === 'dashboard') {
        title.innerText = 'Visão Geral';
        const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        content.innerHTML = `
            <div class="grid">
                <div class="card"><h3>Projetos Ativos</h3><p class="big-number">${count || 0}</p></div>
                <div class="card"><h3>Status do Sistema</h3><p class="big-number" style="font-size:1.5rem; color:#10b981">ONLINE</p></div>
            </div>`;
    } else if (page === 'projects') {
        title.innerText = 'Gerenciar Projetos';
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        content.innerHTML = `
            <button class="btn-primary" style="width:auto; margin-bottom:20px" onclick="addProject()">+ Novo Projeto</button>
            ${data?.length ? `<table class="data-table"><thead><tr><th>Nome</th><th>Status</th></tr></thead><tbody>
            ${data.map(p => `<tr><td>${p.name}</td><td><span class="badge">${p.status}</span></td></tr>`).join('')}
            </tbody></table>` : '<p>Nenhum projeto.</p>'}`;
    } else if (page === 'finance') {
        title.innerText = 'Financeiro';
        content.innerHTML = '<div class="card"><h3>Mercado Pago Integrado</h3><p>Sistema pronto para receber pagamentos.</p></div>';
    } else {
        title.innerText = page;
        content.innerHTML = '<div class="card">Módulo em desenvolvimento.</div>';
    }
}

async function addProject() {
    const name = prompt('Nome do Projeto:');
    if (!name) return;
    await window.supabaseClient.from('projects').insert({ name, client_id: currentUser.id, status: 'active' });
    navigateTo('projects', window.supabaseClient);
}
