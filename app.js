// --- CONFIGURAÇÃO E ESTADO ---
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

// --- FUNÇÕES DE AUTENTICAÇÃO ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.querySelector('.btn-primary');
    
    // Feedback visual de carregamento
    const originalText = btn.innerText;
    btn.innerText = 'Verificando...';
    btn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                alert('⚠️ E-mail não confirmado! Verifique sua caixa de entrada (ou spam) e clique no link de validação.');
            } else {
                alert(`Erro: ${error.message}`);
            }
            return;
        }

        if (data.user) {
            await loadUserData(data.user);
        }
    } catch (err) {
        alert('Falha na conexão com o servidor.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validação básica de senha forte
    if (password.length < 8) {
        alert('A senha deve ter no mínimo 8 caracteres.');
        return;
    }

    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/dashboard` // Redireciona após confirmar e-mail
        }
    });

    if (error) {
        alert(`Erro ao cadastrar: ${error.message}`);
    } else {
        alert('✅ Cadastro realizado! Enviamos um link de confirmação para seu e-mail. Por favor, verifique sua caixa de entrada.');
        toggleMode(); // Volta para tela de login
    }
}

// --- CARREGAMENTO DE DADOS DO USUÁRIO ---
async function loadUserData(user) {
    currentUser = user;
    
    // Busca perfil e role (admin/client)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado (primeiro login)
        console.error('Erro ao buscar perfil:', error);
    }

    // Se for primeiro acesso, cria perfil básico
    if (!profile) {
        await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.email.split('@')[0],
            role: 'client' // Padrão é cliente. Admin você cria manualmente no DB.
        });
    }

    // Transição de tela suave
    document.getElementById('auth-box').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        renderMenu(profile?.role || 'client');
        navigateTo('dashboard');
    }, 300);
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já existe sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) loadUserData(session.user);
    });

    // Listener para mudanças de auth (ex: usuário confirmou e-mail em outra aba)
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) loadUserData(session.user);
    });

    // Bind do formulário de login
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
});

// Alternar entre Login e Cadastro
function toggleMode() {
    const form = document.getElementById('login-form');
    const title = document.querySelector('.logo-area p');
    const footer = document.querySelector('.footer-links');
    const btn = document.querySelector('.btn-primary');
    
    if (form.getAttribute('data-mode') === 'signup') {
        // Modo Login
        form.setAttribute('data-mode', 'login');
        title.innerText = 'Gestão inteligente de projetos e pagamentos';
        btn.innerText = 'Entrar no Painel';
        btn.onclick = null;
        form.onsubmit = handleLogin;
        footer.innerHTML = 'Não tem conta? <a href="#" onclick="toggleMode()">Solicitar acesso</a>';
    } else {
        // Modo Cadastro
        form.setAttribute('data-mode', 'signup');
        title.innerText = 'Crie sua conta Silven Tec';
        btn.innerText = 'Criar Conta';
        btn.onclick = null;
        form.onsubmit = handleSignup;
        footer.innerHTML = 'Já tem conta? <a href="#" onclick="toggleMode()">Fazer login</a>';
    }
}
