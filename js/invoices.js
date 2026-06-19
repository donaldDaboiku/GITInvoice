// GITInvoice — invoices, dashboard, line items
'use strict';
let currentInvoice = null;
let currentViewInvoice = null;
// ==================== CUSTOMER AUTOCOMPLETE ====================

function showCustomerSuggestions(query) {
    const suggestionsDiv = document.getElementById('customer-suggestions');
    if (!query || query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    const customers = getCustomers();
    const matches = customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (matches.length === 0) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    suggestionsDiv.innerHTML = `
        <div style="position:absolute;left:0;right:0;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            ${matches.map(c => `
                <div onclick="selectCustomer('${c.id}')"
                     style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);font-size:14px;"
                     onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
                     onmouseleave="this.style.background=''">
                    <strong>${c.name}</strong>
                    ${c.email ? `<span style="color:var(--text-muted);margin-left:8px;font-size:12px;">${c.email}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function selectCustomer(id) {
    const customers = getCustomers();
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-address').value = customer.address || '';
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-suggestions').innerHTML = '';
}

// ==================== INVOICE NUMBER ====================

// peekNextInvoiceNumber — shows what the next number WILL be without committing it.
// The number only gets locked in when saveInvoice() actually saves a new invoice.
function peekNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
    let lastYear = 0, lastCount = 0;
    if (stored) {
        const parts = stored.split(':');
        lastYear  = parseInt(parts[0], 10);
        lastCount = parseInt(parts[1], 10);
    }
    const next = (lastYear === year) ? lastCount + 1 : 1;
    return `INV-${year}-${String(next).padStart(4, '0')}`;
}

// commitNextInvoiceNumber — locks in the counter. Call ONLY when a new invoice is saved.
function commitNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
    let lastYear = 0, lastCount = 0;
    if (stored) {
        const parts = stored.split(':');
        lastYear  = parseInt(parts[0], 10);
        lastCount = parseInt(parts[1], 10);
    }
    const next = (lastYear === year) ? lastCount + 1 : 1;
    localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, `${year}:${next}`);
    return `INV-${year}-${String(next).padStart(4, '0')}`;
}

// generateInvoiceNumber — kept for compatibility, used when opening modal
function generateInvoiceNumber() {
    document.getElementById('invoice-number').value = peekNextInvoiceNumber();
}

// syncCounterToInvoices — call after a backup restore to ensure the counter
// is always ahead of the highest existing invoice number.
function syncCounterToInvoices(invoices) {
    const year = new Date().getFullYear();
    let highest = 0;

    invoices.forEach(inv => {
        if (!inv.number) return;
        // Match format INV-YYYY-NNNN
        const match = inv.number.match(/^INV-(\d{4})-(\d+)$/);
        if (match && parseInt(match[1], 10) === year) {
            highest = Math.max(highest, parseInt(match[2], 10));
        }
    });

    if (highest > 0) {
        const stored = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
        let currentCount = 0;
        if (stored) {
            const parts = stored.split(':');
            if (parseInt(parts[0], 10) === year) currentCount = parseInt(parts[1], 10);
        }
        // Only update if restored data has a higher number
        if (highest > currentCount) {
            localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, `${year}:${highest}`);
        }
    }
}

// ==================== LOAD & DISPLAY INVOICES ====================

function loadInvoices() {
    const invoices = getVisibleInvoices();
    const container = document.getElementById('invoices-container');
    const dashboardContainer = document.getElementById('dashboard-invoices-container');

    if (invoices.length === 0) {
        const emptyHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <div class="empty-title">No invoices yet</div>
                <div class="empty-text">Create your first invoice to get started</div>
            </div>`;
        if (container) container.innerHTML = emptyHTML;
        if (dashboardContainer) dashboardContainer.innerHTML = emptyHTML;
        return;
    }

    const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (container) container.innerHTML = buildInvoiceTable(sorted, true);
    if (dashboardContainer) dashboardContainer.innerHTML = buildInvoiceTable(sorted.slice(0, 5), false);
}

function buildInvoiceTable(invoices, showDueDate) {
    // Desktop: full table. Mobile: card list (CSS swaps via media query)
    return `
        <div class="invoice-list-wrap">
            <!-- Desktop table -->
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        ${showDueDate ? '<th class="col-due">Due</th>' : ''}
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(inv => `
                        <tr>
                            <td><strong>${escapeHtml(inv.number)}</strong></td>
                            <td>${escapeHtml(inv.customerName)}</td>
                            <td class="col-date">${formatDate(inv.date)}</td>
                            ${showDueDate ? `<td class="col-due">${formatDate(inv.dueDate)}</td>` : ''}
                            <td><strong>${formatCurrency(inv.total)}</strong></td>
                            <td>
                                <span class="status-badge ${inv.status}">
                                    ${inv.status === 'paid' ? '✓' : inv.status === 'overdue' ? '⚠' : '⏱'}
                                    ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                </span>
                            </td>
                            <td class="col-actions">
                                <button class="actions-btn" onclick="viewInvoice('${inv.id}')" title="View">👁</button>
                                <button class="actions-btn" onclick="editInvoice('${inv.id}')" title="Edit">✏️</button>
                                <button class="actions-btn" onclick="deleteInvoice('${inv.id}')" title="Delete">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Mobile cards (shown via CSS on small screens) -->
            <div class="invoice-cards">
                ${invoices.map(inv => `
                    <div class="invoice-card-mobile">
                        <div class="icm-top">
                            <div class="icm-number">${escapeHtml(inv.number)}</div>
                            <span class="status-badge ${inv.status}">
                                ${inv.status === 'paid' ? '✓' : inv.status === 'overdue' ? '⚠' : '⏱'}
                                ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                        </div>
                        <div class="icm-customer">${escapeHtml(inv.customerName)}</div>
                        <div class="icm-meta">
                            <span>${formatDate(inv.date)}</span>
                            <strong>${formatCurrency(inv.total)}</strong>
                        </div>
                        <div class="icm-actions">
                            <button class="icm-btn" onclick="viewInvoice('${inv.id}')">👁 View</button>
                            <button class="icm-btn" onclick="editInvoice('${inv.id}')">✏️ Edit</button>
                            <button class="icm-btn icm-btn-danger" onclick="deleteInvoice('${inv.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// ==================== FILTER INVOICES ====================

function filterInvoices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    let invoices = getVisibleInvoices();

    if (searchTerm) {
        invoices = invoices.filter(inv =>
            inv.number.toLowerCase().includes(searchTerm) ||
            inv.customerName.toLowerCase().includes(searchTerm)
        );
    }
    if (statusFilter !== 'all') {
        invoices = invoices.filter(inv => inv.status === statusFilter);
    }

    const container = document.getElementById('invoices-container');
    if (invoices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No invoices found</div>
                <div class="empty-text">Try adjusting your search or filters</div>
            </div>`;
        return;
    }

    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = buildInvoiceTable(invoices, true);
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const invoices = getVisibleInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('total-invoices').textContent = invoices.length;
    document.getElementById('pending-invoices').textContent = pendingCount;
    document.getElementById('overdue-invoices').textContent = overdueCount;

    updateDashboardExtras(invoices);
    loadInvoices();
}

function updateDashboardExtras(invoices) {
    const el = document.getElementById('dashboard-extras');
    if (!el || !canUseInventory()) { if(el) el.innerHTML=''; return; }
    const now = new Date();
    const monthRevenue = invoices.filter(i => {
        const d = new Date(i.date);
        return i.status==='paid' && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }).reduce((s,i) => s+i.total, 0);
    const monthExpenses = getExpenses().filter(e => {
        const d = new Date(e.date);
        return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    }).reduce((s,e) => s+e.amount, 0);
    const monthProfit = monthRevenue - monthExpenses;
    const lowStock = getProducts().filter(p => p.trackStock && p.stockQty <= p.lowStockAlert);
    const pendingQuotes = getQuotes().filter(q => q.status==='pending');
    const pipelineValue = pendingQuotes.reduce((s,q) => s+q.total, 0);
    el.innerHTML = `
        <div class="stats-grid" style="margin-top:0;margin-bottom:8px">
            <div class="stat-card ${monthProfit<0?'stat-card-danger':''}">
                <div class="stat-label">This Month Profit</div>
                <div class="stat-value" style="${monthProfit<0?'color:var(--danger)':''}">${formatCurrency(monthProfit)}</div>
                <div class="stat-change"><span>${formatCurrency(monthRevenue)} rev − ${formatCurrency(monthExpenses)} exp</span></div>
            </div>
            <div class="stat-card ${lowStock.length>0?'stat-card-warning':''}">
                <div class="stat-label">Low Stock Items</div>
                <div class="stat-value" style="${lowStock.length>0?'color:var(--warning,#ffaa00)':''}">${lowStock.length}</div>
                <div class="stat-change"><span>${lowStock.length>0?'Needs restocking':'All stocked'}</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Quote Pipeline</div>
                <div class="stat-value">${formatCurrency(pipelineValue)}</div>
                <div class="stat-change"><span>${pendingQuotes.length} pending quote${pendingQuotes.length!==1?'s':''}</span></div>
            </div>
        </div>
        ${lowStock.length>0?`<div class="low-stock-banner">⚠️ Low stock: ${lowStock.map(p=>'<strong>'+escapeHtml(p.name)+'</strong> ('+p.stockQty+' left)').join(', ')} &nbsp;<button class="btn btn-secondary btn-sm" onclick="navigateToPage('inventory')">View Inventory →</button></div>`:''}`;
}

// ==================== INVOICE MODAL ====================

function openInvoiceModal() {
    // For new invoices, check trial limit before even opening the modal
    if (!checkInvoiceTrialLimit()) return;
    currentInvoice = null;
    document.getElementById('modal-title').textContent = 'Create New Invoice';
    document.getElementById('invoice-form').reset();
    document.getElementById('customer-suggestions').innerHTML = '';

    const ic = document.getElementById('items-container');
    ic.innerHTML = '<div class="item-row">' + buildItemRowHTML() + '</div>';
    ic.querySelector('.remove-item-btn').style.visibility = 'hidden';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    const due = new Date();
    due.setDate(due.getDate() + 30);
    document.getElementById('due-date').value = due.toISOString().split('T')[0];
    generateInvoiceNumber();
    calculateInvoiceTotal();

    document.getElementById('invoice-modal').classList.add('active');
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').classList.remove('active');
    currentInvoice = null;
}

// ==================== SAVE INVOICE ====================

function saveInvoice() {
    if (currentInvoice && !canAccessInvoice(currentInvoice)) {
        showToast('You can only edit your own invoices.', 'error');
        return;
    }

    const number = document.getElementById('invoice-number').value.trim();
    const status = document.getElementById('invoice-status').value;
    const date = document.getElementById('invoice-date').value;
    const dueDate = document.getElementById('due-date').value;
    const customerName = document.getElementById('customer-name').value.trim();
    const customerAddress = document.getElementById('customer-address').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('invoice-notes').value.trim();

    if (!number || !date || !dueDate || !customerName) {
        alert('Please fill in all required fields (Invoice #, Date, Due Date, Customer Name).');
        return;
    }

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const description = row.querySelector('.item-description').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (description && quantity > 0 && price >= 0) {
            items.push({ description, quantity, price, total: quantity * price });
        }
    });

    if (items.length === 0) {
        alert('Please add at least one item with a description and price.');
        return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const settings = getSettings();
    const taxRate = (settings.taxRate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const session = getSession();
    const invoice = {
        id: currentInvoice ? currentInvoice.id : generateId(),
        number: currentInvoice ? number : commitNextInvoiceNumber(),
        status, date, dueDate,
        customerName, customerAddress, customerEmail, customerPhone,
        items, subtotal, tax, total, notes,
        createdBy:     currentInvoice ? currentInvoice.createdBy     : (session ? session.username : 'owner'),
        createdByRole: currentInvoice ? currentInvoice.createdByRole : (session ? session.role     : 'owner'),
        createdAt: currentInvoice ? currentInvoice.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const invoices = getInvoices();
    if (currentInvoice) {
        const idx = invoices.findIndex(inv => inv.id === currentInvoice.id);
        if (idx !== -1) invoices[idx] = invoice;
    } else {
        invoices.push(invoice);
    }

    if (saveInvoices(invoices)) {
        // Auto-sync customer to Customer Management
        syncCustomerFromInvoice({ customerName, customerAddress, customerEmail, customerPhone });
        if (invoice.status === 'paid') deductStockForInvoice(invoice);
        closeInvoiceModal();
        loadInvoices();
        updateDashboard();
        renderTrialBanner();
        showToast('Invoice saved successfully!');
        trackInvoiceSave();
    }
}

// ==================== AUTO-SYNC CUSTOMER FROM INVOICE ====================
// When an invoice is saved, automatically create or update the customer record.
// - New customer name → creates a new customer entry silently
// - Existing customer name (exact match) → updates their address/email/phone
//   only if the invoice fields are non-empty (never blanks out existing data)

function syncCustomerFromInvoice({ customerName, customerAddress, customerEmail, customerPhone }) {
    if (!customerName) return;

    const customers = getCustomers();
    const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());

    if (existing) {
        // Update contact details only if the invoice provided them
        let changed = false;
        if (customerAddress && customerAddress !== existing.address) { existing.address = customerAddress; changed = true; }
        if (customerEmail   && customerEmail   !== existing.email)   { existing.email   = customerEmail;   changed = true; }
        if (customerPhone   && customerPhone   !== existing.phone)   { existing.phone   = customerPhone;   changed = true; }
        if (changed) {
            existing.updatedAt = new Date().toISOString();
            saveCustomers(customers);
        }
    } else {
        // Brand new customer — create silently
        const newCustomer = {
            id: generateId(),
            name: customerName,
            address: customerAddress || '',
            email: customerEmail || '',
            phone: customerPhone || '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        customers.push(newCustomer);
        saveCustomers(customers);
    }

    updateEmailCount();
}

// ==================== EDIT / DELETE / VIEW INVOICE ====================

function editInvoice(id) {
    const invoice = getInvoices().find(inv => inv.id === id);
    if (!invoice) return;
    if (!canAccessInvoice(invoice)) {
        showToast('You can only edit your own invoices.', 'error');
        return;
    }

    currentInvoice = invoice;
    document.getElementById('modal-title').textContent = 'Edit Invoice';
    document.getElementById('invoice-number').value = invoice.number;
    document.getElementById('invoice-status').value = invoice.status;
    document.getElementById('invoice-date').value = invoice.date;
    document.getElementById('due-date').value = invoice.dueDate;
    document.getElementById('customer-name').value = invoice.customerName;
    document.getElementById('customer-address').value = invoice.customerAddress || '';
    document.getElementById('customer-email').value = invoice.customerEmail || '';
    document.getElementById('customer-phone').value = invoice.customerPhone || '';
    document.getElementById('invoice-notes').value = invoice.notes || '';
    document.getElementById('customer-suggestions').innerHTML = '';

    const itemsContainer = document.getElementById('items-container');
    itemsContainer.innerHTML = '';
    invoice.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="form-group">
                <input type="text" class="form-input item-description" value="${escapeHtml(item.description)}" placeholder="Description" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-quantity" min="1" value="${item.quantity}" placeholder="Qty" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-price" step="0.01" min="0" value="${item.price}" placeholder="Price" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-total" value="${item.total.toFixed(2)}" placeholder="Total" readonly>
            </div>
            <button type="button" class="remove-item-btn" onclick="removeItem(this)" ${index === 0 ? 'style="visibility:hidden;"' : ''}>×</button>`;
        itemsContainer.appendChild(row);
    });

    calculateInvoiceTotal();
    document.getElementById('invoice-modal').classList.add('active');
}

function deleteInvoice(id) {
    const invoice = getInvoices().find(inv => inv.id === id);
    if (!invoice) return;
    if (!canAccessInvoice(invoice)) {
        showToast('You can only delete your own invoices.', 'error');
        return;
    }
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    const filtered = getInvoices().filter(inv => inv.id !== id);
    if (saveInvoices(filtered)) {
        loadInvoices();
        updateDashboard();
        showToast('Invoice deleted.');
    }
}

function viewInvoice(id) {
    const invoice = getInvoices().find(inv => inv.id === id);
    if (!invoice) return;
    if (!canAccessInvoice(invoice)) {
        showToast('You can only view your own invoices.', 'error');
        return;
    }

    currentViewInvoice = invoice;
    generateInvoicePreview(invoice);
    const editBtn = document.getElementById('view-modal-edit-btn');
    if (editBtn) editBtn.style.display = canAccessInvoice(invoice) ? '' : 'none';
    document.getElementById('view-invoice-modal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('view-invoice-modal').classList.remove('active');
    currentViewInvoice = null;
}

function editCurrentInvoice() {
    if (currentViewInvoice) {
        closeViewModal();
        editInvoice(currentViewInvoice.id);
    }
}

// ==================== INVOICE PREVIEW ====================

function generateInvoicePreview(invoice) {
    const settings = getSettings();
    const logo = getLogo();
    const isPaid = invoice.status === 'paid';
    const docType = isPaid ? 'RECEIPT' : 'INVOICE';
    const docTitle = isPaid ? 'Payment Receipt' : 'Invoice';
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const invoiceNumber = invoice.number || '—';
    const customerName = invoice.customerName || 'Walk-in Customer';
    const taxRate = Number(settings.taxRate) || 0;

    const html = `
        <div class="invoice-preview-header">
            <div class="company-info">
                ${logo ? `<img src="${logo}" alt="Logo" class="company-logo">` : ''}
                <h2>${escapeHtml(settings.companyName || 'Your Company Name')}</h2>
                <p>${settings.companyAddress ? escapeHtml(settings.companyAddress).replace(/\n/g, '<br>') : 'Company Address'}</p>
                ${settings.companyEmail ? `<p>Email: ${escapeHtml(settings.companyEmail)}</p>` : ''}
                ${settings.companyPhone ? `<p>Phone: ${escapeHtml(settings.companyPhone)}</p>` : ''}
            </div>
            <div class="invoice-details">
                <div style="font-size:24px;font-weight:700;color:${isPaid ? '#00ba88' : '#000'}">${docType}</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:16px;">${escapeHtml(invoiceNumber)}</div>
                ${isPaid ? `<p style="color:#00ba88;font-weight:600;">✓ PAID</p>` : ''}
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                ${!isPaid ? `<p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
            </div>
        </div>

        <div class="invoice-preview-parties">
            <div class="party-section">
                <h3>${isPaid ? 'Received From:' : 'Bill To:'}</h3>
                <div class="party-details">
                    <strong>${escapeHtml(customerName)}</strong><br>
                    ${invoice.customerAddress ? escapeHtml(invoice.customerAddress).replace(/\n/g, '<br>') + '<br>' : ''}
                    ${invoice.customerEmail ? `Email: ${escapeHtml(invoice.customerEmail)}<br>` : ''}
                    ${invoice.customerPhone ? `Phone: ${escapeHtml(invoice.customerPhone)}` : ''}
                </div>
            </div>
            <div class="party-section">
                <h3>${isPaid ? 'Received By:' : 'From:'}</h3>
                <div class="party-details">
                    <strong>${escapeHtml(settings.companyName || 'Your Company Name')}</strong><br>
                    ${settings.companyAddress ? escapeHtml(settings.companyAddress).replace(/\n/g, '<br>') + '<br>' : ''}
                    ${settings.companyEmail ? `Email: ${escapeHtml(settings.companyEmail)}<br>` : ''}
                    ${settings.companyPhone ? `Phone: ${escapeHtml(settings.companyPhone)}` : ''}
                </div>
            </div>
        </div>

        ${isPaid ? '<p style="text-align:center;color:#00ba88;font-weight:600;margin-bottom:24px;">Payment received in full. Thank you for your business!</p>' : ''}

        <table class="invoice-preview-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.description || 'Item')}</td>
                        <td class="text-right">${Number(item.quantity) || 0}</td>
                        <td class="text-right">${formatCurrency(item.price)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <div class="invoice-preview-summary">
            <div class="summary-row" style="color:#000;"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
            <div class="summary-row" style="color:#000;"><span>Tax (${taxRate}%):</span><span>${formatCurrency(invoice.tax)}</span></div>
            <div class="summary-row total" style="color:#000;">
                <span>${isPaid ? 'Amount Paid:' : 'Total Due:'}</span>
                <span>${formatCurrency(invoice.total)}</span>
            </div>
        </div>

        ${invoice.notes ? `
            <div style="margin-top:40px;">
                <h3 style="font-size:13px;text-transform:uppercase;color:#666;margin-bottom:10px;">Notes:</h3>
                <p style="line-height:1.8;">${escapeHtml(invoice.notes).replace(/\n/g, '<br>')}</p>
            </div>` : ''}

        ${!isPaid && (settings.bankName || settings.accountName || settings.accountNumber) ? `
            <div class="invoice-preview-footer">
                <div class="bank-details">
                    <h3>Payment Details:</h3>
                    ${settings.bankName ? `<p><strong>Bank:</strong> ${escapeHtml(settings.bankName)}</p>` : ''}
                    ${settings.accountName ? `<p><strong>Account Name:</strong> ${escapeHtml(settings.accountName)}</p>` : ''}
                    ${settings.accountNumber ? `<p><strong>Account Number:</strong> ${escapeHtml(settings.accountNumber)}</p>` : ''}
                    ${settings.routingNumber ? `<p><strong>Routing/Sort Code:</strong> ${escapeHtml(settings.routingNumber)}</p>` : ''}
                    ${settings.swiftCode ? `<p><strong>SWIFT/BIC:</strong> ${escapeHtml(settings.swiftCode)}</p>` : ''}
                    ${settings.iban ? `<p><strong>IBAN:</strong> ${escapeHtml(settings.iban)}</p>` : ''}
                </div>
            </div>` : ''}

        <div class="invoice-print-reference">Reference: gitsystem</div>
    `;

    document.getElementById('invoice-preview-container').innerHTML = html;
    document.getElementById('view-modal-title').textContent = docTitle;
}

function printInvoice() {
    window.print();
}

// ==================== ITEMS ====================

function addItem() {
    const container = document.getElementById('items-container');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = buildItemRowHTML();
    container.appendChild(row);
    syncRemoveBtns(container);
}

function removeItem(button) {
    const container = button.closest('#items-container') || button.closest('#quote-items-container') || document.getElementById('items-container');
    if (container.children.length > 1) {
        button.closest('.item-row').remove();
        syncRemoveBtns(container);
        if (container.id === 'quote-items-container') calculateQuoteTotal();
        else calculateInvoiceTotal();
    }
}

function calculateItemTotal(row) {
    const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    row.querySelector('.item-total').value = (qty * price).toFixed(2);
}

function calculateInvoiceTotal() {
    const settings = getSettings();
    const taxRate = (settings.taxRate || 0) / 100;
    let subtotal = 0;

    document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const sym = getCurrencySymbol();

    document.getElementById('subtotal').textContent = `${sym}${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `${sym}${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `${sym}${total.toFixed(2)}`;

    const taxLabel = document.getElementById('tax-label');
    if (taxLabel) taxLabel.textContent = `Tax (${settings.taxRate || 0}%):`;
}

function convertQuoteToInvoice(quoteId) {
    const q = getQuotes().find(x => x.id === quoteId); if (!q) return;
    if (!checkInvoiceTrialLimit()) return;
    const taxRate = (getSettings().taxRate||0)/100;
    const subtotal = q.items.reduce((s,i) => s+i.total, 0);
    const due = new Date(); due.setDate(due.getDate()+30);
    const invoice = {
        id: generateId(), number: commitNextInvoiceNumber(), status: 'pending',
        date: today(), dueDate: due.toISOString().split('T')[0],
        customerName: q.customerName, customerEmail: q.customerEmail||'',
        customerPhone: q.customerPhone||'', customerAddress: '',
        items: q.items, subtotal, tax: subtotal*taxRate, total: subtotal+(subtotal*taxRate),
        notes: q.notes||'', convertedFromQuote: quoteId,
        createdBy: getSession()?.username||'owner', createdByRole: getSession()?.role||'owner',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    const invoices = getInvoices(); invoices.push(invoice);
    if (saveInvoices(invoices)) { updateQuoteStatus(quoteId, 'accepted'); showToast('Quote converted to invoice!'); navigateToPage('invoices'); }
}
