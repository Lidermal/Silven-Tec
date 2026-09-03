document.addEventListener('DOMContentLoaded', () => {
    const btnShowClient = document.getElementById('btnShowClient');
    const btnShowAdmin = document.getElementById('btnShowAdmin');
    const clientModal = document.getElementById('clientModal');
    const adminModal = document.getElementById('adminModal');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // Funções para alternar as janelas
    btnShowClient.addEventListener('click', () => {
        clientModal.classList.remove('hidden');
        adminModal.classList.add('hidden');
        welcomeMessage.classList.add('opacity-10');
    });

    btnShowAdmin.addEventListener('click', () => {
        adminModal.classList.remove('hidden');
        clientModal.classList.add('hidden');
        welcomeMessage.classList.add('opacity-10');
    });

    // Redireciona o Cliente com o Token
    document.getElementById('btnAccessClient').addEventListener('click', () => {
        const token = document.getElementById('tokenInput').value.trim().toUpperCase();
        if (!token) {
            alert("Por favor, insira um token válido.");
            return;
        }
        window.location.href = `client-dashboard.html?token=${token}`;
    });

    // Autentica o Administrador no Supabase
    document.getElementById('btnAccessAdmin').addEventListener('click', async () => {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPass').value;
        const errorEl = document.getElementById('adminError');
        const btn = document.getElementById('btnAccessAdmin');

        if (!email || !password) {
            errorEl.textContent = "Preencha e-mail e senha.";
            errorEl.classList.remove('hidden');
            return;
        }

        btn.textContent = "Autenticando...";
        btn.disabled = true;
        errorEl.classList.add('hidden');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            errorEl.textContent = "Acesso negado: " + error.message;
            errorEl.classList.remove('hidden');
            btn.textContent = "Entrar no Sistema";
            btn.disabled = false;
        } else {
            window.location.href = 'admin-dashboard.html';
        }
    });
});
