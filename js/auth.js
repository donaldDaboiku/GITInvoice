// GITInvoice — user accounts, sessions, and invoice access control
'use strict';

function getUsers() {
    return readJson(STORAGE_KEYS.USERS, []);
}

function saveUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    } catch (e) {
        return false;
    }
}

function getSession() {
    return readJson(STORAGE_KEYS.SESSION, null);
}

function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function getUsersMax() {
    var tier = localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo';
    return { solo: 1, team: 10, business: 25 }[tier] || 1;
}

function getVisibleInvoices() {
    var all = getInvoices();
    var session = getSession();
    if (!session || session.role === 'owner') return all;
    return all.filter(function (inv) { return inv.createdBy === session.username; });
}

function canAccessInvoice(invoice) {
    if (!invoice) return false;
    var session = getSession();
    if (!session || session.role === 'owner') return true;
    return invoice.createdBy === session.username;
}
