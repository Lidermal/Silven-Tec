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
    
    // Validação SHA-256 (Senha padrão: silven123)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pass));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
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
    loadAdminStats();
    
    document.getElementById('form-new-project').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'Processando...';

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
        btn.disabled = false; btn.textContent = 'Cadastrar';
    });
}

async function loadAdminStats() {
    const { data } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    if(!data) return;

    let rev = 0;
    const list = document.getElementById('projects-list');
    list.innerHTML = '';

    data.forEach(p => {
        rev += Number(p.total_value);
        list.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid var(--border-color);">
            <div>
                <h4 style="color: white; font-weight: 600;">${p.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${p.client_name} • <span style="color: var(--cyan-primary); font-family: monospace;">${p.access_token}</span></p>
            </div>
            <div style="text-align: right;">
                <span style="color: #10b981; font-weight: bold;">${formatCurrency(p.total_value)}</span>
                <span style="display: block; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">${p.status}</span>
            </div>
        </div>`;
    });

    document.getElementById('stat-projects').textContent = data.length;
    document.getElementById('stat-revenue').textContent = formatCurrency(rev);
}

function logout() {
    sessionStorage.removeItem('silven_admin');
    window.location.href = 'index.html';
}

// ==========================================
// CLIENT.HTML LOGIC
// ==========================================
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
    
    // Lógica de Multa
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    
    let finalValue = Number(data.total_value);
    if(diffDays > 0) {
        const multa = finalValue * 0.02;
        const juros = finalValue * 0.00033 * diffDays;
        finalValue += multa + juros;
        document.getElementById('finance-value').innerHTML = `${formatCurrency(finalValue)} <span style="font-size: 0.8rem; color: #ef4444; display: block; margin-top: 0.5rem;">Inclui multa/juros (${diffDays} dias)</span>`;
    } else {
        document.getElementById('finance-value').textContent = formatCurrency(finalValue);
    }

    if(data.signed_client) {
        document.getElementById('sign-area').classList.add('hidden');
        document.getElementById('signed-msg').classList.remove('hidden');
    }
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

// --- INTEGRAÇÃO MERCADO PAGO VIA SUPABASE EDGE FUNCTION ---
async function generatePix() {
    const btn = document.getElementById('btn-pix');
    const load = document.getElementById('pix-loading');
    btn.classList.add('hidden'); load.classList.remove('hidden');

    try {
        // Chama a função que você configurou no Supabase com as secrets do MP
        const { data, error } = await supabase.functions.invoke('gerar-pix-mp', {
            body: { 
                amount: Number(document.getElementById('finance-value').innerText.replace(/[^\d,]/g, '').replace(',', '.')), 
                description: `Pagamento Silven Tec: ${currentProject.title}`
            }
        });

        if (error || data.error) throw new Error(data?.error || 'Falha na geração');

        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
        
    } catch(e) {
        console.error(e);
        // Fallback visual caso a função ainda não esteja 100%
        document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SIMULACAO_PIX_SILVEN_TEC`;
        document.getElementById('pix-code').textContent = "00020126360014BR.GOV.BCB.PIX... (SIMULAÇÃO)";
        document.getElementById('pix-result').classList.remove('hidden');
    } finally {
        load.classList.add('hidden');
    }
}

function copyPix() {
    const code = document.getElementById('pix-code').textContent;
    navigator.clipboard.writeText(code).then(() => alert('Código PIX copiado!'));
}

// --- CONTRATO DIGITAL ---
function clearSig() { if(signaturePad) signaturePad.clear(); }

async function signContract() {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Por favor, assine o contrato.');
    
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho com Marca
    doc.setFontSize(20); doc.setTextColor(6, 182, 212);
    doc.text("SILVEN TEC", 20, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("INOVAÇÃO & GESTÃO", 20, 26);
    doc.line(20, 32, 190, 32);
    
    doc.setFontSize(14); doc.setTextColor(0);
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 20, 45);
    
    doc.setFontSize(11);
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 60);
    doc.text(`PROJETO: ${currentProject.title}`, 20, 68);
    doc.text(`VALOR: ${formatCurrency(currentProject.total_value)}`, 20, 76);
    
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text("Cláusula de atraso: Multa de 2% + Juros de 0,033% ao dia.", 20, 90);
    
    doc.addImage(sigData, 'PNG', 20, 140, 70, 35);
    doc.text(`Assinado em: ${new Date().toLocaleString()}`, 20, 180);

    doc.save(`Contrato_SilvenTec_${currentProject.title}.pdf`);

    await supabase.from('contracts').upsert({ 
        project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() 
    }, { onConflict: 'project_id' });
    
    await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
}
