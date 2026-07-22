// GITInvoice — shared configuration and storage keys
'use strict';

var LICENSE_VALIDATE_URL = '/api/validate-license';
var BUYER_KYC_URL = '/api/buyer-kyc';
var APP_VERSION = '4.5.0';
var SURVEY_TRIGGER_COUNT = 5;
var DEV_MODE = false;
var TRIAL_INVOICE_LIMIT = 3;
var TRIAL_CUSTOMER_LIMIT = 2;
/** Shared login password for demo accounts seeded after DEMO-* license activation. */
var DEMO_USER_PASSWORD = 'demo1234';

var STORAGE_KEYS = {
    INVOICES:         'GIT Invoice_invoices',
    CUSTOMERS:        'GIT Invoice_customers',
    SETTINGS:         'GIT Invoice_settings',
    LOGO:             'GIT Invoice_logo',
    PRODUCTS:         'GIT Invoice_products',
    EXPENSES:         'GIT Invoice_expenses',
    QUOTES:           'GIT Invoice_quotes',
    LICENSE_KEY:      'GIT Invoice_license_key',
    LICENSE_EMAIL:    'GIT Invoice_license_email',
    LICENSE_DEVICES:  'GIT Invoice_license_devices',
    DEVICE_ACTIVATED: 'GIT Invoice_device_activated',
    ACTIVATED_AT:     'GIT Invoice_activated_at',
    BUYER_KYC_STATUS: 'GIT Invoice_buyer_kyc_status',
    BUYER_KYC_SUBMITTED_AT: 'GIT Invoice_buyer_kyc_submitted_at',
    PRIVACY_ACK:      'GIT Invoice_privacy_ack',
    INVOICE_COUNTER:  'GIT Invoice_invoice_counter',
    LICENSE_TIER:     'GIT Invoice_license_tier',
    API_KEY:          'GIT Invoice_api_key',
    USERS:            'GIT Invoice_users',
    SESSION:          'GIT Invoice_session',
    DEVICE_ID:        'GIT Invoice_device_id',
    NOTIF_DISMISSED:  'GIT Invoice_notif_dismissed',
    SURVEY_DONE:      'GIT Invoice_survey_done',
    SURVEY_USAGE:     'GIT Invoice_survey_usage',
    APP_VERSION:      'GIT Invoice_app_version',
};

// One-time recovery: older builds stored data under localStorage key "undefined".
function migrateLegacyStorageKeys() {
    var legacyRaw = localStorage.getItem('undefined');
    if (!legacyRaw) return;

    var legacy;
    try { legacy = JSON.parse(legacyRaw); } catch (e) { return; }
    if (!Array.isArray(legacy) || legacy.length === 0) return;

    var targets = [
        { key: STORAGE_KEYS.PRODUCTS, match: function (item) { return 'sellPrice' in item || 'trackStock' in item; } },
        { key: STORAGE_KEYS.EXPENSES, match: function (item) { return 'amount' in item && 'category' in item; } },
        { key: STORAGE_KEYS.QUOTES,   match: function (item) { return 'validUntil' in item || (item.number && String(item.number).indexOf('QTE-') === 0); } },
    ];

    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        if (!localStorage.getItem(target.key) && legacy.some(target.match)) {
            localStorage.setItem(target.key, legacyRaw);
            break;
        }
    }
    localStorage.removeItem('undefined');
}

function getDeviceId() {
    var id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
        id = (crypto.randomUUID && crypto.randomUUID()) ||
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
}
