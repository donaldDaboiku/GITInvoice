// GITInvoice — demo seed data
'use strict';
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
                { id: 'demo-i3', number: 'INV-2026-0003', status: 'overdue', date: daysAgo(45), dueDate: daysAgo(15),  customerName: 'Dangote Properties Ltd', customerEmail: 'procurement@dangoteprop.com', customerPhone: '0801 999 0001', customerAddress: 'Plot 3, Eko Atlantic City, Lagos',         items: [{ description: 'Architectural Consultancy', quantity: 1, price: 1500000, total: 1500000 }, { description: 'Detailed Engineering Drawings', quantity: 1, price: 850000, total: 850000 }], subtotal: 2350000, tax: 235000,  total: 2585000,  notes: 'Please contact accounts@primebuild.ng for payment confirmation.', createdBy: 'owner', createdByRole: 'owner', createdAt: daysAgo(45) }
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

    // Seed products, expenses, quotes for team/business
    if (tier === 'team' || tier === 'business') {
        const demoProducts = tier === 'team' ? [
            { id:'dp1', name:'Bulk Rice (50kg bags)', sku:'RICE-50KG', description:'', sellPrice:45000, costPrice:38000, trackStock:true, stockQty:45, lowStockAlert:10, createdAt:daysAgo(90), updatedAt:daysAgo(1) },
            { id:'dp2', name:'Vegetable Oil (25L)', sku:'OIL-25L', description:'', sellPrice:28000, costPrice:22000, trackStock:true, stockQty:8, lowStockAlert:10, createdAt:daysAgo(90), updatedAt:daysAgo(1) },
            { id:'dp3', name:'Frozen Chicken (1kg)', sku:'CHKN-1KG', description:'', sellPrice:4500, costPrice:3200, trackStock:true, stockQty:120, lowStockAlert:20, createdAt:daysAgo(60), updatedAt:daysAgo(1) },
            { id:'dp4', name:'Sugar (50kg bags)', sku:'SUGR-50KG', description:'', sellPrice:38000, costPrice:32000, trackStock:true, stockQty:25, lowStockAlert:5, createdAt:daysAgo(60), updatedAt:daysAgo(1) },
        ] : [
            { id:'dp1', name:'Structural Steel', sku:'STL-001', description:'Per tonne', sellPrice:850000, costPrice:680000, trackStock:false, stockQty:null, lowStockAlert:null, createdAt:daysAgo(120), updatedAt:daysAgo(1) },
            { id:'dp2', name:'Roofing Materials', sku:'RF-001', description:'Per job', sellPrice:2800000, costPrice:2100000, trackStock:false, stockQty:null, lowStockAlert:null, createdAt:daysAgo(120), updatedAt:daysAgo(1) },
            { id:'dp3', name:'Architectural Consulting', sku:'AC-001', description:'Per project', sellPrice:1500000, costPrice:800000, trackStock:false, stockQty:null, lowStockAlert:null, createdAt:daysAgo(90), updatedAt:daysAgo(1) },
        ];
        saveProducts(demoProducts);

        const demoExpenses = tier === 'team' ? [
            { id:'de1', description:'Warehouse rent — April', amount:180000, date:daysAgo(20), category:'Rent', paymentMethod:'Bank Transfer', notes:'', createdBy:'owner', createdAt:daysAgo(20) },
            { id:'de2', description:'Staff salaries — April', amount:350000, date:daysAgo(18), category:'Salaries', paymentMethod:'Bank Transfer', notes:'3 cashiers', createdBy:'owner', createdAt:daysAgo(18) },
            { id:'de3', description:'Cold storage electricity', amount:45000, date:daysAgo(10), category:'Utilities', paymentMethod:'Card', notes:'', createdBy:'owner', createdAt:daysAgo(10) },
        ] : [
            { id:'de1', description:'Site equipment hire', amount:1200000, date:daysAgo(60), category:'Equipment', paymentMethod:'Bank Transfer', notes:'Crane + scaffolding', createdBy:'owner', createdAt:daysAgo(60) },
            { id:'de2', description:'Worker wages — March', amount:2400000, date:daysAgo(45), category:'Salaries', paymentMethod:'Bank Transfer', notes:'30 workers x 30 days', createdBy:'owner', createdAt:daysAgo(45) },
            { id:'de3', description:'Insurance premium', amount:350000, date:daysAgo(30), category:'Insurance', paymentMethod:'Bank Transfer', notes:'Annual policy', createdBy:'owner', createdAt:daysAgo(30) },
            { id:'de4', description:'Office rent — April', amount:280000, date:daysAgo(20), category:'Rent', paymentMethod:'Bank Transfer', notes:'', createdBy:'owner', createdAt:daysAgo(20) },
        ];
        saveExpenses(demoExpenses);

        const demoQuotes = tier === 'team' ? [
            { id:'dq1', number:'QTE-2026-0001', customerName:'Blessing Catering Co.', customerEmail:'blessing@blesscater.com', customerPhone:'0705 444 5566', date:daysAgo(5), validUntil:daysAhead(25), items:[{description:'Frozen Chicken (1kg packs)',quantity:100,price:4500,total:450000},{description:'Tomato Paste (crates)',quantity:10,price:18000,total:180000}], subtotal:630000, tax:63000, total:693000, notes:'Quote valid 30 days. Bulk discount applied.', status:'pending', createdAt:daysAgo(5) },
        ] : [
            { id:'dq1', number:'QTE-2026-0001', customerName:'Abuja Capital Estates', customerEmail:'contracts@abujacapital.ng', customerPhone:'0803 777 8899', date:daysAgo(10), validUntil:daysAhead(20), items:[{description:'Block C Foundation & Framing',quantity:1,price:5500000,total:5500000},{description:'Electrical Rough-in',quantity:1,price:1200000,total:1200000}], subtotal:6700000, tax:670000, total:7370000, notes:'Quote valid 30 days. Subject to site survey.', status:'pending', createdAt:daysAgo(10) },
        ];
        saveQuotes(demoQuotes);
    }

    // Pre-fill company name in settings
    const settings = getSettings();
    if (!settings.companyName) {
        settings.companyName = data.company;
        saveSettingsData(settings);
    }

    console.log(`[GIT Invoice] Demo data seeded for ${tier} plan (${invoices.length} invoices, ${customers.length} customers)`);
}

function isDemoLicenseKey(key) {
    if (!key) return false;
    var k = String(key).trim().toUpperCase();
    return k === 'DEMO' || k.indexOf('DEMO-') === 0 || k === 'DEMO-LICENSE';
}

/**
 * Seed login users for demo licenses (password: DEMO_USER_PASSWORD).
 * Solo: owner. Team/Business: owner + cashiers.
 * Only runs when no users exist yet.
 */
async function ensureDemoUsers(tier) {
    var existing = getUsers();
    if (existing.length > 0) return;

    var password = typeof DEMO_USER_PASSWORD === 'string' ? DEMO_USER_PASSWORD : 'demo1234';
    var hash = await hashPassword(password);
    var now = new Date().toISOString();
    var users = [
        { id: 'demo-owner', username: 'owner', role: 'owner', passwordHash: hash, createdAt: now }
    ];

    if (tier === 'team' || tier === 'business') {
        users.push(
            { id: 'demo-cashier1', username: 'cashier1', role: 'cashier', passwordHash: hash, createdAt: now },
            { id: 'demo-cashier2', username: 'cashier2', role: 'cashier', passwordHash: hash, createdAt: now }
        );
    }

    if (tier === 'business') {
        users.push(
            { id: 'demo-cashier3', username: 'supervisor1', role: 'cashier', passwordHash: hash, createdAt: now }
        );
    }

    saveUsers(users);
    console.log('[GIT Invoice] Demo users seeded. Login: owner / ' + password);
}
