SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS organizations (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    owner_user_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'free_demo',
    billing_model ENUM('free', 'one_time', 'subscription') NOT NULL DEFAULT 'free',
    subscription_status ENUM('active', 'trialing', 'past_due', 'canceled', 'none') NOT NULL DEFAULT 'none',
    staff_limit INT UNSIGNED NOT NULL DEFAULT 1,
    max_invoices_per_month INT UNSIGNED NOT NULL DEFAULT 3,
    features_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_user_id),
    INDEX idx_plan (plan_code, subscription_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_members (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    organization_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    invited_email VARCHAR(255) NULL,
    role ENUM('owner', 'admin', 'staff') NOT NULL DEFAULT 'staff',
    status ENUM('active', 'invited', 'disabled') NOT NULL DEFAULT 'invited',
    joined_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uniq_org_user (organization_id, user_id),
    INDEX idx_org_role (organization_id, role, status),
    INDEX idx_invited_email (invited_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS primary_organization_id INT UNSIGNED NULL AFTER company_name,
    ADD INDEX IF NOT EXISTS idx_primary_organization (primary_organization_id);

INSERT INTO organizations (
    owner_user_id,
    name,
    slug,
    plan_code,
    billing_model,
    subscription_status,
    staff_limit,
    max_invoices_per_month,
    features_json
)
SELECT
    u.id,
    COALESCE(NULLIF(u.company_name, ''), CONCAT(u.full_name, '''s Workspace'), CONCAT('Workspace ', u.id)),
    CONCAT(
        LOWER(REPLACE(COALESCE(NULLIF(u.company_name, ''), SUBSTRING_INDEX(u.email, '@', 1), 'workspace'), ' ', '-')),
        '-u',
        u.id
    ),
    'free_demo',
    'free',
    COALESCE(u.subscription_status, 'none'),
    1,
    3,
    JSON_OBJECT(
        'offline_mode', TRUE,
        'cloud_sync', FALSE,
        'team_collaboration', FALSE,
        'advanced_reports', FALSE,
        'priority_support', FALSE
    )
FROM users u
LEFT JOIN organizations o ON o.owner_user_id = u.id
WHERE o.id IS NULL;

UPDATE users u
INNER JOIN organizations o ON o.owner_user_id = u.id
SET u.primary_organization_id = o.id
WHERE u.primary_organization_id IS NULL;

INSERT INTO organization_members (
    organization_id,
    user_id,
    invited_email,
    role,
    status,
    joined_at
)
SELECT
    o.id,
    u.id,
    u.email,
    'owner',
    'active',
    NOW()
FROM users u
INNER JOIN organizations o ON o.owner_user_id = u.id
LEFT JOIN organization_members om
    ON om.organization_id = o.id
   AND om.user_id = u.id
WHERE om.id IS NULL;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_customers_org (organization_id);

ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_inventory_org (organization_id);

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_invoices_org (organization_id);

ALTER TABLE recurring_invoices
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_recurring_org (organization_id);

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_settings_org (organization_id);

ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD COLUMN IF NOT EXISTS plan_code VARCHAR(50) NULL AFTER stripe_customer_id,
    ADD COLUMN IF NOT EXISTS billing_model ENUM('free', 'one_time', 'subscription') NOT NULL DEFAULT 'subscription' AFTER plan_name,
    ADD COLUMN IF NOT EXISTS staff_limit INT UNSIGNED NOT NULL DEFAULT 1 AFTER status,
    ADD COLUMN IF NOT EXISTS max_invoices_per_month INT UNSIGNED NOT NULL DEFAULT 0 AFTER staff_limit,
    ADD COLUMN IF NOT EXISTS features_json JSON NULL AFTER max_invoices_per_month,
    ADD INDEX IF NOT EXISTS idx_subscription_org (organization_id);

ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_payment_org (organization_id);

ALTER TABLE activity_log
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_activity_org (organization_id);

ALTER TABLE uploads
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_uploads_org (organization_id);

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_notifications_org (organization_id);

ALTER TABLE api_tokens
    ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED NULL AFTER user_id,
    ADD INDEX IF NOT EXISTS idx_tokens_org (organization_id);

UPDATE customers c
INNER JOIN users u ON u.id = c.user_id
SET c.organization_id = u.primary_organization_id
WHERE c.organization_id IS NULL;

UPDATE inventory_items i
INNER JOIN users u ON u.id = i.user_id
SET i.organization_id = u.primary_organization_id
WHERE i.organization_id IS NULL;

UPDATE invoices i
INNER JOIN users u ON u.id = i.user_id
SET i.organization_id = u.primary_organization_id
WHERE i.organization_id IS NULL;

UPDATE recurring_invoices ri
INNER JOIN users u ON u.id = ri.user_id
SET ri.organization_id = u.primary_organization_id
WHERE ri.organization_id IS NULL;

UPDATE user_settings us
INNER JOIN users u ON u.id = us.user_id
SET us.organization_id = u.primary_organization_id
WHERE us.organization_id IS NULL;

UPDATE subscriptions s
INNER JOIN users u ON u.id = s.user_id
SET s.organization_id = u.primary_organization_id,
    s.plan_code = COALESCE(
        s.plan_code,
        CASE s.plan_name
            WHEN 'starter' THEN 'solo_lifetime'
            WHEN 'pro' THEN 'team_5'
            WHEN 'enterprise' THEN 'team_unlimited'
            ELSE 'free_demo'
        END
    )
WHERE s.organization_id IS NULL OR s.plan_code IS NULL;

UPDATE payment_transactions pt
INNER JOIN users u ON u.id = pt.user_id
SET pt.organization_id = u.primary_organization_id
WHERE pt.organization_id IS NULL;

UPDATE activity_log al
INNER JOIN users u ON u.id = al.user_id
SET al.organization_id = u.primary_organization_id
WHERE al.organization_id IS NULL;

UPDATE uploads up
INNER JOIN users u ON u.id = up.user_id
SET up.organization_id = u.primary_organization_id
WHERE up.organization_id IS NULL;

UPDATE notifications n
INNER JOIN users u ON u.id = n.user_id
SET n.organization_id = u.primary_organization_id
WHERE n.organization_id IS NULL;

UPDATE api_tokens t
INNER JOIN users u ON u.id = t.user_id
SET t.organization_id = u.primary_organization_id
WHERE t.organization_id IS NULL;

SET FOREIGN_KEY_CHECKS=1;
