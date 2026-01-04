// Alke Wallet - Menu/Dashboard Script
// ======================================

// Verificar autenticación al cargar la página
$(document).ready(function() {
    checkAuthentication();
    loadUserData();
    loadBalance();
    loadRecentTransactions();
    calculateMonthlyStats();
    
    // Animar el balance al cargar
    animateBalance();
});

// Verificar si el usuario está autenticado
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

// Cargar saldo desde localStorage
function loadBalance() {
    let balance = parseFloat(localStorage.getItem('balance')) || 10000;
    localStorage.setItem('balance', balance.toFixed(2));
    
    const formattedBalance = formatCurrency(balance);
    $('#balanceAmount').text(formattedBalance);
}

// Animar el balance con efecto de conteo
function animateBalance() {
    const balance = parseFloat(localStorage.getItem('balance')) || 10000;
    const duration = 1500;
    const steps = 50;
    const stepValue = balance / steps;
    let currentValue = 0;
    
    const interval = setInterval(() => {
        currentValue += stepValue;
        if (currentValue >= balance) {
            currentValue = balance;
            clearInterval(interval);
        }
        $('#balanceAmount').text(formatCurrency(currentValue));
    }, duration / steps);
}

// Formatear moneda
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Cargar transacciones recientes (últimas 3)
function loadRecentTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    if (transactions.length === 0) {
        return; // Mostrar mensaje por defecto
    }
    
    const recentTransactions = transactions.slice(-3).reverse();
    const container = $('#recentTransactions');
    
    container.empty();
    
    recentTransactions.forEach((transaction, index) => {
        const isIncome = transaction.type === 'deposit' || transaction.type === 'income';
        const iconClass = isIncome ? 'income' : 'expense';
        const amountClass = isIncome ? 'positive' : 'negative';
        const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
        const sign = isIncome ? '+' : '-';
        
        const transactionHtml = `
            <div class="transaction-item" style="animation: slideIn 0.3s ease ${index * 0.1}s both;">
                <div class="d-flex align-items-center flex-grow-1">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-name">${transaction.description}</div>
                        <div class="transaction-date">${formatDate(transaction.date)}</div>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${sign}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
        
        container.append(transactionHtml);
    });
}

// Calcular estadísticas mensuales
function calculateMonthlyStats() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
            
            if (transaction.type === 'deposit' || transaction.type === 'income') {
                income += parseFloat(transaction.amount);
            } else {
                expenses += parseFloat(transaction.amount);
            }
        }
    });
    
    $('#monthlyIncome').text(income.toFixed(2));
    $('#monthlyExpenses').text(expenses.toFixed(2));
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy';
    } else if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
        });
    }
}

// Manejar cierre de sesión
$('#logoutBtn').on('click', function(e) {
    e.preventDefault();
    
    // Confirmar cierre de sesión
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        // Limpiar sesión
        sessionStorage.clear();
        
        // Redireccionar a login
        window.location.href = 'login.html';
    }
});

// Actualizar datos cada 5 segundos
setInterval(() => {
    loadBalance();
    loadRecentTransactions();
    calculateMonthlyStats();
}, 5000);