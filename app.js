/* app.js - Silven Tec Core Logic (Blindada) */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

let supabase;
try {
    if (!window.supabase) throw new Error("Biblioteca Supabase não carregada!");
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase inicializado");
} catch (e) {
    console.error("❌ Falha ao iniciar Supabase:", e);
}

let currentProject = null;
let signaturePad = null;
let systemConfig = {}; 

// ==========================================
// INICIALIZAÇÃO CENTRALIZADA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM Carregado. Iniciando App...");
    
    try {
        // Inicializa ícones
        if(window.lucide) lucide.createIcons();

        // --- LÓGICA DA INDEX (LOGIN) ---
        const btnTabClient = document.getElementById('btn-tab-client');
        const btnTabAdmin = document.getElementById('btn-tab-admin');
        const formClient = document.getElementById('form-client');
        const formAdmin = document.getElementById('form-admin');
        const errEl = document.getElementById('admin-error');

        if (btnTabClient && btnTabAdmin) {
            btnTabClient.addEventListener('click', () => {
                btnTabClient.classList.add('active');
                btnTabAdmin.classList.remove('active');
                formClient.classList.remove('hidden');
                formAdmin.classList.add('hidden');
                if(errEl) errEl.classList.add('hidden');
            });

            btnTabAdmin.addEventListener('click', () => {
                btnTabAdmin.classList.add('active');
                btnTabClient.classList.remove('active');
                formAdmin.classList.remove('hidden');
                formClient.classList.add('hidden');
                if(errEl) errEl.classList.add('hidden');
            });
        }

        const btnAccessClient = document.getElementById('btn-access-client');
        if(btnAccessClient) {
            btnAccessClient.addEventListener('click', handleClientAccess);
            console.log("✅ Botão Cliente atrelado");
        }

        const btnLoginAdmin = document.getElementById('btn-login-admin');
        if(btnLoginAdmin) {
            btnLoginAdmin.addEventListener('click', handleAdminLogin);
            console.log("✅ Botão Admin atrelado");
        }

        // --- LÓGICA DO ADMIN DASHBOARD ---
        if(document.getElementById('projects-list')) {
            console.log(" Página Admin detectada");
            initAdmin();
            
            const formNewProj = document.getElementById('form-new-project');
            if(formNewProj) formNewProj.addEventListener('submit', handleCreateProject);
        }

        // --- LÓGICA DO CLIENT AREA ---
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if(token) {
            console.log("👤 Página Cliente detectada. Token:", token);
            initClient(token);
            
            // Atrela botões do cliente se existirem
            const btnPix = document.getElementById('btn-pix');
            if(btnPix) btnPix.addEventListener('click', generatePix);
            
            const btnSign = document.querySelector('#sign-area button:last-child');
            if(btnSign) btnSign.addEventListener('click', signContract);

            // Listener global para abas do cliente
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.innerText.toLowerCase().split(' ')[0];
                    let targetId = '';
                    if(tabName.includes('visão')) targetId = 'tab-overview';
                    else if(tabName.includes('financeiro')) targetId = 'tab-finance';
                    else if(tabName.includes('contrato')) targetId = 'tab-contract';
                    
                    if(targetId) {
                        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
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
                });
            });
        }

        console.log("🎉 App.js inicializado com sucesso!");

    } catch (err) {
        console.error("💥 ERRO FATAL NA INICIALIZAÇÃO:", err);
        alert("Erro crítico ao carregar o sistema. Verifique o console (F12).");
    }
});

// ==========================================
// FUNÇÕES DE NEGÓCIO
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
    console.log("🔐 Tentativa de login admin...");
    const passInput = document.getElementById('admin-pass')?.value;
    const errEl = document.getElementById('admin-error');
    const btn = document.getElementById('btn-login-admin');
    
    if (!passInput) {
        if(errEl) { errEl.textContent = "Digite a senha."; errEl.classList.remove('hidden'); }
        return;
    }

    if(btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = `Verificando...`;
        btn.disabled = true;
        if(errEl) errEl.classList.add('hidden');

        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('password_hash, role')
                .eq('username', 'janaelson')
                .single();

            if (error) throw new Error(`Erro DB: ${error.message}`);
            if (!user) throw new Error("Usuário 'janaelson' não encontrado.");

            if (String(user.password_hash) !== String(passInput)) {
                throw new Error("Senha incorreta.");
            }

            sessionStorage.setItem('silven_admin', 'true');
            sessionStorage.setItem('silven_user', JSON.stringify({ username: 'janaelson', role: user.role }));
            console.log("✅ Login bem-sucedido! Redirecionando...");
            window.location.href = 'admin.html';

        } catch (err) {
            console.error("❌ Login falhou:", err);
            if(errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

function handleClientAccess() {
    const token = document.getElementById('token-input')?.value.trim().toUpperCase();
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
    if(btn) { btn.disabled = true; btn.textContent = 'Processando...'; }

    const client = document.getElementById('new-client')?.value;
    const title = document.getElementById('new-title')?.value;
    const value = document.getElementById('new-value')?.value;
    
    if(!client || !title || !value) { alert("Preencha todos os campos"); return; }

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
    if(btn) { btn.disabled = false; btn.textContent = 'Criar Projeto'; }
}

async function loadAdminStats() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    if(error) { console.error(error); return; }
    if(!data) return;

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
    const projTitle = document.getElementById('proj-title');
    const clientName = document.getElementById('client-name');
    const statusBadge = document.getElementById('status-badge');
    const deadlineDisplay = document.getElementById('deadline-display');
    
    if(projTitle) projTitle.textContent = data.title;
    if(clientName) clientName.textContent = `Cliente: ${data.client_name}`;
    if(statusBadge) statusBadge.textContent = data.status.toUpperCase();
    if(deadlineDisplay) deadlineDisplay.textContent = new Date(data.deadline).toLocaleDateString('pt-BR');
    
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

        const qrImg = document.getElementById('qr-img');
        const pixCode = document.getElementById('pix-code');
        const pixResult = document.getElementById('pix-result');
        
        if(qrImg) qrImg.src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        if(pixCode) pixCode.textContent = data.qr_code;
        if(pixResult) pixResult.classList.remove('hidden');
    } catch(e) {
        console.warn("PIX Fallback:", e);
        const qrImg = document.getElementById('qr-img');
        const pixCode = document.getElementById('pix-code');
        const pixResult = document.getElementById('pix-result');
        
        if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=SIMULACAO_SILVEN_TEC`;
        if(pixCode) pixCode.textContent = "00020126360014BR.GOV.BCB.PIX... (SIMULAÇÃO)";
        if(pixResult) pixResult.classList.remove('hidden');
    } finally {
        if(load) load.classList.add('hidden');
    }
}

function copyPix() {
    const code = document.getElementById('pix-code')?.textContent;
    if(code) navigator.clipboard.writeText(code).then(() => alert('Código PIX copiado!'));
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
    
    const signArea = document.getElementById('sign-area');
    const signedMsg = document.getElementById('signed-msg');
    if(signArea) signArea.classList.add('hidden');
    if(signedMsg) signedMsg.classList.remove('hidden');
}
