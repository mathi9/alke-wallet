// Alke Wallet - Transactions Script
// ======================================

let allTransactions = [];
let filteredTransactions = [];
const itemsPerPage = 10;
let currentPage = 1;

// Verificar autenticación al cargar
$(document).ready(function() {
    checkAuthentication();
    loadUserData();
    loadBalance();
    loadTransactions();
    
    // Event listeners para filtros
    $('#filterType').on('change', applyFilters);
    $('#sortOrder').on('change', applyFilters);
    $('#searchTransaction').on('input', debounce(applyFilters, 300));
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

// Cargar saldo
function loadBalance() {
    const balance = parseFloat(localStorage.getItem('balance')) || 10000;
    $('#currentBalance').text(formatCurrency(balance));
}

// Formatear moneda
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Cargar todas las transacciones
function loadTransactions() {
    allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    if (allTransactions.length === 0) {
        // Generar algunas transacciones de ejemplo
        generateSampleTransactions();
        allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }
    
    filteredTransactions = [...allTransactions];
    
    calculateStatistics();
    displayTransactions();
}

// Generar transacciones de ejemplo
function generateSampleTransactions() {
    const sampleTransactions = [
        {
            id: Date.now() - 86400000 * 5,
            type: 'deposit',
            amount: '5000.00',
            description: 'Depósito inicial',
            paymentMethod: 'bank',
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            balanceAfter: '15000.00'
        },
        {
            id: Date.now() - 86400000 * 3,
            type: 'transfer',
            amount: '250.00',
            description: 'Pago de cena',
            recipient: 'María García',
            recipientEmail: 'maria@email.com',
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            balanceAfter: '14750.00'
        },
        {
            id: Date.now() - 86400000 * 2,
            type: 'deposit',
            amount: '1500.00',
            description: 'Freelance - Proyecto web',
            paymentMethod: 'card',
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            balanceAfter: '16250.00'
        }
    ];
    
    localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
}

// Calcular estadísticas
function calculateStatistics() {
    let totalDeposits = 0;
    let totalTransfers = 0;
    
    allTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'deposit') {
            totalDeposits += amount;
        } else if (transaction.type === 'transfer') {
            totalTransfers += amount;
        }
    });
    
    const netBalance = totalDeposits - totalTransfers;
    
    $('#totalTransactions').text(allTransactions.length);
    $('#totalDeposits').text(totalDeposits.toFixed(2));
    $('#totalTransfers').text(totalTransfers.toFixed(2));
    $('#netBalance').text(netBalance.toFixed(2));
    
    // Animar los números
    animateValue('totalTransactions', 0, allTransactions.length, 1000);
}

// Animar valores numéricos
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Aplicar filtros y ordenamiento
function applyFilters() {
    const filterType = $('#filterType').val();
    const sortOrder = $('#sortOrder').val();
    const searchTerm = $('#searchTransaction').val().toLowerCase().trim();
    
    // Filtrar
    filteredTransactions = allTransactions.filter(transaction => {
        // Filtro por tipo
        if (filterType !== 'all' && transaction.type !== filterType) {
            return false;
        }
        
        // Filtro por búsqueda
        if (searchTerm) {
            const searchableText = (
                transaction.description.toLowerCase() +
                (transaction.recipient ? transaction.recipient.toLowerCase() : '')
            );
            return searchableText.includes(searchTerm);
        }
        
        return true;
    });
    
    // Ordenar
    filteredTransactions.sort((a, b) => {
        switch (sortOrder) {
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'highest':
                return parseFloat(b.amount) - parseFloat(a.amount);
            case 'lowest':
                return parseFloat(a.amount) - parseFloat(b.amount);
            default:
                return 0;
        }
    });
    
    currentPage = 1;
    displayTransactions();
}

// Mostrar transacciones
function displayTransactions() {
    const container = $('#transactionsList');
    
    if (filteredTransactions.length === 0) {
        container.html(`
            <div class="text-center py-5 text-muted">
                <i class="fas fa-search fa-3x mb-3 opacity-50"></i>
                <p>No se encontraron transacciones</p>
                <p class="small">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `);
        $('#pagination').addClass('d-none');
        return;
    }
    
    container.empty();
    
    // Paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTransactions.length);
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    pageTransactions.forEach((transaction, index) => {
        const isIncome = transaction.type === 'deposit';
        const iconClass = isIncome ? 'income' : 'expense';
        const amountClass = isIncome ? 'positive' : 'negative';
        const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
        const sign = isIncome ? '+' : '-';
        
        const transactionHtml = `
            <div class="transaction-item" style="animation: slideIn 0.3s ease ${index * 0.05}s both; cursor: pointer;" data-transaction-id="${transaction.id}">
                <div class="d-flex align-items-center flex-grow-1">
                    <div class="transaction-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-name">${transaction.description}</div>
                        <div class="transaction-date">
                            ${formatDate(transaction.date)}
                            ${transaction.recipient ? ` · <i class="fas fa-user text-muted"></i> ${transaction.recipient}` : ''}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="transaction-amount ${amountClass}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </div>
                    <div class="text-end">
                        <small class="text-muted">ID: ${transaction.id}</small>
                    </div>
                </div>
            </div>
        `;
        
        container.append(transactionHtml);
    });
    
    // Event listener para ver detalles
    $('.transaction-item').on('click', function() {
        const transactionId = $(this).data('transaction-id');
        showTransactionDetail(transactionId);
    });
    
    // Mostrar paginación si hay más de una página
    if (filteredTransactions.length > itemsPerPage) {
        renderPagination();
    } else {
        $('#pagination').addClass('d-none');
    }
}

// Renderizar paginación
function renderPagination() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const pagination = $('#pagination');
    
    pagination.empty().removeClass('d-none');
    
    // Botón anterior
    const prevBtn = `
        <button class="btn btn-sm btn-outline ${currentPage === 1 ? 'disabled' : ''}" id="prevPage">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    pagination.append(prevBtn);
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = `
            <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${i}">
                ${i}
            </button>
        `;
        pagination.append(pageBtn);
    }
    
    // Botón siguiente
    const nextBtn = `
        <button class="btn btn-sm btn-outline ${currentPage === totalPages ? 'disabled' : ''}" id="nextPage">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    pagination.append(nextBtn);
    
    // Event listeners
    $('#prevPage').on('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayTransactions();
        }
    });
    
    $('#nextPage').on('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions();
        }
    });
    
    $('[data-page]').on('click', function() {
        currentPage = parseInt($(this).data('page'));
        displayTransactions();
    });
}

// Mostrar detalle de transacción
function showTransactionDetail(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    
    if (!transaction) return;
    
    const isIncome = transaction.type === 'deposit';
    const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
    const iconColor = isIncome ? 'var(--success)' : 'var(--error)';
    const sign = isIncome ? '+' : '-';
    
    const detailHtml = `
        <div class="text-center mb-4">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: ${isIncome ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                <i class="fas ${icon} fa-2x" style="color: ${iconColor};"></i>
            </div>
            <h3 class="font-mono" style="color: ${iconColor};">
                ${sign}${formatCurrency(transaction.amount)}
            </h3>
        </div>
        
        <div class="mb-3">
            <label class="text-secondary small">Tipo de Transacción</label>
            <p class="mb-0">${transaction.type === 'deposit' ? 'Depósito' : 'Transferencia'}</p>
        </div>
        
        <div class="mb-3">
            <label class="text-secondary small">Descripción</label>
            <p class="mb-0">${transaction.description}</p>
        </div>
        
        ${transaction.recipient ? `
            <div class="mb-3">
                <label class="text-secondary small">Destinatario</label>
                <p class="mb-0">${transaction.recipient}</p>
                <p class="text-muted small mb-0">${transaction.recipientEmail}</p>
            </div>
        ` : ''}
        
        ${transaction.paymentMethod ? `
            <div class="mb-3">
                <label class="text-secondary small">Método de Pago</label>
                <p class="mb-0">${getPaymentMethodName(transaction.paymentMethod)}</p>
            </div>
        ` : ''}
        
        <div class="mb-3">
            <label class="text-secondary small">Fecha y Hora</label>
            <p class="mb-0">${new Date(transaction.date).toLocaleString('es-ES')}</p>
        </div>
        
        <div class="mb-3">
            <label class="text-secondary small">ID de Transacción</label>
            <p class="mb-0 font-mono small">${transaction.id}</p>
        </div>
        
        <div class="mb-0">
            <label class="text-secondary small">Saldo Después</label>
            <p class="mb-0 font-mono">${formatCurrency(transaction.balanceAfter)}</p>
        </div>
    `;
    
    $('#transactionDetail').html(detailHtml);
    const modal = new bootstrap.Modal(document.getElementById('transactionDetailModal'));
    modal.show();
}

// Obtener nombre del método de pago
function getPaymentMethodName(method) {
    const methods = {
        'card': 'Tarjeta de Crédito/Débito',
        'bank': 'Transferencia Bancaria',
        'crypto': 'Criptomonedas'
    };
    return methods[method] || method;
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Ayer ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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

// Función debounce para búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar historial
$('#exportBtn').on('click', function() {
    const dataStr = JSON.stringify(allTransactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alke-wallet-transactions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// Manejar cierre de sesión
$('#logoutBtn').on('click', function(e) {
    e.preventDefault();
    
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
});