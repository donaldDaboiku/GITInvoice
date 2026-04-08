<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class Organization
{
    public static function createForUser(int $userId, string $name, ?string $email = null): int
    {
        $baseSlug = slugify($name !== '' ? $name : 'workspace');
        $slug = "{$baseSlug}-u{$userId}";
        $plan = Plan::find(Plan::FREE_DEMO);

        Database::beginTransaction();

        try {
            $organizationId = Database::insert('organizations', [
                'owner_user_id' => $userId,
                'name' => $name !== '' ? $name : 'My Workspace',
                'slug' => $slug,
                'plan_code' => $plan['code'],
                'billing_model' => $plan['billing_model'],
                'subscription_status' => 'none',
                'staff_limit' => $plan['staff_limit'],
                'max_invoices_per_month' => $plan['max_invoices_per_month'],
                'features_json' => json_encode($plan['features'], JSON_UNESCAPED_UNICODE),
            ]);

            Database::insert('organization_members', [
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'invited_email' => $email,
                'role' => 'owner',
                'status' => 'active',
                'joined_at' => date('Y-m-d H:i:s'),
            ]);

            if (Database::tableHasColumn('users', 'primary_organization_id')) {
                Database::update('users', ['primary_organization_id' => $organizationId], 'id = ?', [$userId]);
            }

            Database::commit();

            return $organizationId;
        } catch (\Throwable $exception) {
            Database::rollback();
            throw $exception;
        }
    }

    public static function getForUser(int $userId): ?array
    {
        if (
            !Database::tableHasColumn('organizations', 'id')
            || !Database::tableHasColumn('users', 'primary_organization_id')
        ) {
            return null;
        }

        return Database::fetchOne(
            "SELECT o.*,
                    COUNT(DISTINCT om.id) AS total_members,
                    SUM(CASE WHEN om.status = 'active' THEN 1 ELSE 0 END) AS active_members
             FROM organizations o
             INNER JOIN organization_members om
                ON om.organization_id = o.id
             WHERE o.id = (
                SELECT primary_organization_id
                FROM users
                WHERE id = ?
             )
             GROUP BY o.id",
            [$userId]
        ) ?: null;
    }

    public static function getById(int $organizationId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM organizations WHERE id = ?",
            [$organizationId]
        ) ?: null;
    }

    public static function getMembers(int $organizationId): array
    {
        return Database::fetchAll(
            "SELECT om.id,
                    om.user_id,
                    om.invited_email,
                    om.role,
                    om.status,
                    om.joined_at,
                    om.created_at,
                    u.full_name,
                    u.email
             FROM organization_members om
             LEFT JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = ?
             ORDER BY
                CASE om.role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    ELSE 3
                END,
                COALESCE(u.full_name, om.invited_email) ASC",
            [$organizationId]
        );
    }

    public static function getMemberByUser(int $organizationId, int $userId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM organization_members
             WHERE organization_id = ? AND user_id = ?
             LIMIT 1",
            [$organizationId, $userId]
        ) ?: null;
    }

    public static function canAddSeat(int $organizationId): bool
    {
        $organization = self::getById($organizationId);
        if (!$organization) {
            return false;
        }

        $staffLimit = (int) ($organization['staff_limit'] ?? 0);
        if ($staffLimit === 0) {
            return true;
        }

        $result = Database::fetchOne(
            "SELECT COUNT(*) AS count
             FROM organization_members
             WHERE organization_id = ?
               AND status IN ('active', 'invited')",
            [$organizationId]
        );

        return (int) ($result['count'] ?? 0) < $staffLimit;
    }

    public static function addMember(int $organizationId, array $data): array
    {
        if (!self::canAddSeat($organizationId)) {
            throw new \RuntimeException('This workspace has reached its staff limit for the current plan.');
        }

        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $role = $data['role'] ?? 'staff';

        $existingUser = Database::fetchOne(
            "SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1",
            [$email]
        );

        $existingMembership = Database::fetchOne(
            "SELECT id FROM organization_members
             WHERE organization_id = ?
               AND (
                    user_id = ?
                    OR invited_email = ?
               )
             LIMIT 1",
            [$organizationId, $existingUser['id'] ?? 0, $email]
        );

        if ($existingMembership) {
            throw new \RuntimeException('That email is already part of this workspace or has a pending invite.');
        }

        $memberId = Database::insert('organization_members', [
            'organization_id' => $organizationId,
            'user_id' => $existingUser['id'] ?? null,
            'invited_email' => $email,
            'role' => $role,
            'status' => $existingUser ? 'active' : 'invited',
            'joined_at' => $existingUser ? date('Y-m-d H:i:s') : null,
        ]);

        return Database::fetchOne(
            "SELECT om.id,
                    om.user_id,
                    om.invited_email,
                    om.role,
                    om.status,
                    om.joined_at,
                    u.full_name,
                    u.email
             FROM organization_members om
             LEFT JOIN users u ON u.id = om.user_id
             WHERE om.id = ?",
            [$memberId]
        ) ?: [];
    }

    public static function removeMember(int $organizationId, int $memberId): bool
    {
        $member = Database::fetchOne(
            "SELECT role FROM organization_members WHERE id = ? AND organization_id = ?",
            [$memberId, $organizationId]
        );

        if (!$member) {
            return false;
        }

        if ($member['role'] === 'owner') {
            throw new \RuntimeException('The workspace owner cannot be removed.');
        }

        return Database::delete(
            'organization_members',
            'id = ? AND organization_id = ?',
            [$memberId, $organizationId]
        ) > 0;
    }

    public static function updatePlan(int $organizationId, array $plan, string $subscriptionStatus = 'active'): void
    {
        Database::update('organizations', [
            'plan_code' => $plan['code'],
            'billing_model' => $plan['billing_model'],
            'subscription_status' => $subscriptionStatus,
            'staff_limit' => $plan['staff_limit'],
            'max_invoices_per_month' => $plan['max_invoices_per_month'],
            'features_json' => json_encode($plan['features'], JSON_UNESCAPED_UNICODE),
        ], 'id = ?', [$organizationId]);

        Database::query(
            "UPDATE users u
             INNER JOIN organization_members om ON om.user_id = u.id
             SET u.subscription_tier = ?, u.subscription_status = ?
             WHERE om.organization_id = ?",
            [Plan::toLegacyTier($plan['code']), $subscriptionStatus, $organizationId]
        );
    }

    public static function getFeatureFlags(array $organization): array
    {
        $features = $organization['features_json'] ?? null;

        if (is_string($features)) {
            $decoded = json_decode($features, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        $plan = Plan::find($organization['plan_code'] ?? Plan::FREE_DEMO);

        return $plan['features'] ?? [];
    }
}
