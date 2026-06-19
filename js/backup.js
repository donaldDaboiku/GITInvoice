// GITInvoice — backup export/import validation and sanitization
'use strict';

var BACKUP_FORMAT_VERSION = '4.5';
var MAX_LOGO_LENGTH = 2 * 1024 * 1024;
var MAX_ARRAY_LENGTH = 10000;

function backupTrim(value, max) {
    if (value == null) return '';
    return String(value).trim().slice(0, max);
}

function backupClampNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeId(value, fallbackPrefix) {
    var id = backupTrim(value, 80);
    if (!id) return fallbackPrefix + Date.now() + Math.random().toString(36).slice(2, 7);
    return id.replace(/[^\w.-]/g, '');
}

function sanitizeInvoiceItems(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 200).map(function (item) {
        if (!isPlainObject(item)) return null;
        var qty = backupClampNumber(item.quantity, 1);
        var price = backupClampNumber(item.price, 0);
        if (qty <= 0 || price < 0) return null;
        var total = backupClampNumber(item.total, qty * price);
        return {
            description: backupTrim(item.description, 500),
            quantity: qty,
            price: price,
            total: total,
        };
    }).filter(Boolean);
}

function sanitizeInvoices(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_ARRAY_LENGTH).map(function (inv, index) {
        if (!isPlainObject(inv)) return null;
        var items = sanitizeInvoiceItems(inv.items);
        if (!items.length) return null;
        var subtotal = backupClampNumber(inv.subtotal, items.reduce(function (s, i) { return s + i.total; }, 0));
        var tax = backupClampNumber(inv.tax, 0);
        var total = backupClampNumber(inv.total, subtotal + tax);
        var status = ['paid', 'pending', 'overdue'].indexOf(inv.status) >= 0 ? inv.status : 'pending';
        return {
            id: sanitizeId(inv.id, 'inv-'),
            number: backupTrim(inv.number, 80) || ('INV-IMPORT-' + (index + 1)),
            status: status,
            date: backupTrim(inv.date, 20),
            dueDate: backupTrim(inv.dueDate, 20),
            customerName: backupTrim(inv.customerName, 200),
            customerAddress: backupTrim(inv.customerAddress, 1000),
            customerEmail: backupTrim(inv.customerEmail, 254),
            customerPhone: backupTrim(inv.customerPhone, 80),
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: total,
            notes: backupTrim(inv.notes, 2000),
            createdBy: backupTrim(inv.createdBy, 80) || 'owner',
            createdByRole: inv.createdByRole === 'cashier' ? 'cashier' : 'owner',
            createdAt: backupTrim(inv.createdAt, 40) || new Date().toISOString(),
            updatedAt: backupTrim(inv.updatedAt, 40) || new Date().toISOString(),
        };
    }).filter(Boolean);
}

function sanitizeCustomers(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_ARRAY_LENGTH).map(function (c) {
        if (!isPlainObject(c)) return null;
        var name = backupTrim(c.name, 200);
        if (!name) return null;
        return {
            id: sanitizeId(c.id, 'cus-'),
            name: name,
            email: backupTrim(c.email, 254),
            phone: backupTrim(c.phone, 80),
            address: backupTrim(c.address, 1000),
            notes: backupTrim(c.notes, 2000),
            createdAt: backupTrim(c.createdAt, 40) || new Date().toISOString(),
            updatedAt: backupTrim(c.updatedAt, 40) || new Date().toISOString(),
        };
    }).filter(Boolean);
}

function sanitizeProducts(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_ARRAY_LENGTH).map(function (p) {
        if (!isPlainObject(p)) return null;
        var name = backupTrim(p.name, 200);
        if (!name) return null;
        return {
            id: sanitizeId(p.id, 'prd-'),
            name: name,
            sku: backupTrim(p.sku, 80),
            description: backupTrim(p.description, 500),
            sellPrice: Math.max(0, backupClampNumber(p.sellPrice, 0)),
            costPrice: Math.max(0, backupClampNumber(p.costPrice, 0)),
            trackStock: !!p.trackStock,
            stockQty: p.trackStock ? Math.max(0, backupClampNumber(p.stockQty, 0)) : null,
            lowStockAlert: p.trackStock ? Math.max(0, backupClampNumber(p.lowStockAlert, 5)) : null,
            createdAt: backupTrim(p.createdAt, 40) || new Date().toISOString(),
            updatedAt: backupTrim(p.updatedAt, 40) || new Date().toISOString(),
        };
    }).filter(Boolean);
}

function sanitizeExpenses(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_ARRAY_LENGTH).map(function (e) {
        if (!isPlainObject(e)) return null;
        var description = backupTrim(e.description, 500);
        if (!description) return null;
        return {
            id: sanitizeId(e.id, 'exp-'),
            description: description,
            amount: Math.max(0, backupClampNumber(e.amount, 0)),
            date: backupTrim(e.date, 20),
            category: backupTrim(e.category, 80) || 'Other',
            paymentMethod: backupTrim(e.paymentMethod, 80),
            notes: backupTrim(e.notes, 2000),
            createdBy: backupTrim(e.createdBy, 80) || 'owner',
            createdAt: backupTrim(e.createdAt, 40) || new Date().toISOString(),
        };
    }).filter(Boolean);
}

function sanitizeQuotes(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX_ARRAY_LENGTH).map(function (q) {
        if (!isPlainObject(q)) return null;
        var items = sanitizeInvoiceItems(q.items);
        if (!items.length) return null;
        var subtotal = backupClampNumber(q.subtotal, items.reduce(function (s, i) { return s + i.total; }, 0));
        var tax = backupClampNumber(q.tax, 0);
        return {
            id: sanitizeId(q.id, 'qte-'),
            number: backupTrim(q.number, 80),
            customerName: backupTrim(q.customerName, 200),
            customerEmail: backupTrim(q.customerEmail, 254),
            customerPhone: backupTrim(q.customerPhone, 80),
            date: backupTrim(q.date, 20),
            validUntil: backupTrim(q.validUntil, 20),
            items: items,
            subtotal: subtotal,
            tax: tax,
            total: backupClampNumber(q.total, subtotal + tax),
            notes: backupTrim(q.notes, 2000),
            status: backupTrim(q.status, 40) || 'pending',
            createdAt: backupTrim(q.createdAt, 40) || new Date().toISOString(),
        };
    }).filter(Boolean);
}

var SETTINGS_ALLOWLIST = [
    'currency', 'currencySymbol', 'theme', 'taxRate', 'dateFormat',
    'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyWebsite', 'companyTaxId',
    'bankName', 'accountName', 'accountNumber', 'routingNumber', 'swiftCode', 'iban',
    'footerCompanyName', 'footerTagline', 'footerTermsUrl', 'footerPrivacyUrl', 'footerSupportUrl',
    'collectEmails', 'emailConsentMessage',
];

function sanitizeSettings(settings) {
    if (!isPlainObject(settings)) return null;
    var clean = {};
    for (var i = 0; i < SETTINGS_ALLOWLIST.length; i++) {
        var key = SETTINGS_ALLOWLIST[i];
        if (settings[key] === undefined) continue;
        if (key === 'taxRate') {
            clean.taxRate = Math.min(100, Math.max(0, backupClampNumber(settings.taxRate, 10)));
        } else if (key === 'collectEmails') {
            clean.collectEmails = !!settings.collectEmails;
        } else if (key === 'theme') {
            clean.theme = settings.theme === 'light' ? 'light' : 'dark';
        } else if (key === 'dateFormat') {
            clean.dateFormat = ['us', 'eu', 'iso'].indexOf(settings.dateFormat) >= 0 ? settings.dateFormat : 'us';
        } else {
            clean[key] = backupTrim(settings[key], key.indexOf('Url') >= 0 ? 500 : 1000);
        }
    }
    return Object.keys(clean).length ? clean : null;
}

function sanitizeLogo(logo) {
    if (typeof logo !== 'string') return null;
    if (!logo.startsWith('data:image/')) return null;
    if (logo.length > MAX_LOGO_LENGTH) return null;
    return logo;
}

function validateBackupData(raw) {
    if (!isPlainObject(raw)) {
        return { valid: false, error: 'Backup file must be a JSON object.' };
    }

    var sections = ['invoices', 'customers', 'settings', 'products', 'expenses', 'quotes', 'logo'];
    var hasContent = sections.some(function (key) {
        if (key === 'logo') return typeof raw.logo === 'string' && raw.logo.length > 0;
        if (key === 'settings') return isPlainObject(raw.settings) && Object.keys(raw.settings).length > 0;
        return Array.isArray(raw[key]) && raw[key].length > 0;
    });

    if (!hasContent) {
        return { valid: false, error: 'This file does not contain any recognizable GITInvoice data.' };
    }

    if (raw.invoices != null && !Array.isArray(raw.invoices)) {
        return { valid: false, error: 'Invalid invoices section in backup file.' };
    }
    if (raw.customers != null && !Array.isArray(raw.customers)) {
        return { valid: false, error: 'Invalid customers section in backup file.' };
    }
    if (raw.products != null && !Array.isArray(raw.products)) {
        return { valid: false, error: 'Invalid products section in backup file.' };
    }
    if (raw.expenses != null && !Array.isArray(raw.expenses)) {
        return { valid: false, error: 'Invalid expenses section in backup file.' };
    }
    if (raw.quotes != null && !Array.isArray(raw.quotes)) {
        return { valid: false, error: 'Invalid quotes section in backup file.' };
    }
    if (raw.settings != null && !isPlainObject(raw.settings)) {
        return { valid: false, error: 'Invalid settings section in backup file.' };
    }

    var data = sanitizeBackupPayload(raw);
    if (!data.invoices.length && !data.customers.length && !data.products.length &&
        !data.expenses.length && !data.quotes.length && !data.settings && !data.logo) {
        return { valid: false, error: 'Backup file did not contain any usable records after validation.' };
    }

    return { valid: true, data: data };
}

function sanitizeBackupPayload(raw) {
    return {
        invoices: raw.invoices ? sanitizeInvoices(raw.invoices) : [],
        customers: raw.customers ? sanitizeCustomers(raw.customers) : [],
        products: raw.products ? sanitizeProducts(raw.products) : [],
        expenses: raw.expenses ? sanitizeExpenses(raw.expenses) : [],
        quotes: raw.quotes ? sanitizeQuotes(raw.quotes) : [],
        settings: raw.settings ? sanitizeSettings(raw.settings) : null,
        logo: raw.logo ? sanitizeLogo(raw.logo) : null,
        exportDate: backupTrim(raw.exportDate, 40) || null,
        version: backupTrim(raw.version, 20) || null,
    };
}

function mergeRecordsById(existing, incoming) {
    var map = new Map();
    (existing || []).forEach(function (item) {
        if (item && item.id) map.set(item.id, item);
    });
    (incoming || []).forEach(function (item) {
        if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
}

function mergeSettings(existing, incoming) {
    if (!incoming) return existing;
    if (!existing) return incoming;
    return Object.assign({}, existing, incoming);
}
