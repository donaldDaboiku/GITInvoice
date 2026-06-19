// GITInvoice — shared utilities
'use strict';
// ==================== UTILITY FUNCTIONS ====================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    let date;
    if (dateString instanceof Date) {
        date = new Date(dateString.getTime());
    } else if (typeof dateString === 'string') {
        const value = dateString.trim();
        if (!value) return '—';

        // Preserve plain YYYY-MM-DD values as local dates, but allow ISO timestamps too.
        const plainDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (plainDateMatch) {
            const [, year, month, day] = plainDateMatch;
            date = new Date(Number(year), Number(month) - 1, Number(day));
        } else {
            date = new Date(value);
        }
    } else {
        date = new Date(dateString);
    }

    if (Number.isNaN(date.getTime())) return '—';

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
    // Simple toast notification — type: success | error | info
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed; bottom: 80px; right: 24px; z-index: 9998;
            color: white;
            padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: opacity 0.3s; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    const colors = {success:'var(--success,#00ba88)',error:'var(--danger,#ff4848)',info:'#5b6ee1'};
    toast.style.background = colors[type]||colors.success;
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

