// app.js - Lógica do Sistema Silven Tec
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', async () => {
    // Proteção: Se o supabase não carregou, avisa no console
    if (typeof supabase === 'undefined') {
        console.error('ERRO CRÍTICO: Supabase não inicializado. Verifique o config.js');
        alert('Erro de configuração do sistema. Contate o administrador.');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await initApp(session.user);
    } catch (err) {
        console.error('Falha ao verificar sessão:', err);
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') initApp(session.user);
        if (event === 'SIGNED_OUT') window.location.reload();
    });

    const form = document.getElementById('auth-form');
    if (form) form.addEventListener('submit', handleAuth);
});

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('auth-btn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) return alert('Preencha todos os campos');

    btn.innerText = 'Processando...';
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

        if (!isLoginMode) {
            alert('Cadastro realizado! Verifique seu e-mail para confirmar o acesso.');
            toggleAuthMode();
        }
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
    await supabase.auth.signOut();
    window.location.reload();
}

async function initApp(user) {
    currentUser = user;
    
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        currentRole = profile?.role || 'client';
        document.getElementById('user-name').innerText = profile?.full_name || user.email;
        
        document.getElementById('auth-screen').classList.replace('active', 'hidden');
        document.getElementById('app-screen').classList.replace('hidden', 'active');
        
        renderSidebar();
        navigateTo('dashboard');
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        alert('Erro ao carregar dados do usuário. Tente recarregar a página.');
    }
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const items = currentRole === 'admin' ? [
        { id: 'dashboard', label: 'Visão Geral' },
        { id: 'projects', label: 'Projetos' },
        { id: 'finance', label: 'Financeiro' }
    ] : [
        { id: 'my-projects', label: 'Meus Projetos' },
        { id: 'invoices', label: 'Faturas' }
    ];

    nav.innerHTML = items.map(i => `
        <button onclick="navigateTo('${i.id}')" id="nav-${i.id}">${i.label}</button>
    `).join('');
}

function navigateTo(page) {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${page}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const title = document.getElementById('page-title');
    const content = document.getElementById('main-content');
    
    if (page === 'dashboard') {
        title.innerText = 'Visão Geral';
        content.innerHTML = `
            <div class="grid">
                <div class="card"><h3>Projetos Ativos</h3><p class="big-number" id="stat-projects">...</p></div>
                <div class="card"><h3>Faturamento</h3><p class="big-number">R$ 0,00</p></div>
            </div>`;
        loadStats();
    } else if (page === 'projects') {
        title.innerText = 'Gerenciar Projetos';
        content.innerHTML = `
            <button class="btn-primary" style="width:auto; margin-bottom:20px" onclick="addProject()">+ Novo Projeto</button>
            <div id="projects-list">Carregando...</div>`;
        loadProjects();
    } else {
        title.innerText = page.charAt(0).toUpperCase() + page.slice(1);
        content.innerHTML = '<div class="card">Módulo em desenvolvimento.</div>';
    }
}

async function loadStats() {
    try {
        const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        document.getElementById('stat-projects').innerText = count || 0;
    } catch (e) { console.error(e); }
}

async function loadProjects() {
    try {
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
                    <td><strong>${p.name}</strong><br><small>${p.url || '-'}</small></td>
                    <td>${p.profiles?.full_name || 'N/A'}</td>
                    <td><span class="badge">${p.status}</span></td>
                    <td><button class="btn-sm">Editar</button></td>
                </tr>
            `).join('')}</tbody>
        </table>`;
    } catch (e) { 
        document.getElementById('projects-list').innerHTML = '<p>Erro ao carregar projetos.</p>';
    }
}

async function addProject() {
    const name = prompt('Nome do Projeto:');
    if (!name) return;
    
    try {
        const { error } = await supabase.from('projects').insert({ 
            name, 
            client_id: currentUser.id,
            status: 'active'
        });
        if (error) throw error;
        loadProjects();
    } catch (err) {
        alert('Erro ao criar projeto: ' + err.message);
    }
}
