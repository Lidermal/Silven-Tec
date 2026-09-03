/* app.js - Silven Tec Core Logic */

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

if (typeof window.supabase === 'undefined') {
    alert("Erro de conexão: Não foi possível carregar o banco de dados. Verifique sua internet.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let signaturePad = null;
let systemConfig = {}; 

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

async function generateSmartToken(name) {
    if (!systemConfig.token_prefix) {
        try {
            const { data } = await supabase.from('system_config').select('config_value').eq('config_key', 'token_prefix').single();
            if (data) systemConfig.token_prefix = data.config_value;
        } catch (e) { console.warn("Falha ao buscar config, usando padrão ST"); }
    }
    
    const prefix = systemConfig.token_prefix || 'ST';
    const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${clean}-${rand}`;
}

// ==========================================
// LÓGICA DE LOGIN ADMIN (CORRIGIDA)
// ==========================================
window.handleAdminLogin = async function() {
    const passInput = document.getElementById('admin-pass').value;
    const errEl = document.getElementById('admin-error');
    const btn = document.querySelector('#form-admin button');
    
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

        if (error || !user) {
            throw new Error("Erro de credenciais. Acesso negado.");
        }

        if (String(user.password_hash) !== String(passInput)) {
            throw new Error("Senha incorreta.");
        }

        sessionStorage.setItem('silven_admin', 'true');
        sessionStorage.setItem('silven_user', JSON.stringify({ username: 'janaelson', role: user.role }));
        
        window.location.href = 'admin.html';

    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// ACESSO CLIENTE
// ==========================================
window.handleClientAccess = function() {
    const token = document.getElementById('token-input').value.trim().toUpperCase();
    if (!token) return alert("Insira um token válido.");
    window.location.href = `client.html?token=${token}`;
};

// ==========================================
// ADMIN DASHBOARD LOGIC
// ==========================================
window.initAdmin = async function() {
    window.loadAdminStats();
    
    const form = document.getElementById('form-new-project');
    if(form) {
        form.addEventListener('submit', async (e) => {
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

            if(error) alert('Erro ao criar: ' + error.message);
            else {
                alert(`Projeto criado com sucesso!\nToken gerado: ${token}`);
                e.target.reset();
                window.loadAdminStats();
            }
            btn.disabled = false; btn.textContent = 'Criar Projeto';
        });
    }
};

window.loadAdminStats = async function() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
    if(error) return;

    let rev = 0;
    const list = document.getElementById('projects-list');
    if(list) {
        list.innerHTML = '';
        data.forEach(p => {
            rev += Number(p.total_value);
            list.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                <div>
                    <h4 style="color: white; font-weight: 600; margin-bottom: 0.3rem;">${p.title}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">${p.client_name} • <span style="color: var(--cyan-primary); font-family: monospace;">${p.access_token}</span></p>
                </div>
                <div style="text-align: right;">
                    <span style="color: #10b981; font-weight: 700;">${formatCurrency(p.total_value)}</span>
                    <span style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem; text-transform: uppercase;">${p.status.replace('_', ' ')}</span>
                </div>
            </div>`;
        });
    }

    const statProj = document.getElementById('stat-projects');
    const statRev = document.getElementById('stat-revenue');
    if(statProj) statProj.textContent = data.length;
    if(statRev) statRev.textContent = formatCurrency(rev);
};

window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
};

// ==========================================
// CLIENT AREA LOGIC
// ==========================================
window.initClient = async function(token) {
    const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();
    
    if(error || !data) {
        alert('Projeto não encontrado ou token inválido.');
        window.location.href = 'index.html';
        return;
    }

    currentProject = data;
    document.getElementById('proj-title').textContent = data.title;
    document.getElementById('client-name').textContent = `Cliente: ${data.client_name}`;
    document.getElementById('status-badge').textContent = data.status.toUpperCase().replace('_', ' ');
    
    const deadlineDate = new Date(data.deadline);
    deadlineDate.setDate(deadlineDate.getDate() + 1); // Ajuste de fuso horário simples
    document.getElementById('deadline-display').textContent = deadlineDate.toLocaleDateString('pt-BR');
    
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(data.deadline); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    
    let finalValue = Number(data.total_value);
    const valEl = document.getElementById('finance-value');
    
    if(diffDays > 0 && valEl) {
        const multa = finalValue * 0.02;
        const juros = finalValue * 0.00033 * diffDays;
        finalValue += multa + juros;
        valEl.innerHTML = `${formatCurrency(finalValue)} <span style="font-size: 0.85rem; color: #ef4444; display: block; margin-top: 0.8rem;">Em atraso (${diffDays} dias) • Multa + Juros aplicados</span>`;
    } else if (valEl) {
        valEl.textContent = formatCurrency(finalValue);
    }

    if(data.signed_client) {
        const signArea = document.getElementById('sign-area');
        const signedMsg = document.getElementById('signed-msg');
        if(signArea) signArea.classList.add('hidden');
        if(signedMsg) signedMsg.classList.remove('hidden');
    }
};

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(`tab-${tabName}`);
    if(target) target.classList.remove('hidden');
    
    // Captura o elemento clicado para ativar a borda inferior
    const eventElement = event?.currentTarget;
    if(eventElement) eventElement.classList.add('active');

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
    if(btn) btn.classList.add('hidden');
    if(load) load.classList.remove('hidden');

    try {
        const { data, error } = await supabase.functions.invoke('gerar-pix-mp', {
            body: { 
                transaction_amount: Number(currentProject.total_value), 
                description: `Silven Tec: ${currentProject.title}`
            }
        });

        if (error || data?.error) throw new Error(data?.error || 'Falha de comunicação com o Mercado Pago');

        const qrImg = document.getElementById('qr-img');
        const pixCode = document.getElementById('pix-code');
        const pixResult = document.getElementById('pix-result');
        
        if(qrImg) qrImg.src = `data:image/jpeg;base64,${data.qr_code_base64}`;
        if(pixCode) pixCode.textContent = data.qr_code;
        if(pixResult) pixResult.classList.remove('hidden');
        
    } catch(e) {
        alert("Erro ao gerar PIX: " + e.message);
        if(btn) btn.classList.remove('hidden');
    } finally {
        if(load) load.classList.add('hidden');
    }
};

window.copyPix = function() {
    const code = document.getElementById('pix-code').textContent;
    navigator.clipboard.writeText(code).then(() => alert('Código PIX Copia e Cola copiado com sucesso!'));
};

window.clearSig = function() { 
    if(signaturePad) signaturePad.clear(); 
};

window.signContract = async function() {
    if(!signaturePad || signaturePad.isEmpty()) return alert('Por favor, assine o contrato no quadro branco.');
    
    const sigData = signaturePad.toDataURL();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(24); doc.setTextColor(6, 182, 212); doc.setFont("helvetica", "bold");
    doc.text("SILVEN TEC", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.setFont("helvetica", "normal");
    doc.text("INOVAÇÃO E GESTÃO EM TECNOLOGIA", 20, 32);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DIGITAL DE PRESTAÇÃO DE SERVIÇOS", 20, 55);
    
    doc.setFontSize(11); doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal");
    doc.text(`CONTRATANTE: ${currentProject.client_name}`, 20, 75);
    doc.text(`PROJETO REFERENTE: ${currentProject.title}`, 20, 83);
    doc.text(`VALOR MENSAL ACORDADO: ${formatCurrency(currentProject.total_value)}`, 20, 91);
    
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("CLÁUSULA DE ATRASO:", 20, 110);
    doc.setFontSize(9);
    doc.text("Em caso de inadimplência, incidirá multa fixa de 2% (dois por cento)", 20, 116);
    doc.text("sobre o valor da parcela, somada a juros de mora de 0,033% ao dia de atraso.", 20, 121);
    
    doc.addImage(sigData, 'PNG', 20, 150, 80, 40);
    doc.line(20, 192, 100, 192);
    doc.text("Assinatura Eletrônica do Cliente", 20, 198);

    doc.save(`Contrato_SilvenTec_${currentProject.title.replace(/\s+/g, '_')}.pdf`);

    await supabase.from('contracts').upsert({ 
        project_id: currentProject.id, signature_data: sigData, signed_at: new Date().toISOString() 
    }, { onConflict: 'project_id' });
    
    await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
    
    document.getElementById('sign-area').classList.add('hidden');
    document.getElementById('signed-msg').classList.remove('hidden');
};
