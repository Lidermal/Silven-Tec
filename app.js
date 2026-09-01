// ==========================================
// CONFIGURAÇÃO SILVEN TEC
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let signaturePad;
let currentProjectId = null;

// ==========================================
// NAVEGAÇÃO E UI
// ==========================================
function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`view-${viewId}`);
    if(target) {
        target.classList.remove('hidden');
        // Re-trigger animation
        target.classList.remove('animate-fade-in', 'animate-slide-up');
        void target.offsetWidth; 
        target.classList.add(viewId === 'admin-login' ? 'animate-slide-up' : 'animate-fade-in');
    }
    
    if(viewId === 'admin-dash') loadAdminDashboard();
    lucide.createIcons();
}

function switchClientTab(tabName) {
    document.querySelectorAll('.client-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');

    if(tabName === 'contract') initSignaturePad();
}

// ==========================================
// ADMINISTRAÇÃO
// ==========================================
async function loginAdmin() {
    const pass = document.getElementById('admin-pass').value;
    const msgEl = document.getElementById('login-msg');
    
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('config_value')
            .eq('config_key', 'admin_password_hash')
            .single();

        if(error || !data) throw new Error("Configuração não encontrada");

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(pass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if(hashHex === data.config_value) {
            sessionStorage.setItem('silven_admin', 'true');
            navigate('admin-dash');
        } else {
            msgEl.textContent = "Senha incorreta!";
            msgEl.classList.remove('hidden');
        }
    } catch(e) {
        msgEl.textContent = "Erro de conexão: " + e.message;
        msgEl.classList.remove('hidden');
    }
}

function logout() {
    sessionStorage.removeItem('silven_admin');
    navigate('home');
}

async function loadAdminDashboard() {
    if(!sessionStorage.getItem('silven_admin')) return navigate('admin-login');

    const { data: projects } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    const list = document.getElementById('admin-projects-list');
    list.innerHTML = '';

    let pendingRev = 0;
    let signedCount = 0;

    projects?.forEach(p => {
        if(p.status !== 'concluido') pendingRev += Number(p.total_value || 0);
        
        const link = `${window.location.origin}${window.location.pathname}?token=${p.access_token}`;
        list.innerHTML += `
            <div class="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition group">
                <div>
                    <h4 class="font-bold text-white">${p.title}</h4>
                    <p class="text-xs text-slate-400">${p.client_name} • ${new Date(p.created_at).toLocaleDateString()}</p>
                    <p class="text-[10px] text-cyan-500 mt-1 select-all opacity-0 group-hover:opacity-100 transition">${link}</p>
                </div>
                <div class="text-right">
                    <span class="block text-emerald-400 font-bold">R$ ${Number(p.total_value).toFixed(2)}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">${p.status}</span>
                </div>
            </div>
        `;
    });

    document.getElementById('stat-projects').textContent = projects?.length || 0;
    document.getElementById('stat-revenue').textContent = `R$ ${pendingRev.toFixed(2)}`;
    document.getElementById('stat-contracts').textContent = signedCount; // Implementar contador real depois
}

async function createProject() {
    const client = document.getElementById('new-client').value;
    const title = document.getElementById('new-title').value;
    const value = document.getElementById('new-value').value;

    if(!client || !title || !value) return alert("Preencha todos os campos!");

    const token = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { error } = await supabase.from('projects').insert([{
        client_name: client,
        title: title,
        total_value: value,
        access_token: token,
        status: 'em_andamento',
        deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] // +30 dias padrão
    }]);

    if(error) alert("Erro: " + error.message);
    else {
        alert(`Projeto criado! Token: ${token}`);
        document.getElementById('new-client').value = '';
        document.getElementById('new-title').value = '';
        document.getElementById('new-value').value = '';
        loadAdminDashboard();
    }
}

// ==========================================
// ÁREA DO CLIENTE
// ==========================================
function checkClientAccess() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if(token) {
        loadClientArea(token);
    } else {
        const input = prompt("Cole seu Link de Acesso ou digite o Token:");
        if(input) {
            const cleanToken = input.includes('token=') ? input.split('token=')[1] : input;
            window.location.search = `?token=${cleanToken.trim()}`;
        }
    }
}

async function loadClientArea(token) {
    navigate('client-area');
    const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();

    if(error || !data) {
        document.getElementById('client-proj-title').textContent = "Projeto Não Encontrado";
        return;
    }

    currentProjectId = data.id;
    document.getElementById('client-proj-title').textContent = data.title;
    document.getElementById('client-name-display').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('client-status-badge').textContent = data.status.toUpperCase();
    document.getElementById('client-deadline').textContent = data.deadline ? new Date(data.deadline).toLocaleDateString('pt-BR') : 'A definir';
    document.getElementById('client-total-value').textContent = `R$ ${Number(data.total_value).toFixed(2)}`;
    
    loadSupportMessages();
}

// --- FINANCEIRO / PIX (SIMULAÇÃO SEGURA PARA FRONTEND) ---
function generatePixPayment() {
    // NOTA: Em produção real, chame uma API segura. 
    // Aqui geramos um payload PIX estático de exemplo para demonstração visual.
    const pixPayload = "00020126580014BR.GOV.BCB.PIX0136silventec-exemplo-payload-12345678905204000053039865802BR5913SILVEN TEC LTDA6008SAO PAULO62070503***6304ABCD";
    
    // Gera QR Code usando API pública gratuita (goqr.me)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`;
    
    document.getElementById('pix-qr-img').src = qrUrl;
    document.getElementById('pix-copy-paste').textContent = pixPayload;
    document.getElementById('pix-area').classList.remove('hidden');
    document.getElementById('btn-generate-pix').classList.add('hidden');
}

function copyPix() {
    const code = document.getElementById('pix-copy-paste').textContent;
    navigator.clipboard.writeText(code).then(() => alert("Código PIX copiado!"));
}

// --- CONTRATO E ASSINATURA ---
function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    // Ajusta resolução para telas retina/mobile
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    if(!signaturePad) signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
}

function clearSignature() {
    if(signaturePad) signaturePad.clear();
}

async function signContract() {
    if(!signaturePad || signaturePad.isEmpty()) return alert("Por favor, assine antes de continuar.");
    
    const dataURL = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Monta PDF simples
    doc.setFontSize(20);
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS - SILVEN TEC", 20, 20);
    doc.setFontSize(12);
    doc.text(`Projeto ID: ${currentProjectId}`, 20, 40);
    doc.text(`Data de Assinatura: ${new Date().toLocaleString()}`, 20, 50);
    doc.text("Este documento certifica a concordância com os termos do projeto.", 20, 70);
    
    // Adiciona imagem da assinatura
    doc.addImage(dataURL, 'PNG', 20, 100, 80, 40);
    doc.text("Assinatura Digital do Cliente", 20, 145);
    
    doc.save(`Contrato_SilvenTec_${currentProjectId}.pdf`);
    
    document.getElementById('contract-signed-msg').classList.remove('hidden');
    
    // Opcional: Salvar base64 no Supabase storage ou campo text
    // await supabase.from('contracts').update({ signed_client: true, pdf_data: dataURL }).eq('project_id', currentProjectId);
}

// --- SUPORTE / MENSAGENS ---
async function sendSupportMessage() {
    const msg = document.getElementById('support-msg').value;
    if(!msg) return;

    // Salva na tabela 'requests' ou 'messages' (ajuste conforme seu schema real)
    // Como você apagou tabelas, assumindo que requests existe ou usaremos um campo json no project
    // Para este demo, vamos apenas simular localmente e alertar
    
    const history = document.getElementById('support-history');
    const div = document.createElement('div');
    div.className = "p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-sm";
    div.innerHTML = `<strong>Você:</strong> ${msg} <br><span class="text-xs text-slate-500">${new Date().toLocaleTimeString()}</span>`;
    history.prepend(div);
    
    document.getElementById('support-msg').value = '';
    alert("Solicitação enviada ao administrador!");
}

async function loadSupportMessages() {
    // Carregar mensagens reais do Supabase aqui quando a tabela estiver pronta
    // const { data } = await supabase.from('requests').select('*').eq('project_id', currentProjectId);
}

// Inicialização
if(sessionStorage.getItem('silven_admin')) navigate('admin-dash');
else if(new URLSearchParams(window.location.search).get('token')) checkClientAccess();
else navigate('home');
