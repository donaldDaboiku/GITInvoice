// GITInvoice — app settings, theme, logo, footer
'use strict';
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
