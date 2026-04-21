// invoHub v4 - Complete Application with Gumroad License + PWA + Privacy
'use strict';

// ==================== CONFIGURATION ====================
 const LICENSE_VALIDATE_URL = '/api/validate-license';

// ==================== DEV MODE ====================
// Set to true to bypass license check during development.
// IMPORTANT: Set back to false before deploying to production.
const DEV_MODE = false;

// ==================== DEMO DATA ====================
// Seeded automatically on first boot after license activation.
// Only injected if the workspace is completely empty (no invoices, no customers).
// Tailored to each license tier so the demo feels relevant.

function seedDemoData(tier) {
    // Only seed if workspace is truly empty
    if (getInvoices().length > 0 || getCustomers().length > 0) return;

    const today      = new Date();
    const fmt        = d => d.toISOString().split('T')[0];
    const daysAgo    = n => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
    const daysAhead  = n => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

    // ---- Tier-specific personas ----
    const personas = {
        solo: {
            company:   'Tunde Photography',
            customers: [
                { id: 'demo-c1', name: 'Lagos Events Ltd',    email: 'events@lagosevents.ng',  phone: '0801 234 5678', address: '14 Broad Street, Lagos Island', notes: 'Corporate client', createdAt: daysAgo(60) },
                { id: 'demo-c2', name: 'Adaeze Williams',     email: 'adaeze.w@gmail.com',      phone: '0703 987 6543', address: '5 Adeola Odeku, Victoria Island', notes: 'Wedding photography', createdAt: daysAgo(30) }
            ],
            invoices: [
                { id: 'demo-i1', number: 'INV-2026-0001', status: 'paid',    date: daysAgo(45), dueDate: daysAgo(15), customerName: 'Lagos Events Ltd',  customerEmail: 'events@lagosevents.ng',  customerPhone: '0801 234 5678', customerAddress: '14 Broad Street, Lagos Island', items: [{ description: 'Corporate Event Photography (4hrs)', quantity: 1, price: 150000, total: 150000 }, { description: 'Photo Editing & Delivery (USB)', quantity: 1, price: 25000, total: 25000 }], subtotal: 175000, tax: 17500,  total: 192500,  notes: 'Thank you for your business!', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(45) },
                { id: 'demo-i2', number: 'INV-2026-0002', status: 'pending', date: daysAgo(20), dueDate: daysAhead(10), customerName: 'Adaeze Williams', customerEmail: 'adaeze.w@gmail.com',      customerPhone: '0703 987 6543', customerAddress: '5 Adeola Odeku, Victoria Island', items: [{ description: 'Wedding Photography (Full Day)', quantity: 1, price: 350000, total: 350000 }, { description: 'Wedding Album (Premium)', quantity: 1, price: 75000, total: 75000 }], subtotal: 425000, tax: 42500,  total: 467500,  notes: '50% deposit already received. Balance due on delivery.', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(20) },
                { id: 'demo-i3', number: 'INV-2026-0003', status: 'overdue', date: daysAgo(40), dueDate: daysAgo(10), customerName: 'Lagos Events Ltd',  customerEmail: 'events@lagosevents.ng',  customerPhone: '0801 234 5678', customerAddress: '14 Broad Street, Lagos Island', items: [{ description: 'Product Photography (20 items)', quantity: 20, price: 8000, total: 160000 }], subtotal: 160000, tax: 16000,  total: 176000,  notes: 'Please settle at your earliest convenience.', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(40) }
            ]
        },
        team: {
            company:   'SwiftMart Superstore',
            customers: [
                { id: 'demo-c1', name: 'Emeka Okafor Supplies',  email: 'emeka@okafor.ng',         phone: '0802 111 2233', address: '22 Otigba Street, Computer Village, Ikeja', notes: 'Wholesale buyer', createdAt: daysAgo(90) },
                { id: 'demo-c2', name: 'Blessing Catering Co.',  email: 'blessing@blesscater.com', phone: '0705 444 5566', address: '8 Allen Avenue, Ikeja', notes: 'Monthly orders', createdAt: daysAgo(45) }
            ],
            invoices: [
                { id: 'demo-i1', number: 'INV-2026-0001', status: 'paid',    date: daysAgo(30), dueDate: daysAgo(2),   customerName: 'Emeka Okafor Supplies',  customerEmail: 'emeka@okafor.ng',         customerPhone: '0802 111 2233', customerAddress: '22 Otigba Street, Computer Village, Ikeja', items: [{ description: 'Bulk Rice (50kg bags)', quantity: 20, price: 45000, total: 900000 }, { description: 'Vegetable Oil (25L)', quantity: 10, price: 28000, total: 280000 }, { description: 'Delivery Fee', quantity: 1, price: 15000, total: 15000 }], subtotal: 1195000, tax: 119500, total: 1314500, notes: 'Bulk order discount applied.', createdBy: 'cashier1', createdByRole: 'cashier', createdAt: daysAgo(30) },
                { id: 'demo-i2', number: 'INV-2026-0002', status: 'pending', date: daysAgo(7),  dueDate: daysAhead(7), customerName: 'Blessing Catering Co.',  customerEmail: 'blessing@blesscater.com', customerPhone: '0705 444 5566', customerAddress: '8 Allen Avenue, Ikeja',               items: [{ description: 'Frozen Chicken (1kg packs)', quantity: 50, price: 4500, total: 225000 }, { description: 'Tomato Paste (crates)', quantity: 5, price: 18000, total: 90000 }], subtotal: 315000, tax: 31500,  total: 346500,  notes: 'Monthly order — net 7 days.', createdBy: 'cashier2', createdByRole: 'cashier', createdAt: daysAgo(7) },
                { id: 'demo-i3', number: 'INV-2026-0003', status: 'paid',    date: daysAgo(15), dueDate: daysAgo(1),   customerName: 'Emeka Okafor Supplies',  customerEmail: 'emeka@okafor.ng',         customerPhone: '0802 111 2233', customerAddress: '22 Otigba Street, Computer Village, Ikeja', items: [{ description: 'Semolina (10kg bags)', quantity: 30, price: 12000, total: 360000 }, { description: 'Sugar (50kg bags)', quantity: 10, price: 38000, total: 380000 }], subtotal: 740000, tax: 74000,  total: 814000,  notes: '', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(15) }
            ]
        },
        business: {
            company:   'PrimeBuild Construction',
            customers: [
                { id: 'demo-c1', name: 'Dangote Properties Ltd',  email: 'procurement@dangoteprop.com', phone: '0801 999 0001', address: 'Plot 3, Eko Atlantic City, Lagos', notes: 'Key account — high value contracts', createdAt: daysAgo(120) },
                { id: 'demo-c2', name: 'Abuja Capital Estates',   email: 'contracts@abujacapital.ng',   phone: '0803 777 8899', address: '15 Aguiyi Ironsi Street, Maitama, Abuja', notes: 'Quarterly projects', createdAt: daysAgo(60) }
            ],
            invoices: [
                { id: 'demo-i1', number: 'INV-2026-0001', status: 'paid',    date: daysAgo(60), dueDate: daysAgo(30),  customerName: 'Dangote Properties Ltd', customerEmail: 'procurement@dangoteprop.com', customerPhone: '0801 999 0001', customerAddress: 'Plot 3, Eko Atlantic City, Lagos',         items: [{ description: 'Structural Steel Supply & Installation', quantity: 1, price: 8500000, total: 8500000 }, { description: 'Site Labour (30 workers × 30 days)', quantity: 900, price: 8000, total: 7200000 }, { description: 'Equipment Hire', quantity: 1, price: 1200000, total: 1200000 }], subtotal: 16900000, tax: 1690000, total: 18590000, notes: 'Phase 1 completion. Certificate of completion attached.', createdBy: 'supervisor1', createdByRole: 'cashier', createdAt: daysAgo(60) },
                { id: 'demo-i2', number: 'INV-2026-0002', status: 'pending', date: daysAgo(14), dueDate: daysAhead(16), customerName: 'Abuja Capital Estates',  customerEmail: 'contracts@abujacapital.ng',   customerPhone: '0803 777 8899', customerAddress: '15 Aguiyi Ironsi Street, Maitama, Abuja', items: [{ description: 'Foundation Work — Block A', quantity: 1, price: 4200000, total: 4200000 }, { description: 'Roofing Materials & Installation', quantity: 1, price: 2800000, total: 2800000 }], subtotal: 7000000, tax: 700000,  total: 7700000,  notes: 'Milestone 2 of 4. Next invoice due on completion of block B.', createdBy: 'supervisor2', createdByRole: 'cashier', createdAt: daysAgo(14) },
                { id: 'demo-i3', number: 'INV-2026-0003', status: 'overdue', date: daysAgo(45), dueDate: daysAgo(15),  customerName: 'Dangote Properties Ltd', customerEmail: 'procurement@dangoteprop.com', customerPhone: '0801 999 0001', customerAddress: 'Plot 3, Eko Atlantic City, Lagos',         items: [{ description: 'Architectural Consultancy', quantity: 1, price: 1500000, total: 1500000 }, { description: 'Detailed Engineering Drawings', quantity: 1, price: 850000, total: 850000 }], subtotal: 2350000, tax: 235000,  total: 2585000,  total: 2585000,  notes: 'Please contact accounts@primebuild.ng for payment confirmation.', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(45) }
            ]
        }
    };

    const data = personas[tier] || personas.solo;

    // Stamp all records with updatedAt
    const stamp = r => ({ ...r, updatedAt: r.createdAt });
    const customers = data.customers.map(stamp);
    const invoices  = data.invoices.map(stamp);

    // Set the invoice counter so next real invoice continues sequentially
    const year = new Date().getFullYear();
    localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, `${year}:${invoices.length}`);

    saveCustomers(customers);
    saveInvoices(invoices);

    // Seed products, expenses, quotes for team/business tiers
    if (tier === 'team' || tier === 'business') {
        const demoProducts = tier === 'team' ? [
            { id: 'demo-p1', name: 'Bulk Rice (50kg bags)', sku: 'RICE-50KG', description: '', sellPrice: 45000, costPrice: 38000, trackStock: true, stockQty: 45, lowStockAlert: 10, createdAt: daysAgo(90), updatedAt: daysAgo(1) },
            { id: 'demo-p2', name: 'Vegetable Oil (25L)',   sku: 'OIL-25L',   description: '', sellPrice: 28000, costPrice: 22000, trackStock: true, stockQty: 8,  lowStockAlert: 10, createdAt: daysAgo(90), updatedAt: daysAgo(1) },
            { id: 'demo-p3', name: 'Frozen Chicken (1kg)',  sku: 'CHKN-1KG',  description: '', sellPrice: 4500,  costPrice: 3200,  trackStock: true, stockQty: 120,lowStockAlert: 20, createdAt: daysAgo(60), updatedAt: daysAgo(1) },
            { id: 'demo-p4', name: 'Sugar (50kg bags)',     sku: 'SUGR-50KG', description: '', sellPrice: 38000, costPrice: 32000, trackStock: true, stockQty: 25, lowStockAlert: 5,  createdAt: daysAgo(60), updatedAt: daysAgo(1) },
        ] : [
            { id: 'demo-p1', name: 'Structural Steel',        sku: 'STL-001', description: 'Per tonne', sellPrice: 850000,  costPrice: 680000,  trackStock: false, stockQty: null, lowStockAlert: null, createdAt: daysAgo(120), updatedAt: daysAgo(1) },
            { id: 'demo-p2', name: 'Roofing Materials',       sku: 'RF-001',  description: 'Per job',   sellPrice: 2800000, costPrice: 2100000, trackStock: false, stockQty: null, lowStockAlert: null, createdAt: daysAgo(120), updatedAt: daysAgo(1) },
            { id: 'demo-p3', name: 'Architectural Consulting', sku: 'AC-001', description: 'Per project',sellPrice: 1500000, costPrice: 800000,  trackStock: false, stockQty: null, lowStockAlert: null, createdAt: daysAgo(90),  updatedAt: daysAgo(1) },
        ];
        saveProducts(demoProducts);

        const demoExpenses = tier === 'team' ? [
            { id: 'demo-e1', description: 'Warehouse rent — April', amount: 180000, date: daysAgo(20), category: 'Rent',      paymentMethod: 'Bank Transfer', notes: '', createdBy: 'owner', createdAt: daysAgo(20) },
            { id: 'demo-e2', description: 'Staff salaries — April', amount: 350000, date: daysAgo(18), category: 'Salaries',  paymentMethod: 'Bank Transfer', notes: '3 cashiers', createdBy: 'owner', createdAt: daysAgo(18) },
            { id: 'demo-e3', description: 'Cold storage electricity',amount: 45000, date: daysAgo(10), category: 'Utilities', paymentMethod: 'Card', notes: '', createdBy: 'owner', createdAt: daysAgo(10) },
        ] : [
            { id: 'demo-e1', description: 'Site equipment hire',    amount: 1200000, date: daysAgo(60), category: 'Equipment',  paymentMethod: 'Bank Transfer', notes: 'Crane + scaffolding', createdBy: 'owner', createdAt: daysAgo(60) },
            { id: 'demo-e2', description: 'Worker wages — March',   amount: 2400000, date: daysAgo(45), category: 'Salaries',   paymentMethod: 'Bank Transfer', notes: '30 workers x 30 days', createdBy: 'owner', createdAt: daysAgo(45) },
            { id: 'demo-e3', description: 'Insurance premium',      amount: 350000,  date: daysAgo(30), category: 'Insurance',  paymentMethod: 'Bank Transfer', notes: 'Annual policy', createdBy: 'owner', createdAt: daysAgo(30) },
            { id: 'demo-e4', description: 'Office rent — April',    amount: 280000,  date: daysAgo(20), category: 'Rent',       paymentMethod: 'Bank Transfer', notes: '', createdBy: 'owner', createdAt: daysAgo(20) },
        ];
        saveExpenses(demoExpenses);

        const demoQuotes = tier === 'team' ? [
            { id: 'demo-q1', number: 'QTE-2026-0001', customerName: 'Blessing Catering Co.', customerEmail: 'blessing@blesscater.com', customerPhone: '0705 444 5566', date: daysAgo(5), validUntil: daysAhead(25), items: [{ description: 'Frozen Chicken (1kg packs)', quantity: 100, price: 4500, total: 450000 }, { description: 'Tomato Paste (crates)', quantity: 10, price: 18000, total: 180000 }], subtotal: 630000, tax: 63000, total: 693000, notes: 'Quote valid for 30 days. Bulk discount applied.', status: 'pending', createdAt: daysAgo(5) },
        ] : [
            { id: 'demo-q1', number: 'QTE-2026-0001', customerName: 'Abuja Capital Estates', customerEmail: 'contracts@abujacapital.ng', customerPhone: '0803 777 8899', date: daysAgo(10), validUntil: daysAhead(20), items: [{ description: 'Block C Foundation & Framing', quantity: 1, price: 5500000, total: 5500000 }, { description: 'Electrical Rough-in', quantity: 1, price: 1200000, total: 1200000 }], subtotal: 6700000, tax: 670000, total: 7370000, notes: 'Quote valid 30 days. Subject to site survey confirmation.', status: 'pending', createdAt: daysAgo(10) },
        ];
        saveQuotes(demoQuotes);
    }

    // Pre-fill company name in settings
    const settings = getSettings();
    if (!settings.companyName) {
        settings.companyName = data.company;
        saveSettingsData(settings);
    }

    console.log(`[invoHub] Demo data seeded for ${tier} plan (${invoices.length} invoices, ${customers.length} customers)`);
}

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
    INVOICES:         'invohub_invoices',
    CUSTOMERS:        'invohub_customers',
    SETTINGS:         'invohub_settings',
    LOGO:             'invohub_logo',
    LICENSE_KEY:      'invohub_license_key',
    LICENSE_EMAIL:    'invohub_license_email',
    LICENSE_DEVICES:  'invohub_license_devices',
    DEVICE_ACTIVATED: 'invohub_device_activated',
    PRIVACY_ACK:      'invohub_privacy_ack',
    INVOICE_COUNTER:  'invohub_invoice_counter',
    LICENSE_TIER:     'invohub_license_tier',
    USERS:            'invohub_users',
    SESSION:          'invohub_session',
    DEVICE_ID:        'invohub_device_id',
    PRODUCTS:         'invohub_products',
    EXPENSES:         'invohub_expenses',
    QUOTES:           'invohub_quotes',
};

// Returns a stable UUID for this browser/device. Generated once, stored forever.
// Sent with every license API call so the backend can track seats per device.
function getDeviceId() {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID()
           : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
               const r = Math.random() * 16 | 0;
               return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
             });
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
}

// ==================== TRIAL CONFIG ====================
// Free trial: full app access until limits hit, then paywall.
const TRIAL_INVOICE_LIMIT  = 3;
const TRIAL_CUSTOMER_LIMIT = 2;

function isLicensed() {
    if (DEV_MODE) return true;
    return !!localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) &&
           !!localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);
}

// Only count user-created records (demo seeds have IDs starting with 'demo-')
function getUserInvoiceCount() {
    return getInvoices().filter(inv => !inv.id.startsWith('demo-')).length;
}
function getUserCustomerCount() {
    return getCustomers().filter(c => !c.id.startsWith('demo-')).length;
}

function checkInvoiceTrialLimit() {
    if (isLicensed()) return true;
    if (getUserInvoiceCount() >= TRIAL_INVOICE_LIMIT) {
        showPaywall('invoice');
        return false;
    }
    return true;
}

function checkCustomerTrialLimit() {
    if (isLicensed()) return true;
    if (getUserCustomerCount() >= TRIAL_CUSTOMER_LIMIT) {
        showPaywall('customer');
        return false;
    }
    return true;
}

function renderTrialBanner() {
    const banner = document.getElementById('trial-banner');
    if (!banner) return;
    if (isLicensed()) { banner.style.display = 'none'; return; }
    const invLeft = Math.max(0, TRIAL_INVOICE_LIMIT  - getUserInvoiceCount());
    const cusLeft = Math.max(0, TRIAL_CUSTOMER_LIMIT - getUserCustomerCount());
    banner.style.display = 'flex';
    banner.innerHTML = `
        <span>🔓 <strong>Free Trial</strong> — ${invLeft} invoice${invLeft !== 1 ? 's' : ''} &amp; ${cusLeft} customer${cusLeft !== 1 ? 's' : ''} remaining</span>
        <button onclick="showPaywall('upgrade')" style="background:var(--primary);color:#fff;border:none;padding:5px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;margin-left:12px;">Unlock Full Access →</button>
    `;
}

// ==================== GLOBAL STATE ====================
let currentInvoice = null;
let currentViewInvoice = null;
let currentCustomer = null;
let revenueChart = null;
let currentSession = null; // logged-in user
let statusChart = null;

// ==================== APP INIT ====================
document.addEventListener('DOMContentLoaded', function () {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[SW] Registered:', reg.scope);
        }).catch(err => console.warn('[SW] Registration failed:', err));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const action    = urlParams.get('action');

    if (DEV_MODE) {
        // Dev bypass — skip all checks, auto-login as licensed owner
        localStorage.setItem(STORAGE_KEYS.LICENSE_KEY,      'DEV-MODE');
        localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL,    'dev@localhost');
        localStorage.setItem(STORAGE_KEYS.DEVICE_ACTIVATED, 'true');
        localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES,  '1/25');
        localStorage.setItem(STORAGE_KEYS.LICENSE_TIER,     'business');
        seedDemoData('business');
        const devUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        if (devUsers.length === 0) {
            hashPassword('devpass').then(hash => {
                devUsers.push({ id: 'dev-owner', username: 'owner', role: 'owner', passwordHash: hash, createdAt: new Date().toISOString() });
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(devUsers));
            });
        }
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ userId: 'dev-owner', username: 'owner', role: 'owner', loginAt: new Date().toISOString() }));
        bootApp(action);
        return;
    }

    // ---- Freemium flow ----
    // New visitors go straight into the app (trial mode).
    // The paywall only appears when they hit the invoice/customer limit.
    // After purchasing a license they activate it inside the app.
    const licenseKey      = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    const alreadyActivated = localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);

    if (licenseKey && alreadyActivated) {
        // Returning licensed user — verify key silently in background
        silentLicenseCheck(licenseKey, action);
    } else {
        // Trial or returning trial user — boot straight into app
        bootApp(action);
    }
});

// ==================== LICENSE GATE ====================

// showLicenseGate is kept only for Settings > Deactivate re-activation.
// New visitors no longer see it — they go straight into the trial.
function showLicenseGate(prefillKey = '') {
    showPaywall('activate', prefillKey);
}

// ==================== PAYWALL MODAL ====================

function showPaywall(reason = 'upgrade', prefillKey = '') {
    const modal = document.getElementById('paywall-modal');
    if (!modal) return;

    // Update headline based on why it's showing
    const title = document.getElementById('paywall-title');
    const sub   = document.getElementById('paywall-sub');

    if (reason === 'invoice') {
        title.textContent = "You've used all 3 free invoices";
        sub.textContent   = "Unlock invoHub to create unlimited invoices, manage your team, and get paid faster.";
    } else if (reason === 'customer') {
        title.textContent = "You've used both free customer slots";
        sub.textContent   = "Upgrade to add unlimited customers and get full access to every feature.";
    } else {
        title.textContent = 'Unlock Full Access';
        sub.textContent   = 'Choose a plan to remove all limits and keep your trial data.';
    }

    // Pre-fill key if passed (e.g. from settings deactivate flow)
    const keyInput = document.getElementById('paywall-key-input');
    if (keyInput && prefillKey) keyInput.value = prefillKey;
    if (keyInput) {
        keyInput.classList.remove('error', 'success');
        keyInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') activateLicense();
        }, { once: true });
    }

    const errEl = document.getElementById('paywall-error');
    if (errEl) errEl.textContent = '';

    modal.classList.add('visible');
}

function closePaywall() {
    const modal = document.getElementById('paywall-modal');
    if (modal) modal.classList.remove('visible');
}

async function activateLicense() {
    const input   = document.getElementById('paywall-key-input');
    const btn     = document.getElementById('paywall-activate-btn');
    const btnText = document.getElementById('paywall-activate-btn-text');
    const errorEl = document.getElementById('paywall-error');

    const key = input.value.trim().toUpperCase();

    if (!key || key.length < 8) {
        input.classList.add('error');
        errorEl.textContent = 'Please enter a valid license key from your Gumroad receipt email.';
        return;
    }

    btn.disabled = true;
    btnText.innerHTML = '<span class="license-loader"></span> Validating...';
    errorEl.textContent = '';

    try {
        const response = await fetch(LICENSE_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, action: 'activate', device_id: getDeviceId() })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
            localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL, data.email || 'Verified');
            localStorage.setItem(STORAGE_KEYS.DEVICE_ACTIVATED, 'true');
            if (data.users_max) {
                localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES, `${data.users_used || 1}/${data.users_max}`);
            }
            if (data.tier) localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, data.tier);

            // Seed demo data on first activation so new users see a working app
            seedDemoData(data.tier || 'solo');

            input.classList.add('success');
            btnText.innerHTML = '✓ Activated! Loading app...';

            setTimeout(() => {
                closePaywall();
                renderTrialBanner(); // hides the trial banner now licensed
                showToast('🎉 License activated! Full access unlocked.');
            }, 800);
        } else {
            input.classList.add('error');
            errorEl.textContent = data.error || 'Invalid license key. Please check your Gumroad receipt email.';
            btn.disabled = false;
            btnText.textContent = '✓ Activate License';
        }
    } catch (err) {
        console.error('License validation error:', err);
        input.classList.add('error');
        errorEl.textContent = 'Could not reach activation server. Please check your internet connection and try again.';
        btn.disabled = false;
        btnText.textContent = '✓ Activate License';
    }
}

// Silent background check on every app launch — no seat increment, just verifies key is still valid
async function silentLicenseCheck(key, action) {
    bootApp(action); // Boot immediately, check happens in background

    try {
        const response = await fetch(LICENSE_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, action: 'check', device_id: getDeviceId() })
        });

        const data = await response.json();

        if (!data.success) {
            // Key revoked / refunded — sign out
            localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.DEVICE_ACTIVATED);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_DEVICES);
            alert('Your license is no longer valid. Please contact support.');
            window.location.reload();
            return;
        }

        // Update user/tier display
        if (data.users_max) {
            const devStr = `${data.users_used || 1}/${data.users_max}`;
            localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES, devStr);
            const el = document.getElementById('settings-device-count');
            if (el) el.textContent = `${devStr} users • ${data.tier || ''} plan`;
        }
        if (data.tier) localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, data.tier);

    } catch (err) {
        // Offline — allow, since key is stored locally
        console.log('[License] Offline check skipped');
    }
}

async function deactivateLicense() {
    if (!confirm('This will release this device\'s license seat and sign you out. You can re-activate on another device. Continue?')) return;

    const key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    const wasActivated = localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);

    // Tell server to free the seat
    if (key && wasActivated) {
        try {
            await fetch(LICENSE_VALIDATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, action: 'deactivate', device_id: getDeviceId() })
            });
        } catch (err) {
            console.warn('Could not reach server to free seat — deactivating locally anyway');
        }
    }

    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ACTIVATED);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_DEVICES);
    window.location.reload();
}

function copyLicenseKey() {
    const key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (key) {
        navigator.clipboard.writeText(key).then(() => {
            alert('License key copied to clipboard!');
        });
    }
}

// ==================== BOOT APP ====================

function bootApp(action) {
    // Always hide the license gate — it's no longer shown on startup
    const gate = document.getElementById('license-gate');
    if (gate) gate.classList.remove('visible');

    // Route to user login screen (handles no-users first-run too)
    showUserLoginScreen(action);
}

// ==================== USER AUTH ====================

function getUsers() {
    try { const d = localStorage.getItem(STORAGE_KEYS.USERS); return d ? JSON.parse(d) : []; }
    catch(e) { return []; }
}
function saveUsers(users) {
    try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); return true; }
    catch(e) { return false; }
}
function getSession() {
    try { const d = localStorage.getItem(STORAGE_KEYS.SESSION); return d ? JSON.parse(d) : null; }
    catch(e) { return null; }
}
function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    currentSession = session;
}
function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    currentSession = null;
}

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function showUserLoginScreen(pendingAction) {
    document.getElementById('license-gate').classList.remove('visible');
    document.getElementById('user-login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';

    const tier = localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo';
    const tierLabel = { solo: 'Solo Plan', team: 'Team Plan', business: 'Business Plan' }[tier] || 'Solo Plan';
    const tierBadge = document.getElementById('user-tier-badge');
    if (tierBadge) tierBadge.textContent = tierLabel;

    showUserSelectView(pendingAction);
}

function showUserSelectView(pendingAction) {
    document.getElementById('user-select-view').style.display = 'block';
    document.getElementById('user-password-view').style.display = 'none';
    document.getElementById('user-login-sub').textContent = "Who's working today?";

    const users = getUsers();
    const grid = document.getElementById('user-cards-grid');
    const divider = document.getElementById('add-user-divider');

    if (users.length === 0) {
        // First run — no users yet, prompt to create owner
        grid.innerHTML = `
            <div style="text-align:center; padding:32px; color:var(--text-muted); width:100%;">
                <div style="font-size:40px; margin-bottom:16px;">👤</div>
                <div style="font-size:15px; margin-bottom:8px;">No users set up yet.</div>
                <div style="font-size:13px; margin-bottom:24px;">Create the owner account to get started.</div>
                <button class="btn-activate" onclick="openAddUserModal(true)">Create Owner Account</button>
            </div>`;
        divider.style.display = 'none';
    } else {
        grid.innerHTML = users.map(u => `
            <div class="user-card" onclick="selectUserCard('${u.id}', '${escapeHtml(u.username)}')" data-user-id="${u.id}">
                <div class="user-card-avatar">${u.username.charAt(0).toUpperCase()}</div>
                <div class="user-card-name">${escapeHtml(u.username)}</div>
                <div class="user-card-role ${u.role}">${u.role}</div>
            </div>`).join('');

        // Show add user button only for owners with seats remaining
        const session = getSession();
        const isOwner = session && session.role === 'owner';
        const usersMax = getUsersMax();
        divider.style.display = (isOwner && users.length < usersMax) ? 'block' : 'none';
    }

    // Store pending action for after login
    if (pendingAction) window._pendingAction = pendingAction;
}

function getUsersMax() {
    const tier = localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo';
    return { solo: 1, team: 10, business: 25 }[tier] || 1;
}

// ==================== TIER FEATURE GATES ====================
function getTier() { return localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo'; }
function canUseInventory() { const t = getTier(); return t === 'team' || t === 'business'; }
function canUseExpenses()  { const t = getTier(); return t === 'team' || t === 'business'; }
function canUseQuotes()    { const t = getTier(); return t === 'team' || t === 'business'; }

function requireTierFeature(featureName) {
    showToast(`${featureName} is available on Team & Business plans. Upgrade to unlock.`, 'info');
    showPaywall('upgrade');
}

// ==================== PRODUCTS / INVENTORY ====================
function getProducts() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]'); } catch(e) { return []; }
}
function saveProducts(products) {
    try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); return true; } catch(e) { showToast('Storage full.','error'); return false; }
}

let currentProduct = null;
function loadInventory() {
    if (!canUseInventory()) { requireTierFeature('Inventory Management'); return; }
    const products = getProducts();
    const sym = getCurrencySymbol();
    const lowStock = products.filter(p => p.trackStock && p.stockQty <= p.lowStockAlert);
    const container = document.getElementById('inventory-page');
    if (!container) return;

    const alertBanner = lowStock.length > 0
        ? `<div class="low-stock-banner">⚠️ ${lowStock.length} product${lowStock.length>1?'s':''} running low on stock: ${lowStock.map(p=>`<strong>${escapeHtml(p.name)}</strong>`).join(', ')}</div>`
        : '';

    const totalValue = products.reduce((s,p) => s + (p.trackStock ? (p.stockQty||0)*(p.costPrice||0) : 0), 0);

    container.querySelector('.content').innerHTML = `
        ${alertBanner}
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${products.length}</div></div>
            <div class="stat-card"><div class="stat-label">Low Stock Items</div><div class="stat-value" style="${lowStock.length>0?'color:var(--danger)':''}">${lowStock.length}</div></div>
            <div class="stat-card"><div class="stat-label">Inventory Value</div><div class="stat-value">${formatCurrency(totalValue)}</div></div>
        </div>
        <div class="section-header">
            <div class="section-title">Product Catalogue</div>
            <button class="btn btn-primary" onclick="openProductModal()">+ Add Product</button>
        </div>
        ${products.length === 0 ? `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">No products yet</div><div class="empty-sub">Add products to your catalogue so you can pick them quickly when creating invoices.</div><button class="btn btn-primary" onclick="openProductModal()">+ Add First Product</button></div>` : `
        <table class="invoice-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Sell Price</th><th>Cost Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${products.map(p => {
                const stockStatus = !p.trackStock ? '<span class="badge">Service</span>'
                    : p.stockQty <= 0 ? '<span class="badge badge-danger">Out of stock</span>'
                    : p.stockQty <= p.lowStockAlert ? '<span class="badge badge-warning">Low stock</span>'
                    : '<span class="badge badge-success">In stock</span>';
                return `<tr>
                    <td><strong>${escapeHtml(p.name)}</strong>${p.description?`<br><small style="color:var(--text-muted)">${escapeHtml(p.description)}</small>`:''}</td>
                    <td><code>${escapeHtml(p.sku||'—')}</code></td>
                    <td>${formatCurrency(p.sellPrice||0)}</td>
                    <td>${p.costPrice?formatCurrency(p.costPrice):'—'}</td>
                    <td>${p.trackStock ? `<strong>${p.stockQty}</strong> units` : '—'}</td>
                    <td>${stockStatus}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
                    </td>
                </tr>`;
            }).join('')}</tbody>
        </table>`}`;
}

function openProductModal(productId = null) {
    currentProduct = productId ? getProducts().find(p=>p.id===productId) : null;
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    document.getElementById('product-modal-title').textContent = currentProduct ? 'Edit Product' : 'Add Product';
    document.getElementById('product-name').value = currentProduct?.name || '';
    document.getElementById('product-sku').value = currentProduct?.sku || '';
    document.getElementById('product-description').value = currentProduct?.description || '';
    document.getElementById('product-sell-price').value = currentProduct?.sellPrice || '';
    document.getElementById('product-cost-price').value = currentProduct?.costPrice || '';
    document.getElementById('product-track-stock').checked = currentProduct?.trackStock ?? true;
    document.getElementById('product-stock-qty').value = currentProduct?.stockQty ?? 0;
    document.getElementById('product-low-stock').value = currentProduct?.lowStockAlert ?? 5;
    toggleStockFields();
    modal.classList.add('active');
}

function toggleStockFields() {
    const track = document.getElementById('product-track-stock').checked;
    document.getElementById('stock-fields').style.display = track ? '' : 'none';
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    currentProduct = null;
}

function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const sellPrice = parseFloat(document.getElementById('product-sell-price').value);
    if (!name || isNaN(sellPrice)) { showToast('Product name and sell price are required.','error'); return; }
    const trackStock = document.getElementById('product-track-stock').checked;
    const product = {
        id: currentProduct ? currentProduct.id : generateId(),
        name,
        sku: document.getElementById('product-sku').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        sellPrice,
        costPrice: parseFloat(document.getElementById('product-cost-price').value) || 0,
        trackStock,
        stockQty: trackStock ? parseInt(document.getElementById('product-stock-qty').value)||0 : null,
        lowStockAlert: trackStock ? parseInt(document.getElementById('product-low-stock').value)||5 : null,
        createdAt: currentProduct ? currentProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const products = getProducts();
    if (currentProduct) {
        const idx = products.findIndex(p=>p.id===product.id);
        if (idx !== -1) products[idx] = product;
    } else { products.push(product); }
    if (saveProducts(products)) { closeProductModal(); loadInventory(); showToast('Product saved!'); }
}

function editProduct(id) { openProductModal(id); }
function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const products = getProducts().filter(p=>p.id!==id);
    saveProducts(products); loadInventory(); showToast('Product deleted.');
}

// Deduct stock when invoice is marked paid
function deductStockForInvoice(invoice) {
    if (!canUseInventory()) return;
    const products = getProducts();
    let changed = false;
    invoice.items.forEach(item => {
        const match = products.find(p => p.name.toLowerCase() === item.description.toLowerCase() && p.trackStock);
        if (match) {
            match.stockQty = Math.max(0, (match.stockQty||0) - item.quantity);
            changed = true;
        }
    });
    if (changed) saveProducts(products);
}

// Show product picker inside invoice form
function showProductPicker(rowEl) {
    if (!canUseInventory()) return;
    const products = getProducts();
    if (products.length === 0) { showToast('No products in catalogue yet. Add products in Inventory.','info'); return; }
    const existing = document.getElementById('product-picker-dropdown');
    if (existing) existing.remove();
    const dropdown = document.createElement('div');
    dropdown.id = 'product-picker-dropdown';
    dropdown.className = 'product-picker-dropdown';
    dropdown.innerHTML = products.map(p =>
        `<div class="product-picker-item" onclick="selectProductForRow(this,'${p.id}')">
            <strong>${escapeHtml(p.name)}</strong>
            <span>${formatCurrency(p.sellPrice)}${p.trackStock?' · '+p.stockQty+' in stock':''}</span>
        </div>`).join('');
    rowEl.querySelector('.item-description').parentNode.appendChild(dropdown);
    dropdown._row = rowEl;
    setTimeout(()=>document.addEventListener('click', ()=>dropdown.remove(), {once:true}), 50);
}

function selectProductForRow(itemEl, productId) {
    const product = getProducts().find(p=>p.id===productId);
    if (!product) return;
    const dropdown = document.getElementById('product-picker-dropdown');
    const row = dropdown?._row || itemEl.closest('.item-row');
    if (!row) return;
    row.querySelector('.item-description').value = product.name;
    row.querySelector('.item-price').value = product.sellPrice;
    calculateItemTotal(row);
    calculateInvoiceTotal();
    dropdown?.remove();
}

// ==================== EXPENSES ====================
function getExpenses() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]'); } catch(e) { return []; }
}
function saveExpenses(expenses) {
    try { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); return true; } catch(e) { showToast('Storage full.','error'); return false; }
}

const EXPENSE_CATEGORIES = ['Rent','Utilities','Salaries','Supplies','Transport','Marketing','Equipment','Taxes','Insurance','Other'];
let currentExpense = null;

function loadExpenses() {
    if (!canUseExpenses()) { requireTierFeature('Expense Tracking'); return; }
    const expenses = getExpenses();
    const sym = getCurrencySymbol();
    const now = new Date();
    const thisMonth = expenses.filter(e => { const d=new Date(e.date); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); });
    const totalThisMonth = thisMonth.reduce((s,e)=>s+e.amount,0);
    const totalAll = expenses.reduce((s,e)=>s+e.amount,0);
    const byCategory = {};
    expenses.forEach(e=>{ byCategory[e.category]=(byCategory[e.category]||0)+e.amount; });
    const topCategory = Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0];

    const container = document.getElementById('expenses-page');
    if (!container) return;
    container.querySelector('.content').innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-card"><div class="stat-label">This Month</div><div class="stat-value">${formatCurrency(totalThisMonth)}</div></div>
            <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value">${formatCurrency(totalAll)}</div></div>
            <div class="stat-card"><div class="stat-label">Top Category</div><div class="stat-value" style="font-size:18px">${topCategory?topCategory[0]:'—'}</div></div>
        </div>
        <div class="section-header">
            <div class="section-title">Expense Log</div>
            <button class="btn btn-primary" onclick="openExpenseModal()">+ Add Expense</button>
        </div>
        ${expenses.length===0 ? `<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">No expenses logged</div><div class="empty-sub">Track your business expenses to understand your true profit margins.</div><button class="btn btn-primary" onclick="openExpenseModal()">+ Log First Expense</button></div>` : `
        <table class="invoice-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Paid via</th><th>Actions</th></tr></thead>
            <tbody>${expenses.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=>`<tr>
                <td>${formatDate(e.date)}</td>
                <td>${escapeHtml(e.description)}</td>
                <td><span class="badge">${escapeHtml(e.category)}</span></td>
                <td><strong>${formatCurrency(e.amount)}</strong></td>
                <td>${escapeHtml(e.paymentMethod||'—')}</td>
                <td style="white-space:nowrap">
                    <button class="btn btn-secondary btn-sm" onclick="editExpense('${e.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e.id}')">Delete</button>
                </td>
            </tr>`).join('')}</tbody>
        </table>`}`;
}

function openExpenseModal(expenseId=null) {
    currentExpense = expenseId ? getExpenses().find(e=>e.id===expenseId) : null;
    const modal = document.getElementById('expense-modal');
    if (!modal) return;
    document.getElementById('expense-modal-title').textContent = currentExpense ? 'Edit Expense' : 'Log Expense';
    document.getElementById('expense-description').value = currentExpense?.description||'';
    document.getElementById('expense-amount').value = currentExpense?.amount||'';
    document.getElementById('expense-date').value = currentExpense?.date||today();
    document.getElementById('expense-category').value = currentExpense?.category||'Other';
    document.getElementById('expense-payment-method').value = currentExpense?.paymentMethod||'Cash';
    document.getElementById('expense-notes').value = currentExpense?.notes||'';
    modal.classList.add('active');
}
function closeExpenseModal() { document.getElementById('expense-modal').classList.remove('active'); currentExpense=null; }
function editExpense(id) { openExpenseModal(id); }
function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    saveExpenses(getExpenses().filter(e=>e.id!==id)); loadExpenses(); showToast('Expense deleted.');
}
function saveExpense() {
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    if (!description || isNaN(amount) || !date) { showToast('Description, amount, and date are required.','error'); return; }
    const expense = {
        id: currentExpense ? currentExpense.id : generateId(),
        description, amount, date,
        category: document.getElementById('expense-category').value,
        paymentMethod: document.getElementById('expense-payment-method').value,
        notes: document.getElementById('expense-notes').value.trim(),
        createdBy: getSession()?.username || 'owner',
        createdAt: currentExpense ? currentExpense.createdAt : new Date().toISOString()
    };
    const expenses = getExpenses();
    if (currentExpense) { const idx=expenses.findIndex(e=>e.id===expense.id); if(idx!==-1) expenses[idx]=expense; }
    else expenses.push(expense);
    if (saveExpenses(expenses)) { closeExpenseModal(); loadExpenses(); showToast('Expense saved!'); }
}

// ==================== QUOTES / ESTIMATES ====================
function getQuotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTES) || '[]'); } catch(e) { return []; }
}
function saveQuotes(quotes) {
    try { localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes)); return true; } catch(e) { showToast('Storage full.','error'); return false; }
}

let currentQuote = null;
function loadQuotes() {
    if (!canUseQuotes()) { requireTierFeature('Quotes & Estimates'); return; }
    const quotes = getQuotes();
    const container = document.getElementById('quotes-page');
    if (!container) return;
    const pending = quotes.filter(q=>q.status==='pending').length;
    const accepted = quotes.filter(q=>q.status==='accepted').length;
    const totalValue = quotes.filter(q=>q.status==='pending').reduce((s,q)=>s+q.total,0);

    container.querySelector('.content').innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-card"><div class="stat-label">Total Quotes</div><div class="stat-value">${quotes.length}</div></div>
            <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${pending}</div></div>
            <div class="stat-card"><div class="stat-label">Accepted</div><div class="stat-value" style="color:var(--success)">${accepted}</div></div>
            <div class="stat-card"><div class="stat-label">Pipeline Value</div><div class="stat-value">${formatCurrency(totalValue)}</div></div>
        </div>
        <div class="section-header">
            <div class="section-title">Quotes & Estimates</div>
            <button class="btn btn-primary" onclick="openQuoteModal()">+ New Quote</button>
        </div>
        ${quotes.length===0 ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No quotes yet</div><div class="empty-sub">Create quotes to send clients before they commit. Convert accepted quotes to invoices in one click.</div><button class="btn btn-primary" onclick="openQuoteModal()">+ Create First Quote</button></div>` : `
        <table class="invoice-table">
            <thead><tr><th>Quote #</th><th>Client</th><th>Date</th><th>Valid Until</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${quotes.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(q=>{
                const statusColors={pending:'',accepted:'badge-success',declined:'badge-danger',expired:'badge-warning'};
                return `<tr>
                    <td><strong>${escapeHtml(q.number)}</strong></td>
                    <td>${escapeHtml(q.customerName)}</td>
                    <td>${formatDate(q.date)}</td>
                    <td>${formatDate(q.validUntil)}</td>
                    <td><strong>${formatCurrency(q.total)}</strong></td>
                    <td><span class="badge ${statusColors[q.status]||''}">${q.status}</span></td>
                    <td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">
                        <button class="btn btn-secondary btn-sm" onclick="viewQuote('${q.id}')">View</button>
                        ${q.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="convertQuoteToInvoice('${q.id}')">→ Invoice</button>`:''}
                        <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q.id}')">Delete</button>
                    </td>
                </tr>`;
            }).join('')}</tbody>
        </table>`}`;
}

function openQuoteModal(quoteId=null) {
    currentQuote = quoteId ? getQuotes().find(q=>q.id===quoteId) : null;
    const modal = document.getElementById('quote-modal');
    if (!modal) return;
    document.getElementById('quote-modal-title').textContent = currentQuote ? 'Edit Quote' : 'New Quote';
    document.getElementById('quote-number').value = currentQuote?.number || generateQuoteNumber();
    document.getElementById('quote-customer-name').value = currentQuote?.customerName||'';
    document.getElementById('quote-customer-email').value = currentQuote?.customerEmail||'';
    document.getElementById('quote-customer-phone').value = currentQuote?.customerPhone||'';
    document.getElementById('quote-date').value = currentQuote?.date||today();
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate()+30);
    document.getElementById('quote-valid-until').value = currentQuote?.validUntil||validUntil.toISOString().split('T')[0];
    document.getElementById('quote-notes').value = currentQuote?.notes||'';
    const itemsContainer = document.getElementById('quote-items-container');
    if (currentQuote && currentQuote.items.length>0) {
        itemsContainer.innerHTML = currentQuote.items.map(item=>`
            <div class="item-row">
                <div class="form-group"><input type="text" class="form-input item-description" value="${escapeHtml(item.description)}"></div>
                <div class="form-group"><input type="number" class="form-input item-quantity" value="${item.quantity}" min="1"></div>
                <div class="form-group"><input type="number" class="form-input item-price" value="${item.price}" step="0.01" min="0"></div>
                <div class="form-group"><input type="number" class="form-input item-total" value="${item.total}" readonly></div>
                <button type="button" class="remove-item-btn" onclick="removeQuoteItem(this)">×</button>
            </div>`).join('');
    } else {
        itemsContainer.innerHTML = `<div class="item-row">
            <div class="form-group"><input type="text" class="form-input item-description" placeholder="Description"></div>
            <div class="form-group"><input type="number" class="form-input item-quantity" placeholder="Qty" value="1" min="1"></div>
            <div class="form-group"><input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0"></div>
            <div class="form-group"><input type="number" class="form-input item-total" placeholder="Total" readonly></div>
            <button type="button" class="remove-item-btn" onclick="removeQuoteItem(this)" style="visibility:hidden">×</button>
        </div>`;
    }
    calculateQuoteTotal();
    modal.classList.add('active');
}
function closeQuoteModal() { document.getElementById('quote-modal').classList.remove('active'); currentQuote=null; }

function generateQuoteNumber() {
    const year = new Date().getFullYear();
    const quotes = getQuotes();
    return `QTE-${year}-${String(quotes.length+1).padStart(4,'0')}`;
}

function addQuoteItem() {
    const container = document.getElementById('quote-items-container');
    const row = document.createElement('div'); row.className='item-row';
    row.innerHTML=`<div class="form-group"><input type="text" class="form-input item-description" placeholder="Description"></div>
        <div class="form-group"><input type="number" class="form-input item-quantity" placeholder="Qty" value="1" min="1"></div>
        <div class="form-group"><input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0"></div>
        <div class="form-group"><input type="number" class="form-input item-total" placeholder="Total" readonly></div>
        <button type="button" class="remove-item-btn" onclick="removeQuoteItem(this)">×</button>`;
    container.appendChild(row);
    container.querySelectorAll('.item-row').forEach((r,i)=>{ r.querySelector('.remove-item-btn').style.visibility=i===0&&container.children.length===1?'hidden':'visible'; });
    row.querySelectorAll('.item-quantity,.item-price').forEach(inp=>inp.addEventListener('input',()=>{ calculateItemTotal(row); calculateQuoteTotal(); }));
}
function removeQuoteItem(btn) {
    const container = document.getElementById('quote-items-container');
    if (container.children.length>1) { btn.closest('.item-row').remove(); calculateQuoteTotal(); }
}
function calculateQuoteTotal() {
    const settings = getSettings(); const taxRate=(settings.taxRate||0)/100;
    let subtotal=0;
    document.querySelectorAll('#quote-items-container .item-row').forEach(row=>{
        const qty=parseFloat(row.querySelector('.item-quantity').value)||0;
        const price=parseFloat(row.querySelector('.item-price').value)||0;
        const total=qty*price; row.querySelector('.item-total').value=total.toFixed(2); subtotal+=total;
    });
    const tax=subtotal*taxRate; const sym=getCurrencySymbol();
    const subEl=document.getElementById('quote-subtotal'); const taxEl=document.getElementById('quote-tax'); const totEl=document.getElementById('quote-total');
    if(subEl) subEl.textContent=`${sym}${subtotal.toFixed(2)}`;
    if(taxEl) taxEl.textContent=`${sym}${tax.toFixed(2)}`;
    if(totEl) totEl.textContent=`${sym}${(subtotal+tax).toFixed(2)}`;
}

function saveQuote() {
    const number=document.getElementById('quote-number').value.trim();
    const customerName=document.getElementById('quote-customer-name').value.trim();
    const date=document.getElementById('quote-date').value;
    const validUntil=document.getElementById('quote-valid-until').value;
    if (!number||!customerName||!date) { showToast('Quote number, client name and date are required.','error'); return; }
    const items=[];
    document.querySelectorAll('#quote-items-container .item-row').forEach(row=>{
        const description=row.querySelector('.item-description').value.trim();
        const quantity=parseFloat(row.querySelector('.item-quantity').value);
        const price=parseFloat(row.querySelector('.item-price').value);
        if(description&&quantity>0&&price>=0) items.push({description,quantity,price,total:quantity*price});
    });
    if(items.length===0) { showToast('Add at least one item.','error'); return; }
    const subtotal=items.reduce((s,i)=>s+i.total,0);
    const settings=getSettings(); const taxRate=(settings.taxRate||0)/100;
    const tax=subtotal*taxRate; const total=subtotal+tax;
    const quote={
        id: currentQuote?currentQuote.id:generateId(), number, customerName,
        customerEmail: document.getElementById('quote-customer-email').value.trim(),
        customerPhone: document.getElementById('quote-customer-phone').value.trim(),
        date, validUntil, items, subtotal, tax, total,
        notes: document.getElementById('quote-notes').value.trim(),
        status: currentQuote?currentQuote.status:'pending',
        createdAt: currentQuote?currentQuote.createdAt:new Date().toISOString()
    };
    const quotes=getQuotes();
    if(currentQuote) { const idx=quotes.findIndex(q=>q.id===quote.id); if(idx!==-1) quotes[idx]=quote; } else quotes.push(quote);
    if(saveQuotes(quotes)) { closeQuoteModal(); loadQuotes(); showToast('Quote saved!'); }
}

function viewQuote(id) {
    const quote=getQuotes().find(q=>q.id===id);
    if(!quote) return;
    const sym=getCurrencySymbol();
    const actions = quote.status==='pending' ? `
        <div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-primary" onclick="convertQuoteToInvoice('${id}');closeViewModal()">→ Convert to Invoice</button>
            <button class="btn btn-success" onclick="updateQuoteStatus('${id}','accepted');closeViewModal()">✓ Mark Accepted</button>
            <button class="btn btn-danger" onclick="updateQuoteStatus('${id}','declined');closeViewModal()">✗ Mark Declined</button>
        </div>` : '';
    const preview=document.getElementById('invoice-preview');
    if(!preview) return;
    preview.innerHTML=`<div style="padding:20px">
        <h2 style="margin-bottom:4px">QUOTE — ${escapeHtml(quote.number)}</h2>
        <p style="color:var(--text-muted)">Status: <strong>${quote.status}</strong> · Valid until: ${formatDate(quote.validUntil)}</p>
        <p><strong>${escapeHtml(quote.customerName)}</strong>${quote.customerEmail?`<br>${escapeHtml(quote.customerEmail)}`:''}</p>
        <table class="invoice-table" style="margin-top:16px">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${quote.items.map(i=>`<tr><td>${escapeHtml(i.description)}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td><td>${formatCurrency(i.total)}</td></tr>`).join('')}</tbody>
        </table>
        <div style="text-align:right;margin-top:12px">
            <div>Subtotal: ${formatCurrency(quote.subtotal)}</div>
            <div>Tax: ${formatCurrency(quote.tax)}</div>
            <div style="font-size:18px;font-weight:700;margin-top:4px">Total: ${formatCurrency(quote.total)}</div>
        </div>
        ${quote.notes?`<p style="margin-top:12px;color:var(--text-muted)">${escapeHtml(quote.notes)}</p>`:''}
        ${actions}
    </div>`;
    document.getElementById('view-modal').classList.add('active');
}

function updateQuoteStatus(id, status) {
    const quotes=getQuotes();
    const q=quotes.find(q=>q.id===id);
    if(q) { q.status=status; saveQuotes(quotes); loadQuotes(); showToast(`Quote marked as ${status}.`); }
}

function deleteQuote(id) {
    if(!confirm('Delete this quote?')) return;
    saveQuotes(getQuotes().filter(q=>q.id!==id)); loadQuotes(); showToast('Quote deleted.');
}

function convertQuoteToInvoice(quoteId) {
    const quote=getQuotes().find(q=>q.id===quoteId);
    if(!quote) return;
    if(!checkInvoiceTrialLimit()) return;
    const settings=getSettings(); const taxRate=(settings.taxRate||0)/100;
    const subtotal=quote.items.reduce((s,i)=>s+i.total,0);
    const tax=subtotal*taxRate;
    const dueDate=new Date(); dueDate.setDate(dueDate.getDate()+30);
    const invoice={
        id: generateId(), number: commitNextInvoiceNumber(), status:'pending',
        date: today(), dueDate: dueDate.toISOString().split('T')[0],
        customerName: quote.customerName, customerEmail: quote.customerEmail||'',
        customerPhone: quote.customerPhone||'', customerAddress:'',
        items: quote.items, subtotal, tax, total: subtotal+tax,
        notes: quote.notes||'', convertedFromQuote: quoteId,
        createdBy: getSession()?.username||'owner',
        createdByRole: getSession()?.role||'owner',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    const invoices=getInvoices(); invoices.push(invoice);
    if(saveInvoices(invoices)) {
        updateQuoteStatus(quoteId,'accepted');
        showToast('Quote converted to invoice!');
        navigateToPage('invoices');
    }
}


let _selectedUserId = null;

function selectUserCard(userId, username) {
    _selectedUserId = userId;
    document.getElementById('user-select-view').style.display = 'none';
    document.getElementById('user-password-view').style.display = 'block';
    document.getElementById('user-login-sub').textContent = `Welcome, ${username}`;
    document.getElementById('selected-user-display').innerHTML =
        `<div class="selected-user-avatar">${username.charAt(0).toUpperCase()}</div>
         <div class="selected-user-name">${escapeHtml(username)}</div>`;
    document.getElementById('user-password-input').value = '';
    document.getElementById('user-login-error').textContent = '';
    document.getElementById('user-login-btn-text').textContent = '→ Sign In';
    setTimeout(() => document.getElementById('user-password-input').focus(), 100);

    document.getElementById('user-password-input').onkeydown = (e) => {
        if (e.key === 'Enter') submitUserLogin();
    };
}

async function submitUserLogin() {
    const password = document.getElementById('user-password-input').value;
    const errorEl  = document.getElementById('user-login-error');
    const btnText  = document.getElementById('user-login-btn-text');

    if (!password) { errorEl.textContent = 'Please enter your password.'; return; }

    btnText.textContent = 'Signing in...';
    errorEl.textContent = '';

    const users = getUsers();
    const user  = users.find(u => u.id === _selectedUserId);
    if (!user) { errorEl.textContent = 'User not found.'; btnText.textContent = '→ Sign In'; return; }

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) {
        errorEl.textContent = 'Incorrect password. Please try again.';
        btnText.textContent = '→ Sign In';
        document.getElementById('user-password-input').value = '';
        document.getElementById('user-password-input').focus();
        return;
    }

    saveSession({ userId: user.id, username: user.username, role: user.role, loginAt: new Date().toISOString() });
    launchMainApp(window._pendingAction || null);
}

function launchMainApp(action) {
    document.getElementById('user-login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    // Privacy notice first run
    if (!localStorage.getItem(STORAGE_KEYS.PRIVACY_ACK)) {
        document.getElementById('privacy-notice').classList.add('visible');
    }

    // Show license info in sidebar ONLY when actually licensed
    if (isLicensed()) {
        const email      = localStorage.getItem(STORAGE_KEYS.LICENSE_EMAIL) || 'Verified';
        const devices    = localStorage.getItem(STORAGE_KEYS.LICENSE_DEVICES) || '';
        const emailShort = email.length > 28 ? email.substring(0, 25) + '...' : email;

        const licStatus = document.getElementById('sidebar-license-status');
        const licEmail  = document.getElementById('sidebar-license-email');
        const licEmailText = document.getElementById('sidebar-email-text');
        if (licStatus)    licStatus.style.display    = 'flex';
        if (licEmail)     licEmail.style.display     = 'flex';
        if (licEmailText) licEmailText.textContent   = emailShort;

        const settingsEmail   = document.getElementById('settings-license-email');
        const settingsDevices = document.getElementById('settings-device-count');
        if (settingsEmail)   settingsEmail.textContent   = `Licensed to: ${email}`;
        if (settingsDevices && devices) settingsDevices.textContent = `${devices} users`;
    } else {
        // Trial mode — hide license-related elements in settings
        const settingsLicSection = document.querySelector('.settings-section:has(#settings-license-email)');
        // Keep deactivate button hidden in trial; show upgrade button instead
        const deactivateBtn = document.querySelector('[onclick="deactivateLicense()"]');
        if (deactivateBtn) deactivateBtn.style.display = 'none';
    }

    // Apply role-based UI
    const session = getSession();
    applyRolePermissions(session ? session.role : 'cashier');

    // Update sidebar user card
    updateSidebarUser();

    // Show cashier badge on dashboard
    if (session && session.role === 'cashier') {
        const badge = document.getElementById('cashier-header-badge');
        if (badge) { badge.textContent = `👤 ${session.username}`; badge.style.display = 'inline-flex'; }
    }

    // Initialize app
    initApp();

    // Show trial banner if not yet licensed
    renderTrialBanner();

    // Handle PWA shortcut actions
    if (action === 'new-invoice') {
        setTimeout(() => openInvoiceModal(), 300);
    } else if (action === 'customers') {
        navigateToPage('customers');
    } else if (action === 'reports') {
        navigateToPage('reports');
    }
}

function applyRolePermissions(role) {
    const isOwner = role === 'owner';
    document.querySelectorAll('.owner-only').forEach(el => {
        el.style.display = isOwner ? '' : 'none';
    });
    // Show Business Tools nav section for team/business tiers
    const teamFeatureEls = document.querySelectorAll('.team-feature');
    const showFeatures = canUseInventory(); // team or business
    teamFeatureEls.forEach(el => { el.style.display = showFeatures ? '' : 'none'; });
}

function updateSidebarUser() {
    const session = getSession();
    if (!session) return;
    const avatar = document.getElementById('sidebar-user-avatar');
    const name   = document.getElementById('sidebar-user-name');
    const role   = document.getElementById('sidebar-user-role');
    if (avatar) avatar.textContent = session.username.charAt(0).toUpperCase();
    if (name)   name.textContent   = session.username;
    if (role)   role.textContent   = session.role;
}

function switchUser() {
    clearSession();
    window.location.reload();
}

// ==================== USER MANAGEMENT (owner) ====================

let editingUserId = null;

function openAddUserModal(forceOwner = false) {
    editingUserId = null;
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('user-form-username').value = '';
    document.getElementById('user-form-password').value = '';
    document.getElementById('user-form-password2').value = '';
    document.getElementById('user-form-role').value = forceOwner ? 'owner' : 'cashier';
    document.getElementById('user-form-role').disabled = forceOwner; // can't change on first owner
    document.getElementById('user-form-error').textContent = '';
    document.getElementById('user-modal').classList.add('active');
}

function openEditUserModal(userId) {
    const users = getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) return;
    editingUserId = userId;
    document.getElementById('user-modal-title').textContent = 'Edit User';
    document.getElementById('user-form-username').value = user.username;
    document.getElementById('user-form-password').value = '';
    document.getElementById('user-form-password2').value = '';
    document.getElementById('user-form-role').value = user.role;
    document.getElementById('user-form-role').disabled = false;
    document.getElementById('user-form-error').textContent = '';
    document.getElementById('user-modal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
    editingUserId = null;
}

async function saveUser() {
    const username  = document.getElementById('user-form-username').value.trim();
    const password  = document.getElementById('user-form-password').value;
    const password2 = document.getElementById('user-form-password2').value;
    const role      = document.getElementById('user-form-role').value;
    const errorEl   = document.getElementById('user-form-error');

    errorEl.textContent = '';

    if (!username || username.length < 2) { errorEl.textContent = 'Username must be at least 2 characters.'; return; }
    if (!editingUserId && (!password || password.length < 4)) { errorEl.textContent = 'Password must be at least 4 characters.'; return; }
    if (password && password !== password2) { errorEl.textContent = 'Passwords do not match.'; return; }

    const users = getUsers();

    if (editingUserId) {
        // Edit existing
        const idx = users.findIndex(u => u.id === editingUserId);
        if (idx === -1) return;
        // Check duplicate username (excluding self)
        if (users.some(u => u.id !== editingUserId && u.username.toLowerCase() === username.toLowerCase())) {
            errorEl.textContent = 'That username is already taken.'; return;
        }
        users[idx].username = username;
        users[idx].role = role;
        if (password) users[idx].passwordHash = await hashPassword(password);
        users[idx].updatedAt = new Date().toISOString();
    } else {
        // Check seat limit
        const maxUsers = getUsersMax();
        if (users.length >= maxUsers) {
            errorEl.textContent = `Your license allows up to ${maxUsers} user(s). Upgrade to add more.`; return;
        }
        // Check duplicate username
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            errorEl.textContent = 'That username is already taken.'; return;
        }
        users.push({
            id: generateId(), username, role,
            passwordHash: await hashPassword(password),
            createdAt: new Date().toISOString()
        });
    }

    saveUsers(users);
    closeUserModal();
    loadUsersManagementList();
    showToast(editingUserId ? 'User updated.' : 'User added.');

    // If this was the first user (owner setup), proceed to login
    if (users.length === 1) {
        showUserSelectView();
    }
}

async function deleteUser(userId) {
    const session = getSession();
    if (session && session.userId === userId) { alert("You can't delete the currently logged-in user."); return; }
    if (!confirm('Delete this user? Their invoices will remain but they will no longer be able to log in.')) return;
    const users = getUsers().filter(u => u.id !== userId);
    saveUsers(users);
    loadUsersManagementList();
    showToast('User deleted.');
}

function loadUsersManagementList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;
    const users = getUsers();
    const maxUsers = getUsersMax();
    const seatCount = document.getElementById('user-seat-count');
    if (seatCount) seatCount.textContent = ` (${users.length}/${maxUsers} seats used)`;

    if (users.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No users yet.</p>';
        return;
    }

    container.innerHTML = `
        <div class="users-management-table">
            <div class="users-table-header">
                <span>Username</span><span>Role</span><span>Added</span><span>Actions</span>
            </div>
            ${users.map(u => `
                <div class="users-table-row">
                    <span class="user-table-avatar-name">
                        <span class="user-mini-avatar">${u.username.charAt(0).toUpperCase()}</span>
                        ${escapeHtml(u.username)}
                    </span>
                    <span><span class="user-role-badge ${u.role}">${u.role}</span></span>
                    <span style="color:var(--text-muted);font-size:13px;">${formatDate(u.createdAt)}</span>
                    <span style="display:flex;gap:8px;">
                        <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="openEditUserModal('${u.id}')">Edit</button>
                        <button class="btn btn-danger" style="padding:6px 12px;font-size:12px;" onclick="deleteUser('${u.id}')">Delete</button>
                    </span>
                </div>`).join('')}
        </div>`;
}

// ==================== PRIVACY =====================

function acknowledgePrivacy() {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_ACK, '1');
    document.getElementById('privacy-notice').classList.remove('visible');
}

// ==================== APP INITIALIZATION ====================

function initApp() {
    // Restore session into global
    currentSession = getSession();

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];

    generateInvoiceNumber();
    loadSettings();
    applyTheme();
    renderFooter();
    loadInvoices();
    updateDashboard();
    loadCustomers();
    loadUsersManagementList();
    setupEventListeners();
    setupNavigation();
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function () {
            navigateToPage(this.getAttribute('data-page'));
        });
    });
}

function navigateToPage(pageName) {
    // Block cashiers from restricted pages
    const session = getSession();
    const restrictedPages = ['customers', 'reports', 'settings', 'expenses'];
    if (session && session.role === 'cashier' && restrictedPages.includes(pageName)) {
        showToast('Access restricted to owner only.', 'error');
        return;
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-page') === pageName);
    });

    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));

    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) selectedPage.classList.remove('hidden');

    if (pageName === 'invoices') loadInvoices();
    else if (pageName === 'dashboard') updateDashboard();
    else if (pageName === 'customers') loadCustomers();
    else if (pageName === 'reports') loadReports();
    else if (pageName === 'settings') loadUsersManagementList();
    else if (pageName === 'inventory') loadInventory();
    else if (pageName === 'expenses') loadExpenses();
    else if (pageName === 'quotes') loadQuotes();
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', filterInvoices);
    document.getElementById('status-filter').addEventListener('change', filterInvoices);

    const customerSearchInput = document.getElementById('customer-search-input');
    if (customerSearchInput) customerSearchInput.addEventListener('input', filterCustomers);

    document.getElementById('items-container').addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            calculateItemTotal(e.target.closest('.item-row'));
            calculateInvoiceTotal();
        }
    });

    // Customer name autocomplete
    const customerNameInput = document.getElementById('customer-name');
    customerNameInput.addEventListener('input', function () {
        showCustomerSuggestions(this.value);
    });

    // Quote items live calculation
    const quoteItemsContainer = document.getElementById('quote-items-container');
    if (quoteItemsContainer) {
        quoteItemsContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
                calculateItemTotal(e.target.closest('.item-row'));
                calculateQuoteTotal();
            }
        });
    }

    // Email settings toggle
    const emailToggle = document.getElementById('collect-emails-toggle');
    if (emailToggle) {
        emailToggle.addEventListener('change', function () {
            document.getElementById('email-settings-container').style.display = this.checked ? 'block' : 'none';
        });
    }

    // Theme preview
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', function () {
            applyTheme(this.value);
        });
    }
}

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

// ==================== STORAGE FUNCTIONS ====================

// Returns only invoices the current user is allowed to see:
//   owner → all invoices
//   cashier → only their own
function getVisibleInvoices() {
    const all = getInvoices();
    const session = getSession();
    if (!session || session.role === 'owner') return all;
    return all.filter(inv => inv.createdBy === session.username);
}


function getInvoices() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveInvoices(invoices) {
    try {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        return true;
    } catch (e) {
        alert('Failed to save. Your browser storage may be full.');
        return false;
    }
}

function getSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            currency: 'NGN', currencySymbol: '₦', theme: 'dark',
            taxRate: 10, dateFormat: 'us',
            companyName: '', companyAddress: '', companyEmail: '',
            companyPhone: '', companyWebsite: '', companyTaxId: '',
            bankName: '', accountName: '', accountNumber: '',
            routingNumber: '', swiftCode: '', iban: '',
            footerCompanyName: 'GIT System Software', footerTagline: '',
            footerTermsUrl: '', footerPrivacyUrl: '', footerSupportUrl: '',
            collectEmails: false,
            emailConsentMessage: 'I agree to receive promotional emails. You can unsubscribe at any time.'
        };
    } catch (e) {
        return {};
    }
}

function saveSettingsData(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (e) {
        return false;
    }
}

function getLogo() { return localStorage.getItem(STORAGE_KEYS.LOGO); }

function saveLogo(logoData) {
    try { localStorage.setItem(STORAGE_KEYS.LOGO, logoData); return true; }
    catch (e) { return false; }
}

function getCustomers() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveCustomers(customers) {
    try {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        return true;
    } catch (e) {
        alert('Failed to save customers.');
        return false;
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
                            <td><strong>${inv.number}</strong></td>
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
                            <div class="icm-number">${inv.number}</div>
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

    // Extra dashboard widgets for team/business tiers
    updateDashboardExtras(invoices);

    loadInvoices();
}

function updateDashboardExtras(invoices) {
    const extrasEl = document.getElementById('dashboard-extras');
    if (!extrasEl) return;
    if (!canUseInventory()) { extrasEl.innerHTML = ''; return; }

    // Net profit = revenue - expenses
    const paidRevenue = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
    const expenses = getExpenses();
    const now = new Date();
    const monthExpenses = expenses.filter(e=>{
        const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((s,e)=>s+e.amount,0);
    const monthRevenue = invoices.filter(i=>{
        const d=new Date(i.date); return i.status==='paid'&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((s,i)=>s+i.total,0);
    const monthProfit = monthRevenue - monthExpenses;

    // Low stock alerts
    const products = getProducts();
    const lowStock = products.filter(p=>p.trackStock&&p.stockQty<=p.lowStockAlert);

    // Pending quotes
    const quotes = getQuotes();
    const pendingQuotes = quotes.filter(q=>q.status==='pending');
    const pipelineValue = pendingQuotes.reduce((s,q)=>s+q.total,0);

    extrasEl.innerHTML = `
        <div class="stats-grid dashboard-extras-grid" style="margin-top:0">
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
        ${lowStock.length>0?`<div class="low-stock-banner" style="margin-top:16px">
            ⚠️ Low stock: ${lowStock.map(p=>`<strong>${escapeHtml(p.name)}</strong> (${p.stockQty} left)`).join(', ')}
            &nbsp;<button class="btn btn-secondary btn-sm" onclick="navigateToPage('inventory')">View Inventory →</button>
        </div>`:''}
    `;
}

// ==================== INVOICE MODAL ====================

function openInvoiceModal() {
    // For new invoices, check trial limit before even opening the modal
    if (!checkInvoiceTrialLimit()) return;
    currentInvoice = null;
    document.getElementById('modal-title').textContent = 'Create New Invoice';
    document.getElementById('invoice-form').reset();
    document.getElementById('customer-suggestions').innerHTML = '';

    document.getElementById('items-container').innerHTML = `
        <div class="item-row">
            <div class="form-group">
                <input type="text" class="form-input item-description" placeholder="Description" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-quantity" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-input item-total" placeholder="Total" readonly>
            </div>
            <button type="button" class="remove-item-btn" onclick="removeItem(this)" style="visibility:hidden;">×</button>
        </div>`;

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

    currentViewInvoice = invoice;
    generateInvoicePreview(invoice);
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
                <div style="font-size:18px;font-weight:700;margin-bottom:16px;">${escapeHtml(invoice.number)}</div>
                ${isPaid ? `<p style="color:#00ba88;font-weight:600;">✓ PAID</p>` : ''}
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                ${!isPaid ? `<p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
            </div>
        </div>

        <div class="invoice-preview-parties">
            <div class="party-section">
                <h3>${isPaid ? 'Received From:' : 'Bill To:'}</h3>
                <div class="party-details">
                    <strong>${escapeHtml(invoice.customerName)}</strong><br>
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
                ${invoice.items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.description)}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.price)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>

        <div class="invoice-preview-summary">
            <div class="summary-row" style="color:#000;"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
            <div class="summary-row" style="color:#000;"><span>Tax (${settings.taxRate || 0}%):</span><span>${formatCurrency(invoice.tax)}</span></div>
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
    row.innerHTML = `
        <div class="form-group" style="position:relative">
            <input type="text" class="form-input item-description" placeholder="Description" required>
            ${canUseInventory() ? `<button type="button" class="product-pick-btn" onclick="showProductPicker(this.closest('.item-row'))" title="Pick from catalogue">📦</button>` : ''}
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-quantity" placeholder="Qty" min="1" value="1" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-price" placeholder="Price" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-input item-total" placeholder="Total" readonly>
        </div>
        <button type="button" class="remove-item-btn" onclick="removeItem(this)">×</button>`;
    container.appendChild(row);

    // Make first item remove button always hidden
    const firstRow = container.querySelector('.item-row:first-child .remove-item-btn');
    if (firstRow) firstRow.style.visibility = container.children.length === 1 ? 'hidden' : 'visible';
}

function removeItem(button) {
    const container = document.getElementById('items-container');
    if (container.children.length > 1) {
        button.closest('.item-row').remove();
        calculateInvoiceTotal();
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

// ==================== SETTINGS ====================

function loadSettings() {
    const settings = getSettings();
    const logo = getLogo();

    document.getElementById('currency-select').value = settings.currency || 'NGN';
    document.getElementById('theme-select').value = settings.theme || 'dark';
    document.getElementById('tax-rate').value = settings.taxRate ?? 10;
    document.getElementById('date-format').value = settings.dateFormat || 'us';

    document.getElementById('company-name').value = settings.companyName || '';
    document.getElementById('company-address').value = settings.companyAddress || '';
    document.getElementById('company-email').value = settings.companyEmail || '';
    document.getElementById('company-phone').value = settings.companyPhone || '';
    document.getElementById('company-website').value = settings.companyWebsite || '';
    document.getElementById('company-tax-id').value = settings.companyTaxId || '';

    document.getElementById('bank-name').value = settings.bankName || '';
    document.getElementById('account-name').value = settings.accountName || '';
    document.getElementById('account-number').value = settings.accountNumber || '';
    document.getElementById('routing-number').value = settings.routingNumber || '';
    document.getElementById('swift-code').value = settings.swiftCode || '';
    document.getElementById('iban').value = settings.iban || '';

    const emailToggle = document.getElementById('collect-emails-toggle');
    if (emailToggle) {
        emailToggle.checked = settings.collectEmails || false;
        document.getElementById('email-settings-container').style.display = settings.collectEmails ? 'block' : 'none';
    }
    document.getElementById('email-consent-message').value = settings.emailConsentMessage || '';

    if (logo) {
        document.getElementById('logo-preview').innerHTML = `<img src="${logo}" alt="Logo">`;
    }

    updateEmailCount();
}

function saveSettings() {
    const currencySelect = document.getElementById('currency-select').value;
    const currencySymbols = {
        'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R',
        'KES': 'KSh', 'GHS': 'GH₵', 'XOF': 'CFA', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
    };

    const settings = {
        currency: currencySelect,
        currencySymbol: currencySymbols[currencySelect] || '₦',
        theme: document.getElementById('theme-select').value,
        taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
        dateFormat: document.getElementById('date-format').value,
        companyName: document.getElementById('company-name').value,
        companyAddress: document.getElementById('company-address').value,
        companyEmail: document.getElementById('company-email').value,
        companyPhone: document.getElementById('company-phone').value,
        companyWebsite: document.getElementById('company-website').value,
        companyTaxId: document.getElementById('company-tax-id').value,
        bankName: document.getElementById('bank-name').value,
        accountName: document.getElementById('account-name').value,
        accountNumber: document.getElementById('account-number').value,
        routingNumber: document.getElementById('routing-number').value,
        swiftCode: document.getElementById('swift-code').value,
        iban: document.getElementById('iban').value,
        footerCompanyName: 'GIT System Software',
        footerTagline: '',
        footerTermsUrl: '',
        footerPrivacyUrl: '',
        footerSupportUrl: '',
        collectEmails: document.getElementById('collect-emails-toggle').checked,
        emailConsentMessage: document.getElementById('email-consent-message').value
    };

    if (saveSettingsData(settings)) {
        applyTheme(settings.theme);
        showToast('Settings saved!');
    }
}

function applyTheme(theme) {
    const settings = getSettings();
    const t = theme || settings.theme || 'dark';
    document.body.classList.toggle('light-theme', t === 'light');
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB.'); return; }

    const reader = new FileReader();
    reader.onload = function (e) {
        saveLogo(e.target.result);
        document.getElementById('logo-preview').innerHTML = `<img src="${e.target.result}" alt="Logo">`;
        showToast('Logo uploaded!');
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    if (!confirm('Remove company logo?')) return;
    localStorage.removeItem(STORAGE_KEYS.LOGO);
    document.getElementById('logo-preview').innerHTML = '<div class="logo-preview-empty">No logo uploaded</div>';
    document.getElementById('logo-input').value = '';
    showToast('Logo removed.');
}

// ==================== FOOTER (hardcoded) ====================

function renderFooter() {
    const year = new Date().getFullYear();
    const footerEl = document.getElementById('footer-content');
    if (!footerEl) return;
    footerEl.innerHTML = `
        <div>© ${year} GIT System Software. All rights reserved.</div>
        <div style="margin-top: 6px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="https://gitsystemsoftware.com/terms" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Terms of Service</a>
            <a href="https://gitsystemsoftware.com/privacy" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Privacy Policy</a>
            <a href="https://gitsystemsoftware.com/support" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;">Support</a>
        </div>
    `;
}

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
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
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
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
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

// ==================== REPORTS ====================

function loadReports() {
    const invoices = getInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const paidRevenue = paid.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const avg = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const collectionRate = invoices.length > 0 ? (paid.length / invoices.length * 100) : 0;
    const activeCustomers = new Set(invoices.map(inv => inv.customerName)).size;

    document.getElementById('report-total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('report-avg-invoice').textContent = formatCurrency(avg);
    document.getElementById('report-collection-rate').textContent = `${collectionRate.toFixed(1)}%`;
    document.getElementById('report-active-customers').textContent = activeCustomers;

    loadRevenueChart(invoices);
    loadStatusChart(invoices);
    loadTopCustomers(invoices);
    if (canUseExpenses()) loadProfitReport(invoices);
}

function loadProfitReport(invoices) {
    const existing = document.getElementById('profit-report-section');
    if (existing) existing.remove();

    const expenses = getExpenses();
    const sym = getCurrencySymbol();

    // Build 6-month profit/loss table
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const rev = invoices.filter(inv => {
            const ik = new Date(inv.date); 
            return inv.status==='paid' && `${ik.getFullYear()}-${String(ik.getMonth()+1).padStart(2,'0')}`===key;
        }).reduce((s,i)=>s+i.total,0);
        const exp = expenses.filter(e => {
            const ek = new Date(e.date);
            return `${ek.getFullYear()}-${String(ek.getMonth()+1).padStart(2,'0')}`===key;
        }).reduce((s,e)=>s+e.amount,0);
        months.push({ label, rev, exp, profit: rev-exp });
    }

    // Category breakdown
    const byCategory = {};
    expenses.forEach(e => { byCategory[e.category]=(byCategory[e.category]||0)+e.amount; });
    const catRows = Object.entries(byCategory).sort((a,b)=>b[1]-a[1])
        .map(([cat,amt])=>`<tr><td>${escapeHtml(cat)}</td><td>${formatCurrency(amt)}</td></tr>`).join('');

    const totalExp = expenses.reduce((s,e)=>s+e.amount,0);
    const totalRev = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);

    const section = document.createElement('div');
    section.id = 'profit-report-section';
    section.className = 'report-section';
    section.innerHTML = `
        <div class="section-header"><div class="section-title">Profit & Loss — Last 6 Months</div></div>
        <table class="invoice-table" style="margin-bottom:24px">
            <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th></tr></thead>
            <tbody>${months.map(m=>`<tr>
                <td>${m.label}</td>
                <td>${formatCurrency(m.rev)}</td>
                <td>${formatCurrency(m.exp)}</td>
                <td style="${m.profit<0?'color:var(--danger)':'color:var(--success,#00ba88)'}"><strong>${formatCurrency(m.profit)}</strong></td>
            </tr>`).join('')}</tbody>
            <tfoot><tr style="font-weight:700;border-top:2px solid var(--border-color)">
                <td>Total</td>
                <td>${formatCurrency(totalRev)}</td>
                <td>${formatCurrency(totalExp)}</td>
                <td style="${totalRev-totalExp<0?'color:var(--danger)':'color:var(--success,#00ba88)'}"><strong>${formatCurrency(totalRev-totalExp)}</strong></td>
            </tr></tfoot>
        </table>
        ${catRows ? `<div class="section-header"><div class="section-title">Expenses by Category</div></div>
        <table class="invoice-table">
            <thead><tr><th>Category</th><th>Total Spent</th></tr></thead>
            <tbody>${catRows}</tbody>
        </table>` : ''}
    `;
    document.getElementById('reports-page').querySelector('.content').appendChild(section);
}

function loadRevenueChart(invoices) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const monthlyRevenue = {};
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        monthlyRevenue[key] = 0;
    }

    invoices.forEach(inv => {
        const d = new Date(inv.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue.hasOwnProperty(key)) monthlyRevenue[key] += inv.total || 0;
    });

    if (revenueChart) revenueChart.destroy();

    const settings = getSettings();
    const sym = settings.currencySymbol || '₦';

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue',
                data: Object.values(monthlyRevenue),
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff6b35',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${sym}${Number(ctx.raw).toLocaleString('en', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '10%',
                    ticks: {
                        maxTicksLimit: 6,
                        callback: v => {
                            if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
                            if (v >= 1_000)     return `${sym}${(v / 1_000).toFixed(0)}K`;
                            return `${sym}${v}`;
                        }
                    }
                },
                x: {
                    ticks: { maxRotation: 0 }
                }
            }
        }
    });
}

function loadStatusChart(invoices) {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
                data: [
                    invoices.filter(inv => inv.status === 'paid').length,
                    invoices.filter(inv => inv.status === 'pending').length,
                    invoices.filter(inv => inv.status === 'overdue').length
                ],
                backgroundColor: [
                    'rgba(0, 186, 136, 0.8)',
                    'rgba(255, 165, 0, 0.8)',
                    'rgba(249, 24, 128, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function loadTopCustomers(invoices) {
    const container = document.getElementById('top-customers-container');
    const customerRevenue = {};

    invoices.forEach(inv => {
        if (!customerRevenue[inv.customerName]) {
            customerRevenue[inv.customerName] = { name: inv.customerName, total: 0, count: 0 };
        }
        customerRevenue[inv.customerName].total += inv.total || 0;
        customerRevenue[inv.customerName].count++;
    });

    const top = Object.values(customerRevenue).sort((a, b) => b.total - a.total).slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No data yet</div>
                <div class="empty-text">Create invoices to see top customers</div>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr><th>Customer</th><th>Invoices</th><th>Revenue</th></tr>
            </thead>
            <tbody>
                ${top.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.name)}</strong></td>
                        <td>${c.count}</td>
                        <td><strong>${formatCurrency(c.total)}</strong></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportReportData() {
    const invoices = getInvoices();
    let csv = 'Invoice Number,Customer,Date,Due Date,Subtotal,Tax,Total,Status\n';
    invoices.forEach(inv => {
        csv += `"${inv.number}","${inv.customerName}","${inv.date}","${inv.dueDate}","${inv.subtotal || 0}","${inv.tax || 0}","${inv.total}","${inv.status}"\n`;
    });
    downloadFile(csv, `invohub-report-${today()}.csv`, 'text/csv');
    showToast('Report exported!');
}

// ==================== DATA BACKUP / RESTORE ====================

function exportData() {
    const data = {
        invoices: getInvoices(),
        customers: getCustomers(),
        settings: getSettings(),
        logo: getLogo(),
        products: getProducts(),
        expenses: getExpenses(),
        quotes: getQuotes(),
        exportDate: new Date().toISOString(),
        version: '4.5'
    };
    downloadFile(JSON.stringify(data, null, 2), `invohub-backup-${today()}.json`, 'application/json');
    showToast('Backup downloaded!');
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!confirm(`This will merge ${data.invoices?.length || 0} invoices and ${data.customers?.length || 0} customers into your current data. Continue?`)) return;

            if (data.invoices) saveInvoices(data.invoices);
            if (data.customers) saveCustomers(data.customers);
            if (data.settings) saveSettingsData(data.settings);
            if (data.logo) saveLogo(data.logo);
            if (data.products) saveProducts(data.products);
            if (data.expenses) saveExpenses(data.expenses);
            if (data.quotes) saveQuotes(data.quotes);

            // Resync the sequential counter to the highest invoice number in restored data
            if (data.invoices && data.invoices.length > 0) {
                syncCounterToInvoices(data.invoices);
            }

            loadSettings();
            loadInvoices();
            updateDashboard();
            loadCustomers();
            applyTheme();
            renderFooter();
            showToast('Backup restored successfully!');
        } catch (err) {
            alert('Failed to restore backup. Please check the file is a valid invoHub backup.');
        }
    };
    reader.readAsText(file);
}

// ==================== UTILITY FUNCTIONS ====================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00'); // avoid timezone shifts
    const settings = getSettings();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (settings.dateFormat || 'us') {
        case 'eu': return `${day}/${month}/${year}`;
        case 'iso': return `${year}-${month}-${day}`;
        default: return `${month}/${day}/${year}`;
    }
}

function formatCurrency(amount) {
    const settings = getSettings();
    const currency = settings.currency || 'NGN';
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency', currency,
            minimumFractionDigits: 2
        }).format(Number(amount) || 0);
    } catch {
        return `${settings.currencySymbol || '₦'}${(Number(amount) || 0).toFixed(2)}`;
    }
}

function getCurrencySymbol() {
    return getSettings().currencySymbol || '₦';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showToast(message, type = 'success') {
    // Simple toast notification — type: 'success' | 'error' | 'info'
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed; bottom: 80px; right: 24px; z-index: 9998;
            padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: opacity 0.3s; pointer-events: none; color: white;
        `;
        document.body.appendChild(toast);
    }
    const colors = { success: 'var(--success, #00ba88)', error: 'var(--danger, #ff4848)', info: '#5b6ee1' };
    toast.style.background = colors[type] || colors.success;
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}
