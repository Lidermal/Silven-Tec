/* app.js - Silven Tec Core Logic V20 - Double Signature & Tech Scope (Rounded Logo Fix) */

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let currentContract = null;
let signaturePad = null;
let adminSignaturePad = null;
let realtimeDebounceTimer = null; 

// ==========================================
// COMPONENTES DE UI
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
    return { final: value + (value*0.02) + (value * (0.00033 * diffDays)), isLate: true, days: diffDays };
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

function setupRealtime() {
    db.channel('public:all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          clearTimeout(realtimeDebounceTimer);
          realtimeDebounceTimer = setTimeout(() => {
              showToast('Dados atualizados em tempo real', 'success');
              if(document.getElementById('view-dashboard') && !document.getElementById('view-dashboard').classList.contains('hidden')) loadDashboardData();
              if(document.getElementById('view-projects') && !document.getElementById('view-projects').classList.contains('hidden')) loadProjectsTable();
              if(document.getElementById('view-finance') && !document.getElementById('view-finance').classList.contains('hidden')) loadFinanceTable();
              if(document.getElementById('view-contracts') && !document.getElementById('view-contracts').classList.contains('hidden')) loadContractsTable();
          }, 1000);
      }).subscribe();
}

// ==========================================
// ADMIN LOGIC
// ==========================================
window.entrarAdmin = async function() {
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-pass')?.value;
    const errEl = document.getElementById('admin-error');
    const btn = document.getElementById('btn-admin-login');
    if (!email || !pass) { errEl.textContent = "Preencha e-mail e senha."; errEl.classList.remove('hidden'); return; }
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
        btn.disabled = false; lucide.createIcons();
    }
};

window.logout = async () => { await db.auth.signOut(); sessionStorage.clear(); window.location.href = 'index.html'; };

async function initAdminPanel() {
    setupRealtime();
    loadDashboardData();
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('new-start')) document.getElementById('new-start').value = today;

    const formNew = document.getElementById('form-new-project');
    if(formNew) {
        formNew.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Gerando...';
            try {
                const clientName = document.getElementById('new-client').value;
                const title = document.getElementById('new-title').value;
                const techStack = document.getElementById('new-techs').value; 
                const value = Number(document.getElementById('new-value').value);
                const months = parseInt(document.getElementById('new-months').value);
                const supportType = document.getElementById('new-support').value;
                const startDate = document.getElementById('new-start').value;
                const firstDueDate = document.getElementById('new-due').value;
                const token = await generateSmartToken(clientName);

                const { data: projData, error: projError } = await db.from('projects').insert([{
                    client_name: clientName, title, total_value: value, 
                    access_token: token, status: 'aguardando_assinatura', 
                    deadline: firstDueDate, signed_client: false,
                    support_type: supportType, start_date: startDate,
                    tech_stack: techStack
                }]).select().single();
                if(projError) throw projError;

                const payments = [];
                for(let i=0; i<months; i++) {
                    let d = new Date(firstDueDate + 'T12:00:00'); d.setMonth(d.getMonth() + i);
                    payments.push({ project_id: projData.id, month_number: i + 1, due_date: d.toISOString().split('T')[0], amount: value, status: 'pending' });
                }
                const { error: payError } = await db.from('payments').insert(payments);
                if(payError) throw payError;

                showToast(`Estrutura criada! O contrato está aguardando sua assinatura.`, "success");
                closeModal('modal-new-project'); e.target.reset();
                loadProjectsTable(); loadDashboardData(); loadContractsTable();
            } catch (err) { showToast("Erro: " + err.message, "error"); } 
            finally { btn.disabled = false; btn.textContent = 'Criar Estrutura'; }
        });
    }

    const formEdit = document.getElementById('form-edit-project');
    if(formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const { error } = await db.from('projects').update({ 
                client_name: document.getElementById('edit-client').value, 
                title: document.getElementById('edit-title').value, 
                status: document.getElementById('edit-status').value 
            }).eq('id', id);
            if(!error) { showToast("Projeto atualizado!", "success"); closeModal('modal-edit-project'); loadProjectsTable(); }
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
    let rev = 0, signed = 0; const tbody = document.getElementById('dash-recent-list'); tbody.innerHTML = '';
    if(data) {
        data.forEach(p => {
            rev += Number(p.total_value); if(p.signed_client) signed++;
            if(tbody.children.length < 5) {
                const badgeClass = p.status === 'aguardando_assinatura' ? 'badge-warning' : (p.status === 'em_andamento' ? 'badge-cyan' : (p.status === 'concluido' ? 'badge-green' : 'badge-red'));
                tbody.innerHTML += `<tr><td>${p.client_name}</td><td>${p.title}</td><td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td><td><span class="badge ${badgeClass}">${p.status.replace('_', ' ').toUpperCase()}</span></td><td>${formatCurrency(p.total_value)}</td></tr>`;
            }
        });
        document.getElementById('dash-active-proj').textContent = data.length;
    }
    document.getElementById('dash-revenue').textContent = formatCurrency(rev); document.getElementById('dash-signed').textContent = signed;
}

async function loadProjectsTable() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    const tbody = document.getElementById('projects-list'); tbody.innerHTML = '';
    data?.forEach(p => {
        tbody.innerHTML += `<tr><td style="font-weight:600;">${p.title}</td><td>${p.client_name}</td><td>${formatDate(p.start_date)} até ${formatDate(p.deadline)}</td>
            <td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td>
            <td>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${p.access_token}');showToast('Copiado!','success')"><i data-lucide="copy" size="16"></i></button>
                <button class="action-btn" onclick="openEditProject('${p.id}','${p.client_name}','${p.title}','${p.status}')"><i data-lucide="edit" size="16"></i></button>
                <button class="action-btn delete" onclick="deleteProject('${p.id}')"><i data-lucide="trash-2" size="16"></i></button>
            </td></tr>`;
    });
    lucide.createIcons();
}

window.openEditProject = (id, client, title, status) => {
    document.getElementById('edit-id').value = id; document.getElementById('edit-client').value = client;
    document.getElementById('edit-title').value = title; document.getElementById('edit-status').value = status;
    openModal('modal-edit-project');
};

window.deleteProject = async (id) => {
    if(!await customConfirm("Aviso", "Excluir permanentemente este projeto e todas as parcelas?")) return;
    try {
        await db.from('payments').delete().eq('project_id', id); await db.from('contracts').delete().eq('project_id', id);
        await db.from('projects').delete().eq('id', id);
        showToast("Excluído com sucesso.", "success"); loadProjectsTable(); loadDashboardData(); loadFinanceTable();
    } catch(e) { showToast("Erro: " + e.message, "error"); }
};

async function loadFinanceTable() {
    const { data: projects } = await db.from('projects').select('id, client_name, title, access_token, total_value');
    const { data: payments } = await db.from('payments').select('*');
    let received = 0, pending = 0; const container = document.getElementById('finance-cards-container'); container.innerHTML = '';
    
    if(!projects || projects.length===0) return container.innerHTML = `<p style="color:var(--text-muted);">Sem dados.</p>`;
    projects.forEach(proj => {
        const projPayments = payments?.filter(p => p.project_id === proj.id) || [];
        const paidCount = projPayments.filter(p => p.status === 'paid').length;
        projPayments.forEach(p => { if(p.status==='paid') received+=Number(p.amount); else pending+=Number(p.amount); });
        
        container.innerHTML += `
            <div class="finance-card" onclick='openFinanceDetails(${JSON.stringify(proj)}, ${JSON.stringify(projPayments)})'>
                <h4>${proj.client_name}</h4><p>${proj.title}</p>
                <div class="finance-info"><span style="color:var(--text-main); font-weight:600; font-size:0.9rem;">${paidCount}/${projPayments.length} Pagos</span><span class="finance-token">${proj.access_token}</span></div>
                <div style="margin-top:1rem; text-align:right; font-weight:700; color:var(--cyan); font-size:1.2rem;">${formatCurrency(proj.total_value)} /mês</div>
            </div>`;
    });
    document.getElementById('fin-received').textContent = formatCurrency(received);
    document.getElementById('fin-pending').textContent = formatCurrency(pending);
}

window.openFinanceDetails = (proj, payments) => {
    document.getElementById('finance-modal-title').textContent = proj.client_name;
    const tbody = document.getElementById('finance-modal-list'); tbody.innerHTML = '';
    payments.sort((a,b) => a.month_number - b.month_number).forEach(p => {
        const isLate = new Date(p.due_date+'T00:00:00') < new Date() && p.status!=='paid';
        const badge = p.status==='paid' ? 'badge-green' : (isLate ? 'badge-red' : 'badge-cyan');
        const txt = p.status==='paid' ? 'Pago' : (isLate ? 'Atrasado' : 'Pendente');
        tbody.innerHTML += `<tr><td>${p.month_number}ª Parcela</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${badge}">${txt}</span></td><td><button class="action-btn" title="Marcar Pago" onclick="markPaid('${p.id}')"><i data-lucide="check" size="16"></i></button></td></tr>`;
    });
    document.getElementById('slide-finance-details').classList.add('active'); lucide.createIcons();
};

window.closeSlidePanel = (id) => document.getElementById(id).classList.remove('active');
window.markPaid = async (pid) => {
    if(!await customConfirm("Confirmação", "Registrar pagamento?")) return;
    await db.from('payments').update({status:'paid'}).eq('id', pid);
    showToast("Atualizado!", "success"); loadFinanceTable(); document.getElementById('slide-finance-details').classList.remove('active');
};

// ADMIN - ASSINATURA E CONTRATOS
async function loadContractsTable() {
    const { data: projects } = await db.from('projects').select('*');
    const { data: contracts } = await db.from('contracts').select('*');
    const tbody = document.getElementById('contracts-list'); tbody.innerHTML = '';
    
    projects?.forEach(p => {
        const c = contracts?.find(c => c.project_id === p.id);
        const adminSigned = c && c.admin_signature_data;
        const clientSigned = c && c.signature_data;
        
        let adminStatus = adminSigned ? '<span class="badge badge-green">Assinado</span>' : '<span class="badge badge-warning">Pendente</span>';
        let clientStatus = clientSigned ? '<span class="badge badge-green">Assinado</span>' : '<span class="badge badge-red">Aguardando</span>';
        
        let actions = '';
        if(!adminSigned) {
            actions = `<button class="action-btn primary" onclick="openAdminSign('${p.id}')"><i data-lucide="pen-tool" size="14"></i> Assinar (Silven Tec)</button>`;
        } else if (adminSigned && !clientSigned) {
            actions = `<span style="font-size:0.8rem; color:var(--text-muted);">Aguardando aceite do cliente</span>`;
        } else if (adminSigned && clientSigned) {
            actions = `<button class="action-btn" onclick="generatePDF('${p.id}')"><i data-lucide="download" size="14"></i> Baixar PDF Final</button>`;
        }

        tbody.innerHTML += `<tr><td>${p.title}</td><td>${p.client_name}</td><td>${adminStatus}</td><td>${clientStatus}</td><td>${actions}</td></tr>`;
    });
    lucide.createIcons();
}

window.openAdminSign = (projectId) => {
    document.getElementById('sign-project-id').value = projectId;
    openModal('modal-admin-sign');
    const canvas = document.getElementById('admin-sig-pad');
    if(canvas && !adminSignaturePad) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        adminSignaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: '#0f172a' });
    } else if (adminSignaturePad) adminSignaturePad.clear();
};

window.saveAdminSignature = async () => {
    if(!adminSignaturePad || adminSignaturePad.isEmpty()) return showToast('Assine o documento.', 'warning');
    const btn = document.querySelector('#modal-admin-sign .btn-primary');
    const originalText = btn.innerHTML; btn.innerHTML = 'Enviando...'; btn.disabled = true;

    try {
        const projId = document.getElementById('sign-project-id').value;
        const sigData = adminSignaturePad.toDataURL();
        const { error } = await db.from('contracts').upsert({ project_id: projId, admin_signature_data: sigData, admin_signed_at: new Date().toISOString() }, { onConflict: 'project_id' });
        if(error) throw error;
        
        showToast('Documento assinado e liberado para o cliente!', 'success');
        closeModal('modal-admin-sign'); loadContractsTable();
    } catch(e) { showToast(e.message, 'error'); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
};

window.generatePDF = async (projectId) => {
    const { data: proj } = await db.from('projects').select('*').eq('id', projectId).single();
    const { data: contr } = await db.from('contracts').select('*').eq('project_id', projectId).single();
    generatePDFDocument(proj, contr);
};

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

// ==========================================
// CLIENT AREA LOGIC
// ==========================================
window.acessarCliente = function() {
    const token = document.getElementById('token-input')?.value.trim().toUpperCase();
    if (!token) return showToast("Insira um token válido.", "warning");
    window.location.href = `client.html?token=${token}`;
};

async function initClientArea(token) {
    const { data: proj, error } = await db.from('projects').select('*').eq('access_token', token).single();
    if(error || !proj) { showToast("Token inválido.", "error"); setTimeout(() => window.location.href = 'index.html', 1500); return; }
    
    currentProject = proj;
    document.getElementById('proj-title').textContent = proj.title;
    document.getElementById('client-name').textContent = `Cliente: ${proj.client_name}`;
    document.getElementById('deadline-display').textContent = formatDate(proj.deadline);

    const badgeClass = proj.status === 'aguardando_assinatura' ? 'badge-warning' : (proj.status === 'em_andamento' ? 'badge-cyan' : 'badge-green');
    const statusBadge = document.getElementById('status-badge');
    statusBadge.textContent = proj.status.replace('_', ' ').toUpperCase(); statusBadge.className = `badge ${badgeClass}`;

    const fin = calculateFinalValue(proj.total_value, proj.deadline);
    document.getElementById('finance-value').textContent = formatCurrency(fin.final);
    if(fin.isLate) document.getElementById('late-fee-msg').classList.remove('hidden');

    const { data: contr } = await db.from('contracts').select('*').eq('project_id', proj.id).single();
    currentContract = contr;

    if(proj.signed_client) {
        document.getElementById('contract-preparing')?.classList.add('hidden');
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.remove('hidden');
        document.getElementById('finance-locked')?.classList.add('hidden');
        document.getElementById('finance-unlocked')?.classList.remove('hidden');
    } else if (contr && contr.admin_signature_data && !proj.signed_client) {
        document.getElementById('contract-preparing')?.classList.add('hidden');
        document.getElementById('sign-area')?.classList.remove('hidden');
        document.getElementById('signed-msg')?.classList.add('hidden');
        document.getElementById('finance-locked')?.classList.remove('hidden');
        document.getElementById('finance-unlocked')?.classList.add('hidden');
    } else {
        document.getElementById('contract-preparing')?.classList.remove('hidden');
        document.getElementById('sign-area')?.classList.add('hidden');
        document.getElementById('signed-msg')?.classList.add('hidden');
        document.getElementById('finance-locked')?.classList.remove('hidden');
        document.getElementById('finance-unlocked')?.classList.add('hidden');
    }

    const { data: payments } = await db.from('payments').select('*').eq('project_id', proj.id).order('month_number', {ascending: true});
    const tbody = document.getElementById('client-finance-list');
    if(tbody && payments) {
        tbody.innerHTML = '';
        payments.forEach(p => {
            const isLate = new Date(p.due_date+'T00:00:00') < new Date() && p.status!=='paid';
            const bClass = p.status==='paid' ? 'badge-green' : (isLate ? 'badge-red' : 'badge-cyan');
            const txt = p.status==='paid' ? 'Pago' : (isLate ? 'Atrasado' : 'Pendente');
            tbody.innerHTML += `<tr><td>${p.month_number}ª</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${bClass}">${txt}</span></td></tr>`;
        });
    }
}

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
    document.querySelector(`.tab-btn[onclick*="${tabName}"]`)?.classList.add('active');

    if(tabName === 'contract' && !signaturePad && currentProject && !currentProject.signed_client && currentContract && currentContract.admin_signature_data) {
        const canvas = document.getElementById('sig-pad');
        if(canvas) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: '#0f172a' });
        }
    }
};

window.generatePix = async function() {
    const btn = document.getElementById('btn-pix'); const load = document.getElementById('pix-loading');
    btn.classList.add('hidden'); load.classList.remove('hidden');
    try {
        const fin = calculateFinalValue(currentProject.total_value, currentProject.deadline);
        const { data, error } = await db.functions.invoke('gerar-pix-mp', { body: { transaction_amount: Number(fin.final.toFixed(2)), description: `Silven Tec: ${currentProject.title}` } });
        if (error || data?.error) throw new Error(data?.error || 'Falha MP');
        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
    } catch(e) { showToast("Erro PIX: " + e.message, "error"); btn.classList.remove('hidden'); } 
    finally { load.classList.add('hidden'); }
};

window.copyPix = () => { navigator.clipboard.writeText(document.getElementById('pix-code').textContent); showToast("Copiado!", "success"); };
window.clearSig = () => signaturePad?.clear();

window.signContract = async () => {
    if(!signaturePad || signaturePad.isEmpty()) return showToast('Por favor, assine.', 'warning');
    const btn = document.querySelector('#tab-contract .btn-primary');
    const orig = btn.innerHTML; btn.innerHTML = 'Salvando...'; btn.disabled = true;

    try {
        const sigData = signaturePad.toDataURL();
        const { error: err1 } = await db.from('contracts').update({ signature_data: sigData, signed_at: new Date().toISOString() }).eq('project_id', currentProject.id);
        if(err1) throw err1;
        const { error: err2 } = await db.from('projects').update({ signed_client: true, status: 'em_andamento' }).eq('id', currentProject.id);
        if(err2) throw err2;
        
        document.getElementById('sign-area').classList.add('hidden');
        document.getElementById('signed-msg').classList.remove('hidden');
        document.getElementById('finance-locked').classList.add('hidden');
        document.getElementById('finance-unlocked').classList.remove('hidden');
        document.getElementById('status-badge').textContent = 'EM ANDAMENTO';
        document.getElementById('status-badge').className = 'badge badge-cyan';
        
        currentProject.signed_client = true;
        const { data: updatedContr } = await db.from('contracts').select('*').eq('project_id', currentProject.id).single();
        currentContract = updatedContr;

        showToast("Contrato assinado! Projeto em andamento.", "success");
    } catch(e) { showToast(e.message, "error"); btn.innerHTML = orig; btn.disabled = false; lucide.createIcons(); }
};

window.downloadMyContract = () => generatePDFDocument(currentProject, currentContract);

// ==========================================
// FUNÇÃO CENTRAL PARA GERAR PDF
// ==========================================
function generatePDFDocument(proj, contract) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const logoBase64 = getLogoBase64();
    
    // FUNDO ESCURO ARREDONDADO ATRÁS DA LOGO (Não vaza pelos cantos)
    if(logoBase64) {
        doc.setFillColor(11, 15, 25);
        // x=20, y=15, largura=22, altura=22, raio_x=5, raio_y=5 (curvatura)
        doc.roundedRect(20, 15, 22, 22, 5, 5, 'F');
        doc.addImage(logoBase64, 'PNG', 20, 15, 22, 22);
    }
    
    doc.setFontSize(22); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold"); 
    doc.text("SILVEN TEC", 50, 25);
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica", "normal"); 
    doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA", 50, 32);
    doc.line(20, 42, 190, 42);
    
    doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold"); 
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA", 20, 52);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATADA: SILVEN TEC`, 20, 62);
    doc.text(`CONTRATANTE: ${proj.client_name}`, 20, 69);
    doc.text(`OBJETO DO CONTRATO: ${proj.title}`, 20, 76);
    doc.text(`VIGÊNCIA: De ${formatDate(proj.start_date)} a ${formatDate(proj.deadline)}`, 20, 83);
    
    const supportText = proj.support_type === 'com_suporte' ? 'INCLUSO (Em dias úteis e horário comercial)' : 'NÃO INCLUSO (Apenas desenvolvimento)';
    doc.text(`MODALIDADE DE SUPORTE: ${supportText}`, 20, 90);
    
    // ESCOPO TÉCNICO E PALAVRAS CHAVE GERADOS AUTOMATICAMENTE
    doc.setFont("helvetica", "bold"); doc.text("ESCOPO TÉCNICO E TECNOLOGIAS:", 20, 102);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const techWords = proj.tech_stack || "Desenvolvimento padrão conforme alinhamento prévio";
    const techText = `O escopo técnico engloba a estruturação, o desenvolvimento e a entrega dos serviços utilizando as seguintes tecnologias, ferramentas e regras de negócio: ${techWords}.`;
    const splitTech = doc.splitTextToSize(techText, 170);
    doc.text(splitTech, 20, 108);
    
    // CLÁUSULAS
    let yPos = 114 + (splitTech.length * 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("CLÁUSULAS CONTRATUAIS:", 20, yPos);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    yPos += 7;
    
    const clauses = [
        "CLÁUSULA 1 - DO OBJETO: O presente contrato tem por objeto a prestação de serviços conforme especificado no escopo do projeto, garantindo o cumprimento técnico pré-acordado.",
        `CLÁUSULA 2 - DO PAGAMENTO: A CONTRATANTE pagará à CONTRATADA o valor fixo de ${formatCurrency(proj.total_value)}, que deverá ser pago até a data de vencimento estabelecida.`,
        "CLÁUSULA 3 - DA MULTA E JUROS DE MORA: O atraso sujeitará a CONTRATANTE a multa penal de 2% sobre o valor do débito, somada a juros de mora de 0,033% ao dia.",
        "CLÁUSULA 4 - DAS OBRIGAÇÕES: A CONTRATADA obriga-se a entregar os serviços com zelo, utilizando as melhores práticas vigentes de software e respeitando os prazos.",
        "CLÁUSULA 5 - DA CONFIDENCIALIDADE: Ambas as partes assumem o compromisso de manter o mais absoluto sigilo sobre os dados e informações compartilhadas.",
        "CLÁUSULA 6 - DA RESCISÃO: Este contrato poderá ser rescindido mediante aviso prévio de no mínimo 30 (trinta) dias corridos, garantindo-se a quitação dos serviços executados.",
        "CLÁUSULA 7 - DISPOSIÇÕES GERAIS E ACEITE DIGITAL: As partes reconhecem a validade deste contrato em formato eletrônico. A assinatura digital apostada neste documento comprova a integridade, o aceite irrevogável das regras de negócio estipuladas e a autoria, possuindo pleno vigor legal para todos os fins de direito (Medida Provisória nº 2.200-2/2001)."
    ];
    
    clauses.forEach(clause => {
        const split = doc.splitTextToSize(clause, 170);
        doc.text(split, 20, yPos);
        yPos += (split.length * 4) + 3;
    });
    
    // ÁREA DE ASSINATURA DUPLA
    yPos += 15;
    
    // Assinatura Silven Tec (Admin) - Lado Esquerdo
    if(contract && contract.admin_signature_data) {
        doc.addImage(contract.admin_signature_data, 'PNG', 20, yPos, 50, 25);
        doc.line(20, yPos + 27, 85, yPos + 27);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("SILVEN TEC (Responsável Técnico)", 20, yPos + 32);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        doc.text(`Emissão: ${new Date(contract.admin_signed_at).toLocaleString('pt-BR')}`, 20, yPos + 36);
    }
    
    // Assinatura do Cliente - Lado Direito
    if(contract && contract.signature_data) {
        doc.addImage(contract.signature_data, 'PNG', 115, yPos, 50, 25);
        doc.line(115, yPos + 27, 185, yPos + 27);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(`CONTRATANTE: ${proj.client_name}`, 115, yPos + 32);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        doc.text(`Aceite/Validação Digital: ${new Date(contract.signed_at).toLocaleString('pt-BR')}`, 115, yPos + 36);
    }

    doc.save(`Contrato_SilvenTec_${proj.client_name.replace(/\s/g,'_')}.pdf`);
}
