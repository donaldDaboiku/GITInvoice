<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class User
{
    public static function findById(int $id): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
            [$id]
        ) ?: null;
    }
    
    public static function findByEmail(string $email): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            [$email]
        ) ?: null;
    }
    
    public static function create(array $data): int
    {
        return Database::insert('users', [
            'email' => $data['email'],
            'password_hash' => $data['password_hash'],
            'full_name' => $data['full_name'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'subscription_tier' => $data['subscription_tier'] ?? 'free',
            'subscription_status' => $data['subscription_status'] ?? 'none'
        ]);
    }
    
    public static function update(int $id, array $data): bool
    {
        $updateData = [];
        
        $allowedFields = ['full_name', 'company_name', 'email', 'subscription_tier', 'subscription_status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        return Database::update('users', $updateData, 'id = ?', [$id]) > 0;
    }
    
    public static function updateLastLogin(int $id): void
    {
        Database::update('users', ['last_login_at' => date('Y-m-d H:i:s')], 'id = ?', [$id]);
    }
    
    public static function verifyEmail(int $id): void
    {
        Database::update('users', ['email_verified_at' => date('Y-m-d H:i:s')], 'id = ?', [$id]);
    }
    
    public static function getSettings(int $userId): ?array
    {
        [$column, $ownerId] = self::resolveOwnershipScope('user_settings', $userId);

        return Database::fetchOne(
            "SELECT * FROM user_settings WHERE {$column} = ?",
            [$ownerId]
        ) ?: null;
    }

    public static function updateSettings(int $userId, array $settings): bool
    {
        $existing = self::getSettings($userId);
        [$column, $ownerId] = self::resolveOwnershipScope('user_settings', $userId);
        
        if (!$existing) {
            // Create default settings
            $insertData = ['user_id' => $userId];
            if ($column === 'organization_id') {
                $insertData['organization_id'] = $ownerId;
            }

            Database::insert('user_settings', $insertData);
        }
        
        return Database::update('user_settings', $settings, "{$column} = ?", [$ownerId]) > 0;
    }
    
    public static function getInvoiceCount(int $userId, ?string $period = 'month'): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope('invoices', $userId);
        $where = "{$column} = ?";
        $params = [$ownerId];
        
        if ($period === 'month') {
            $where .= " AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())";
        }
        
        $result = Database::fetchOne(
            "SELECT COUNT(*) as count FROM invoices WHERE {$where}",
            $params
        );
        
        return (int)($result['count'] ?? 0);
    }
    
    public static function canCreateInvoice(int $userId): bool
    {
        $user = self::findById($userId);
        if (!$user) return false;

        $workspace = self::getCurrentOrganization($userId);
        $planCode = $workspace['plan_code'] ?? Plan::FREE_DEMO;
        $plan = Plan::find($planCode) ?? Plan::find(Plan::FREE_DEMO);

        if (($plan['max_invoices_per_month'] ?? 0) === 0) {
            return true;
        }

        $count = self::getInvoiceCount($userId, 'month');
        return $count < (int) $plan['max_invoices_per_month'];
    }

    public static function getPrimaryOrganizationId(int $userId): ?int
    {
        if (!Database::tableHasColumn('users', 'primary_organization_id')) {
            return null;
        }

        $result = Database::fetchOne(
            "SELECT primary_organization_id FROM users WHERE id = ?",
            [$userId]
        );

        return isset($result['primary_organization_id']) ? (int) $result['primary_organization_id'] : null;
    }

    public static function getCurrentOrganization(int $userId): ?array
    {
        return Organization::getForUser($userId);
    }

    public static function serializeProfile(?array $user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'company_name' => $user['company_name'],
            'subscription_tier' => $user['subscription_tier'],
            'subscription_status' => $user['subscription_status'],
            'primary_organization_id' => isset($user['primary_organization_id'])
                ? (int) $user['primary_organization_id']
                : null,
        ];
    }

    public static function serializeWorkspace(?array $workspace): ?array
    {
        if (!$workspace) {
            return null;
        }

        return [
            'id' => (int) $workspace['id'],
            'name' => $workspace['name'],
            'slug' => $workspace['slug'] ?? null,
            'plan_code' => $workspace['plan_code'] ?? Plan::FREE_DEMO,
            'billing_model' => $workspace['billing_model'] ?? 'free',
            'subscription_status' => $workspace['subscription_status'] ?? 'none',
            'staff_limit' => (int) ($workspace['staff_limit'] ?? 1),
            'active_members' => (int) ($workspace['active_members'] ?? 1),
            'features' => Organization::getFeatureFlags($workspace),
        ];
    }

    private static function resolveOwnershipScope(string $table, int $userId): array
    {
        $organizationId = self::getPrimaryOrganizationId($userId);

        if ($organizationId && Database::tableHasColumn($table, 'organization_id')) {
            return ['organization_id', $organizationId];
        }

        return ['user_id', $userId];
    }
}
