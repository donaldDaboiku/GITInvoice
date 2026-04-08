<?php

namespace InvoHub\Models;

class Plan
{
    public const FREE_DEMO = 'free_demo';
    public const SOLO_LIFETIME = 'solo_lifetime';
    public const TEAM_5 = 'team_5';
    public const TEAM_UNLIMITED = 'team_unlimited';

    public static function all(): array
    {
        return [
            self::FREE_DEMO => [
                'code' => self::FREE_DEMO,
                'name' => 'Free Demo',
                'billing_model' => 'free',
                'staff_limit' => 1,
                'max_invoices_per_month' => (int) ($_ENV['PLAN_FREE_INVOICES'] ?? 3),
                'price_monthly' => 0,
                'price_once' => 0,
                'features' => [
                    'offline_mode' => true,
                    'cloud_sync' => false,
                    'team_collaboration' => false,
                    'advanced_reports' => false,
                    'priority_support' => false,
                ],
            ],
            self::SOLO_LIFETIME => [
                'code' => self::SOLO_LIFETIME,
                'name' => 'Solo Lifetime',
                'billing_model' => 'one_time',
                'staff_limit' => 1,
                'max_invoices_per_month' => (int) ($_ENV['PLAN_STARTER_INVOICES'] ?? 25),
                'price_monthly' => null,
                'price_once' => 25.42,
                'features' => [
                    'offline_mode' => true,
                    'cloud_sync' => false,
                    'team_collaboration' => false,
                    'advanced_reports' => true,
                    'priority_support' => false,
                ],
            ],
            self::TEAM_5 => [
                'code' => self::TEAM_5,
                'name' => 'Team 5',
                'billing_model' => 'subscription',
                'staff_limit' => 5,
                'max_invoices_per_month' => 0,
                'price_monthly' => (float) ($_ENV['PLAN_PRO_PRICE'] ?? 19),
                'price_once' => null,
                'features' => [
                    'offline_mode' => true,
                    'cloud_sync' => true,
                    'team_collaboration' => true,
                    'advanced_reports' => true,
                    'priority_support' => false,
                ],
            ],
            self::TEAM_UNLIMITED => [
                'code' => self::TEAM_UNLIMITED,
                'name' => 'Team Unlimited',
                'billing_model' => 'subscription',
                'staff_limit' => 0,
                'max_invoices_per_month' => 0,
                'price_monthly' => (float) ($_ENV['PLAN_ENTERPRISE_PRICE'] ?? 49),
                'price_once' => null,
                'features' => [
                    'offline_mode' => true,
                    'cloud_sync' => true,
                    'team_collaboration' => true,
                    'advanced_reports' => true,
                    'priority_support' => true,
                ],
            ],
        ];
    }

    public static function find(string $code): ?array
    {
        return self::all()[$code] ?? null;
    }

    public static function toLegacyTier(string $code): string
    {
        return match ($code) {
            self::SOLO_LIFETIME => 'starter',
            self::TEAM_5 => 'pro',
            self::TEAM_UNLIMITED => 'enterprise',
            default => 'free',
        };
    }

    public static function normalizeForOutput(array $plan): array
    {
        return [
            'code' => $plan['code'],
            'name' => $plan['name'],
            'billing_model' => $plan['billing_model'],
            'staff_limit' => $plan['staff_limit'],
            'max_invoices_per_month' => $plan['max_invoices_per_month'],
            'price_monthly' => $plan['price_monthly'],
            'price_once' => $plan['price_once'],
            'features' => $plan['features'],
        ];
    }
}
