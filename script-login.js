// script-login.js
// (Este é o mesmo código do script acima, apenas separado)

// Configurações
const CONFIG = {
    USUARIO: "Entre com usuário",
    SENHA: "Coloque a senha aqui",
    URL_SIMULADO: "https://cristianmarquesdevx.github.io/S.LDB-Cliente/",
    URL_LOGIN: window.location.href,
    TEMPO_SESSAO: 8 * 60 * 60 * 1000, // 8 horas
    TEMPO_REDIRECIONAMENTO: 1200 // ms
};

// Estado da aplicação
const STATE = {
    elementos: {},
    carregando: false,
    tentativas: 0
};

// Inicialização
function initLogin() {
    // Mapear elementos DOM
    STATE.elementos = {
        user: document.getElementById('loginUser'),
        pass: document.getElementById('loginPass'),
        erro: document.getElementById('loginErro'),
        btnLogin: document.getElementById('btnLogin'),
        btnText: document.getElementById('btnText'),
        btnSpinner: document.getElementById('btnSpinner'),
        form: document.getElementById('loginForm')
    };
    
    // Verificar sessão existente
    checkExistingSession();
    
    // Configurar eventos
    setupEvents();
    
    // Foco automático
    if (STATE.elementos.user) {
        STATE.elementos.user.focus();
        STATE.elementos.user.select();
    }
    
    console.log('✅ Sistema de Login inicializado');
}

// Verificar sessão existente
function checkExistingSession() {
    try {
        const session = localStorage.getItem('simulado_session');
        if (!session) return;
        
        const sessionData = JSON.parse(session);
        const agora = Date.now();
        
        if (sessionData.expira > agora) {
            // Se a sessão for recente (< 1 minuto), redireciona direto
            if (agora - sessionData.timestamp < 60000) {
                console.log('Sessão ativa detectada, redirecionando...');
                showMessage('Sessão ativa encontrada, redirecionando...', 'info');
                setTimeout(() => {
                    window.location.href = CONFIG.URL_SIMULADO + '?token=' + sessionData.token;
                }, 1500);
            }
        } else {
            // Sessão expirada
            localStorage.removeItem('simulado_session');
            localStorage.removeItem('simulado_token');
            showMessage('Sua sessão expirou. Faça login novamente.', 'warning');
        }
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
    }
}

// Configurar eventos
function setupEvents() {
    const el = STATE.elementos;
    
    // Evento de submit do formulário
    if (el.form) {
        el.form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Eventos de foco nos campos
    if (el.user && el.pass) {
        el.user.addEventListener('focus', clearError);
        el.pass.addEventListener('focus', clearError);
    }
    
    // Evento de tecla Enter em qualquer lugar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !STATE.carregando) {
            handleLogin();
        }
    });
}

// Manipular login
function handleLogin() {
    if (STATE.carregando) return;
    
    const user = STATE.elementos.user.value.trim();
    const pass = STATE.elementos.pass.value;
    
    // Validação
    if (!validateInputs(user, pass)) return;
    
    // Iniciar processo de login
    STATE.carregando = true;
    STATE.tentativas++;
    
    showLoading(true);
    
    // Simular delay de rede
    setTimeout(() => {
        if (authenticate(user, pass)) {
            loginSuccess();
        } else {
            loginFailed();
        }
    }, 800);
}

// Validar inputs
function validateInputs(user, pass) {
    if (!user || !pass) {
        showError('Por favor, preencha todos os campos');
        highlightInvalidFields(!user, !pass);
        return false;
    }
    
    if (user.length < 3) {
        showError('Usuário deve ter pelo menos 3 caracteres');
        highlightInvalidFields(true, false);
        return false;
    }
    
    if (pass.length < 4) {
        showError('Senha deve ter pelo menos 4 caracteres');
        highlightInvalidFields(false, true);
        return false;
    }
    
    return true;
}

// Autenticar usuário
function authenticate(user, pass) {
    return user === CONFIG.USUARIO && pass === CONFIG.SENHA;
}

// Login bem-sucedido
function loginSuccess() {
    // Gerar token
    const token = generateToken();
    
    // Criar dados da sessão
    const sessionData = {
        usuario: CONFIG.USUARIO,
        token: token,
        timestamp: Date.now(),
        expira: Date.now() + CONFIG.TEMPO_SESSAO,
        ip: '127.0.0.1', // Simulado
        userAgent: navigator.userAgent
    };
    
    // Salvar sessão
    saveSession(sessionData);
    
    // Animação de sucesso
    animateSuccess();
    
    // Redirecionar
    setTimeout(() => {
        redirectToSimulado(token);
    }, CONFIG.TEMPO_REDIRECIONAMENTO);
}

// Login falhou
function loginFailed() {
    STATE.carregando = false;
    showLoading(false);
    
    // Mensagem de erro
    let errorMsg = 'Credenciais inválidas';
    if (STATE.tentativas > 2) {
        errorMsg += `. Tentativa ${STATE.tentativas} de 5`;
    }
    
    showError(errorMsg);
    
    // Efeitos visuais
    shakeForm();
    highlightInvalidFields(true, true);
    
    // Focar no campo de usuário
    STATE.elementos.user.focus();
    STATE.elementos.user.select();
    
    // Limpar destaque após 3 segundos
    setTimeout(() => {
        clearError();
    }, 3000);
    
    // Bloqueio após muitas tentativas
    if (STATE.tentativas >= 5) {
        showError('Muitas tentativas falhas. Aguarde 30 segundos.');
        disableLogin(30000);
    }
}

// Gerar token
function generateToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${CONFIG.USUARIO}:${timestamp}:${random}:${navigator.userAgent}`;
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
}

// Salvar sessão
function saveSession(sessionData) {
    try {
        localStorage.setItem('simulado_session', JSON.stringify(sessionData));
        localStorage.setItem('simulado_token', sessionData.token);
        localStorage.setItem('simulado_usuario', sessionData.usuario);
        localStorage.setItem('simulado_login_time', sessionData.timestamp);
        
        // Cookie de backup (7 dias)
        document.cookie = `simulado_token=${sessionData.token}; path=/; max-age=${7*24*60*60}; SameSite=Strict`;
    } catch (e) {
        console.error('Erro ao salvar sessão:', e);
    }
}

// Mostrar loading
function showLoading(show) {
    const el = STATE.elementos;
    
    if (show) {
        el.btnText.style.display = 'none';
        el.btnSpinner.style.display = 'block';
        el.btnLogin.disabled = true;
        el.btnLogin.style.cursor = 'not-allowed';
        el.btnLogin.style.opacity = '0.7';
    } else {
        el.btnText.style.display = 'inline';
        el.btnSpinner.style.display = 'none';
        el.btnLogin.disabled = false;
        el.btnLogin.style.cursor = 'pointer';
        el.btnLogin.style.opacity = '1';
    }
    
    STATE.carregando = show;
}

// Mostrar erro
function showError(message) {
    const el = STATE.elementos.erro;
    if (!el) return;
    
    el.querySelector('span').textContent = message;
    el.style.display = 'flex';
    el.style.animation = 'fadeIn 0.3s ease';
}

// Mostrar mensagem informativa
function showMessage(message, type = 'info') {
    // Criar elemento de mensagem
    const msgEl = document.createElement('div');
    msgEl.className = `message-${type}`;
    msgEl.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    msgEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'info' ? '#4361ee' : type === 'warning' ? '#f8961e' : '#38b000'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(msgEl);
    
    // Remover após 3 segundos
    setTimeout(() => {
        msgEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => msgEl.remove(), 300);
    }, 3000);
}

// Limpar erro
function clearError() {
    const el = STATE.elementos;
    if (el.erro) el.erro.style.display = 'none';
    if (el.user) el.user.style.borderColor = '';
    if (el.pass) el.pass.style.borderColor = '';
}

// Destacar campos inválidos
function highlightInvalidFields(userInvalid, passInvalid) {
    const el = STATE.elementos;
    
    if (userInvalid && el.user) {
        el.user.style.borderColor = 'var(--danger-color)';
        el.user.style.boxShadow = '0 0 0 3px rgba(247, 37, 133, 0.1)';
    }
    
    if (passInvalid && el.pass) {
        el.pass.style.borderColor = 'var(--danger-color)';
        el.pass.style.boxShadow = '0 0 0 3px rgba(247, 37, 133, 0.1)';
    }
}

// Animar sucesso
function animateSuccess() {
    const el = STATE.elementos;
    
    // Mudar aparência do botão
    el.btnLogin.style.background = '#38b000';
    el.btnLogin.style.transform = 'scale(0.98)';
    
    // Mudar ícone
    const icon = el.btnLogin.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-check';
    }
    
    // Texto de sucesso
    el.btnText.textContent = 'Login bem-sucedido!';
    el.btnText.style.display = 'inline';
    el.btnSpinner.style.display = 'none';
    
    // Efeito de confete (simples)
    createConfetti();
}

// Criar efeito de confete
function createConfetti() {
    const colors = ['#4361ee', '#7209b7', '#4cc9f0', '#38b000', '#f8961e'];
    
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            z-index: 1000;
            pointer-events: none;
            opacity: 0.8;
        `;
        
        document.body.appendChild(confetti);
        
        // Animação
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let x = 50, y = 50;
        const animate = () => {
            x += vx;
            y += vy;
            vy += 0.1; // gravidade
            
            confetti.style.left = x + '%';
            confetti.style.top = y + '%';
            confetti.style.opacity = parseFloat(confetti.style.opacity) - 0.02;
            
            if (parseFloat(confetti.style.opacity) > 0) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        };
        
        animate();
    }
}

// Sacudir formulário
function shakeForm() {
    const form = STATE.elementos.form;
    if (!form) return;
    
    form.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        form.style.animation = '';
    }, 500);
}

// Desabilitar login temporariamente
function disableLogin(time) {
    const el = STATE.elementos;
    
    el.btnLogin.disabled = true;
    el.btnLogin.style.cursor = 'not-allowed';
    el.btnLogin.style.opacity = '0.5';
    el.btnText.textContent = `Aguarde ${time/1000}s...`;
    
    // Contador regressivo
    const interval = setInterval(() => {
        time -= 1000;
        if (time <= 0) {
            clearInterval(interval);
            el.btnLogin.disabled = false;
            el.btnLogin.style.cursor = 'pointer';
            el.btnLogin.style.opacity = '1';
            el.btnText.textContent = 'Entrar no Sistema';
            STATE.tentativas = 0;
        } else {
            el.btnText.textContent = `Aguarde ${time/1000}s...`;
        }
    }, 1000);
}

// Redirecionar para simulado
function redirectToSimulado(token) {
    const url = new URL(CONFIG.URL_SIMULADO);
    url.searchParams.set('token', token);
    url.searchParams.set('usuario', CONFIG.USUARIO);
    url.searchParams.set('src', 'login_system');
    url.searchParams.set('ts', Date.now());
    
    window.location.href = url.toString();
}

// Adicionar estilos de animação
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        #btnSpinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        addAnimationStyles();
        initLogin();
    });
} else {
    addAnimationStyles();
    initLogin();
}

// Exportar funções para debug (se necessário)
window.loginSystem = {
    init: initLogin,
    login: handleLogin,
    logout: function() {
        localStorage.clear();
        window.location.reload();
    },
    getState: () => STATE,
    getConfig: () => CONFIG
};