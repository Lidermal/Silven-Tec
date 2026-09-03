document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert("Acesso negado. Token não fornecido.");
        window.location.href = 'index.html';
        return;
    }

    let currentProject = null;
    let signaturePad = null;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.client-tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            const target = e.target.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
            e.target.classList.add('active');

            if (target === 'contract' && !signaturePad) {
                const canvas = document.getElementById('signature-pad');
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                signaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
            }
        });
    });

    async function loadClientData() {
        const { data, error } = await supabase.from('projects').select('*').eq('access_token', token).single();
        
        if (error || !data) {
            alert("Projeto não encontrado ou token inválido.");
            return;
        }

        currentProject = data;
        document.getElementById('client-proj-title').textContent = data.title;
        document.getElementById('client-name-display').textContent = `Cliente: ${data.client_name}`;
        
        const deadlineDate = new Date(data.deadline);
        deadlineDate.setDate(deadlineDate.getDate() + 1);
        document.getElementById('client-deadline').textContent = deadlineDate.toLocaleDateString('pt-BR');

        const financeData = FinanceService.calculateLateFee(data.total_value, data.deadline);
        const valueDisplay = document.getElementById('client-total-value');
        
        if (financeData.isLate) {
            valueDisplay.innerHTML = `
                <span class="text-red-400">R$ ${financeData.finalValue.toFixed(2)}</span>
                <p class="text-xs text-red-500 mt-1">Atraso de ${financeData.lateDays} dias (Multa 2% + Juros)</p>
            `;
        } else {
            valueDisplay.textContent = `R$ ${financeData.finalValue.toFixed(2)}`;
        }

        if (data.signed_client) {
            document.getElementById('signature-area').innerHTML = `
                <div class="p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-center">
                    Contrato já assinado eletronicamente.
                </div>`;
        }
    }

    document.getElementById('btnSignContract')?.addEventListener('click', async () => {
        if (!signaturePad || signaturePad.isEmpty()) {
            alert("Por favor, assine antes de enviar.");
            return;
        }

        const btn = document.getElementById('btnSignContract');
        btn.textContent = "Processando...";
        btn.disabled = true;

        const signatureData = signaturePad.toDataURL();
        
        await supabase.from('projects').update({ signed_client: true }).eq('id', currentProject.id);
        await supabase.from('contracts').upsert({ 
            project_id: currentProject.id, 
            signature_data: signatureData,
            signed_at: new Date().toISOString()
        });

        const doc = await ContractService.generateContractDocument(currentProject);
        doc.addImage(signatureData, 'PNG', 20, 155, 80, 40);
        doc.save(`Contrato_SilvenTec_${currentProject.title.replace(/\s+/g, '_')}.pdf`);

        alert("Contrato assinado com sucesso! O download começará automaticamente.");
        window.location.reload();
    });

    document.getElementById('btn-generate-pix')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-generate-pix');
        btn.textContent = "Gerando PIX...";
        btn.disabled = true;

        try {
            const financeData = FinanceService.calculateLateFee(currentProject.total_value, currentProject.deadline);
            const pixData = await FinanceService.generatePix(financeData.finalValue, currentProject.title);
            
            document.getElementById('pix-qr-img').src = pixData.qrCodeUrl;
            document.getElementById('pix-copy-paste').textContent = pixData.copyPasteCode;
            
            btn.classList.add('hidden');
            document.getElementById('pix-area').classList.remove('hidden');
        } catch (error) {
            alert(error.message);
            btn.textContent = "Gerar Pagamento PIX";
            btn.disabled = false;
        }
    });

    loadClientData();
});
