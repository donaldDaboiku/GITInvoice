// GITInvoice — localStorage data access layer
'use strict';

var DEFAULT_SETTINGS = {
    currency: 'NGN',
    currencySymbol: '₦',
    theme: 'dark',
    taxRate: 10,
    dateFormat: 'us',
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyTaxId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    iban: '',
    footerCompanyName: 'GIT System Software',
    footerTagline: '',
    footerTermsUrl: '',
    footerPrivacyUrl: '',
    footerSupportUrl: '',
    collectEmails: false,
    emailConsentMessage: 'I agree to receive promotional emails. You can unsubscribe at any time.',
};

function readJson(key, fallback) {
    try {
        var data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeJson(key, value, onError) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        if (typeof onError === 'function') onError(e);
        return false;
    }
}

function getInvoices() {
    return readJson(STORAGE_KEYS.INVOICES, []);
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

function getCustomers() {
    return readJson(STORAGE_KEYS.CUSTOMERS, []);
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

function getSettings() {
    var settings = readJson(STORAGE_KEYS.SETTINGS, null);
    return settings || Object.assign({}, DEFAULT_SETTINGS);
}

function saveSettingsData(settings) {
    return writeJson(STORAGE_KEYS.SETTINGS, settings);
}

function getLogo() {
    return localStorage.getItem(STORAGE_KEYS.LOGO);
}

function saveLogo(logoData) {
    try {
        localStorage.setItem(STORAGE_KEYS.LOGO, logoData);
        return true;
    } catch (e) {
        return false;
    }
}

function getProducts() {
    return readJson(STORAGE_KEYS.PRODUCTS, []);
}

function saveProducts(products) {
    try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return true;
    } catch (e) {
        if (typeof showToast === 'function') showToast('Storage full.', 'error');
        return false;
    }
}

function getExpenses() {
    return readJson(STORAGE_KEYS.EXPENSES, []);
}

function saveExpenses(expenses) {
    try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
        return true;
    } catch (e) {
        if (typeof showToast === 'function') showToast('Storage full.', 'error');
        return false;
    }
}

function getQuotes() {
    return readJson(STORAGE_KEYS.QUOTES, []);
}

function saveQuotes(quotes) {
    try {
        localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
        return true;
    } catch (e) {
        if (typeof showToast === 'function') showToast('Storage full.', 'error');
        return false;
    }
}
