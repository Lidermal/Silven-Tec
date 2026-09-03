// js/services/contractService.js

const ContractService = {
    // Regras financeiras do sistema
    FINANCIAL_RULES: {
        multaFixa: 0.02, // 2%
        jurosAoDia: 0.00033 // 0,033%
    },

    async createProject(clientName, title, monthlyValue, installments) {
        // Gera o token inteligente (Ex: ST-JOAO-8X9P)
        const namePart = clientName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase().padEnd(4, 'X');
        const uniquePart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const smartToken = `ST-${namePart}-${uniquePart}`;
        
        const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const { data, error } = await supabase.from('projects').insert([{
                client_name: clientName, 
                title: title, 
                total_value: monthlyValue, // Tratado como valor da mensalidade
                access_token: smartToken, 
                status: 'em_andamento', 
                deadline: deadline
            }]).select();

            if (error) throw error;
            return { success: true, data: data[0], token: smartToken };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Função para gerar o documento base do contrato (sem a assinatura ainda)
    async generateContractDocument(project) {
        const doc = new window.jspdf.jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS EM TECNOLOGIA", 20, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        
        const contractText = `
CONTRATADA: Silven Tec - Inovação & Gestão
CONTRATANTE: ${project.client_name}

1. DO OBJETO
O presente contrato tem como objeto a prestação de serviços de desenvolvimento
e gestão em tecnologia para o projeto "${project.title}".

2. DO VALOR E FORMA DE PAGAMENTO (ASSINATURA)
O serviço será prestado no modelo de assinatura mensal.
O valor da mensalidade acordada é de R$ ${Number(project.total_value).toFixed(2)}.

3. DOS ATRASOS E PENALIDADES
Em caso de atraso no pagamento de qualquer parcela, incidirão sobre o 
valor devido as seguintes penalidades:
a) Multa fixa de 2% (dois por cento) sobre o valor da parcela, aplicada 
uma única vez, independentemente dos dias de atraso.
b) Juros de mora de 0,033% por dia de atraso, calculados sobre o valor da parcela.

Cálculo do valor final em atraso: 
Valor da Parcela + Multa (2%) + Juros (0,033% x dias de atraso).

Data de emissão: ${new Date().toLocaleDateString('pt-BR')}
        `;

        const splitText = doc.splitTextToSize(contractText, 170);
        doc.text(splitText, 20, 35);
        
        return doc;
    }
};
