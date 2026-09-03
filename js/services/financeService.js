const FinanceService = {
    calculateLateFee(originalValue, dueDateStr) {
        const value = Number(originalValue);
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return { finalValue: value, isLate: false, lateDays: 0, multa: 0, juros: 0 };
        }

        const multa = value * 0.02;
        const juros = value * 0.00033 * diffDays;
        const finalValue = value + multa + juros;

        return { finalValue, isLate: true, lateDays: diffDays, multa, juros };
    },

    async generatePix(value, description) {
        try {
            const { data, error } = await supabase.functions.invoke('gerar-pix-mp', {
                body: { 
                    transaction_amount: Number(value.toFixed(2)), 
                    description: `Silven Tec: ${description}`
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return {
                qrCodeUrl: `data:image/jpeg;base64,${data.qr_code_base64}`,
                copyPasteCode: data.qr_code
            };
        } catch (e) {
            console.error("Erro no Mercado Pago:", e);
            throw new Error("Não foi possível gerar o PIX. Tente novamente mais tarde.");
        }
    }
};
