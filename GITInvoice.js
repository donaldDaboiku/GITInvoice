// GITInvoice — app shell (navigation, users, notifications, init)
// Modules loaded via index.html before this file.
'use strict';

// ==================== APP INIT ====================
document.addEventListener('DOMContentLoaded', function () {
    migrateLegacyStorageKeys();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[SW] Registered:', reg.scope);
        }).catch(err => console.warn('[SW] Registration failed:', err));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const action    = urlParams.get('action');

    initLicenseOnLoad(action);
});

// ==================== USER AUTH (js/auth.js) — UI below ====================

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
                <button class="btn-activate" id="create-owner-account-btn" type="button">Create Owner Account</button>
            </div>`;
        const ownerBtn = document.getElementById('create-owner-account-btn');
        if (ownerBtn) ownerBtn.addEventListener('click', () => openAddUserModal(true));
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

// ==================== API KEY (BUSINESS ONLY) ====================
function generateApiKey() {
    if (!canUseAPI()) { requireTierFeature('API Access'); return; }
    const licenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '';
    // API key = license key itself (validated server-side via Supabase)
    // Store it visibly so the user can copy it
    localStorage.setItem(STORAGE_KEYS.API_KEY, licenseKey);
    renderApiKeySection();
    showToast('API key ready! Use your license key as the API key.', 'success');
}

function renderApiKeySection() {
    const el = document.getElementById('api-key-section');
    if (!el) return;
    if (!canUseAPI()) {
        el.innerHTML = `<div class="tier-locked-banner">
            🔒 API Access is available on the <strong>Business plan</strong>.
            <button class="btn btn-primary btn-sm" onclick="switchPlan()" style="margin-left:12px">Upgrade →</button>
        </div>`;
        return;
    }
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || localStorage.getItem(STORAGE_KEYS.LICENSE_KEY) || '—';
    el.innerHTML = `
        <div class="api-key-display">
            <code id="api-key-value">${apiKey}</code>
            <button class="btn btn-secondary btn-sm" onclick="copyApiKey()">Copy</button>
        </div>
        <div style="margin-top:12px;font-size:13px;color:var(--text-muted)">
            Use this key in the <code>X-API-Key</code> header to access your data programmatically.
        </div>
        <div class="api-endpoints-box">
            <div class="api-endpoint"><span class="api-method">GET</span><code>/api/external/invoices</code></div>
            <div class="api-endpoint"><span class="api-method">GET</span><code>/api/external/customers</code></div>
            <div class="api-endpoint"><span class="api-method">GET</span><code>/api/external/products</code></div>
        </div>`;
}

function copyApiKey() {
    const key = document.getElementById('api-key-value')?.textContent;
    if (key && key !== '—') {
        navigator.clipboard.writeText(key).then(() => showToast('API key copied!'));
    }
}

// ==================== FEATURE 3: FEEDBACK SURVEY ====================
function trackInvoiceSave() {
    if (localStorage.getItem(STORAGE_KEYS.SURVEY_DONE)) return;
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.SURVEY_USAGE) || '0') + 1;
    localStorage.setItem(STORAGE_KEYS.SURVEY_USAGE, count);
    if (count >= SURVEY_TRIGGER_COUNT) {
        setTimeout(() => openSurveyModal(), 1500); // slight delay so invoice saves first
    }
}

function openSurveyModal() {
    if (localStorage.getItem(STORAGE_KEYS.SURVEY_DONE)) return;
    const m = document.getElementById('survey-modal');
    if (m) m.classList.add('active');
}

function closeSurveyModal(skipForever = false) {
    const m = document.getElementById('survey-modal');
    if (m) m.classList.remove('active');
    if (skipForever) localStorage.setItem(STORAGE_KEYS.SURVEY_DONE, 'true');
}

async function submitSurvey() {
    const rating    = document.querySelector('.star-rating .star.selected')?.dataset.value || '';
    const recommend = document.getElementById('survey-recommend')?.value || '';
    const feedback  = document.getElementById('survey-feedback')?.value?.trim() || '';

    if (!rating) { showToast('Please select a star rating.', 'error'); return; }

    const btn = document.getElementById('survey-submit-btn');
    btn.disabled = true; btn.textContent = 'Sending...';

    try {
        // POST to a Tally form (replace YOUR_TALLY_ID with your actual Tally form ID)
        // Tally gives you a free embeddable form — sign up at tally.so
        const TALLY_ENDPOINT = 'https://tally.so/r/YOUR_TALLY_ID';
        const tier = getTier();
        const payload = { rating, recommend, feedback, tier, version: APP_VERSION };

        // Try Tally first, fall back to a mailto link
        try {
            await fetch(TALLY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch(e) {
            // Fallback: open mailto
            const body = encodeURIComponent(`Rating: ${rating}/5\nRecommend: ${recommend}\nFeedback: ${feedback}\nTier: ${tier}`);
            window.open('mailto:support@yourdomain.com?subject=invoHub Feedback&body=' + body);
        }
    } catch(e) { console.warn('Survey submission error:', e); }

    // Mark done regardless
    localStorage.setItem(STORAGE_KEYS.SURVEY_DONE, 'true');
    document.getElementById('survey-form').style.display = 'none';
    document.getElementById('survey-thankyou').style.display = 'block';
    setTimeout(() => closeSurveyModal(), 2500);
}

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.toggle('hovered', parseInt(s.dataset.value) <= val));
        });
        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.value) <= val));
        });
    });
}

// ==================== FEATURE 4: IN-APP NOTIFICATIONS ====================
const NOTIFICATIONS = [
    {
        id: 'v45-new-features',
        type: 'update',
        title: "What's new in v4.5",
        message: 'Inventory management, expense tracking, quotes, and a product catalogue picker are now live.',
        action: null,
        version: '4.5.0'
    },
    {
        id: 'api-business-launch',
        type: 'feature',
        title: 'Business API now available',
        message: 'Business plan users can now access their data via REST API. Connect to Zapier, Google Sheets, and more.',
        action: null,
        tierRequired: 'business'
    }
];

function getNotifsDismissed() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIF_DISMISSED) || '[]'); } catch(e) { return []; }
}
function dismissNotif(id) {
    const dismissed = getNotifsDismissed();
    if (!dismissed.includes(id)) dismissed.push(id);
    localStorage.setItem(STORAGE_KEYS.NOTIF_DISMISSED, JSON.stringify(dismissed));
    renderNotificationBell();
    const el = document.getElementById('notif-' + id);
    if (el) el.remove();
}
function dismissAllNotifs() {
    const ids = NOTIFICATIONS.map(n => n.id);
    localStorage.setItem(STORAGE_KEYS.NOTIF_DISMISSED, JSON.stringify(ids));
    renderNotificationBell();
    closeNotifPanel();
}

function getActiveNotifs() {
    const dismissed = getNotifsDismissed();
    const tier = getTier();
    return NOTIFICATIONS.filter(n => {
        if (dismissed.includes(n.id)) return false;
        if (n.tierRequired && n.tierRequired !== tier) return false;
        return true;
    });
}

function renderNotificationBell() {
    const bell = document.getElementById('notif-bell');
    const badge = document.getElementById('notif-badge');
    if (!bell) return;
    const count = getActiveNotifs().length + getRenewalNotifs().length;
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

function getRenewalNotifs() {
    const activatedAt = localStorage.getItem(STORAGE_KEYS.ACTIVATED_AT);
    if (!activatedAt || !isLicensed()) return [];
    const daysSince = (Date.now() - new Date(activatedAt)) / 86_400_000;
    // Remind after 11 months (330 days) and again after 13 months
    if (daysSince > 330) return [{ id: 'renewal', type: 'renewal', title: 'License renewal', message: 'Your license is over a year old. Check for major updates or new plans on Gumroad.', action: 'openRenewal' }];
    return [];
}

function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isOpen = panel.classList.contains('active');
    if (isOpen) { closeNotifPanel(); return; }
    renderNotifPanel();
    panel.classList.add('active');
}
function closeNotifPanel() {
    document.getElementById('notif-panel')?.classList.remove('active');
}
function openRenewal() {
    window.open('https://gitsystem.gumroad.com', '_blank');
    dismissNotif('renewal');
}

function renderNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const notifs = [...getActiveNotifs(), ...getRenewalNotifs()];
    if (notifs.length === 0) {
        panel.innerHTML = `<div class="notif-header"><strong>Notifications</strong><button class="modal-close" onclick="closeNotifPanel()">×</button></div>
            <div class="notif-empty">You're all caught up ✓</div>`;
        return;
    }
    const icons = { update: '🆕', feature: '✨', renewal: '🔔', info: 'ℹ️' };
    panel.innerHTML = `<div class="notif-header">
        <strong>Notifications</strong>
        <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary btn-sm" onclick="dismissAllNotifs()">Clear all</button>
            <button class="modal-close" onclick="closeNotifPanel()">×</button>
        </div>
    </div>` + notifs.map(n => `
        <div class="notif-item" id="notif-${n.id}">
            <div class="notif-icon">${icons[n.type]||'ℹ️'}</div>
            <div class="notif-body">
                <div class="notif-title">${escapeHtml(n.title)}</div>
                <div class="notif-msg">${escapeHtml(n.message)}</div>
                ${n.action ? `<button class="btn btn-primary btn-sm" style="margin-top:6px" onclick="${n.action}()">${n.action==='openRenewal'?'View on Gumroad →':'Learn more'}</button>` : ''}
            </div>
            <button class="notif-dismiss" onclick="dismissNotif('${n.id}')" title="Dismiss">×</button>
        </div>`).join('');
}

function checkAndShowVersionNotif() {
    const lastSeen = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    if (lastSeen !== APP_VERSION) {
        localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
        // Don't auto-dismiss version notifs — user dismisses manually
    }
    renderNotificationBell();
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

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        errorEl.textContent = 'Incorrect password. Please try again.';
        btnText.textContent = '→ Sign In';
        document.getElementById('user-password-input').value = '';
        document.getElementById('user-password-input').focus();
        return;
    }

    if (needsPasswordUpgrade(user.passwordHash)) {
        try {
            user.passwordHash = await hashPassword(password);
            user.updatedAt = new Date().toISOString();
            saveUsers(users);
        } catch (upgradeErr) {
            console.warn('Could not upgrade password hash:', upgradeErr);
        }
    }

    const shouldOpenSettings = user.role === 'owner' && user.openSettingsOnFirstLogin === true;
    if (shouldOpenSettings) {
        user.openSettingsOnFirstLogin = false;
        user.updatedAt = new Date().toISOString();
        saveUsers(users);
    }

    saveSession({ userId: user.id, username: user.username, role: user.role, loginAt: new Date().toISOString() });
    launchMainApp(shouldOpenSettings ? 'settings' : (window._pendingAction || null));
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
    } else if (action === 'settings') {
        navigateToPage('settings');
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
    // Show Business Tools nav and catalogue picker buttons for team/business tiers only
    const hasCatalogue = canUseInventory();
    document.querySelectorAll('.team-feature').forEach(el => {
        el.style.display = hasCatalogue ? '' : 'none';
    });
    document.querySelectorAll('.btn-add-catalogue').forEach(el => {
        el.style.display = hasCatalogue ? '' : 'none';
    });
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
let userModalForceOwner = false;

function openAddUserModal(forceOwner = false) {
    editingUserId = null;
    userModalForceOwner = forceOwner;
    document.getElementById('user-modal-title').textContent = forceOwner ? 'Create Owner Account' : 'Add New User';
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
    userModalForceOwner = false;
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
    userModalForceOwner = false;
}

async function saveUser() {
    const username  = document.getElementById('user-form-username').value.trim();
    const password  = document.getElementById('user-form-password').value;
    const password2 = document.getElementById('user-form-password2').value;
    const role      = userModalForceOwner ? 'owner' : document.getElementById('user-form-role').value;
    const errorEl   = document.getElementById('user-form-error');

    errorEl.textContent = '';

    if (!username || username.length < 2) { errorEl.textContent = 'Username must be at least 2 characters.'; return; }
    if (!editingUserId && (!password || password.length < 4)) { errorEl.textContent = 'Password must be at least 4 characters.'; return; }
    if (password && password !== password2) { errorEl.textContent = 'Passwords do not match.'; return; }

    const users = getUsers();
    const wasEditing = !!editingUserId;

    try {
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
                openSettingsOnFirstLogin: role === 'owner',
                createdAt: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error('Could not prepare user account:', err);
        errorEl.textContent = 'Could not create account in this browser. Try opening the app on localhost or HTTPS.';
        return;
    }

    if (!saveUsers(users)) {
        errorEl.textContent = 'Could not save account. Your browser storage may be full or blocked.';
        return;
    }

    const wasFirstUser = !wasEditing && users.length === 1;
    closeUserModal();
    loadUsersManagementList();
    showToast(wasEditing ? 'User updated.' : 'User added.');

    // If this was the first user (owner setup), proceed to login
    if (wasFirstUser) {
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
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const menuBackdrop = document.querySelector('.mobile-menu-backdrop');

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    if (menuBackdrop) {
        menuBackdrop.addEventListener('click', closeMobileMenu);
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeMobileMenu();
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function () {
            navigateToPage(this.getAttribute('data-page'));
        });
    });
}

function toggleMobileMenu() {
    const isOpen = document.body.classList.toggle('mobile-menu-open');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }
}

function closeMobileMenu() {
    document.body.classList.remove('mobile-menu-open');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
    }
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

    closeMobileMenu();

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
        version: BACKUP_FORMAT_VERSION
    };
    downloadFile(JSON.stringify(data, null, 2), `GIT Invoice-backup-${today()}.json`, 'application/json');
    showToast('Backup downloaded!');
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const raw = JSON.parse(e.target.result);
            const result = validateBackupData(raw);
            if (!result.valid) {
                alert(result.error || 'Invalid backup file.');
                return;
            }

            const data = result.data;
            const summary = [
                data.invoices.length ? `${data.invoices.length} invoice(s)` : '',
                data.customers.length ? `${data.customers.length} customer(s)` : '',
                data.products.length ? `${data.products.length} product(s)` : '',
                data.expenses.length ? `${data.expenses.length} expense(s)` : '',
                data.quotes.length ? `${data.quotes.length} quote(s)` : '',
            ].filter(Boolean).join(', ');

            if (!confirm(`Merge backup into your current data?\n\n${summary || 'Settings/logo only'}\n\nExisting records with the same ID will be updated.`)) return;

            if (data.invoices.length) {
                saveInvoices(mergeRecordsById(getInvoices(), data.invoices));
            }
            if (data.customers.length) {
                saveCustomers(mergeRecordsById(getCustomers(), data.customers));
            }
            if (data.settings) {
                saveSettingsData(mergeSettings(getSettings(), data.settings));
            }
            if (data.logo) {
                saveLogo(data.logo);
            }
            if (data.products.length) {
                saveProducts(mergeRecordsById(getProducts(), data.products));
            }
            if (data.expenses.length) {
                saveExpenses(mergeRecordsById(getExpenses(), data.expenses));
            }
            if (data.quotes.length) {
                saveQuotes(mergeRecordsById(getQuotes(), data.quotes));
            }

            if (data.invoices.length > 0) {
                syncCounterToInvoices(getInvoices());
            }

            loadSettings();
            loadInvoices();
            updateDashboard();
            loadCustomers();
            applyTheme();
            renderFooter();
            showToast('Backup restored successfully!');
        } catch (err) {
            console.error('Backup restore failed:', err);
            alert('Failed to restore backup. Please check the file is a valid GIT Invoice backup.');
        }
    };
    reader.readAsText(file);
}
