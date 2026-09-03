/* app.js - Silven Tec Core Logic (Sincronizado com Supabase) */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;
let systemConfig = {}; // Cache para configs do banco

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Gera token usando prefixo vindo do system_config
async function generateSmartToken(name) {
    // Busca prefixo do banco se ainda não tiver em cache
    if (!systemConfig.token_prefix) {
        const { data } = await supabase.from('system_config').select('config_value').eq('config_key', 'token_prefix').single();
        if (data) systemConfig.token_prefix = data.config_value;
    }
    
    const prefix = systemConfig.token_prefix || 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

// ==========================================
// INDEX.HTML LOGIC (LOGIN VIA BANCO)
// ==========================================
async function handleClientAccess() {
    const token = document.getElementById('token-input').value.trim().toUpperCase();
    if (!token) return alert("Insira um token válido.");
    window.location.href = `client.html?token=${token}`;
}

async function handleAdminLogin() {
    const passInput = document.getElementById('admin-pass').value;
    const errEl = document.getElementById('admin-error');
    const btn = document.querySelector('#form-admin button');
    
    if (!passInput) {
        errEl.textContent = "Digite a senha.";
        errEl.classList.remove('hidden');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="display:inline-block"></i> Verificando...`;
    btn.disabled = true;
    lucide.createIcons();

    try {
        // CONSULTA DIRETA NO BANCO DE DADOS
        const { data: user, error } = await supabase
            .from('users')
            .select('password_hash, role')
            .eq('username', 'janaelson')
            .single();

        if (error || !user) throw new Error("Usuário administrador não encontrado.");

        // COMPARAÇÃO DE SENHA (Sem hash no código, vem do DB)
        if (user.password_hash !== passInput) throw new Error("Senha incorreta.");

        // SUCESSO
        sessionStorage.setItem('silven_admin', 'true');
        sessionStorage.setItem('silven_user', JSON.stringify({ username: 'janaelson', role: user.role }));
        window.location.href = 'admin.html';

    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
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
        
        // Token gerado dinamicamente via system_config
        const token = await generateSmartToken(client);
        const deadline = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

        const { error } = await supabase.from('projects').insert([{
            client_name: client, title, total_value: value, 
            access_token: token, status: 'em_andamento', deadline
        }]);

        if(error) alert('Erro ao criar: ' + error.message);
        else {
            alert(`Projeto criado!\nToken de Acesso: ${token}`);
            e.target.reset();
            loadAdminStats();
        }
        btn.disabled = false; btn.textContent = 'Criar Projeto';
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
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid var(--border-color); transition: all 0.3s;" onmouseover="this.style.borderColor='var(--cyan-primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
            <div>
                <h4 style="color: white; font-weight: 600; margin-bottom: 0.3rem;">${p.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${p.client_name} • <span style="color: var(--cyan-primary); font-family: 'Orbitron', monospace; font-size: 0.8rem;">${p.access_token}</span></p>
            </div>
            <div style="text-align: right;">
                <span style="color: #10b981; font-weight: 700; font-size: 1.1rem;">${formatCurrency(p.total_value)}</span>
                <span style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.5px;">${p.status}</span>
            </div>
        </div>`;
    });

    document.getElementById('stat-projects').textContent = data.length;
    document.getElementById('stat-revenue').textContent = formatCurrency(rev);
}

function logout() {
    sessionStorage.removeItem('silven_admin');
    sessionStorage.removeItem('silven_user');
    window.location.href = 'index.html';
}

// ==========================================
// CLIENT.HTML LOGIC
// ==========================================
async function initClient(token) {
    const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();
    
    if(error || !data) {
        alert('Projeto não encontrado ou token inválido.');
        window.location.href = 'index.html';
        return;
    }

    currentProject = data;
    document.getElementById('proj-title').textContent = data.title;
    document.getElementById('client-name').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('status-badge').textContent = data.status.toUpperCase();
    document.getElementById('deadline-display').textContent = new Date(data.deadline).toLocaleDateString('pt-BR');
    
    // Lógica de Multa Automática
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    
    let finalValue = Number(data.total_value);
    if(diffDays > 0) {
        const multa = finalValue * 0.02;
        const juros = finalValue * 0.00033 * diffDays;
        finalValue += multa + juros;
        document.getElementById('finance-value').innerHTML = `${formatCurrency(finalValue)} <span style="font-size: 0.85rem; color: #ef4444; display: block; margin-top: 0.8rem; font-weight: 500;">️ Inclui multa de 2% + juros de 0,033%/dia (${diffDays} dias de atraso)</span>`;
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
        signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)', penColor: '#0f172a' });
    }
}

// --- INTEGRAÇÃO MERCADO PAGO (SUPABASE EDGE FUNCTION) ---
async function generatePix() {
    const btn = document.getElementById('btn-pix');
    const load = document.getElementById('pix-loading');
    btn.classList.add('hidden'); load.classList.remove('hidden');

    try {
        // Chama sua Edge Function configurada com secrets do MP
        const { data, error } = await supabase.functions.invoke('gerar-pix-mp', {
            body: { 
                amount: Number(document.getElementById('finance-value').innerText.replace(/[^\d,]/g, '').replace(',', '.')), 
                description: `Silven Tec: ${currentProject.title}`
            }
        });

        if (error || data?.error) throw new Error(data?.error || 'Falha na comunicação com gateway');

        document.getElementById('qr-img').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        document.getElementById('pix-code').textContent = data.qr_code;
        document.getElementById('pix-result').classList.remove('hidden');
        
    } catch(e) {
        console.error("Erro PIX:", e);
        // Fallback visual para teste
        document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PIX_SIMULACAO_SILVEN_TEC`;
        document.getElementById('pix-code').textContent = "00020126360014BR.GOV.BCB.PIX... (SIMULAÇÃO - Configure a Edge Function)";
        document.getElementById('pix-result').classList.remove('hidden');
    } finally {
        load.classList.add('hidden');
    }
}

function copyPix() {
    const code = document.getElementById('pix-code').textContent;
    navigator.clipboard.writeText(code).then(() => alert('Código PIX copiado para a área de transferência!'));
}

// --- CONTRATO DIGITAL COM MARCA SILVEN TEC ---
function clearSig() { if(signaturePad) signaturePad.clear(); }

async function signContract() {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Por favor, realize sua assinatura no quadro acima.');
    
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho Profissional
    doc.setFontSize(24); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold");
    doc.text("SILVEN TEC", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("INOVAÇÃO & GESTÃO", 20, 32);
    doc.setLineWidth(0.5); doc.setDrawColor(6, 182, 212); doc.line(20, 38, 190, 38);
    
    doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS EM TECNOLOGIA", 20, 55);
    
    doc.setFontSize(11); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 70);
    doc.text(`PROJETO: ${currentProject.title}`, 20, 78);
    doc.text(`VALOR MENSAL: ${formatCurrency(currentProject.total_value)}`, 20, 86);
    doc.text(`DATA DE EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, 20, 94);
    
    doc.setFontSize(9); doc.setTextColor(100);
    const clauses = `CLÁUSULA 1ª - DO OBJETO: Prestação de serviços de desenvolvimento e gestão tecnológica.\nCLÁUSULA 2ª - DOS ATRASOS: Incidirá multa fixa de 2% (dois por cento) sobre o valor da parcela, acrescida de juros moratórios de 0,033% (trinta e três milésimos por cento) ao dia.\nCLÁUSULA 3ª - VALIDADE: Este documento possui plena validade jurídica conforme MP 2.200-2/2001.`;
    
    doc.text(doc.splitTextToSize(clauses, 170), 20, 110);
    
    // Área da Assinatura
    doc.addImage(sigData, 'PNG', 20, 160, 80, 40);
    doc.setDrawColor(100); doc.line(20, 202, 100, 202);
    doc.setFontSize(9); doc.setTextColor(51, 65, 85);
    doc.text("Assinatura Digital do Contratante", 20, 208);
    doc.text(`Validado em: ${new Date().toLocaleString('pt-BR')}`, 20, 214);

    doc.save(`Contrato_SilvenTec_${currentProject.title.replace(/\s+/g, '_')}.pdf`);

    // Salva no Supabase
    await supabase.from('contracts').upsert({ 
        project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() 
    }, { onConflict: 'project_id' });
    
    await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
}
