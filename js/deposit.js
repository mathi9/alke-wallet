// Alke Wallet - Deposit Script
// ======================================

// Verificar autenticación al cargar
$(document).ready(function() {
    checkAuthentication();
    loadUserData();
    loadCurrentBalance();
    
    // Actualizar resumen cuando cambie el monto
    $('#depositAmount').on('input', updateSummary);
});

// Verificar autenticación
function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}

// Cargar datos del usuario
function loadUserData() {
    const username = sessionStorage.getItem('username');
    if (username) {
        $('#navUsername').text(username);
    }
}

// Cargar saldo actual
function loadCurrentBalance() {
    const balance = parseFloat(localStorage.getItem('balance')) || 10000;
    $('#currentBalance').text(formatCurrency(balance));
}

// Formatear moneda
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Función para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = $('#depositAlert');
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    alertDiv.removeClass('d-none alert-success alert-error')
        .addClass(`alert alert-${type}`)
        .html(`<i class="fas ${iconClass}"></i> ${message}`)
        .fadeIn();
    
    setTimeout(() => {
        alertDiv.fadeOut(() => alertDiv.addClass('d-none'));
    }, 4000);
}

// Montos rápidos
$('.quick-amount').on('click', function() {
    const amount = $(this).data('amount');
    $('#depositAmount').val(amount).trigger('input');
    
    // Efecto visual
    $('.quick-amount').removeClass('btn-primary').addClass('btn-outline');
    $(this).removeClass('btn-outline').addClass('btn-primary');
});

// Actualizar resumen
function updateSummary() {
    const amount = parseFloat($('#depositAmount').val()) || 0;
    
    if (amount > 0) {
        $('#summaryAmount').text(formatCurrency(amount));
        $('#summaryTotal').text(formatCurrency(amount));
        $('#depositSummary').removeClass('d-none').hide().slideDown();
    } else {
        $('#depositSummary').slideUp();
    }
}

// Manejar envío del formulario
$('#depositForm').on('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat($('#depositAmount').val());
    const description = $('#depositDescription').val().trim() || 'Depósito de fondos';
    const paymentMethod = $('#paymentMethod').val();
    
    // Validaciones
    if (!amount || amount <= 0) {
        showAlert('Por favor ingresa una cantidad válida', 'error');
        return;
    }
    
    if (amount < 1) {
        showAlert('El monto mínimo de depósito es $1.00', 'error');
        return;
    }
    
    if (amount > 50000) {
        showAlert('El monto máximo de depósito es $50,000.00', 'error');
        return;
    }
    
    if (!paymentMethod) {
        showAlert('Por favor selecciona un método de pago', 'error');
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    const btn = $('#depositBtn');
    const originalText = btn.html();
    btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Procesando...');
    
    // Simular procesamiento
    setTimeout(() => {
        // Actualizar saldo
        const currentBalance = parseFloat(localStorage.getItem('balance')) || 10000;
        const newBalance = currentBalance + amount;
        localStorage.setItem('balance', newBalance.toFixed(2));
        
        // Guardar transacción
        const transaction = {
            id: Date.now(),
            type: 'deposit',
            amount: amount.toFixed(2),
            description: description,
            paymentMethod: paymentMethod,
            date: new Date().toISOString(),
            balanceAfter: newBalance.toFixed(2)
        };
        
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Mostrar éxito
        showAlert(`¡Depósito exitoso! Tu nuevo saldo es ${formatCurrency(newBalance)}`, 'success');
        
        // Actualizar balance en pantalla con animación
        animateBalanceUpdate(currentBalance, newBalance);
        
        // Limpiar formulario
        $('#depositForm')[0].reset();
        $('#depositSummary').slideUp();
        $('.quick-amount').removeClass('btn-primary').addClass('btn-outline');
        
        // Habilitar botón
        btn.prop('disabled', false).html(originalText);
        
        // Opcional: Redireccionar después de un tiempo
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
        
    }, 1500);
});

// Animar actualización del balance
function animateBalanceUpdate(oldBalance, newBalance) {
    const duration = 1000;
    const steps = 30;
    const increment = (newBalance - oldBalance) / steps;
    let currentValue = oldBalance;
    let step = 0;
    
    const interval = setInterval(() => {
        step++;
        currentValue += increment;
        
        if (step >= steps) {
            currentValue = newBalance;
            clearInterval(interval);
        }
        
        $('#currentBalance').text(formatCurrency(currentValue));
    }, duration / steps);
}

// Manejar cierre de sesión
$('#logoutBtn').on('click', function(e) {
    e.preventDefault();
    
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
});

// Validar entrada de números
$('#depositAmount').on('keypress', function(e) {
    // Permitir: backspace, delete, tab, escape, enter, punto decimal
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Permitir: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
    }
    // Asegurar que es un número
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
});