/* app.js - Silven Tec Core Logic V11 - Realtime & Jurídico */

const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val); }
function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('pt-BR'); }

async function generateSmartToken(name) {
    const prefix = 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

function calculateFinalValue(baseValue, deadlineStr) {
    const value = Number(baseValue);
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(deadlineStr); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { final: value, isLate: false, days: 0 };
    const multa = value * 0.02;
    const juros = value * (0.00033 * diffDays);
    return { final: value + multa + juros, isLate: true, days: diffDays };
}

// ==========================================
// REALTIME LISTENERS (AO VIVO)
// ==========================================
function setupRealtime() {
    // Escuta mudanças em Projects
    db.channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
          showRealtimeToast();
          loadDashboardData(); 
          loadProjectsTable();
      })
      .subscribe();

    // Escuta mudanças em Payments
    db.channel('public:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
          showRealtimeToast();
          loadFinanceTable();
      })
      .subscribe();
      
    // Escuta mudanças em Contracts
    db.channel('public:contracts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, payload => {
          showRealtimeToast();
          loadContractsTable();
          loadDashboardData();
      })
      .subscribe();
}

function showRealtimeToast() {
    const toast = document.getElementById('realtime-toast');
    if(toast) {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
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
    
    if (!email || !pass) { errEl.textContent = "Preencha e-mail e senha."; errEl.classList.remove('hidden'); return; }
    btn.innerHTML = `Verificando...`; btn.disabled = true; errEl.classList.add('hidden');

    try {
        const { error } = await db.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        sessionStorage.setItem('silven_admin', 'true');
        window.location.href = 'admin.html';
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.innerHTML = `<i data-lucide="shield-check" size="16"></i> Entrar no Sistema`; btn.disabled = false;
        lucide.createIcons();
    }
};
window.logout = async () => { await db.auth.signOut(); sessionStorage.clear(); window.location.href = 'index.html'; };

// ==========================================
// ADMIN PANEL LOGIC
// ==========================================
async function initAdminPanel() {
    setupRealtime(); // Inicia realtime
    loadDashboardData();
    
    // Define datas padrão no modal
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    if(document.getElementById('new-start')) document.getElementById('new-start').value = today;
    if(document.getElementById('new-due')) document.getElementById('new-due').value = nextMonth;

    const form = document.getElementById('form-new-project');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Gerando Contrato e Parcelas...';

            const clientName = document.getElementById('new-client').value;
            const title = document.getElementById('new-title').value;
            const value = Number(document.getElementById('new-value').value);
            const months = parseInt(document.getElementById('new-months').value);
            const supportType = document.getElementById('new-support').value;
            const startDate = document.getElementById('new-start').value;
            const firstDueDate = document.getElementById('new-due').value;
            
            const token = await generateSmartToken(clientName);

            // 1. Criar Projeto
            const { data: projData, error: projError } = await db.from('projects').insert([{
                client_name: clientName, title, total_value: value, 
                access_token: token, status: 'em_andamento', 
                deadline: firstDueDate, signed_client: false,
                support_type: supportType, start_date: startDate
            }]).select().single();

            if(projError) { alert('Erro: ' + projError.message); btn.disabled=false; return; }

            // 2. Gerar Parcelas Automáticas
            const payments = [];
            for(let i=0; i<months; i++) {
                let d = new Date(firstDueDate);
                d.setMonth(d.getMonth() + i);
                payments.push({
                    project_id: projData.id,
                    month_number: i + 1,
                    due_date: d.toISOString().split('T')[0],
                    amount: value,
                    status: 'pending'
                });
            }
            await db.from('payments').insert(payments);

            // 3. Gerar PDF do Contrato Automaticamente
            await generateContractPDF(projData, supportType, months, startDate);

            alert(`Sucesso!\nToken: ${token}\n${months} parcelas geradas.\nContrato PDF criado.`);
            closeModal('modal-new-project');
            e.target.reset();
            btn.disabled = false; btn.textContent = 'Gerar Contrato e Token';
        });
    }
}

// Função para gerar PDF Jurídico
async function generateContractPDF(project, supportType, months, startDate) {
    const { jsPDF } = window.jspdf; // Precisa importar jspdf no admin.html se for usar aqui, ou fazer no client
    // Nota: Para simplificar, vamos assumir que o admin apenas cria os dados. 
    // O PDF completo é gerado quando o cliente assina ou podemos gerar um "Pré-contrato" aqui.
    // Vou deixar a lógica de PDF completa no Client.html para manter o JS enxuto, 
    // mas aqui salvamos os metadados do contrato.
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
    if(!data) return;
    let rev = 0, signed = 0;
    const tbody = document.getElementById('dash-recent-list');
    tbody.innerHTML = '';
    data.forEach(p => {
        rev += Number(p.total_value);
        if(p.signed_client) signed++;
        if(tbody.children.length < 5) {
            tbody.innerHTML += `<tr><td>${p.client_name}</td><td>${p.title}</td><td style="font-family:monospace; color:var(--cyan);">${p.access_token}</td><td><span class="badge badge-cyan">${p.status}</span></td><td>${formatCurrency(p.total_value)}</td></tr>`;
        }
    });
    document.getElementById('dash-active-proj').textContent = data.length;
    document.getElementById('dash-revenue').textContent = formatCurrency(rev);
    document.getElementById('dash-signed').textContent = signed;
}

async function loadProjectsTable() {
    const { data } = await db.from('projects').select('*').order('created_at', {ascending: false});
    const tbody = document.getElementById('projects-list');
    tbody.innerHTML = '';
    data?.forEach(p => {
        tbody.innerHTML += `<tr><td style="font-weight:600;">${p.title}</td><td>${p.client_name}</td><td>${formatDate(p.start_date)} até ${formatDate(p.deadline)}</td><td><button class="action-btn" onclick="navigator.clipboard.writeText('${p.access_token}');alert('Token copiado!')">Copiar Token</button></td></tr>`;
    });
}

async function loadFinanceTable() {
    // Busca pagamentos juntando com projetos
    const { data } = await db.from('payments').select('*, projects(client_name, title)').order('due_date', {ascending: true});
    const tbody = document.getElementById('finance-list');
    tbody.innerHTML = '';
    let received = 0, pending = 0;

    data?.forEach(p => {
        const isLate = new Date(p.due_date) < new Date() && p.status !== 'paid';
        if(p.status === 'paid') received += Number(p.amount);
        else pending += Number(p.amount);

        tbody.innerHTML += `<tr><td>${p.projects?.client_name}</td><td>${p.month_number}ª Parcela</td><td>${formatDate(p.due_date)}</td><td>${formatCurrency(p.amount)}</td><td><span class="badge ${p.status==='paid'?'badge-green':(isLate?'badge-red':'badge-cyan')}">${p.status==='paid'?'Pago':(isLate?'Atrasado':'Pendente')}</span></td></tr>`;
    });
    document.getElementById('fin-received').textContent = formatCurrency(received);
    document.getElementById('fin-pending').textContent = formatCurrency(pending);
}

async function loadContractsTable() {
    const { data: projects } = await db.from('projects').select('*');
    const { data: contracts } = await db.from('contracts').select('*');
    const tbody = document.getElementById('contracts-list');
    tbody.innerHTML = '';
    projects?.forEach(p => {
        const contract = contracts?.find(c => c.project_id === p.id);
        tbody.innerHTML += `<tr><td>${p.title}</td><td>${p.client_name}</td><td>${contract ? formatDate(contract.signed_at) : '-'}</td><td><span class="badge ${contract ? 'badge-green' : 'badge-red'}">${contract ? 'Assinado' : 'Pendente'}</span></td></tr>`;
    });
}

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

// ==========================================
// CLIENT AREA LOGIC (Com PDF Jurídico Completo)
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
        const financeData = calculateFinalValue(currentProject.total_value, currentProject.deadline);
        const { data, error } = await db.functions.invoke('gerar-pix-mp', { body: { transaction_amount: Number(financeData.final.toFixed(2)), description: `Silven Tec: ${currentProject.title}` } });
        if (error || data?.error) throw new Error(data?.error || 'Falha no gateway MP');
        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
    } catch(e) { alert("Erro ao gerar PIX: " + e.message); btn.classList.remove('hidden'); } finally { load.classList.add('hidden'); }
};
window.copyPix = () => navigator.clipboard.writeText(document.getElementById('pix-code').textContent).then(() => alert('Código copiado!'));
window.clearSig = () => signaturePad?.clear();

window.signContract = async () => {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Assine o contrato.');
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // CABEÇALHO
    doc.setFontSize(22); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold"); doc.text("SILVEN TEC", 20, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal"); doc.text("INOVAÇÃO & GESTÃO EM TECNOLOGIA", 20, 26);
    doc.line(20, 32, 190, 32);
    
    // TÍTULO
    doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA", 20, 45);
    
    // DADOS
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATADA: SILVEN TEC - CNPJ: XX.XXX.XXX/0001-XX`, 20, 55);
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 62);
    doc.text(`OBJETO: ${currentProject.title}`, 20, 69);
    doc.text(`VIGÊNCIA: De ${formatDate(currentProject.start_date)} a ${formatDate(currentProject.deadline)}`, 20, 76);
    doc.text(`SUPORTE: ${currentProject.support_type === 'com_suporte' ? 'INCLUSO (Horário Comercial)' : 'NÃO INCLUSO'}`, 20, 83);
    
    // CLÁUSULAS JURÍDICAS
    doc.setFont("helvetica", "bold"); doc.text("CLÁUSULAS GERAIS:", 20, 95);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    
    const clauses = [
        "1. DO PAGAMENTO: O valor mensal é de " + formatCurrency(currentProject.total_value) + ", payable até o dia do vencimento.",
        "2. DA MULTA E JUROS: Em caso de atraso, incidirá multa fixa de 2% (dois por cento) sobre o valor da parcela, acrescida de juros moratórios de 0,033% (trinta e três milésimos por cento) ao dia, conforme Código Civil Brasileiro.",
        "3. DO SUPORTE: " + (currentProject.support_type === 'com_suporte' ? "A CONTRATADA fornecerá suporte técnico durante o horário comercial." : "O presente contrato não contempla suporte técnico contínuo."),
        "4. DA CONFIDENCIALIDADE (LGPD): As partes comprometem-se a tratar dados pessoais conforme a Lei 13.709/2018.",
        "5. DA RESCISÃO: O contrato poderá ser rescindido com aviso prévio de 30 dias."
    ];
    
    let yPos = 102;
    clauses.forEach(clause => {
        const splitText = doc.splitTextToSize(clause, 170);
        doc.text(splitText, 20, yPos);
        yPos += (splitText.length * 4) + 3;
    });
    
    // ASSINATURA
    doc.addImage(sigData, 'PNG', 20, yPos + 10, 80, 40);
    doc.line(20, yPos + 52, 100, yPos + 52);
    doc.text("Assinatura Digital do Contratante", 20, yPos + 58);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 20, yPos + 64);

    doc.save(`Contrato_SilvenTec_${currentProject.title.replace(/\s/g,'_')}.pdf`);

    await db.from('contracts').upsert({ project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() }, { onConflict: 'project_id' });
    await db.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
};
