// Alke Wallet - Login Script
// ======================================

// Credenciales válidas (en producción esto vendría del backend)
const VALID_CREDENTIALS = {
    username: 'admin',
    password: '12345'
};

// Función para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = $('#loginAlert');
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    alertDiv.removeClass('d-none alert-success alert-error')
        .addClass(`alert alert-${type}`)
        .html(`<i class="fas ${iconClass}"></i> ${message}`)
        .slideDown();
    
    setTimeout(() => {
        alertDiv.slideUp(() => alertDiv.addClass('d-none'));
    }, 3000);
}

// Toggle password visibility
$('#togglePassword').on('click', function() {
    const passwordInput = $('#password');
    const icon = $(this).find('i');
    
    if (passwordInput.attr('type') === 'password') {
        passwordInput.attr('type', 'text');
        icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
        passwordInput.attr('type', 'password');
        icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
});

// Cargar datos recordados si existen
$(document).ready(function() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    
    if (rememberedUser) {
        $('#username').val(rememberedUser);
        $('#rememberMe').prop('checked', true);
    }
    
    // Agregar animación de entrada a los inputs
    $('.form-control').on('focus', function() {
        $(this).parent().addClass('slide-up');
    });
});

// Manejar el envío del formulario
$('#loginForm').on('submit', function(e) {
    e.preventDefault();
    
    const username = $('#username').val().trim();
    const password = $('#password').val();
    const rememberMe = $('#rememberMe').is(':checked');
    
    // Validación
    if (!username || !password) {
        showAlert('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Verificar credenciales
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        // Guardar sesión
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Guardar usuario si se marcó "Recordar"
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Inicializar saldo si no existe
        if (!localStorage.getItem('balance')) {
            localStorage.setItem('balance', '10000.00');
        }
        
        showAlert('¡Bienvenido! Redirigiendo...', 'success');
        
        // Redireccionar al menú principal
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1500);
        
    } else {
        showAlert('Usuario o contraseña incorrectos', 'error');
        
        // Agregar efecto de shake al formulario
        $('#loginForm').addClass('shake');
        setTimeout(() => {
            $('#loginForm').removeClass('shake');
        }, 500);
    }
});

// Animación shake para errores
const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);