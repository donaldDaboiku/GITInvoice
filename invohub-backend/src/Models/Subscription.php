<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class Subscription
{
    public static function getCurrentForOrganization(int $organizationId): ?array
    {
        $subscription = Database::fetchOne(
            "SELECT *
             FROM subscriptions
             WHERE organization_id = ?
             ORDER BY id DESC
             LIMIT 1",
            [$organizationId]
        );

        if ($subscription) {
            return $subscription;
        }

        $organization = Organization::getById($organizationId);
        if (!$organization) {
            return null;
        }

        $plan = Plan::find($organization['plan_code'] ?? Plan::FREE_DEMO) ?? Plan::find(Plan::FREE_DEMO);

        return [
            'plan_code' => $organization['plan_code'],
            'plan_name' => $plan['name'],
            'billing_model' => $organization['billing_model'],
            'status' => $organization['subscription_status'],
            'staff_limit' => $organization['staff_limit'],
            'max_invoices_per_month' => $organization['max_invoices_per_month'],
        ];
    }

    public static function createOrReplace(int $organizationId, int $userId, array $plan, array $payload = []): int
    {
        Database::query(
            "UPDATE subscriptions
             SET ended_at = NOW(), status = 'replaced'
             WHERE organization_id = ?
               AND ended_at IS NULL
               AND status NOT IN ('canceled', 'ended')",
            [$organizationId]
        );

        return Database::insert('subscriptions', [
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'plan_code' => $plan['code'],
            'plan_name' => $plan['name'],
            'billing_model' => $plan['billing_model'],
            'amount' => $plan['billing_model'] === 'one_time'
                ? ($plan['price_once'] ?? 0)
                : ($plan['price_monthly'] ?? 0),
            'currency' => $payload['currency'] ?? 'USD',
            'status' => $payload['status'] ?? 'active',
            'staff_limit' => $plan['staff_limit'],
            'max_invoices_per_month' => $plan['max_invoices_per_month'],
            'features_json' => json_encode($plan['features'], JSON_UNESCAPED_UNICODE),
            'stripe_subscription_id' => $payload['stripe_subscription_id'] ?? null,
            'stripe_customer_id' => $payload['stripe_customer_id'] ?? null,
            'current_period_start' => $payload['current_period_start'] ?? null,
            'current_period_end' => $payload['current_period_end'] ?? null,
            'trial_start' => $payload['trial_start'] ?? null,
            'trial_end' => $payload['trial_end'] ?? null,
        ]);
    }

    public static function cancel(int $organizationId): void
    {
        Database::query(
            "UPDATE subscriptions
             SET status = 'canceled', canceled_at = NOW(), ended_at = NOW()
             WHERE organization_id = ?
               AND ended_at IS NULL",
            [$organizationId]
        );
    }
}
