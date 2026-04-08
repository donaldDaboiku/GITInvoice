<?php

namespace InvoHub\Controllers;

use InvoHub\Middleware\AuthMiddleware;
use InvoHub\Models\Organization;
use InvoHub\Models\Plan;
use InvoHub\Models\Subscription;
use InvoHub\Utils\Response;
use InvoHub\Utils\Validator;

class SubscriptionController
{
    public function getPlans()
    {
        return Response::success([
            'plans' => array_values(array_map(
                [Plan::class, 'normalizeForOutput'],
                Plan::all()
            )),
        ]);
    }

    public function getCurrent()
    {
        $user = AuthMiddleware::getUser();
        if (!$user) {
            return Response::error('Unauthorized', 401);
        }

        $organization = Organization::getForUser((int) $user['id']);
        if (!$organization) {
            return Response::error('Workspace not found', 404);
        }

        $subscription = Subscription::getCurrentForOrganization((int) $organization['id']);

        return Response::success([
            'workspace' => [
                'id' => (int) $organization['id'],
                'name' => $organization['name'],
                'plan_code' => $organization['plan_code'],
                'billing_model' => $organization['billing_model'],
                'subscription_status' => $organization['subscription_status'],
                'staff_limit' => (int) $organization['staff_limit'],
                'active_members' => (int) ($organization['active_members'] ?? 1),
                'features' => Organization::getFeatureFlags($organization),
            ],
            'subscription' => $subscription,
        ]);
    }

    public function createCheckout()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $errors = Validator::validate($data, [
            'plan_code' => 'required|in:free_demo,solo_lifetime,team_5,team_unlimited',
        ]);

        if ($errors !== []) {
            return Response::error('Validation failed', 422, $errors);
        }

        $plan = Plan::find($data['plan_code']);
        $organization = Organization::getForUser($userId);

        if (!$plan || !$organization) {
            return Response::error('Requested plan or workspace not found.', 404);
        }

        $priceConfigured = $plan['billing_model'] !== 'subscription'
            || (
                !empty($_ENV['STRIPE_SECRET_KEY'])
                && str_starts_with((string) $_ENV['STRIPE_SECRET_KEY'], 'sk_')
            );

        return Response::success([
            'message' => $priceConfigured
                ? 'Checkout can be created once product price IDs are wired in.'
                : 'Stripe is not fully configured yet. Use the upgrade endpoint for manual testing in development.',
            'checkout_ready' => false,
            'workspace_id' => (int) $organization['id'],
            'plan' => Plan::normalizeForOutput($plan),
        ], 202);
    }

    public function upgrade()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $errors = Validator::validate($data, [
            'plan_code' => 'required|in:free_demo,solo_lifetime,team_5,team_unlimited',
        ]);

        if ($errors !== []) {
            return Response::error('Validation failed', 422, $errors);
        }

        $plan = Plan::find($data['plan_code']);
        $organization = Organization::getForUser($userId);

        if (!$plan || !$organization) {
            return Response::error('Requested plan or workspace not found.', 404);
        }

        Organization::updatePlan((int) $organization['id'], $plan, $plan['billing_model'] === 'free' ? 'none' : 'active');
        Subscription::createOrReplace((int) $organization['id'], $userId, $plan, [
            'status' => $plan['billing_model'] === 'free' ? 'none' : 'active',
        ]);

        return Response::success([
            'message' => 'Workspace plan updated.',
            'plan' => Plan::normalizeForOutput($plan),
            'subscription' => Subscription::getCurrentForOrganization((int) $organization['id']),
        ]);
    }

    public function cancel()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $organization = Organization::getForUser($userId);
        if (!$organization) {
            return Response::error('Workspace not found', 404);
        }

        Subscription::cancel((int) $organization['id']);
        Organization::updatePlan((int) $organization['id'], Plan::find(Plan::FREE_DEMO), 'canceled');

        return Response::success([
            'message' => 'Subscription canceled. Workspace reverted to the free demo plan.',
        ]);
    }
}
