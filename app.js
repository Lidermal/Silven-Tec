/* app.js - Silven Tec Core Logic V6 - Gestão Completa */

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;
let renewingProjectId = null;

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val); }

async function generateSmartToken(name) {
    const prefix = 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

// ==========================================
// INDEX / LOGIN
// ==========================================
window.acessarCliente = function() {
    const token = document.getElementById('token-input')?.value.trim().toUpperCase();
    if (!token) return alert("Insira um token válido.");
    window.location.href = `client.html?token=${token}`;
};

window.entrarAdmin = async function() {
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-pass')?.value;
    const errEl = document.getElementById('admin-error');
    const btn = document.getElementById('btn-admin-login');
    
    if (!email || !pass) { errEl.textContent = "Preencha todos os campos."; errEl.classList.remove('hidden'); return; }

    btn.innerHTML = `Verificando...`; btn.disabled = true; errEl.classList.add('hidden');

    try {
        const { error } = await db.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        sessionStorage.setItem('silven_admin', 'true');
        window.location.href = 'admin.html';
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.innerHTML = `<i data-lucide="shield-check" size="18"></i> Entrar no Sistema`; btn.disabled = false;
        lucide.createIcons();
    }
};

window.logout = async () => { await db.auth.signOut(); sessionStorage.clear(); window.location.href = 'index.html'; };

// ==========================================
// ADMIN PANEL LOGIC
// ==========================================
async function initAdminPanel() {
    loadDashboardData();
    
    // Form Novo Projeto
    document.getElementById('form-new-project')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Gerando Token e Criando...';

        const clientName = document.getElementById('new-client').value;
        const title = document.getElementById('new-title').value;
        const value = document.getElementById('new-value').value;
        const token = await generateSmartToken(clientName);
        const deadline = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

        // Cria Projeto e Cliente (simulado aqui, idealmente teria tabela clients separada)
        const { error } = await db.from('projects').insert([{
            client_name: clientName, title, total_value: value, 
            access_token: token, status: 'em_andamento', deadline, signed_client: false
        }]);

        if(error) alert('Erro: ' + error.message);
        else {
            alert(`Sucesso!\nCliente: ${clientName}\nToken Gerado: ${token}\nEnvie este token ao cliente.`);
            closeModal('modal-new-project');
            e.target.reset();
            loadDashboardData();
            loadProjectsTable();
        }
        btn.disabled = false; btn.textContent = 'Criar e Gerar Token';
    });
}

window.switchAdminView = function(viewName) {
    document.querySelectorAll('.admin-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.getElementById(`nav-${viewName}`).classList.add('active');
    
    // Carrega dados específicos da view
    if(viewName === 'dashboard') loadDashboardData();
    if(viewName === 'projects') loadProjectsTable();
    if(viewName === 'contracts') loadContractsTable();
    if(viewName === 'finance') loadFinanceTable();
    if(viewName === 'clients') loadClientsTable();
    
    lucide.createIcons();
};

async function loadDashboardData() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    if(!data) return;

    let rev = 0, signed = 0, pending = 0;
    const tbody = document.getElementById('dash-recent-list');
    tbody.innerHTML = '';

    data.forEach(p => {
        rev += Number(p.total_value);
        if(p.signed_client) signed++;
        if(!p.signed_client || new Date(p.deadline) < new Date()) pending++;

        if(tbody.children.length < 5) {
            tbody.innerHTML += `
            <tr>
                <td>${p.client_name}</td>
                <td>${p.title}</td>
                <td><span class="badge ${p.status === 'concluido' ? 'badge-green' : 'badge-cyan'}">${p.status}</span></td>
                <td>${formatCurrency(p.total_value)}</td>
                <td><button class="action-btn" onclick="copyToken('${p.access_token}')">Copiar Token</button></td>
            </tr>`;
        }
    });

    document.getElementById('dash-active-proj').textContent = data.length;
    document.getElementById('dash-revenue').textContent = formatCurrency(rev);
    document.getElementById('dash-signed').textContent = signed;
    document.getElementById('dash-pending').textContent = pending;
}

async function loadProjectsTable() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    const tbody = document.getElementById('projects-list');
    tbody.innerHTML = '';
    data?.forEach(p => {
        tbody.innerHTML += `
        <tr>
            <td style="font-weight:600;">${p.title}</td>
            <td>${p.client_name}</td>
            <td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td>
            <td>${new Date(p.deadline).toLocaleDateString('pt-BR')}</td>
            <td><span class="badge badge-cyan">${p.status}</span></td>
            <td>
                <button class="action-btn" onclick="copyToken('${p.access_token}')">Token</button>
                <button class="action-btn primary" onclick="prepareRenewal('${p.id}', '${p.total_value}')">Renovar</button>
            </td>
        </tr>`;
    });
}

async function loadContractsTable() {
    // Busca projetos e junta com info de contrato
    const { data: projects } = await db.from('projects').select('*');
    const { data: contracts } = await db.from('contracts').select('*');
    
    const tbody = document.getElementById('contracts-list');
    tbody.innerHTML = '';
    
    projects?.forEach(p => {
        const contract = contracts?.find(c => c.project_id === p.id);
        const isSigned = !!contract;
        tbody.innerHTML += `
        <tr>
            <td>${p.title}</td>
            <td>${p.client_name}</td>
            <td>${isSigned ? new Date(contract.signed_at).toLocaleDateString('pt-BR') : '-'}</td>
            <td><span class="badge ${isSigned ? 'badge-green' : 'badge-red'}">${isSigned ? 'Assinado' : 'Pendente'}</span></td>
            <td>
                ${!isSigned ? `<button class="action-btn primary" onclick="alert('Envie o link do cliente: client.html?token=${p.access_token}')">Enviar Termo</button>` : '<button class="action-btn">Baixar PDF</button>'}
            </td>
        </tr>`;
    });
}

async function loadFinanceTable() {
    const { data } = await db.from('projects').select('*');
    const tbody = document.getElementById('finance-list');
    tbody.innerHTML = '';
    let received = 0, toReceive = 0;

    data?.forEach(p => {
        const isLate = new Date(p.deadline) < new Date();
        const val = Number(p.total_value);
        if(!isLate) received += val; else toReceive += val;

        tbody.innerHTML += `
        <tr>
            <td>${p.client_name}</td>
            <td>${p.title}</td>
            <td>${formatCurrency(val)}</td>
            <td>${new Date(p.deadline).toLocaleDateString('pt-BR')}</td>
            <td><span class="badge ${isLate ? 'badge-red' : 'badge-green'}">${isLate ? 'Atrasado' : 'Em Dia'}</span></td>
            <td><button class="action-btn primary" onclick="prepareRenewal('${p.id}', '${val}')">Renovar Contrato</button></td>
        </tr>`;
    });

    document.getElementById('fin-received').textContent = formatCurrency(received);
    document.getElementById('fin-toreceive').textContent = formatCurrency(toReceive);
}

async function loadClientsTable() {
    const { data } = await db.from('projects').select('client_name, created_at').order('created_at', {ascending: false});
    const tbody = document.getElementById('clients-list');
    tbody.innerHTML = '';
    // Agrupa por nome único (simples)
    const uniqueClients = [...new Set(data?.map(p => p.client_name))];
    uniqueClients.forEach(name => {
        const projCount = data.filter(p => p.client_name === name).length;
        tbody.innerHTML += `<tr><td style="font-weight:600;">${name}</td><td>-</td><td>${projCount}</td><td>-</td><td><button class="action-btn">Ver Histórico</button></td></tr>`;
    });
}

// --- AÇÕES GLOBAIS ---
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.copyToken = (tok) => { navigator.clipboard.writeText(tok); alert('Token copiado: ' + tok); };

window.prepareRenewal = (id, val) => {
    renewingProjectId = id;
    document.getElementById('renew-value').value = val;
    openModal('modal-renew');
};

window.confirmRenewal = async () => {
    const newVal = document.getElementById('renew-value').value;
    const newDeadline = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    
    // Atualiza projeto e reseta assinatura para forçar novo termo
    await db.from('projects').update({ 
        total_value: newVal, deadline: newDeadline, signed_client: false, status: 'em_andamento' 
    }).eq('id', renewingProjectId);
    
    // Remove contrato antigo para obrigar reassinatura
    await db.from('contracts').delete().eq('project_id', renewingProjectId);

    alert('Contrato renovado! O cliente deverá assinar o novo termo.');
    closeModal('modal-renew');
    loadDashboardData();
    loadFinanceTable();
};

// ==========================================
// CLIENT AREA LOGIC (Mantida e Integrada)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('proj-title')) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if(token) initClientArea(token);
    }
});

async function initClientArea(token) {
    const { data, error } = await db.from('projects').select('*').eq('access_token', token).single();
    if(error || !data) { alert('Token inválido.'); window.location.href='index.html'; return; }
    
    currentProject = data;
    document.getElementById('proj-title').textContent = data.title;
    document.getElementById('client-name').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('status-badge').textContent = data.status.toUpperCase();
    document.getElementById('deadline-display').textContent = new Date(data.deadline).toLocaleDateString('pt-BR');

    // Cálculo de multa
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    let finalValue = Number(data.total_value);
    const valEl = document.getElementById('finance-value');
    
    if(diffDays > 0 && valEl) {
        finalValue += (finalValue * 0.02) + (finalValue * 0.00033 * diffDays);
        valEl.innerHTML = `${formatCurrency(finalValue)} <span style="font-size:0.85rem; color:#ef4444; display:block; margin-top:0.8rem;">Atraso de ${diffDays} dias (Multa + Juros aplicados)</span>`;
    } else if(valEl) { valEl.textContent = formatCurrency(finalValue); }

    if(data.signed_client) {
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.remove('hidden');
    }
}

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
    event.currentTarget.classList.add('active');

    if(tabName === 'contract' && !signaturePad && currentProject && !currentProject.signed_client) {
        const canvas = document.getElementById('sig-pad');
        if(canvas) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: '#0f172a' });
        }
    }
};

window.generatePix = async function() {
    const btn = document.getElementById('btn-pix');
    const load = document.getElementById('pix-loading');
    btn.classList.add('hidden'); load.classList.remove('hidden');
    try {
        const { data, error } = await db.functions.invoke('gerar-pix-mp', { body: { transaction_amount: Number(currentProject.total_value), description: `Silven Tec: ${currentProject.title}` } });
        if (error || data?.error) throw new Error(data?.error || 'Falha no gateway');
        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
    } catch(e) { alert("Erro PIX: " + e.message); btn.classList.remove('hidden'); } finally { load.classList.add('hidden'); }
};

window.copyPix = () => navigator.clipboard.writeText(document.getElementById('pix-code').textContent).then(() => alert('Código copiado!'));
window.clearSig = () => signaturePad?.clear();

window.signContract = async () => {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Assine o contrato.');
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(24); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold"); doc.text("SILVEN TEC", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal"); doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA", 20, 32); doc.line(20, 38, 190, 38);
    doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.text("CONTRATO DIGITAL DE PRESTAÇÃO DE SERVIÇOS", 20, 55);
    doc.setFontSize(11); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 75);
    doc.text(`PROJETO: ${currentProject.title}`, 20, 83);
    doc.text(`VALOR MENSAL: ${formatCurrency(currentProject.total_value)}`, 20, 91);
    doc.setFontSize(10); doc.setTextColor(100); doc.text("CLÁUSULA DE ATRASO: Multa fixa de 2% + juros de mora de 0,033% ao dia.", 20, 110);
    doc.addImage(sigData, 'PNG', 20, 150, 80, 40); doc.line(20, 192, 100, 192); doc.text("Assinatura Eletrônica", 20, 198);
    doc.save(`Contrato_SilvenTec_${currentProject.title}.pdf`);

    await db.from('contracts').upsert({ project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() }, { onConflict: 'project_id' });
    await db.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
};
