// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se está logado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    loadDashboardStats();
    loadProjectsList();

    // Evento de Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    // Evento de Criar Projeto
    document.getElementById('formNovoProjeto').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btnSubmitProjeto');
        btn.textContent = 'Criando...';
        btn.disabled = true;

        const client = document.getElementById('new-client').value;
        const title = document.getElementById('new-title').value;
        const value = document.getElementById('new-value').value;

        const response = await ContractService.createProject(client, title, value);

        if (response.success) {
            alert(`Projeto criado com sucesso!\nToken do cliente: ${response.token}`);
            e.target.reset();
            loadProjectsList();
            loadDashboardStats();
        } else {
            alert('Erro ao criar: ' + response.message);
        }

        btn.textContent = 'Cadastrar Projeto';
        btn.disabled = false;
    });
});

async function loadDashboardStats() {
    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) return;

    let receita = 0;
    projects.forEach(p => receita += Number(p.total_value));

    document.getElementById('stat-projects').textContent = projects.length;
    document.getElementById('stat-revenue').textContent = `R$ ${receita.toFixed(2)}`;
}

async function loadProjectsList() {
    const list = document.getElementById('admin-projects-list');
    list.innerHTML = '<p class="text-slate-400 text-sm">Carregando...</p>';

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<p class="text-red-400">Erro: ${error.message}</p>`;
        return;
    }

    list.innerHTML = '';
    projects.forEach(p => {
        list.innerHTML += `
            <div class="flex justify-between items-center p-4 bg-slate-800/40 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition">
                <div>
                    <h4 class="font-bold text-white">${p.title}</h4>
                    <p class="text-xs text-slate-400">${p.client_name} • Token: <span class="text-cyan-400 font-mono">${p.access_token}</span></p>
                </div>
                <div class="text-right">
                    <span class="block text-emerald-400 font-bold">R$ ${Number(p.total_value).toFixed(2)}/mês</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 uppercase">${p.status}</span>
                </div>
            </div>
        `;
    });
}
