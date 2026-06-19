// GITInvoice — licensing, trial, paywall, KYC, and tier gates
'use strict';

function isLicensed() {
    if (DEV_MODE) return true;
    return !!localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) &&
           !!localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);
}

function getUserInvoiceCount() {
    return getInvoices().filter(function (inv) { return !inv.id.startsWith('demo-'); }).length;
}

function getUserCustomerCount() {
    return getCustomers().filter(function (c) { return !c.id.startsWith('demo-'); }).length;
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
    var banner = document.getElementById('trial-banner');
    if (!banner) return;
    if (isLicensed()) { banner.style.display = 'none'; return; }
    var invLeft = Math.max(0, TRIAL_INVOICE_LIMIT - getUserInvoiceCount());
    var cusLeft = Math.max(0, TRIAL_CUSTOMER_LIMIT - getUserCustomerCount());
    banner.style.display = 'flex';
    banner.innerHTML =
        '<span>🔓 <strong>Free Trial</strong> — ' + invLeft + ' invoice' + (invLeft !== 1 ? 's' : '') +
        ' &amp; ' + cusLeft + ' customer' + (cusLeft !== 1 ? 's' : '') + ' remaining</span>' +
        '<button onclick="showPaywall(\'upgrade\')" style="background:var(--primary);color:#fff;border:none;padding:5px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;margin-left:12px;">Unlock Full Access →</button>';
}

function initLicenseOnLoad(action) {
    if (DEV_MODE) {
        localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, 'DEV-MODE');
        localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL, 'dev@localhost');
        localStorage.setItem(STORAGE_KEYS.DEVICE_ACTIVATED, 'true');
        localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES, '1/25');
        localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, 'business');
        seedDemoData('business');
        var devUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        if (devUsers.length === 0) {
            hashPassword('devpass').then(function (hash) {
                devUsers.push({
                    id: 'dev-owner',
                    username: 'owner',
                    role: 'owner',
                    passwordHash: hash,
                    createdAt: new Date().toISOString(),
                });
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(devUsers));
            });
        }
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
            userId: 'dev-owner',
            username: 'owner',
            role: 'owner',
            loginAt: new Date().toISOString(),
        }));
        bootApp(action);
        return;
    }

    var licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    var alreadyActivated = localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);

    if (licenseKey && alreadyActivated) {
        silentLicenseCheck(licenseKey, action);
    } else {
        bootApp(action);
    }
}

function showLicenseGate(prefillKey) {
    showPaywall('activate', prefillKey || '');
}

function showPaywall(reason, prefillKey) {
    reason = reason || 'upgrade';
    prefillKey = prefillKey || '';
    var modal = document.getElementById('paywall-modal');
    if (!modal) return;

    var title = document.getElementById('paywall-title');
    var sub = document.getElementById('paywall-sub');

    if (reason === 'invoice') {
        title.textContent = "You've used all 3 free invoices";
        sub.textContent = 'Unlock GIT Invoice to create unlimited invoices, manage your team, and get paid faster.';
    } else if (reason === 'customer') {
        title.textContent = "You've used both free customer slots";
        sub.textContent = 'Upgrade to add unlimited customers and get full access to every feature.';
    } else {
        title.textContent = 'Unlock Full Access';
        sub.textContent = 'Choose a plan to remove all limits and keep your trial data.';
    }

    var keyInput = document.getElementById('paywall-key-input');
    if (keyInput && prefillKey) keyInput.value = prefillKey;
    if (keyInput) {
        keyInput.classList.remove('error', 'success');
        keyInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') activateLicense();
        }, { once: true });
    }

    var errEl = document.getElementById('paywall-error');
    if (errEl) errEl.textContent = '';

    modal.classList.add('visible');
}

function closePaywall() {
    var modal = document.getElementById('paywall-modal');
    if (modal) modal.classList.remove('visible');
}

async function activateLicense() {
    var input = document.getElementById('paywall-key-input');
    var btn = document.getElementById('paywall-activate-btn');
    var btnText = document.getElementById('paywall-activate-btn-text');
    var errorEl = document.getElementById('paywall-error');
    var key = input.value.trim().toUpperCase();

    if (!key || key.length < 8) {
        input.classList.add('error');
        errorEl.textContent = 'Please enter a valid license key from your Gumroad receipt email.';
        return;
    }

    btn.disabled = true;
    btnText.innerHTML = '<span class="license-loader"></span> Validating...';
    errorEl.textContent = '';

    try {
        var response = await fetch(LICENSE_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, action: 'activate', device_id: getDeviceId() }),
        });
        var data = await response.json();

        if (data.success) {
            localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
            localStorage.setItem(STORAGE_KEYS.LICENSE_EMAIL, data.email || 'Verified');
            localStorage.setItem(STORAGE_KEYS.DEVICE_ACTIVATED, 'true');
            if (!localStorage.getItem(STORAGE_KEYS.ACTIVATED_AT)) {
                localStorage.setItem(STORAGE_KEYS.ACTIVATED_AT, new Date().toISOString());
            }
            if (data.users_max) {
                localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES, (data.users_used || 1) + '/' + data.users_max);
            }
            if (data.tier) localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, data.tier);

            seedDemoData(data.tier || 'solo');

            input.classList.add('success');
            btnText.innerHTML = '✓ Activated! Complete KYC...';

            setTimeout(function () {
                closePaywall();
                renderTrialBanner();
                showBuyerKycGate({ licenseKey: key, email: data.email || '', tier: data.tier || 'solo' });
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

async function silentLicenseCheck(key, action) {
    bootApp(action);

    try {
        var response = await fetch(LICENSE_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, action: 'check', device_id: getDeviceId() }),
        });
        var data = await response.json();

        if (!data.success) {
            localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.DEVICE_ACTIVATED);
            localStorage.removeItem(STORAGE_KEYS.LICENSE_DEVICES);
            alert('Your license is no longer valid. Please contact support.');
            window.location.reload();
            return;
        }

        if (data.users_max) {
            var devStr = (data.users_used || 1) + '/' + data.users_max;
            localStorage.setItem(STORAGE_KEYS.LICENSE_DEVICES, devStr);
            var el = document.getElementById('settings-device-count');
            if (el) el.textContent = devStr + ' users • ' + (data.tier || '') + ' plan';
        }
        if (data.tier) localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, data.tier);
    } catch (err) {
        console.log('[License] Offline check skipped');
    }
}

async function deactivateLicense() {
    if (!confirm('This will release this device\'s license seat and sign you out. You can re-activate on another device. Continue?')) return;

    var key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    var wasActivated = localStorage.getItem(STORAGE_KEYS.DEVICE_ACTIVATED);

    if (key && wasActivated) {
        try {
            await fetch(LICENSE_VALIDATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, action: 'deactivate', device_id: getDeviceId() }),
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
    var key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (key) {
        navigator.clipboard.writeText(key).then(function () {
            alert('License key copied to clipboard!');
        });
    }
}

function bootApp(action) {
    var gate = document.getElementById('license-gate');
    if (gate) gate.classList.remove('visible');

    if (isLicensed() && !hasSubmittedBuyerKyc()) {
        showBuyerKycGate();
        return;
    }

    showUserLoginScreen(action);
}

function hasSubmittedBuyerKyc() {
    var status = localStorage.getItem(STORAGE_KEYS.BUYER_KYC_STATUS);
    return ['pending', 'verified', 'rejected'].indexOf(status) >= 0;
}

function showBuyerKycGate(context) {
    context = context || {};
    document.getElementById('license-gate')?.classList.remove('visible');
    document.getElementById('user-login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';

    var modal = document.getElementById('buyer-kyc-modal');
    if (!modal) return;

    var licenseKey = context.licenseKey || localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '';
    var email = context.email || localStorage.getItem(STORAGE_KEYS.LICENSE_EMAIL) || '';
    var tier = context.tier || localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo';

    var emailEl = document.getElementById('buyer-kyc-email-display');
    var tierEl = document.getElementById('buyer-kyc-tier-display');
    if (emailEl) emailEl.textContent = email || 'Verified buyer';
    if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1) + ' plan';

    var licenseInput = document.getElementById('buyer-kyc-license-key');
    if (licenseInput) licenseInput.value = licenseKey;

    var errorEl = document.getElementById('buyer-kyc-error');
    if (errorEl) errorEl.textContent = '';

    modal.classList.add('active');
}

function closeBuyerKycGate() {
    document.getElementById('buyer-kyc-modal')?.classList.remove('active');
}

async function submitBuyerKyc() {
    var errorEl = document.getElementById('buyer-kyc-error');
    var btn = document.getElementById('buyer-kyc-submit-btn');
    var btnText = document.getElementById('buyer-kyc-submit-text');

    var payload = {
        action: 'submit',
        license_key: localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '',
        device_id: getDeviceId(),
        email: localStorage.getItem(STORAGE_KEYS.LICENSE_EMAIL) || '',
        tier: localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo',
        full_name: document.getElementById('buyer-kyc-full-name').value.trim(),
        phone: document.getElementById('buyer-kyc-phone').value.trim(),
        country: document.getElementById('buyer-kyc-country').value.trim(),
        business_name: document.getElementById('buyer-kyc-business-name').value.trim(),
        business_type: document.getElementById('buyer-kyc-business-type').value,
        id_type: document.getElementById('buyer-kyc-id-type').value,
        id_number: document.getElementById('buyer-kyc-id-number').value.trim(),
        business_reg: document.getElementById('buyer-kyc-business-reg').value.trim(),
        address: document.getElementById('buyer-kyc-address').value.trim(),
    };

    if (!payload.license_key) {
        errorEl.textContent = 'Activate your license before submitting KYC.';
        return;
    }
    if (!payload.full_name || !payload.phone || !payload.country || !payload.id_type || !payload.id_number || !payload.address) {
        errorEl.textContent = 'Please complete all required KYC fields.';
        return;
    }

    btn.disabled = true;
    btnText.innerHTML = '<span class="license-loader"></span> Submitting...';
    errorEl.textContent = '';

    try {
        var response = await fetch(BUYER_KYC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        var data = await response.json();
        if (!data.success) throw new Error(data.error || 'KYC submission failed.');

        localStorage.setItem(STORAGE_KEYS.BUYER_KYC_STATUS, data.status || 'pending');
        localStorage.setItem(STORAGE_KEYS.BUYER_KYC_SUBMITTED_AT, new Date().toISOString());
        closeBuyerKycGate();
        showToast('KYC submitted for review. You can continue setup.', 'success');
        bootApp();
    } catch (err) {
        console.error('Buyer KYC submission error:', err);
        errorEl.textContent = err.message || 'Could not submit KYC. Please try again.';
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Submit KYC';
    }
}

function getTier() {
    return localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || 'solo';
}

function canUseInventory() {
    var t = getTier();
    return t === 'team' || t === 'business';
}

function canUseExpenses() {
    var t = getTier();
    return t === 'team' || t === 'business';
}

function canUseQuotes() {
    var t = getTier();
    return t === 'team' || t === 'business';
}

function requireTierFeature(name) {
    showToast(name + ' is available on Team & Business plans.', 'info');
    showPaywall('upgrade');
}

function canUseAPI() {
    return getTier() === 'business';
}

function canUseMultiBranch() {
    return getTier() === 'business';
}

function canUseFullStockHistory() {
    return getTier() === 'business';
}

async function switchPlan() {
    var key = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (!confirm('Switching plan will deactivate your current license on this device. Your data stays intact. Continue?')) return;

    if (key) {
        try {
            await fetch(LICENSE_VALIDATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, action: 'deactivate', device_id: getDeviceId() }),
            });
        } catch (e) {
            console.warn('Server deactivation failed, continuing locally');
        }
    }

    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ACTIVATED);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_DEVICES);
    localStorage.removeItem(STORAGE_KEYS.LICENSE_TIER);
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    showToast('License cleared. Enter your new plan key.', 'info');
    showPaywall('upgrade');
}
