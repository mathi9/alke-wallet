// Alke Wallet - Send Money Script
// ======================================

let selectedContactData = null;

// Verificar autenticación al cargar
$(document).ready(function() {
    checkAuthentication();
    loadUserData();
    loadBalance();
    loadContacts();
    initializeAutocomplete();
    
    // Actualizar resumen cuando cambie el monto
    $('#sendAmount').on('input', updateSummary);
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
    $('#availableBalance').text(formatCurrency(balance));
}

// Formatear moneda
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Función para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = $('#sendAlert');
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    alertDiv.removeClass('d-none alert-success alert-error')
        .addClass(`alert alert-${type}`)
        .html(`<i class="fas ${iconClass}"></i> ${message}`)
        .fadeIn();
    
    setTimeout(() => {
        alertDiv.fadeOut(() => alertDiv.addClass('d-none'));
    }, 4000);
}

// Cargar contactos
function loadContacts() {
    const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    
    // Agregar algunos contactos de ejemplo si no hay ninguno
    if (contacts.length === 0) {
        const defaultContacts = [
            { id: 1, name: 'María García', email: 'maria@email.com', phone: '+1234567890' },
            { id: 2, name: 'Juan Pérez', email: 'juan@email.com', phone: '+1234567891' },
            { id: 3, name: 'Ana Martínez', email: 'ana@email.com', phone: '+1234567892' }
        ];
        localStorage.setItem('contacts', JSON.stringify(defaultContacts));
        displayContacts(defaultContacts);
    } else {
        displayContacts(contacts);
    }
}

// Mostrar contactos en la lista
function displayContacts(contacts) {
    const container = $('#contactsList');
    
    if (contacts.length === 0) {
        container.html(`
            <div class="text-center py-4 text-muted">
                <i class="fas fa-users fa-2x mb-3 opacity-50"></i>
                <p>No tienes contactos guardados</p>
                <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#addContactModal">
                    Agregar Contacto
                </button>
            </div>
        `);
        return;
    }
    
    container.empty();
    
    contacts.forEach(contact => {
        const contactHtml = `
            <div class="transaction-item contact-item mb-2" data-contact-id="${contact.id}">
                <div class="d-flex align-items-center flex-grow-1">
                    <div class="transaction-icon" style="background: rgba(99, 102, 241, 0.2); color: var(--secondary);">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-name">${contact.name}</div>
                        <div class="transaction-date">${contact.email}</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary select-contact-btn" data-contact='${JSON.stringify(contact)}'>
                    Enviar
                </button>
            </div>
        `;
        container.append(contactHtml);
    });
    
    // Event listeners para seleccionar contacto
    $('.select-contact-btn').on('click', function() {
        const contact = JSON.parse($(this).attr('data-contact'));
        selectContact(contact);
    });
}

// Inicializar autocomplete con jQuery UI
function initializeAutocomplete() {
    const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    const contactNames = contacts.map(c => ({
        label: `${c.name} (${c.email})`,
        value: c.name,
        data: c
    }));
    
    $('#searchContact').autocomplete({
        source: contactNames,
        minLength: 1,
        select: function(event, ui) {
            selectContact(ui.item.data);
            return false;
        }
    }).data('ui-autocomplete')._renderItem = function(ul, item) {
        return $('<li>')
            .append(`<div style="padding: 10px;"><strong>${item.data.name}</strong><br><small style="color: var(--text-muted);">${item.data.email}</small></div>`)
            .appendTo(ul);
    };
}

// Seleccionar contacto
function selectContact(contact) {
    selectedContactData = contact;
    
    $('#contactName').text(contact.name);
    $('#contactEmail').text(contact.email);
    $('#selectedContact').removeClass('d-none').hide().slideDown();
    $('#searchContact').val('').prop('disabled', true);
    
    updateSummary();
}

// Limpiar selección de contacto
$('#clearContact').on('click', function() {
    selectedContactData = null;
    $('#selectedContact').slideUp(() => {
        $('#selectedContact').addClass('d-none');
    });
    $('#searchContact').prop('disabled', false).focus();
    $('#sendSummary').slideUp();
});

// Actualizar resumen
function updateSummary() {
    const amount = parseFloat($('#sendAmount').val()) || 0;
    
    if (amount > 0 && selectedContactData) {
        $('#summaryRecipient').text(selectedContactData.name);
        $('#summaryAmount').text(formatCurrency(amount));
        $('#summaryTotal').text(formatCurrency(amount));
        $('#sendSummary').removeClass('d-none').hide().slideDown();
    } else {
        $('#sendSummary').slideUp();
    }
}

// Guardar nuevo contacto
$('#saveContactBtn').on('click', function() {
    const name = $('#contactName').val().trim();
    const email = $('#contactEmail').val().trim();
    const phone = $('#contactPhone').val().trim();
    
    if (!name || !email) {
        alert('Por favor completa los campos requeridos');
        return;
    }
    
    const contacts = JSON.parse(localStorage.getItem('contacts')) || [];
    const newContact = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone
    };
    
    contacts.push(newContact);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
    modal.hide();
    $('#addContactForm')[0].reset();
    
    // Recargar contactos
    loadContacts();
    initializeAutocomplete();
    
    showAlert('Contacto agregado exitosamente', 'success');
});

// Enviar dinero
$('#sendMoneyForm').on('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat($('#sendAmount').val());
    const description = $('#sendDescription').val().trim();
    const balance = parseFloat(localStorage.getItem('balance')) || 10000;
    
    // Validaciones
    if (!selectedContactData) {
        showAlert('Por favor selecciona un contacto', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showAlert('Por favor ingresa una cantidad válida', 'error');
        return;
    }
    
    if (amount > balance) {
        showAlert('Saldo insuficiente para realizar esta transferencia', 'error');
        return;
    }
    
    if (!description) {
        showAlert('Por favor ingresa un concepto', 'error');
        return;
    }
    
    // Deshabilitar botón
    const btn = $('#sendBtn');
    const originalText = btn.html();
    btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Procesando...');
    
    // Simular procesamiento
    setTimeout(() => {
        // Actualizar saldo
        const newBalance = balance - amount;
        localStorage.setItem('balance', newBalance.toFixed(2));
        
        // Guardar transacción
        const transaction = {
            id: Date.now(),
            type: 'transfer',
            amount: amount.toFixed(2),
            description: description,
            recipient: selectedContactData.name,
            recipientEmail: selectedContactData.email,
            date: new Date().toISOString(),
            balanceAfter: newBalance.toFixed(2)
        };
        
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Mostrar éxito
        showAlert(`¡Transferencia exitosa! Enviaste ${formatCurrency(amount)} a ${selectedContactData.name}`, 'success');
        
        // Limpiar formulario
        $('#sendMoneyForm')[0].reset();
        $('#clearContact').click();
        $('#sendSummary').slideUp();
        
        // Actualizar balance
        loadBalance();
        
        // Habilitar botón
        btn.prop('disabled', false).html(originalText);
        
        // Redireccionar después de un tiempo
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
        
    }, 1500);
});

// Manejar cierre de sesión
$('#logoutBtn').on('click', function(e) {
    e.preventDefault();
    
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
});

// Validar entrada de números
$('#sendAmount').on('keypress', function(e) {
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
});