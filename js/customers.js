// GITInvoice — customer management and email marketing
'use strict';
let currentCustomer = null;
// ==================== CUSTOMERS ====================

function loadCustomers() {
    const customers = getCustomers().sort((a, b) => a.name.localeCompare(b.name));
    const container = document.getElementById('customers-container');

    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No customers yet</div>
                <div class="empty-text">Add your first customer to get started</div>
            </div>`;
        return;
    }

    const invoices = getInvoices();
    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Invoices</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(c => {
                    const cInvoices = invoices.filter(inv => inv.customerName === c.name);
                    const revenue = cInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${escapeHtml(c.email) || '—'}</td>
                            <td>${escapeHtml(c.phone) || '—'}</td>
                            <td>${cInvoices.length}</td>
                            <td><strong>${formatCurrency(revenue)}</strong></td>
                            <td>
                                <button class="actions-btn" onclick="viewCustomer('${c.id}')" title="View">👁</button>
                                <button class="actions-btn" onclick="editCustomer('${c.id}')" title="Edit">✏️</button>
                                <button class="actions-btn" onclick="deleteCustomer('${c.id}')" title="Delete">🗑️</button>
                            </td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function filterCustomers() {
    const searchTerm = document.getElementById('customer-search-input').value.toLowerCase();
    let customers = getCustomers();

    if (searchTerm) {
        customers = customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm))
        );
    }

    const container = document.getElementById('customers-container');
    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No customers found</div>
                <div class="empty-text">Try adjusting your search</div>
            </div>`;
        return;
    }

    const invoices = getInvoices();
    customers.sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Invoices</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(c => {
                    const cInvoices = invoices.filter(inv => inv.customerName === c.name);
                    const revenue = cInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                    return `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${escapeHtml(c.email) || '—'}</td>
                            <td>${escapeHtml(c.phone) || '—'}</td>
                            <td>${cInvoices.length}</td>
                            <td><strong>${formatCurrency(revenue)}</strong></td>
                            <td>
                                <button class="actions-btn" onclick="viewCustomer('${c.id}')">👁</button>
                                <button class="actions-btn" onclick="editCustomer('${c.id}')">✏️</button>
                                <button class="actions-btn" onclick="deleteCustomer('${c.id}')">🗑️</button>
                            </td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function openCustomerModal() {
    if (!checkCustomerTrialLimit()) return;
    currentCustomer = null;
    document.getElementById('customer-modal-title').textContent = 'Add New Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal').classList.add('active');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
    currentCustomer = null;
}

function saveCustomer() {
    const name = document.getElementById('customer-form-name').value.trim();
    if (!name) { alert('Customer name is required.'); return; }

    const customer = {
        id: currentCustomer ? currentCustomer.id : generateId(),
        name,
        email: document.getElementById('customer-form-email').value.trim(),
        phone: document.getElementById('customer-form-phone').value.trim(),
        address: document.getElementById('customer-form-address').value.trim(),
        notes: document.getElementById('customer-form-notes').value.trim(),
        createdAt: currentCustomer ? currentCustomer.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const customers = getCustomers();
    if (currentCustomer) {
        const idx = customers.findIndex(c => c.id === currentCustomer.id);
        if (idx !== -1) customers[idx] = customer;
    } else {
        customers.push(customer);
    }

    if (saveCustomers(customers)) {
        closeCustomerModal();
        loadCustomers();
        updateEmailCount();
        renderTrialBanner();
        showToast('Customer saved!');
    }
}

function editCustomer(id) {
    const customer = getCustomers().find(c => c.id === id);
    if (!customer) return;

    currentCustomer = customer;
    document.getElementById('customer-modal-title').textContent = 'Edit Customer';
    document.getElementById('customer-form-name').value = customer.name;
    document.getElementById('customer-form-email').value = customer.email || '';
    document.getElementById('customer-form-phone').value = customer.phone || '';
    document.getElementById('customer-form-address').value = customer.address || '';
    document.getElementById('customer-form-notes').value = customer.notes || '';
    document.getElementById('customer-modal').classList.add('active');
}

function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;
    const filtered = getCustomers().filter(c => c.id !== id);
    if (saveCustomers(filtered)) {
        loadCustomers();
        showToast('Customer deleted.');
    }
}

function viewCustomer(id) {
    const customer = getCustomers().find(c => c.id === id);
    if (!customer) return;

    const invoices = getInvoices().filter(inv => inv.customerName === customer.name);
    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    alert(
        `👤 ${customer.name}\n` +
        `📧 ${customer.email || 'No email'}\n` +
        `📱 ${customer.phone || 'No phone'}\n` +
        `📄 ${invoices.length} invoice(s)\n` +
        `💰 ${formatCurrency(revenue)} total revenue` +
        (customer.notes ? `\n\nNotes: ${customer.notes}` : '')
    );
}

// ==================== EMAIL MARKETING ====================

function updateEmailCount() {
    const count = getCustomers().filter(c => c.email && c.email.trim()).length;
    const el = document.getElementById('email-count');
    if (el) el.textContent = count;
}

function viewEmailList() {
    const settings = getSettings();
    if (!settings.collectEmails) {
        alert('Enable email collection in Settings first.');
        return;
    }

    const customers = getCustomers().filter(c => c.email && c.email.trim());
    const container = document.getElementById('email-list-container');

    if (customers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📧</div>
                <div class="empty-title">No emails collected yet</div>
                <div class="empty-text">Add customers with email addresses to see them here</div>
            </div>`;
    } else {
        container.innerHTML = `
            <table class="invoice-table">
                <thead>
                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Added</th></tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td>${escapeHtml(c.email)}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${formatDate(c.createdAt)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    document.getElementById('email-list-modal').classList.add('active');
}

function closeEmailListModal() {
    document.getElementById('email-list-modal').classList.remove('active');
}

function exportEmailList() {
    const customers = getCustomers().filter(c => c.email && c.email.trim());
    if (customers.length === 0) { alert('No emails to export.'); return; }

    let csv = 'Name,Email,Phone,Address,Added\n';
    customers.forEach(c => {
        const addr = (c.address || '').replace(/\n/g, ' ').replace(/"/g, '""');
        csv += `"${c.name}","${c.email}","${c.phone || ''}","${addr}","${formatDate(c.createdAt)}"\n`;
    });

    downloadFile(csv, `email-list-${today()}.csv`, 'text/csv');
    showToast(`Exported ${customers.length} emails.`);
}
