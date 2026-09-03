/* app.js - Silven Tec Core Logic (Versão Event Listener) */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

if (typeof window.supabase === 'undefined') {
    console.error("CRÍTICO: Supabase JS não carregou!");
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;
let systemConfig = {}; 

// ==========================================
// INICIALIZAÇÃO GLOBAL (GARANTIA DE EXECUÇÃO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("App.js inicializado com sucesso.");
    
    // Atrela eventos apenas se os elementos existirem na página atual
    const btnAccessClient = document.getElementById('btn-access-client');
    const btnLoginAdmin = document.getElementById('btn-login-admin');
    const formNewProject = document.getElementById('form-new-project');
    const btnPix = document.getElementById('btn-pix');
    const btnSign = document.querySelector('#sign-area button:last-child'); // Botão Assinar

    if(btnAccessClient) btnAccessClient.addEventListener('click', handleClientAccess);
    if(btnLoginAdmin) btnLoginAdmin.addEventListener('click', handleAdminLogin);
    if(formNewProject) formNewProject.addEventListener('submit', handleCreateProject);
    if(btnPix) btnPix.addEventListener('click', generatePix);
    if(btnSign) btnSign.addEventListener('click', signContract);

    // Verifica se está em páginas protegidas
    if(document.getElementById('projects-list')) initAdmin();
    if(new URLSearchParams(window.location.search).get('token')) {
        initClient(new URLSearchParams(window.location.search).get('token'));
    }
});

// ==========================================
// FUNÇÕES LÓGICAS
// ==========================================
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

async function generateSmartToken(name) {
    if (!systemConfig.token_prefix) {
        try {
            const { data } = await supabase.from('system_config').select('config_value').eq('config_key', 'token_prefix').single();
            if (data) systemConfig.token_prefix = data.config_value;
        } catch (e) { console.warn("Falha ao buscar config"); }
    }
    const prefix = systemConfig.token_prefix || 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

// --- LOGIN ADMIN ---
async function handleAdminLogin() {
    console.log("Tentativa de login...");
    const passInput = document.getElementById('admin-pass').value;
    const errEl = document.getElementById('admin-error');
    const btn = document.getElementById('btn-login-admin');
    
    if (!passInput) {
        errEl.textContent = "Digite a senha.";
        errEl.classList.remove('hidden');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = `Verificando...`;
    btn.disabled = true;
    errEl.classList.add('hidden');

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('password_hash, role')
            .eq('username', 'janaelson')
            .single();

        if (error) throw new Error(`Erro DB: ${error.message}`);
        if (!user) throw new Error("Usuário não encontrado.");

        // Validação direta conforme seu JSON
        if (String(user.password_hash) !== String(passInput)) {
            throw new Error("Senha incorreta.");
        }

        sessionStorage.setItem('silven_admin', 'true');
        sessionStorage.setItem('silven_user', JSON.stringify({ username: 'janaelson', role: user.role }));
        window.location.href = 'admin.html';

    } catch (err) {
        console.error("Login falhou:", err);
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function handleClientAccess() {
    const token = document.getElementById('token-input').value.trim().toUpperCase();
    if (!token) return alert("Insira um token válido.");
    window.location.href = `client.html?token=${token}`;
}

// --- ADMIN DASHBOARD ---
async function initAdmin() {
    loadAdminStats();
}

async function handleCreateProject(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Processando...';

    const client = document.getElementById('new-client').value;
    const title = document.getElementById('new-title').value;
    const value = document.getElementById('new-value').value;
    
    const token = await generateSmartToken(client);
    const deadline = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    const { error } = await supabase.from('projects').insert([{
        client_name: client, title, total_value: value, 
        access_token: token, status: 'em_andamento', deadline
    }]);

    if(error) alert('Erro: ' + error.message);
    else {
        alert(`Projeto criado!\nToken: ${token}`);
        e.target.reset();
        loadAdminStats();
    }
    btn.disabled = false; btn.textContent = 'Criar Projeto';
}

async function loadAdminStats() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    if(error || !data) return;

    let rev = 0;
    const list = document.getElementById('projects-list');
    if(list) {
        list.innerHTML = '';
        data.forEach(p => {
            rev += Number(p.total_value);
            list.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                <div>
                    <h4 style="color: white; font-weight: 600;">${p.title}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">${p.client_name} • <span style="color: var(--cyan-primary); font-family: monospace;">${p.access_token}</span></p>
                </div>
                <div style="text-align: right;">
                    <span style="color: #10b981; font-weight: 700;">${formatCurrency(p.total_value)}</span>
                    <span style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">${p.status}</span>
                </div>
            </div>`;
        });
    }

    const statProj = document.getElementById('stat-projects');
    const statRev = document.getElementById('stat-revenue');
    if(statProj) statProj.textContent = data.length;
    if(statRev) statRev.textContent = formatCurrency(rev);
}

function logout() {
    sessionStorage.removeItem('silven_admin');
    sessionStorage.removeItem('silven_user');
    window.location.href = 'index.html';
}

// --- CLIENT AREA ---
async function initClient(token) {
    const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();
    
    if(error || !data) {
        alert('Projeto não encontrado.');
        window.location.href = 'index.html';
        return;
    }

    currentProject = data;
    document.getElementById('proj-title').textContent = data.title;
    document.getElementById('client-name').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('status-badge').textContent = data.status.toUpperCase();
    document.getElementById('deadline-display').textContent = new Date(data.deadline).toLocaleDateString('pt-BR');
    
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    
    let finalValue = Number(data.total_value);
    const valEl = document.getElementById('finance-value');
    
    if(diffDays > 0 && valEl) {
        const multa = finalValue * 0.02;
        const juros = finalValue * 0.00033 * diffDays;
        finalValue += multa + juros;
        valEl.innerHTML = `${formatCurrency(finalValue)} <span style="font-size: 0.85rem; color: #ef4444; display: block; margin-top: 0.8rem;">Multa + Juros (${diffDays} dias)</span>`;
    } else if (valEl) {
        valEl.textContent = formatCurrency(finalValue);
    }

    if(data.signed_client) {
        const signArea = document.getElementById('sign-area');
        const signedMsg = document.getElementById('signed-msg');
        if(signArea) signArea.classList.add('hidden');
        if(signedMsg) signedMsg.classList.remove('hidden');
    }
}

// Adiciona listener global para abas (funciona em qualquer página)
document.addEventListener('click', (e) => {
    if(e.target.classList.contains('tab-btn')) {
        const tabName = e.target.getAttribute('data-tab') || e.target.innerText.toLowerCase().split(' ')[0];
        // Mapeamento simples baseado no texto ou data attribute
        let targetId = '';
        if(e.target.innerText.includes('Visão')) targetId = 'tab-overview';
        else if(e.target.innerText.includes('Financeiro')) targetId = 'tab-finance';
        else if(e.target.innerText.includes('Contrato')) targetId = 'tab-contract';
        
        if(targetId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(targetId)?.classList.remove('hidden');
            e.target.classList.add('active');

            if(targetId === 'tab-contract' && !signaturePad && currentProject && !currentProject.signed_client) {
                const canvas = document.getElementById('sig-pad');
                if(canvas) {
                    const ratio = Math.max(window.devicePixelRatio || 1, 1);
                    canvas.width = canvas.offsetWidth * ratio;
                    canvas.height = canvas.offsetHeight * ratio;
                    canvas.getContext("2d").scale(ratio, ratio);
                    signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: '#0f172a' });
                }
            }
        }
    }
});

async function generatePix() {
    const btn = document.getElementById('btn-pix');
    const load = document.getElementById('pix-loading');
    if(btn) btn.classList.add('hidden');
    if(load) load.classList.remove('hidden');

    try {
        const { data, error } = await supabase.functions.invoke('gerar-pix-mp', {
            body: { amount: Number(currentProject.total_value), description: `Silven Tec: ${currentProject.title}` }
        });
        if (error || data?.error) throw new Error(data?.error || 'Falha no gateway');

        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
    } catch(e) {
        console.warn("PIX Fallback:", e);
        document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=SIMULACAO_SILVEN_TEC`;
        document.getElementById('pix-code').textContent = "00020126360014BR.GOV.BCB.PIX... (SIMULAÇÃO)";
        document.getElementById('pix-result').classList.remove('hidden');
    } finally {
        if(load) load.classList.add('hidden');
    }
}

function copyPix() {
    navigator.clipboard.writeText(document.getElementById('pix-code').textContent)
        .then(() => alert('Código PIX copiado!'));
}

function clearSig() { if(signaturePad) signaturePad.clear(); }

async function signContract() {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Por favor, assine o contrato.');
    
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(24); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold");
    doc.text("SILVEN TEC", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("INOVAÇÃO & GESTÃO", 20, 32);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 20, 55);
    
    doc.setFontSize(11); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 70);
    doc.text(`PROJETO: ${currentProject.title}`, 20, 78);
    doc.text(`VALOR: ${formatCurrency(currentProject.total_value)}`, 20, 86);
    doc.text("Cláusula: Multa 2% + Juros 0,033%/dia em caso de atraso.", 20, 100);
    
    doc.addImage(sigData, 'PNG', 20, 140, 80, 40);
    doc.line(20, 182, 100, 182);
    doc.text("Assinatura Digital", 20, 188);

    doc.save(`Contrato_SilvenTec_${currentProject.title}.pdf`);

    await supabase.from('contracts').upsert({ 
        project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() 
    }, { onConflict: 'project_id' });
    
    await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
}
