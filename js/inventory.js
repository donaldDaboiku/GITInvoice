// GITInvoice — products, expenses, quotes, catalogue
'use strict';
// ==================== PRODUCTS / INVENTORY ====================
let currentProduct = null;

function loadInventory() {
    if (!canUseInventory()) { requireTierFeature('Inventory Management'); return; }
    const products = getProducts();
    const lowStock = products.filter(p => p.trackStock && p.stockQty <= p.lowStockAlert);
    const totalValue = products.reduce((s,p) => s + (p.trackStock ? (p.stockQty||0)*(p.costPrice||0) : 0), 0);
    const cont = document.querySelector('#inventory-page .content');
    if (!cont) return;
    const alert = lowStock.length > 0
        ? `<div class="low-stock-banner">⚠️ ${lowStock.length} item${lowStock.length>1?'s':''} low on stock: ${lowStock.map(p=>'<strong>'+escapeHtml(p.name)+'</strong>').join(', ')}</div>` : '';
    cont.innerHTML = alert + `
        <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${products.length}</div></div>
            <div class="stat-card"><div class="stat-label">Low Stock</div><div class="stat-value" style="${lowStock.length>0?'color:var(--danger)':''}">${lowStock.length}</div></div>
            <div class="stat-card"><div class="stat-label">Inventory Value</div><div class="stat-value">${formatCurrency(totalValue)}</div></div>
        </div>
        <div class="section-header"><div class="section-title">Product Catalogue</div><button class="btn btn-primary" onclick="openProductModal()">+ Add Product</button></div>
        ` + (products.length === 0
            ? `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">No products yet</div><div class="empty-sub">Add products so you can pick them when creating invoices and track stock levels.</div><button class="btn btn-primary" onclick="openProductModal()">+ Add First Product</button></div>`
            : `<table class="invoice-table"><thead><tr><th>Product</th><th>SKU</th><th>Sell Price</th><th>Cost</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>` +
            products.map(p => {
                const st = !p.trackStock ? '<span class="inv-badge">Service</span>'
                    : p.stockQty <= 0 ? '<span class="inv-badge inv-danger">Out of stock</span>'
                    : p.stockQty <= p.lowStockAlert ? '<span class="inv-badge inv-warning">Low stock</span>'
                    : '<span class="inv-badge inv-success">In stock</span>';
                return `<tr><td><strong>${escapeHtml(p.name)}</strong>${p.description?'<br><small style="color:var(--text-muted)">'+escapeHtml(p.description)+'</small>':''}</td>
                    <td><code>${escapeHtml(p.sku||'—')}</code></td>
                    <td>${formatCurrency(p.sellPrice||0)}</td>
                    <td>${p.costPrice ? formatCurrency(p.costPrice) : '—'}</td>
                    <td>${p.trackStock ? '<strong>'+p.stockQty+'</strong> units' : '—'}</td>
                    <td>${st}</td>
                    <td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="openProductModal('${p.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`;
            }).join('') + `</tbody></table>`);
}

function openProductModal(id = null) {
    currentProduct = id ? getProducts().find(p => p.id === id) : null;
    const m = document.getElementById('product-modal');
    if (!m) return;
    document.getElementById('product-modal-title').textContent = currentProduct ? 'Edit Product' : 'Add Product';
    document.getElementById('product-name').value = currentProduct?.name || '';
    document.getElementById('product-sku').value = currentProduct?.sku || '';
    document.getElementById('product-description').value = currentProduct?.description || '';
    document.getElementById('product-sell-price').value = currentProduct?.sellPrice || '';
    document.getElementById('product-cost-price').value = currentProduct?.costPrice || '';
    document.getElementById('product-track-stock').checked = currentProduct?.trackStock ?? true;
    document.getElementById('product-stock-qty').value = currentProduct?.stockQty ?? 0;
    document.getElementById('product-low-stock-alert').value = currentProduct?.lowStockAlert ?? 5;
    toggleStockFields();
    m.classList.add('active');
}
function closeProductModal() { document.getElementById('product-modal').classList.remove('active'); currentProduct = null; }
function toggleStockFields() {
    document.getElementById('stock-fields').style.display = document.getElementById('product-track-stock').checked ? '' : 'none';
}
function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const sellPrice = parseFloat(document.getElementById('product-sell-price').value);
    if (!name || isNaN(sellPrice)) { showToast('Product name and sell price are required.', 'error'); return; }
    const trackStock = document.getElementById('product-track-stock').checked;
    const p = {
        id: currentProduct ? currentProduct.id : generateId(),
        name, sku: document.getElementById('product-sku').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        sellPrice, costPrice: parseFloat(document.getElementById('product-cost-price').value) || 0,
        trackStock, stockQty: trackStock ? parseInt(document.getElementById('product-stock-qty').value)||0 : null,
        lowStockAlert: trackStock ? parseInt(document.getElementById('product-low-stock-alert').value)||5 : null,
        createdAt: currentProduct ? currentProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const products = getProducts();
    if (currentProduct) { const i = products.findIndex(x => x.id === p.id); if (i !== -1) products[i] = p; }
    else products.push(p);
    if (saveProducts(products)) { closeProductModal(); loadInventory(); showToast('Product saved!'); }
}
function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    saveProducts(getProducts().filter(p => p.id !== id));
    loadInventory(); showToast('Product deleted.');
}
function deductStockForInvoice(invoice) {
    if (!canUseInventory()) return;
    const products = getProducts(); let changed = false;
    invoice.items.forEach(item => {
        const m = products.find(p => p.trackStock && p.name.toLowerCase() === item.description.toLowerCase());
        if (m) { m.stockQty = Math.max(0, (m.stockQty||0) - item.quantity); changed = true; }
    });
    if (changed) saveProducts(products);
}
// ==================== PRODUCT CATALOGUE PICKER MODAL ====================
let _pickerTargetContainer = null; // 'invoice' or 'quote'
let _pickerSearchTerm = '';

function openCataloguePicker(targetContainer) {
    if (!canUseInventory()) { requireTierFeature('Product Catalogue'); return; }
    const products = getProducts();
    if (products.length === 0) {
        showToast('No products yet — add them in Inventory first.', 'info');
        return;
    }
    _pickerTargetContainer = targetContainer;
    _pickerSearchTerm = '';
    renderPickerProducts('');
    document.getElementById('catalogue-picker-modal').classList.add('active');
    setTimeout(() => document.getElementById('catalogue-picker-search').focus(), 100);
}

function closeCataloguePicker() {
    document.getElementById('catalogue-picker-modal').classList.remove('active');
    _pickerTargetContainer = null;
}

function renderPickerProducts(searchTerm) {
    const products = getProducts();
    const filtered = searchTerm.trim()
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
        : products;
    const grid = document.getElementById('catalogue-picker-grid');
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">No products match "${escapeHtml(searchTerm)}"</div>`;
        return;
    }
    grid.innerHTML = filtered.map(p => {
        const stockInfo = p.trackStock
            ? (p.stockQty <= 0 ? '<span class="inv-badge inv-danger">Out of stock</span>'
               : p.stockQty <= p.lowStockAlert ? `<span class="inv-badge inv-warning">${p.stockQty} left</span>`
               : `<span class="inv-badge inv-success">${p.stockQty} in stock</span>`)
            : '<span class="inv-badge">Service</span>';
        return `<div class="picker-product-card" onclick="selectFromCatalogue('${p.id}')">
            <div class="picker-product-name">${escapeHtml(p.name)}</div>
            ${p.sku ? `<div class="picker-product-sku">${escapeHtml(p.sku)}</div>` : ''}
            <div class="picker-product-price">${formatCurrency(p.sellPrice)}</div>
            <div style="margin-top:6px">${stockInfo}</div>
        </div>`;
    }).join('');
}

function selectFromCatalogue(productId) {
    const p = getProducts().find(x => x.id === productId);
    if (!p) return;
    const containerId = _pickerTargetContainer === 'quote' ? 'quote-items-container' : 'items-container';
    const container = document.getElementById(containerId);
    // Check if last row is empty — fill it, otherwise add new row
    const rows = container.querySelectorAll('.item-row');
    const lastRow = rows[rows.length - 1];
    const lastDesc = lastRow?.querySelector('.item-description');
    const targetRow = (lastDesc && lastDesc.value.trim() === '') ? lastRow : null;
    if (targetRow) {
        targetRow.querySelector('.item-description').value = p.name;
        targetRow.querySelector('.item-price').value = p.sellPrice;
        targetRow.querySelector('.item-quantity').value = 1;
        calculateItemTotal(targetRow);
    } else {
        // Add a new row with the product filled in
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = buildItemRowHTML(p.name, 1, p.sellPrice, p.sellPrice);
        container.appendChild(row);
        syncRemoveBtns(container);
    }
    if (_pickerTargetContainer === 'quote') calculateQuoteTotal();
    else calculateInvoiceTotal();
    closeCataloguePicker();
    showToast(p.name + ' added to items.');
}

function buildItemRowHTML(description='', quantity=1, price='', total='') {
    return `<div class="form-group" style="position:relative">
            <input type="text" class="form-input item-description" placeholder="Description" value="${escapeHtml(String(description))}" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-quantity" placeholder="Qty" min="1" value="${quantity}" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" value="${price}">
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-total" placeholder="Total" readonly value="${total}">
        </div>
        <button type="button" class="remove-item-btn" onclick="removeItem(this)">×</button>`;
}

function syncRemoveBtns(container) {
    const rows = container.querySelectorAll('.item-row');
    rows.forEach((r, i) => {
        const btn = r.querySelector('.remove-item-btn');
        if (btn) btn.style.visibility = (i === 0 && rows.length === 1) ? 'hidden' : 'visible';
    });
}

// Legacy function kept for compatibility — now just opens the modal
function showProductPicker(rowEl) { openCataloguePicker('invoice'); }
function selectProductForRow(el, productId) { selectFromCatalogue(productId); }

// ==================== EXPENSES ====================
let currentExpense = null;

function loadExpenses() {
    if (!canUseExpenses()) { requireTierFeature('Expense Tracking'); return; }
    const expenses = getExpenses();
    const now = new Date();
    const thisMonth = expenses.filter(e => { const d = new Date(e.date); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); });
    const totalMonth = thisMonth.reduce((s,e) => s+e.amount, 0);
    const totalAll = expenses.reduce((s,e) => s+e.amount, 0);
    const byCat = {}; expenses.forEach(e => { byCat[e.category] = (byCat[e.category]||0)+e.amount; });
    const topCat = Object.entries(byCat).sort((a,b) => b[1]-a[1])[0];
    const cont = document.querySelector('#expenses-page .content'); if (!cont) return;
    cont.innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card"><div class="stat-label">This Month</div><div class="stat-value">${formatCurrency(totalMonth)}</div></div>
            <div class="stat-card"><div class="stat-label">All Time</div><div class="stat-value">${formatCurrency(totalAll)}</div></div>
            <div class="stat-card"><div class="stat-label">Top Category</div><div class="stat-value" style="font-size:18px">${topCat?topCat[0]:'—'}</div></div>
        </div>
        <div class="section-header"><div class="section-title">Expense Log</div><button class="btn btn-primary" onclick="openExpenseModal()">+ Log Expense</button></div>
        ` + (expenses.length === 0
            ? `<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">No expenses logged</div><div class="empty-sub">Track costs to see your real profit margins.</div><button class="btn btn-primary" onclick="openExpenseModal()">+ Log First Expense</button></div>`
            : `<table class="invoice-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Paid via</th><th>Actions</th></tr></thead><tbody>` +
            expenses.sort((a,b) => new Date(b.date)-new Date(a.date)).map(e =>
                `<tr><td>${formatDate(e.date)}</td><td>${escapeHtml(e.description)}</td>
                <td><span class="inv-badge">${escapeHtml(e.category)}</span></td>
                <td><strong>${formatCurrency(e.amount)}</strong></td><td>${escapeHtml(e.paymentMethod||'—')}</td>
                <td style="white-space:nowrap"><button class="btn btn-secondary btn-sm" onclick="openExpenseModal('${e.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e.id}')">Delete</button></td></tr>`
            ).join('') + `</tbody></table>`);
}
function openExpenseModal(id = null) {
    currentExpense = id ? getExpenses().find(e => e.id === id) : null;
    const m = document.getElementById('expense-modal'); if (!m) return;
    document.getElementById('expense-modal-title').textContent = currentExpense ? 'Edit Expense' : 'Log Expense';
    document.getElementById('expense-description').value = currentExpense?.description || '';
    document.getElementById('expense-amount').value = currentExpense?.amount || '';
    document.getElementById('expense-date').value = currentExpense?.date || today();
    document.getElementById('expense-category').value = currentExpense?.category || 'Other';
    document.getElementById('expense-payment-method').value = currentExpense?.paymentMethod || 'Cash';
    document.getElementById('expense-notes').value = currentExpense?.notes || '';
    m.classList.add('active');
}
function closeExpenseModal() { document.getElementById('expense-modal').classList.remove('active'); currentExpense = null; }
function saveExpense() {
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    if (!description || isNaN(amount) || !date) { showToast('Description, amount and date are required.', 'error'); return; }
    const e = {
        id: currentExpense ? currentExpense.id : generateId(),
        description, amount, date,
        category: document.getElementById('expense-category').value,
        paymentMethod: document.getElementById('expense-payment-method').value,
        notes: document.getElementById('expense-notes').value.trim(),
        createdBy: getSession()?.username || 'owner',
        createdAt: currentExpense ? currentExpense.createdAt : new Date().toISOString()
    };
    const expenses = getExpenses();
    if (currentExpense) { const i = expenses.findIndex(x => x.id === e.id); if (i !== -1) expenses[i] = e; }
    else expenses.push(e);
    if (saveExpenses(expenses)) { closeExpenseModal(); loadExpenses(); showToast('Expense saved!'); }
}
function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    saveExpenses(getExpenses().filter(e => e.id !== id));
    loadExpenses(); showToast('Expense deleted.');
}

// ==================== QUOTES ====================
let currentQuote = null;

function generateQuoteNumber() {
    const y = new Date().getFullYear();
    return 'QTE-' + y + '-' + String(getQuotes().length + 1).padStart(4, '0');
}
function loadQuotes() {
    if (!canUseQuotes()) { requireTierFeature('Quotes & Estimates'); return; }
    const quotes = getQuotes();
    const pending = quotes.filter(q => q.status === 'pending');
    const accepted = quotes.filter(q => q.status === 'accepted').length;
    const pipeline = pending.reduce((s,q) => s+q.total, 0);
    const cont = document.querySelector('#quotes-page .content'); if (!cont) return;
    cont.innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px">
            <div class="stat-card"><div class="stat-label">Total Quotes</div><div class="stat-value">${quotes.length}</div></div>
            <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${pending.length}</div></div>
            <div class="stat-card"><div class="stat-label">Accepted</div><div class="stat-value" style="color:var(--success,#00ba88)">${accepted}</div></div>
            <div class="stat-card"><div class="stat-label">Pipeline Value</div><div class="stat-value">${formatCurrency(pipeline)}</div></div>
        </div>
        <div class="section-header"><div class="section-title">Quotes & Estimates</div><button class="btn btn-primary" onclick="openQuoteModal()">+ New Quote</button></div>
        ` + (quotes.length === 0
            ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No quotes yet</div><div class="empty-sub">Send clients a quote before they commit. Convert accepted quotes to invoices in one click.</div><button class="btn btn-primary" onclick="openQuoteModal()">+ Create First Quote</button></div>`
            : `<table class="invoice-table"><thead><tr><th>Quote #</th><th>Client</th><th>Date</th><th>Valid Until</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>` +
            quotes.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(q => {
                const sc = {pending:'',accepted:'inv-success',declined:'inv-danger',expired:'inv-warning'};
                return `<tr><td><strong>${escapeHtml(q.number)}</strong></td><td>${escapeHtml(q.customerName)}</td>
                    <td>${formatDate(q.date)}</td><td>${formatDate(q.validUntil)}</td>
                    <td><strong>${formatCurrency(q.total)}</strong></td>
                    <td><span class="inv-badge ${sc[q.status]||''}">${q.status}</span></td>
                    <td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn btn-secondary btn-sm" onclick="viewQuote('${q.id}')">View</button>
                        ${q.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="convertQuoteToInvoice('${q.id}')">→ Invoice</button>`:''}
                        <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q.id}')">Delete</button>
                    </td></tr>`;
            }).join('') + `</tbody></table>`);
}
function openQuoteModal(id = null) {
    currentQuote = id ? getQuotes().find(q => q.id === id) : null;
    const m = document.getElementById('quote-modal'); if (!m) return;
    document.getElementById('quote-modal-title').textContent = currentQuote ? 'Edit Quote' : 'New Quote';
    document.getElementById('quote-number').value = currentQuote?.number || generateQuoteNumber();
    document.getElementById('quote-customer-name').value = currentQuote?.customerName || '';
    document.getElementById('quote-customer-email').value = currentQuote?.customerEmail || '';
    document.getElementById('quote-customer-phone').value = currentQuote?.customerPhone || '';
    document.getElementById('quote-date').value = currentQuote?.date || today();
    const vd = new Date(); vd.setDate(vd.getDate()+30);
    document.getElementById('quote-valid-until').value = currentQuote?.validUntil || vd.toISOString().split('T')[0];
    document.getElementById('quote-notes').value = currentQuote?.notes || '';
    const ic = document.getElementById('quote-items-container');
    ic.innerHTML = (currentQuote?.items?.length > 0 ? currentQuote.items : [{}]).map((item,i) =>
        `<div class="item-row">
            <div class="form-group"><input type="text" class="form-input item-description" placeholder="Description" value="${escapeHtml(item.description||'')}"></div>
            <div class="form-group"><input type="number" class="form-input item-quantity" placeholder="Qty" value="${item.quantity||1}" min="1"></div>
            <div class="form-group"><input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" value="${item.price||''}"></div>
            <div class="form-group"><input type="number" class="form-input item-total" placeholder="Total" readonly value="${item.total||''}"></div>
            <button type="button" class="remove-item-btn" onclick="removeQuoteItem(this)" style="visibility:${i===0?'hidden':'visible'}">×</button>
        </div>`).join('');
    calculateQuoteTotal();
    m.classList.add('active');
}
function closeQuoteModal() { document.getElementById('quote-modal').classList.remove('active'); currentQuote = null; }
function addQuoteItem() {
    const ic = document.getElementById('quote-items-container');
    const row = document.createElement('div'); row.className = 'item-row';
    row.innerHTML = buildItemRowHTML();
    // fix onclick for quote container remove
    row.querySelector('.remove-item-btn').setAttribute('onclick', 'removeItem(this)');
    ic.appendChild(row);
    syncRemoveBtns(ic);
}
function removeQuoteItem(btn) { removeItem(btn); }
function calculateQuoteTotal() {
    const settings = getSettings(); const taxRate = (settings.taxRate||0)/100; let sub = 0;
    document.querySelectorAll('#quote-items-container .item-row').forEach(row => {
        const q = parseFloat(row.querySelector('.item-quantity').value)||0;
        const p = parseFloat(row.querySelector('.item-price').value)||0;
        const t = q*p; row.querySelector('.item-total').value = t.toFixed(2); sub += t;
    });
    const sym = getCurrencySymbol();
    const subEl = document.getElementById('quote-subtotal'); if(subEl) subEl.textContent = sym+sub.toFixed(2);
    const taxEl = document.getElementById('quote-tax'); if(taxEl) taxEl.textContent = sym+(sub*taxRate).toFixed(2);
    const totEl = document.getElementById('quote-total'); if(totEl) totEl.textContent = sym+(sub+sub*taxRate).toFixed(2);
}
function saveQuote() {
    const number = document.getElementById('quote-number').value.trim();
    const customerName = document.getElementById('quote-customer-name').value.trim();
    const date = document.getElementById('quote-date').value;
    if (!number || !customerName || !date) { showToast('Quote number, client name and date are required.', 'error'); return; }
    const items = [];
    document.querySelectorAll('#quote-items-container .item-row').forEach(row => {
        const description = row.querySelector('.item-description').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (description && quantity > 0 && price >= 0) items.push({ description, quantity, price, total: quantity*price });
    });
    if (items.length === 0) { showToast('Add at least one item.', 'error'); return; }
    const subtotal = items.reduce((s,i) => s+i.total, 0);
    const taxRate = (getSettings().taxRate||0)/100;
    const tax = subtotal*taxRate;
    const q = {
        id: currentQuote ? currentQuote.id : generateId(), number, customerName,
        customerEmail: document.getElementById('quote-customer-email').value.trim(),
        customerPhone: document.getElementById('quote-customer-phone').value.trim(),
        date, validUntil: document.getElementById('quote-valid-until').value,
        items, subtotal, tax, total: subtotal+tax,
        notes: document.getElementById('quote-notes').value.trim(),
        status: currentQuote ? currentQuote.status : 'pending',
        createdAt: currentQuote ? currentQuote.createdAt : new Date().toISOString()
    };
    const quotes = getQuotes();
    if (currentQuote) { const i = quotes.findIndex(x => x.id === q.id); if (i !== -1) quotes[i] = q; }
    else quotes.push(q);
    if (saveQuotes(quotes)) { closeQuoteModal(); loadQuotes(); showToast('Quote saved!'); }
}
function viewQuote(id) {
    const q = getQuotes().find(x => x.id === id); if (!q) return;
    currentViewInvoice = null;
    const preview = document.getElementById('invoice-preview-container'); if (!preview) return;
    preview.innerHTML = `<div style="padding:20px">
        <h2>QUOTE — ${escapeHtml(q.number)}</h2>
        <p style="color:var(--text-muted)">Status: <strong>${q.status}</strong> &nbsp;·&nbsp; Valid until: ${formatDate(q.validUntil)}</p>
        <p><strong>${escapeHtml(q.customerName)}</strong>${q.customerEmail?'<br>'+escapeHtml(q.customerEmail):''}</p>
        <table class="invoice-table" style="margin-top:16px"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${q.items.map(i=>`<tr><td>${escapeHtml(i.description)}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td><td>${formatCurrency(i.total)}</td></tr>`).join('')}</tbody></table>
        <div style="text-align:right;margin-top:12px">
            <div>Subtotal: ${formatCurrency(q.subtotal)}</div><div>Tax: ${formatCurrency(q.tax)}</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px">Total: ${formatCurrency(q.total)}</div>
        </div>
        ${q.notes?'<p style="margin-top:12px;color:var(--text-muted)">'+escapeHtml(q.notes)+'</p>':''}
        ${q.status==='pending'?`<div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-primary" onclick="convertQuoteToInvoice('${id}');closeViewModal()">→ Convert to Invoice</button>
            <button class="btn btn-secondary" onclick="updateQuoteStatus('${id}','accepted');closeViewModal()">✓ Mark Accepted</button>
            <button class="btn btn-danger" onclick="updateQuoteStatus('${id}','declined');closeViewModal()">✗ Declined</button>
        </div>`:''}
    </div>`;
    document.getElementById('view-modal-title').textContent = 'Quote Details';
    const editBtn = document.getElementById('view-modal-edit-btn');
    if (editBtn) editBtn.style.display = 'none';
    document.getElementById('view-invoice-modal').classList.add('active');
}
function updateQuoteStatus(id, status) {
    const quotes = getQuotes(); const q = quotes.find(x => x.id === id);
    if (q) { q.status = status; saveQuotes(quotes); loadQuotes(); showToast('Quote updated.'); }
}
function deleteQuote(id) {
    if (!confirm('Delete this quote?')) return;
    saveQuotes(getQuotes().filter(q => q.id !== id)); loadQuotes(); showToast('Quote deleted.');
}
