// app.js - Sistema Silven Tec Completo
let isLoginMode = true;
const MP_PUBLIC_KEY = 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; // Sua chave de teste MP

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) {
        alert('Erro crítico: Supabase não inicializado. Verifique config.js e conexão.');
        return;
    }
    const supabase = window.supabaseClient;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) await initApp(session.user, supabase);
    } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        if (err.message.includes('relation "profiles" does not exist')) {
            alert('Banco de dados não configurado. Execute o SQL no Supabase primeiro.');
        }
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
    
    if (!email || !password) return alert('Preencha e-mail e senha.');

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
                options: { 
                    emailRedirectTo: window.location.origin,
                    data: { full_name: email.split('@')[0] }
                }
            });
        }

        if (res.error) throw res.error;

        if (!isLoginMode) {
            alert('✅ Cadastro realizado! Verifique seu e-mail para confirmar o acesso.');
            toggleAuthMode();
        }
    } catch (err) {
        alert(`Erro: ${err.message}`);
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
    
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error;
            
        currentRole = profile?.role || 'client';
        document.getElementById('user-name').innerText = profile?.full_name || user.email;
        
        document.getElementById('auth-screen').classList.replace('active', 'hidden');
        document.getElementById('app-screen').classList.replace('hidden', 'active');
        
        renderSidebar();
        navigateTo('dashboard', supabase);
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        alert(`Falha ao carregar dados: ${err.message}. Verifique se executou o SQL corretamente.`);
    }
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    const items = currentRole === 'admin' ? [
        { id: 'dashboard', label: '📊 Visão Geral' },
        { id: 'projects', label: '🚀 Projetos' },
        { id: 'finance', label: '💰 Financeiro' },
        { id: 'clients', label: '👥 Clientes' }
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
    
    try {
        switch(page) {
            case 'dashboard':
                title.innerText = 'Visão Geral';
                await loadDashboard(content, supabase);
                break;
            case 'projects':
                title.innerText = 'Gerenciar Projetos';
                await loadProjects(content, supabase);
                break;
            case 'finance':
                title.innerText = 'Financeiro (Mercado Pago)';
                await loadFinance(content, supabase);
                break;
            default:
                title.innerText = page.charAt(0).toUpperCase() + page.slice(1);
                content.innerHTML = '<div class="card"><p>Módulo em desenvolvimento.</p></div>';
        }
    } catch (err) {
        content.innerHTML = `<div class="card error"><p>Erro ao carregar: ${err.message}</p></div>`;
    }
}

async function loadDashboard(container, supabase) {
    const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    
    container.innerHTML = `
        <div class="grid">
            <div class="card">
                <h3>Projetos Ativos</h3>
                <p class="big-number">${projectCount || 0}</p>
            </div>
            <div class="card">
                <h3>Faturamento (Teste)</h3>
                <p class="big-number">R$ 0,00</p>
                <small>Dados reais após integração MP</small>
            </div>
            <div class="card">
                <h3>Seu Nível</h3>
                <p class="big-number" style="font-size:1.5rem">${currentRole.toUpperCase()}</p>
            </div>
        </div>`;
}

async function loadProjects(container, supabase) {
    let query = supabase.from('projects').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (currentRole === 'client') query = query.eq('client_id', currentUser.id);
    
    const { data, error } = await query;
    if (error) throw error;

    let html = `<button class="btn-primary" style="width:auto; margin-bottom:20px" onclick="addProject()">+ Novo Projeto</button>`;
    
    if (!data || data.length === 0) {
        html += '<p>Nenhum projeto encontrado.</p>';
    } else {
        html += `<table class="data-table">
            <thead><tr><th>Projeto</th><th>Cliente</th><th>Status</th><th>Links</th><th>Ações</th></tr></thead>
            <tbody>${data.map(p => `
                <tr>
                    <td><strong>${p.name}</strong><br><small>${p.url || '-'}</small></td>
                    <td>${p.profiles?.full_name || 'N/A'}</td>
                    <td><span class="badge">${p.status}</span></td>
                    <td>
                        ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="link-sm">GitHub</a>` : ''}
                        ${p.vercel_url ? `<a href="${p.vercel_url}" target="_blank" class="link-sm">Vercel</a>` : ''}
                    </td>
                    <td><button class="btn-sm" onclick="editProject(${p.id})">Editar</button></td>
                </tr>
            `).join('')}</tbody>
        </table>`;
    }
    container.innerHTML = html;
}

async function loadFinance(container, supabase) {
    container.innerHTML = `
        <div class="card">
            <h3>Integração Mercado Pago (Modo Teste)</h3>
            <p>Gere cobranças Pix/Card diretamente pelo sistema.</p>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <input type="number" id="mp-amount" placeholder="Valor (R$)" style="width:150px">
                <input type="text" id="mp-desc" placeholder="Descrição" style="flex:1">
                <button class="btn-primary" style="width:auto" onclick="createMPCharge()">Gerar Cobrança</button>
            </div>
            <div id="mp-result" style="margin-top:20px"></div>
        </div>`;
}

// --- AÇÕES ---
async function addProject() {
    const name = prompt('Nome do Projeto:');
    if (!name) return;
    
    const clientId = currentRole === 'admin' 
        ? (prompt('ID do Cliente (UUID):') || currentUser.id) 
        : currentUser.id;
    
    const { error } = await window.supabaseClient.from('projects').insert({ 
        name, client_id: clientId, status: 'active' 
    });
    
    if (error) alert('Erro: ' + error.message);
    else navigateTo('projects', window.supabaseClient);
}

async function createMPCharge() {
    const amount = document.getElementById('mp-amount').value;
    const desc = document.getElementById('mp-desc').value;
    
    if (!amount || !desc) return alert('Preencha valor e descrição');
    
    // Simulação - Em produção, chame sua API Route da Vercel
    document.getElementById('mp-result').innerHTML = `
        <div class="card" style="border-color:var(--primary)">
            <p>✅ Cobrança de R$ ${amount} criada (Simulação)</p>
            <p><small>Descrição: ${desc}</small></p>
            <p><small>Para funcionar real, configure a API Route /api/create-payment na Vercel</small></p>
        </div>`;
}
