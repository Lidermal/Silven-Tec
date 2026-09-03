/* app.js - Silven Tec Core Logic */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function generateSmartToken(name) {
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ST-${clean}-${rand}`;
}

// ==========================================
// INDEX.HTML LOGIC
// ==========================================
async function handleClientAccess() {
    const token = document.getElementById('token-input').value.trim().toUpperCase();
    if (!token) return alert("Insira um token válido.");
    window.location.href = `client.html?token=${token}`;
}

async function handleAdminLogin() {
    const pass = document.getElementById('admin-pass').value;
    const errEl = document.getElementById('admin-error');
    
    // Hash SHA-256 da senha "silven123" (exemplo)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pass));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash correto armazenado no DB ou hardcoded para fallback
    const correctHash = '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b'; 

    if (hashHex === correctHash) {
        sessionStorage.setItem('silven_admin', 'true');
        window.location.href = 'admin.html';
    } else {
        errEl.textContent = "Senha incorreta.";
        errEl.classList.remove('hidden');
    }
}

// ==========================================
// ADMIN.HTML LOGIC
// ==========================================
async function initAdmin() {
    lucide.createIcons();
    loadAdminStats();
    
    document.getElementById('form-new-project').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'Criando...';

        const client = document.getElementById('new-client').value;
        const title = document.getElementById('new-title').value;
        const value = document.getElementById('new-value').value;
        const token = generateSmartToken(client);
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
    });
}

async function loadAdminStats() {
    const { data } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    if(!data) return;

    let rev = 0, signed = 0;
    const list = document.getElementById('projects-list');
    list.innerHTML = '';

    data.forEach(p => {
        rev += Number(p.total_value);
        if(p.signed_client) signed++;
        
        list.innerHTML += `
        <div class="flex justify-between items-center p-4 bg-slate-800/40 rounded-lg border border-white/5 hover:border-cyan-500/30 transition group">
            <div>
                <h4 class="font-bold text-white">${p.title}</h4>
                <p class="text-xs text-slate-400">${p.client_name} • <span class="text-cyan-400 font-tech">${p.access_token}</span></p>
            </div>
            <div class="text-right">
                <span class="block text-emerald-400 font-bold">${formatCurrency(p.total_value)}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">${p.status}</span>
            </div>
        </div>`;
    });

    document.getElementById('stat-projects').textContent = data.length;
    document.getElementById('stat-revenue').textContent = formatCurrency(rev);
    document.getElementById('stat-signed').textContent = signed;
}

function logout() {
    sessionStorage.removeItem('silven_admin');
    window.location.href = 'index.html';
}

// ==========================================
// CLIENT.HTML LOGIC
// ==========================================
async function initClient(token) {
    lucide.createIcons();
    
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
    
    // Calcular valor com multa se atrasado
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    
    let finalValue = Number(data.total_value);
    if(diffDays > 0) {
        const multa = finalValue * 0.02;
        const juros = finalValue * 0.00033 * diffDays;
        finalValue += multa + juros;
        document.getElementById('finance-value').innerHTML = `${formatCurrency(finalValue)} <span class="text-xs text-red-400 block mt-1">Inclui multa/juros (${diffDays} dias)</span>`;
    } else {
        document.getElementById('finance-value').textContent = formatCurrency(finalValue);
    }

    if(data.signed_client) {
        document.getElementById('sign-area').classList.add('hidden');
        document.getElementById('signed-msg').classList.remove('hidden');
    }

    loadSupportHistory();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    event.target.classList.add('active');

    if(tabName === 'contract' && !signaturePad && !currentProject.signed_client) {
        const canvas = document.getElementById('sig-pad');
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
    }
}

// --- PIX ---
async function generatePix() {
    const btn = document.getElementById('btn-pix');
    const load = document.getElementById('pix-loading');
    btn.classList.add('hidden'); load.classList.remove('hidden');

    // Simulação de integração (substitua pela chamada real ao Supabase Edge Function)
    setTimeout(async () => {
        try {
            // Exemplo de chamada real:
            // const { data } = await supabase.functions.invoke('gerar-pix', { body: { amount: currentProject.total_value } });
            
            // Mock para demonstração visual perfeita:
            const mockCode = "00020126360014BR.GOV.BCB.PIX0114+55119999999995204000053039865802BR5913SILVEN TEC6008SAO PAULO62070503***6304";
            document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockCode)}`;
            document.getElementById('pix-code').textContent = mockCode;
            
            document.getElementById('pix-result').classList.remove('hidden');
            load.classList.add('hidden');
        } catch(e) {
            alert('Erro ao gerar PIX');
            btn.classList.remove('hidden'); load.classList.add('hidden');
        }
    }, 1500);
}

function copyPix() {
    const code = document.getElementById('pix-code').textContent;
    navigator.clipboard.writeText(code).then(() => alert('Código copiado!'));
}

// --- CONTRATO ---
function clearSig() { if(signaturePad) signaturePad.clear(); }

async function signContract() {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Por favor, assine o contrato.');
    
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho Silven Tec
    doc.setFontSize(22); doc.setTextColor(6, 182, 212);
    doc.text("SILVEN TEC", 20, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("INOVAÇÃO & GESTÃO", 20, 26);
    
    doc.setLineWidth(0.5); doc.line(20, 32, 190, 32);
    
    doc.setFontSize(14); doc.setTextColor(0);
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 20, 45);
    
    doc.setFontSize(11);
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 60);
    doc.text(`PROJETO: ${currentProject.title}`, 20, 68);
    doc.text(`VALOR MENSAL: ${formatCurrency(currentProject.total_value)}`, 20, 76);
    
    doc.setFontSize(9); doc.setTextColor(80);
    const clauses = `CLÁUSULA 1ª: O presente contrato tem como objeto a prestação de serviços tecnológicos. 
CLÁUSULA 2ª: Em caso de atraso, incidirá multa de 2% mais juros de 0,033% ao dia.
CLÁUSULA 3ª: Este documento possui validade jurídica conforme MP 2.200-2/2001.`;
    
    doc.text(doc.splitTextToSize(clauses, 170), 20, 90);
    
    // Assinatura
    doc.addImage(sigData, 'PNG', 20, 140, 70, 35);
    doc.setFontSize(9); doc.setTextColor(0);
    doc.text("Assinatura Digital do Cliente", 20, 180);
    doc.text(`Data: ${new Date().toLocaleString()}`, 20, 185);

    doc.save(`Contrato_SilvenTec_${currentProject.title.replace(/\s/g,'_')}.pdf`);

    // Salvar no DB
    await supabase.from('contracts').upsert({ 
        project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() 
    }, { onConflict: 'project_id' });
    
    await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
}

// --- SUPORTE ---
async function sendSupport() {
    const msg = document.getElementById('support-msg').value.trim();
    if(!msg) return;
    
    await supabase.from('requests').insert([{
        project_id: currentProject.id, message: msg, sender: 'client'
    }]);
    
    document.getElementById('support-msg').value = '';
    loadSupportHistory();
}

async function loadSupportHistory() {
    const { data } = await supabase.from('requests').select('*').eq('project_id', currentProject.id).order('created_at');
    const hist = document.getElementById('support-history');
    hist.innerHTML = '';
    
    data?.forEach(m => {
        const isMe = m.sender === 'client';
        hist.innerHTML += `
        <div class="p-3 rounded-lg text-sm ${isMe ? 'bg-cyan-900/20 border border-cyan-500/20 ml-8' : 'bg-slate-800 border border-slate-700 mr-8'}">
            <strong class="${isMe ? 'text-cyan-400' : 'text-emerald-400'}">${isMe ? 'Você' : 'Admin'}:</strong>
            <p class="text-slate-300 mt-1">${m.message}</p>
            <span class="text-[10px] text-slate-500 mt-2 block">${new Date(m.created_at).toLocaleString()}</span>
        </div>`;
    });
}
