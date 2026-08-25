// --- AUTENTICAÇÃO ---
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    
    await loadUserData(data.user);
}

async function loadUserData(user) {
    currentUser = user;
    // Busca perfil e role
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    currentRole = profile?.role || 'client';
    
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('active');
    document.getElementById('user-display').innerText = profile.full_name || user.email;
    
    renderMenu();
    navigateTo('dashboard');
}

function renderMenu() {
    const nav = document.getElementById('nav-menu');
    let items = [];
    
    if (currentRole === 'admin') {
        items = [
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'clients', label: '👥 Clientes' },
            { id: 'projects', label: '🚀 Projetos' },
            { id: 'docs', label: '📄 Contratos' },
            { id: 'finance', label: '💰 Financeiro (Asaas)' },
            { id: 'requests', label: '📨 Solicitações' }
        ];
    } else {
        items = [
            { id: 'my-docs', label: '📄 Meus Contratos' },
            { id: 'my-finance', label: '💰 Minhas Parcelas' },
            { id: 'my-requests', label: '📨 Abrir Chamado' }
        ];
    }
    
    nav.innerHTML = items.map(i => `<button onclick="navigateTo('${i.id}')">${i.label}</button>`).join('');
}

function navigateTo(page) {
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    // Lógica simples de roteamento de conteúdo
    const content = document.getElementById('dynamic-content');
    const title = document.getElementById('page-title');
    
    // Aqui você implementaria o switch case para carregar cada tela
    // Exemplo simplificado para Projetos (Admin):
    if (page === 'projects' && currentRole === 'admin') {
        title.innerText = 'Gerenciamento de Projetos';
        loadProjects(content);
    } else if (page === 'dashboard') {
        title.innerText = 'Visão Geral';
        content.innerHTML = `<div class="grid"><div class="card"><h3>Projetos Ativos</h3><p>Carregando...</p></div></div>`;
    }
}

// --- MÓDULO DE PROJETOS (ADMIN) ---
async function loadProjects(container) {
    const { data, error } = await supabase.from('projects').select('*, profiles(full_name)');
    if (error) return container.innerHTML = '<p>Erro ao carregar.</p>';
    
    let html = `
        <button onclick="openNewProjectModal()" style="width:auto; margin-bottom:1rem;">+ Novo Projeto</button>
        <table>
            <thead><tr><th>Projeto</th><th>Solicitante</th><th>URL</th><th>Integrações</th><th>Ações</th></tr></thead>
            <tbody>
    `;
    
    data.forEach(p => {
        html += `
            <tr>
                <td>${p.name}</td>
                <td>${p.profiles?.full_name}</td>
                <td><a href="${p.url}" target="_blank" style="color:var(--primary)">Acessar</a></td>
                <td>
                    <a href="${p.github_url}" target="_blank">GitHub</a> | 
                    <a href="${p.vercel_url}" target="_blank">Vercel</a> | 
                    <span style="cursor:pointer" onclick="alert('DB: ${SUPABASE_URL}')">Supabase</span>
                </td>
                <td class="actions">
                    <button onclick="editProject(${p.id})">Editar</button>
                    <button onclick="deleteProject(${p.id})" style="background:var(--danger)">Excluir</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// --- MÓDULO FINANCEIRO (ASAAS INTEGRATION SIMULATION) ---
// Nota: Em produção, chame a API do Asaas via Edge Functions da Vercel para não expor a chave
async function createAsaasPayment(customerName, email, value, dueDate) {
    // Exemplo de payload para Asaas
    const payload = {
        name: customerName,
        email: email,
        billingType: 'PIX',
        value: value,
        dueDate: dueDate,
        description: 'Pagamento Projeto Silven Tec'
    };
    
    console.log("Enviando para Asaas:", payload);
    alert(`Cobrança PIX de R$ ${value} gerada para ${customerName}. (Integração simulada)`);
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) loadUserData(session.user);
    });
};
