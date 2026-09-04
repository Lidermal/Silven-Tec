/* app.js - Silven Tec Core Logic V18 - Smart Status & DB Fix */

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;
let realtimeDebounceTimer = null; 

// ==========================================
// COMPONENTES DE UI PERSONALIZADOS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '<i data-lucide="info" size="20"></i>';
    if(type === 'success') icon = '<i data-lucide="check-circle" size="20"></i>';
    if(type === 'error') icon = '<i data-lucide="alert-circle" size="20"></i>';
    if(type === 'warning') icon = '<i data-lucide="alert-triangle" size="20"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    if(window.lucide) lucide.createIcons({ nodes: [toast] });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
    return div;
}

window.customConfirm = function(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center; border-color: rgba(239, 68, 68, 0.3);">
                <div style="color: #ef4444; margin-bottom: 1rem; display: flex; justify-content: center;">
                    <i data-lucide="alert-triangle" style="width: 50px; height: 50px;"></i>
                </div>
                <h3 style="color: white; font-size: 1.3rem; margin-bottom: 0.8rem; font-family:'Orbitron';">${title}</h3>
                <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 1rem;">
                    <button id="btn-custom-cancel" class="action-btn" style="flex: 1;">Cancelar</button>
                    <button id="btn-custom-ok" class="btn-primary" style="flex: 1; background: #ef4444; color: white;">Sim, confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if(window.lucide) lucide.createIcons({nodes: [overlay]});
        
        document.getElementById('btn-custom-cancel').onclick = () => { overlay.remove(); resolve(false); };
        document.getElementById('btn-custom-ok').onclick = () => { overlay.remove(); resolve(true); };
    });
};

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val); }
function formatDate(dateStr) { 
    if(!dateStr) return '-';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
}

async function generateSmartToken(name) {
    const prefix = 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

function calculateFinalValue(baseValue, deadlineStr) {
    const value = Number(baseValue);
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(deadlineStr + 'T00:00:00'); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { final: value, isLate: false, days: 0 };
    const multa = value * 0.02;
    const juros = value * (0.00033 * diffDays);
    return { final: value + multa + juros, isLate: true, days: diffDays };
}

function getLogoBase64() {
    const img = document.getElementById('hidden-logo');
    if(!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
}

// ==========================================
// REALTIME LISTENERS
// ==========================================
function setupRealtime() {
    db.channel('public:all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          clearTimeout(realtimeDebounceTimer);
          realtimeDebounceTimer = setTimeout(() => {
              showToast('Banco de dados atualizado', 'success');
              if(document.getElementById('view-dashboard') && !document.getElementById('view-dashboard').classList.contains('hidden')) loadDashboardData();
              if(document.getElementById('view-projects') && !document.getElementById('view-projects').classList.contains('hidden')) loadProjectsTable();
              if(document.getElementById('view-finance') && !document.getElementById('view-finance').classList.contains('hidden')) loadFinanceTable();
              if(document.getElementById('view-contracts') && !document.getElementById('view-contracts').classList.contains('hidden')) loadContractsTable();
          }, 1000);
      })
      .subscribe();
}

// ==========================================
// INDEX / LOGIN
// ==========================================
window.acessarCliente = function() {
    const token = document.getElementById('token-input')?.value.trim().toUpperCase();
    if (!token) return showToast("Insira um token válido.", "warning");
    window.location.href = `client.html?token=${token}`;
};

window.entrarAdmin = async function() {
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-pass')?.value;
    const errEl = document.getElementById('admin-error');
    const btn = document.getElementById('btn-admin-login');
    
    if (!email || !pass) { 
        errEl.textContent = "Preencha e-mail e senha."; 
        errEl.classList.remove('hidden'); 
        return; 
    }

    btn.innerHTML = `Verificando...`; btn.disabled = true; errEl.classList.add('hidden');

    try {
        const { error } = await db.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        sessionStorage.setItem('silven_admin', 'true');
        showToast("Login realizado com sucesso!", "success");
        setTimeout(() => window.location.href = 'admin.html', 500);
    } catch (err) {
        showToast("E-mail ou senha incorretos.", "error");
        btn.innerHTML = `<i data-lucide="shield-check" size="16"></i> Entrar no Sistema`; 
        btn.disabled = false;
        lucide.createIcons();
    }
};

window.logout = async () => { 
    await db.auth.signOut(); 
    sessionStorage.clear(); 
    showToast("Você saiu do sistema.", "info");
    setTimeout(() => window.location.href = 'index.html', 500);
};

// ==========================================
// ADMIN PANEL LOGIC (Projetos & CRUD)
// ==========================================
async function initAdminPanel() {
    setupRealtime();
    loadDashboardData();
    
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    if(document.getElementById('new-start')) document.getElementById('new-start').value = today;
    if(document.getElementById('new-due')) document.getElementById('new-due').value = nextMonth;

    const formNew = document.getElementById('form-new-project');
    if(formNew) {
        formNew.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Gerando...';

            try {
                const clientName = document.getElementById('new-client').value;
                const title = document.getElementById('new-title').value;
                const value = Number(document.getElementById('new-value').value);
                const months = parseInt(document.getElementById('new-months').value);
                const supportType = document.getElementById('new-support').value;
                const startDate = document.getElementById('new-start').value;
                const firstDueDate = document.getElementById('new-due').value;
                
                const token = await generateSmartToken(clientName);

                // NOVO: Projeto nasce com status 'aguardando_assinatura'
                const { data: projData, error: projError } = await db.from('projects').insert([{
                    client_name: clientName, title, total_value: value, 
                    access_token: token, status: 'aguardando_assinatura', 
                    deadline: firstDueDate, signed_client: false,
                    support_type: supportType, start_date: startDate
                }]).select().single();
                if(projError) throw projError;

                const payments = [];
                for(let i=0; i<months; i++) {
                    let d = new Date(firstDueDate + 'T12:00:00');
                    d.setMonth(d.getMonth() + i);
                    payments.push({
                        project_id: projData.id,
                        month_number: i + 1,
                        due_date: d.toISOString().split('T')[0],
                        amount: value,
                        status: 'pending'
                    });
                }
                const { error: payError } = await db.from('payments').insert(payments);
                if(payError) throw payError;

                showToast(`Projeto criado! Token: ${token}`, "success");
                closeModal('modal-new-project');
                e.target.reset();
                loadProjectsTable();
                loadDashboardData();
            } catch (err) {
                showToast("Erro: " + err.message, "error");
            } finally {
                btn.disabled = false; btn.textContent = 'Gerar Contrato';
            }
        });
    }

    const formEdit = document.getElementById('form-edit-project');
    if(formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const client_name = document.getElementById('edit-client').value;
            const title = document.getElementById('edit-title').value;
            const status = document.getElementById('edit-status').value;
            
            try {
                const { error } = await db.from('projects').update({ client_name, title, status }).eq('id', id);
                if(error) throw error;
                showToast("Projeto atualizado!", "success");
                closeModal('modal-edit-project');
                loadProjectsTable();
                loadDashboardData();
            } catch (err) { showToast("Erro ao editar: " + err.message, "error"); }
        });
    }
}

window.switchAdminView = function(viewName) {
    document.querySelectorAll('.admin-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.getElementById(`nav-${viewName}`).classList.add('active');
    
    if(viewName === 'dashboard') loadDashboardData();
    if(viewName === 'projects') loadProjectsTable();
    if(viewName === 'finance') loadFinanceTable();
    if(viewName === 'contracts') loadContractsTable();
    lucide.createIcons();
};

async function loadDashboardData() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    
    let rev = 0, signed = 0;
    const tbody = document.getElementById('dash-recent-list');
    tbody.innerHTML = '';
    
    if(data && data.length > 0) {
        data.forEach(p => {
            rev += Number(p.total_value);
            if(p.signed_client) signed++;
            if(tbody.children.length < 5) {
                tbody.innerHTML += `<tr><td>${p.client_name}</td><td>${p.title}</td><td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td><td><span class="badge badge-cyan">${p.status.replace('_', ' ')}</span></td><td>${formatCurrency(p.total_value)}</td></tr>`;
            }
        });
        document.getElementById('dash-active-proj').textContent = data.length;
    } else {
        document.getElementById('dash-active-proj').textContent = "0";
    }
    
    document.getElementById('dash-revenue').textContent = formatCurrency(rev);
    document.getElementById('dash-signed').textContent = signed;
}

async function loadProjectsTable() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    const tbody = document.getElementById('projects-list');
    tbody.innerHTML = '';
    data?.forEach(p => {
        tbody.innerHTML += `<tr>
            <td style="font-weight:600;">${p.title}</td>
            <td>${p.client_name}</td>
            <td>${formatDate(p.start_date)} até ${formatDate(p.deadline)}</td>
            <td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td>
            <td>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${p.access_token}');showToast('Copiado!', 'success')" title="Copiar Token"><i data-lucide="copy" size="16"></i></button>
                <button class="action-btn" onclick="openEditProject('${p.id}', '${p.client_name}', '${p.title}', '${p.status}')" title="Editar"><i data-lucide="edit" size="16"></i></button>
                <button class="action-btn delete" onclick="deleteProject('${p.id}')" title="Excluir"><i data-lucide="trash-2" size="16"></i></button>
            </td>
        </tr>`;
    });
    lucide.createIcons();
}

window.openEditProject = (id, client, title, status) => {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-client').value = client;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-status').value = status;
    openModal('modal-edit-project');
};

window.deleteProject = async (id) => {
    const confirmed = await customConfirm("Alerta de Exclusão", "Certeza absoluta que deseja excluir este projeto?<br><strong>Isso apagará permanentemente</strong> todas as parcelas e contratos vinculados a ele.");
    if(!confirmed) return;
    
    try {
        await db.from('payments').delete().eq('project_id', id);
        await db.from('contracts').delete().eq('project_id', id);
        const { error } = await db.from('projects').delete().eq('id', id);
        if(error) throw error;
        showToast("Projeto excluído com sucesso.", "success");
        
        loadProjectsTable();
        loadDashboardData();
        loadFinanceTable();
    } catch (e) { showToast("Erro ao excluir: " + e.message, "error"); }
};

// ADMIN: FINANCEIRO EM CARDS
async function loadFinanceTable() {
    const { data: projects } = await db.from('projects').select('id, client_name, title, access_token, total_value');
    const { data: payments } = await db.from('payments').select('*');
    
    let received = 0, pending = 0;
    const container = document.getElementById('finance-cards-container');
    container.innerHTML = '';

    if(!projects || projects.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);">Nenhum projeto cadastrado ainda.</p>`;
        document.getElementById('fin-received').textContent = formatCurrency(0);
        document.getElementById('fin-pending').textContent = formatCurrency(0);
        return;
    }

    projects.forEach(proj => {
        const projPayments = payments?.filter(p => p.project_id === proj.id) || [];
        const paidCount = projPayments.filter(p => p.status === 'paid').length;
        const totalCount = projPayments.length;
        
        projPayments.forEach(p => {
            if(p.status === 'paid') received += Number(p.amount);
            else pending += Number(p.amount);
        });

        const card = document.createElement('div');
        card.className = 'finance-card';
        card.onclick = () => openFinanceDetails(proj, projPayments);
        card.innerHTML = `
            <h4>${proj.client_name}</h4>
            <p>${proj.title}</p>
            <div class="finance-info">
                <span style="color:var(--text-main); font-size: 0.9rem; font-weight:600;">${paidCount}/${totalCount} Pagos</span>
                <span class="finance-token">${proj.access_token}</span>
            </div>
            <div style="margin-top: 1rem; text-align:right; font-weight:700; color:var(--cyan); font-size:1.2rem;">
                ${formatCurrency(proj.total_value)} /mês
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('fin-received').textContent = formatCurrency(received);
    document.getElementById('fin-pending').textContent = formatCurrency(pending);
}

// Abertura do Menu Deslizante
window.openFinanceDetails = (proj, payments) => {
    document.getElementById('finance-modal-title').textContent = proj.client_name;
    const tbody = document.getElementById('finance-modal-list');
    tbody.innerHTML = '';
    
    payments.sort((a,b) => a.month_number - b.month_number);

    payments.forEach(p => {
        const isLate = new Date(p.due_date + 'T00:00:00') < new Date() && p.status !== 'paid';
        const badgeClass = p.status==='paid' ? 'badge-green' : (isLate ? 'badge-red' : 'badge-cyan');
        const badgeText = p.status==='paid' ? 'Pago' : (isLate ? 'Atrasado' : 'Pendente');
        
        tbody.innerHTML += `<tr>
            <td>${p.month_number}ª Parcela</td>
            <td>${formatDate(p.due_date)}</td>
            <td>${formatCurrency(p.amount)}</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            <td>
               <button class="action-btn" title="Marcar como Pago" onclick="markPaid('${p.id}')"><i data-lucide="check" size="16"></i></button>
            </td>
        </tr>`;
    });
    
    document.getElementById('slide-finance-details').classList.add('active');
    lucide.createIcons();
};

window.closeSlidePanel = (id) => document.getElementById(id).classList.remove('active');

window.markPaid = async (paymentId) => {
    const confirmed = await customConfirm("Registro de Pagamento", "Deseja registrar e confirmar o pagamento desta parcela?");
    if(!confirmed) return;
    
    try {
        await db.from('payments').update({ status: 'paid' }).eq('id', paymentId);
        showToast("Parcela atualizada com sucesso!", "success");
        document.getElementById('slide-finance-details').classList.remove('active');
        loadFinanceTable();
    } catch(e) { showToast("Erro: " + e.message, "error"); }
};

// ADMIN: CONTRATOS E PDF REGENERATOR
async function loadContractsTable() {
    const { data: projects } = await db.from('projects').select('*');
    const { data: contracts } = await db.from('contracts').select('*');
    const tbody = document.getElementById('contracts-list');
    tbody.innerHTML = '';
    projects?.forEach(p => {
        const contract = contracts?.find(c => c.project_id === p.id);
        const signedDate = contract ? formatDate(contract.signed_at) + ' às ' + new Date(contract.signed_at).toLocaleTimeString('pt-BR').substring(0,5) : '-';
        
        tbody.innerHTML += `<tr>
            <td>${p.title}</td>
            <td>${p.client_name}</td>
            <td>${signedDate}</td>
            <td><span class="badge ${contract ? 'badge-green' : 'badge-red'}">${contract ? 'Assinado' : 'Pendente'}</span></td>
            <td>
                ${contract ? `<button class="action-btn primary" onclick="generateAdminPDF('${p.id}')"><i data-lucide="download" size="14"></i> Baixar PDF</button>` : `<span style="font-size:0.8rem; color:var(--text-muted);">Aguardando Cliente</span>`}
            </td>
        </tr>`;
    });
    lucide.createIcons();
}

window.generateAdminPDF = async (projectId) => {
    const { data: proj } = await db.from('projects').select('*').eq('id', projectId).single();
    const { data: contr } = await db.from('contracts').select('*').eq('project_id', projectId).single();
    if(!proj || !contr) return showToast("Erro ao carregar dados do contrato.", "error");
    generatePDFDocument(proj, contr.signature_data, contr.signed_at);
};

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

// ==========================================
// CLIENT AREA LOGIC
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
    
    if(error || !data) { 
        showToast("Token inválido ou projeto cancelado/excluído.", "error");
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    currentProject = data;
    document.getElementById('proj-title').textContent = data.title;
    document.getElementById('client-name').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('status-badge').textContent = data.status.replace('_', ' ').toUpperCase();
    document.getElementById('deadline-display').textContent = formatDate(data.deadline);

    const financeData = calculateFinalValue(data.total_value, data.deadline);
    const valEl = document.getElementById('finance-value');
    const lateMsg = document.getElementById('late-fee-msg');
    valEl.textContent = formatCurrency(financeData.final);
    
    if(financeData.isLate) {
        lateMsg.classList.remove('hidden');
        lateMsg.innerHTML = `<strong>Atenção:</strong> Atraso de ${financeData.days} dias.<br>Multa (2%) + Juros (0,033%/dia) aplicados.`;
    } else { lateMsg.classList.add('hidden'); }

    if(data.signed_client) {
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.remove('hidden');
    }

    const { data: payments } = await db.from('payments').select('*').eq('project_id', data.id).order('month_number', {ascending: true});
    const tbody = document.getElementById('client-finance-list');
    
    if(tbody && payments) {
        tbody.innerHTML = '';
        payments.forEach(p => {
            const isLate = new Date(p.due_date + 'T00:00:00') < new Date() && p.status !== 'paid';
            const badgeClass = p.status==='paid' ? 'badge-green' : (isLate ? 'badge-red' : 'badge-cyan');
            const badgeText = p.status==='paid' ? 'Pago' : (isLate ? 'Atrasado' : 'Pendente');
            
            tbody.innerHTML += `<tr>
                <td>${p.month_number}ª</td>
                <td>${formatDate(p.due_date)}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            </tr>`;
        });
    }
}

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
    
    const btn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if(btn) btn.classList.add('active');

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
        const financeData = calculateFinalValue(currentProject.total_value, currentProject.deadline);
        const { data, error } = await db.functions.invoke('gerar-pix-mp', { body: { transaction_amount: Number(financeData.final.toFixed(2)), description: `Silven Tec: ${currentProject.title}` } });
        if (error || data?.error) throw new Error(data?.error || 'Falha no gateway MP');
        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
        showToast("PIX gerado com sucesso!", "success");
    } catch(e) { 
        showToast("Erro ao gerar PIX: " + e.message, "error"); 
        btn.classList.remove('hidden'); 
    } finally { load.classList.add('hidden'); }
};

window.copyPix = () => {
    navigator.clipboard.writeText(document.getElementById('pix-code').textContent);
    showToast("Código PIX copiado!", "success");
};

window.clearSig = () => signaturePad?.clear();

window.signContract = async () => {
    if(!signaturePad || signaturePad.isEmpty()) return showToast('Por favor, assine o contrato.', 'warning');
    
    const btn = document.querySelector('#tab-contract .btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" size="18"></i> Salvando Documento...`;
    btn.disabled = true;

    try {
        const sigData = signaturePad.toDataURL();
        const signedDate = new Date().toISOString();
        
        // Salva contrato
        const { error: errContract } = await db.from('contracts').upsert({ project_id: currentProject.id, signature_data: sigData, signed_at: signedDate }, { onConflict: 'project_id' });
        if(errContract) throw new Error("Erro no banco de dados: " + errContract.message);

        // Atualiza status do projeto para EM ANDAMENTO
        const { error: errProj } = await db.from('projects').update({ signed_client: true, status: 'em_andamento' }).eq('id', currentProject.id);
        if(errProj) throw new Error("Erro ao atualizar o status do projeto.");
        
        generatePDFDocument(currentProject, sigData, signedDate);
        
        document.getElementById('sign-area').classList.add('hidden');
        document.getElementById('signed-msg').classList.remove('hidden');
        
        // Atualiza interface do cliente na hora
        document.getElementById('status-badge').textContent = 'EM ANDAMENTO';
        showToast("Contrato salvo com sucesso! O projeto agora está Em Andamento.", "success");
        
    } catch(e) {
        showToast(e.message, "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
    }
};

window.downloadMyContract = async () => {
    try {
        const btn = document.getElementById('btn-download-contract');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" size="18"></i> Gerando Documento...`;
        btn.disabled = true;

        const { data: contr, error } = await db.from('contracts').select('*').eq('project_id', currentProject.id).single();
        if (error || !contr) throw new Error("Contrato não encontrado. Atualize a página.");
        
        generatePDFDocument(currentProject, contr.signature_data, contr.signed_at);
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
    } catch (e) {
        showToast(e.message, "error");
    }
};

// ==========================================
// FUNÇÃO CENTRAL PARA GERAR PDF
// ==========================================
function generatePDFDocument(proj, signatureBase64, dateISO) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const logoBase64 = getLogoBase64();
    if(logoBase64) {
        doc.addImage(logoBase64, 'PNG', 20, 15, 22, 22);
    }
    
    doc.setFontSize(22); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold"); 
    doc.text("SILVEN TEC", (logoBase64 ? 45 : 20), 25);
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica", "normal"); 
    doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA", (logoBase64 ? 45 : 20), 32);
    doc.line(20, 42, 190, 42);
    
    doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold"); 
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA", 20, 52);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATADA: SILVEN TEC`, 20, 62);
    doc.text(`CONTRATANTE: ${proj.client_name}`, 20, 69);
    doc.text(`OBJETO DO CONTRATO: ${proj.title}`, 20, 76);
    doc.text(`VIGÊNCIA: De ${formatDate(proj.start_date)} a ${formatDate(proj.deadline)}`, 20, 83);
    
    const supportText = proj.support_type === 'com_suporte' ? 'INCLUSO (Em dias úteis e horário comercial)' : 'NÃO INCLUSO (Apenas desenvolvimento/entrega)';
    doc.text(`MODALIDADE DE SUPORTE: ${supportText}`, 20, 90);
    
    doc.setFont("helvetica", "bold"); doc.text("CLÁUSULAS CONTRATUAIS:", 20, 105);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    
    const clauses = [
        "CLÁUSULA 1 - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de tecnologia conforme especificado no escopo do projeto, garantindo o cumprimento de todos os requisitos técnicos pré-acordados entre as partes.",
        `CLÁUSULA 2 - DO PAGAMENTO: Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor fixo mensal de ${formatCurrency(proj.total_value)}, que deverá ser pago até a data de vencimento estabelecida na plataforma financeira.`,
        "CLÁUSULA 3 - DA MULTA E JUROS DE MORA: O atraso no pagamento sujeitará a CONTRATANTE a uma multa penal, inarredável, fixada em 2% (dois por cento) sobre o valor do débito, somada a juros de mora de 0,033% (trinta e três milésimos por cento) cobrados ao dia, nos termos da legislação civil vigente.",
        "CLÁUSULA 4 - DAS OBRIGAÇÕES DA CONTRATADA: A CONTRATADA obriga-se a entregar os serviços com zelo, utilizando-se das melhores práticas e ferramentas de desenvolvimento de software atuais, respeitando os prazos delimitados.",
        "CLÁUSULA 5 - DA CONFIDENCIALIDADE E LGPD: Ambas as partes assumem o compromisso de manter o mais absoluto sigilo e confidencialidade sobre todos os dados e informações técnicas ou financeiras compartilhadas, adequando-se integralmente à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
        "CLÁUSULA 6 - DA RESCISÃO E CANCELAMENTO: Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio expresso de, no mínimo, 30 (trinta) dias corridos, garantindo-se a quitação proporcional dos serviços já executados.",
        "CLÁUSULA 7 - DO FORO: Fica eleito o foro da Comarca de Teresina - PI para dirimir e resolver quaisquer dúvidas ou questões oriundas ou relativas a este contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja."
    ];
    
    let yPos = 112;
    clauses.forEach(clause => {
        const splitText = doc.splitTextToSize(clause, 170);
        doc.text(splitText, 20, yPos);
        yPos += (splitText.length * 4) + 4;
    });
    
    yPos += 10;
    doc.addImage(signatureBase64, 'PNG', 20, yPos, 60, 30);
    doc.line(20, yPos + 32, 100, yPos + 32);
    
    const displayDate = new Date(dateISO).toLocaleString('pt-BR');
    doc.setFont("helvetica", "bold"); doc.text("Assinatura Digital do Contratante", 20, yPos + 38);
    doc.setFont("helvetica", "normal"); doc.text(`Validação Eletrônica (MP 2.200-2/2001) - Data: ${displayDate}`, 20, yPos + 44);

    doc.save(`Contrato_SilvenTec_${proj.client_name.replace(/\s/g,'_')}.pdf`);
}
