document.addEventListener('DOMContentLoaded', () => {
    
    // CONFIGURAÇÃO SUPABASE
    const SUPABASE_URL = 'https://evwsxwkvtjgexhjwofxh.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d3N4d2t2dGpnZXhoandvZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODk0MDEsImV4cCI6MjEwMzI2NTQwMX0.oN_ATHMc7KBHC7NA7O35Q5nS3H4OxSIAXMXvE7xYXCA';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let signaturePad;
    let currentProjectId = null;

    // ==========================================
    // FUNÇÕES GLOBAIS
    // ==========================================

    window.navigate = function(viewId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${viewId}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.remove('animate-fade-in', 'animate-slide-up');
            void target.offsetWidth; 
            target.classList.add(viewId === 'admin-login' ? 'animate-slide-up' : 'animate-fade-in');
        }
        if(viewId === 'admin-dash') window.loadAdminDashboard();
        if(window.lucide) window.lucide.createIcons();
    };

    window.switchClientTab = function(tabName) {
        document.querySelectorAll('.client-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        if(tabName === 'contract') window.initSignaturePad();
    };

    // ADMINISTRAÇÃO
    window.loginAdmin = async function() {
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
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pass));
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            if(hashHex === data.config_value) {
                sessionStorage.setItem('silven_admin', 'true');
                window.navigate('admin-dash');
            } else {
                msgEl.textContent = "Senha incorreta!";
                msgEl.classList.remove('hidden');
            }
        } catch(e) {
            msgEl.textContent = "Erro de conexão: " + e.message;
            msgEl.classList.remove('hidden');
        }
    };

    window.logout = function() {
        sessionStorage.removeItem('silven_admin');
        window.navigate('home');
    };

    window.loadAdminDashboard = async function() {
        if(!sessionStorage.getItem('silven_admin')) return window.navigate('admin-login');

        const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', {ascending: false});
        const list = document.getElementById('admin-projects-list');
        list.innerHTML = '';

        let pendingRev = 0;
        let signedCount = 0;

        if(error) {
            list.innerHTML = `<p class="text-red-400">Erro ao carregar: ${error.message}</p>`;
            return;
        }

        projects?.forEach(p => {
            if(p.status !== 'concluido') pendingRev += Number(p.total_value || 0);
            if(p.signed_client) signedCount++;
            
            const link = `${window.location.origin}${window.location.pathname}?token=${p.access_token}`;
            list.innerHTML += `
                <div class="flex justify-between items-center p-4 bg-slate-800/40 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition group">
                    <div>
                        <h4 class="font-bold text-white">${p.title}</h4>
                        <p class="text-xs text-slate-400">${p.client_name} • ${new Date(p.created_at).toLocaleDateString()}</p>
                        <p class="text-[10px] text-cyan-400 mt-1 select-all opacity-0 group-hover:opacity-100 transition cursor-pointer" onclick="navigator.clipboard.writeText('${link}')">📋 Copiar Link Cliente</p>
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
        document.getElementById('stat-contracts').textContent = signedCount;
    };

    window.createProject = async function() {
        const client = document.getElementById('new-client').value;
        const title = document.getElementById('new-title').value;
        const value = document.getElementById('new-value').value;

        if(!client || !title || !value) return alert("Preencha todos os campos!");

        const token = Math.random().toString(36).substring(2, 10).toUpperCase();
        const deadline = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

        const { error } = await supabase.from('projects').insert([{
            client_name: client, title, total_value: value, access_token: token, status: 'em_andamento', deadline
        }]);

        if(error) alert("Erro ao criar: " + error.message);
        else {
            alert(`✅ Projeto criado!\nToken: ${token}\nLink: ${window.location.origin}${window.location.pathname}?token=${token}`);
            document.getElementById('new-client').value = '';
            document.getElementById('new-title').value = '';
            document.getElementById('new-value').value = '';
            window.loadAdminDashboard();
        }
    };

    // ÁREA DO CLIENTE
    window.checkClientAccess = function() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if(token) window.loadClientArea(token);
        else {
            const input = prompt("Cole seu Link de Acesso ou Token:");
            if(input) {
                const cleanToken = input.includes('token=') ? input.split('token=')[1] : input;
                window.location.search = `?token=${cleanToken.trim()}`;
            }
        }
    };

    window.loadClientArea = async function(token) {
        window.navigate('client-area');
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
        
        window.loadSupportMessages();
    };

    // PIX
    window.generatePixPayment = async function() {
        const btn = document.getElementById('btn-generate-pix');
        const loading = document.getElementById('pix-loading');
        
        btn.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            await new Promise(r => setTimeout(r, 1500));
            // LINK DE EXEMPLO - SUBSTITUA PELO SEU LINK REAL DO MERCADO PAGO QUANDO TIVER
            const mpLink = "https://mpago.la/2wXN123"; 
            
            document.getElementById('pix-qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mpLink)}`;
            document.getElementById('pix-copy-paste').textContent = mpLink;
            document.getElementById('pix-area').classList.remove('hidden');
            
        } catch(e) {
            alert("Erro ao gerar PIX: " + e.message);
            btn.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    };

    window.copyPix = function() {
        const code = document.getElementById('pix-copy-paste').textContent;
        navigator.clipboard.writeText(code).then(() => alert("✅ Código copiado!"));
    };

    // CONTRATO
    window.initSignaturePad = function() {
        const canvas = document.getElementById('signature-pad');
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        if(!signaturePad) signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
    };

    window.clearSignature = function() { if(signaturePad) signaturePad.clear(); };

    window.signContract = async function() {
        if(!signaturePad || signaturePad.isEmpty()) return alert("Por favor, assine antes de continuar.");
        
        const dataURL = signaturePad.toDataURL();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const { data: proj } = await supabase.from('projects').select('*').eq('id', currentProjectId).single();
        
        doc.setFontSize(20);
        doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS - SILVEN TEC", 20, 20);
        doc.setFontSize(12);
        doc.text(`Cliente: ${proj.client_name}`, 20, 40);
        doc.text(`Projeto: ${proj.title}`, 20, 50);
        doc.text(`Valor: R$ ${proj.total_value}`, 20, 60);
        doc.text(`Data: ${new Date().toLocaleString()}`, 20, 70);
        doc.text("Este documento certifica a concordância com os termos.", 20, 90);
        
        doc.addImage(dataURL, 'PNG', 20, 110, 80, 40);
        doc.text("Assinatura Digital do Cliente", 20, 155);
        
        doc.save(`Contrato_SilvenTec_${proj.title.replace(/\s+/g, '_')}.pdf`);
        
        await supabase.from('contracts').upsert({ 
            project_id: currentProjectId, 
            signed_client: true, 
            signed_at: new Date().toISOString(),
            signature_data: dataURL 
        }, { onConflict: 'project_id' });
        
        document.getElementById('contract-signed-msg').classList.remove('hidden');
        window.loadAdminDashboard();
    };

    // SUPORTE
    window.sendSupportMessage = async function() {
        const msg = document.getElementById('support-msg').value;
        if(!msg) return;

        const { error } = await supabase.from('requests').insert([{
            project_id: currentProjectId,
            message: msg,
            sender: 'client',
            created_at: new Date().toISOString()
        }]);

        if(error) alert("Erro ao enviar: " + error.message);
        else {
            document.getElementById('support-msg').value = '';
            window.loadSupportMessages();
            alert("✅ Solicitação enviada!");
        }
    };

    window.loadSupportMessages = async function() {
        const { data } = await supabase.from('requests')
            .select('*')
            .eq('project_id', currentProjectId)
            .order('created_at', { ascending: true });
        
        const history = document.getElementById('support-history');
        history.innerHTML = '';
        
        data?.forEach(m => {
            const isClient = m.sender === 'client';
            history.innerHTML += `
                <div class="p-3 ${isClient ? 'bg-cyan-900/20 border-cyan-500/20' : 'bg-emerald-900/20 border-emerald-500/20'} border rounded-lg text-sm">
                    <strong>${isClient ? 'Você' : 'Admin'}:</strong> ${m.message}
                    <br><span class="text-[10px] text-slate-500">${new Date(m.created_at).toLocaleString()}</span>
                </div>
            `;
        });
    };

    // INICIALIZAÇÃO AUTOMÁTICA
    if(sessionStorage.getItem('silven_admin')) window.navigate('admin-dash');
    else if(new URLSearchParams(window.location.search).get('token')) window.checkClientAccess();
    else window.navigate('home');

});
