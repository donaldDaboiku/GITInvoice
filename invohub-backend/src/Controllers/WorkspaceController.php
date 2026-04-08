<?php

namespace InvoHub\Controllers;

use InvoHub\Middleware\AuthMiddleware;
use InvoHub\Models\Organization;
use InvoHub\Utils\Response;
use InvoHub\Utils\Validator;

class WorkspaceController
{
    public function getCurrent()
    {
        $user = AuthMiddleware::getUser();
        if (!$user) {
            return Response::error('Unauthorized', 401);
        }

        $workspace = Organization::getForUser((int) $user['id']);
        if (!$workspace) {
            return Response::error('Workspace not found', 404);
        }

        return Response::success([
            'workspace' => [
                'id' => (int) $workspace['id'],
                'name' => $workspace['name'],
                'slug' => $workspace['slug'],
                'plan_code' => $workspace['plan_code'],
                'billing_model' => $workspace['billing_model'],
                'subscription_status' => $workspace['subscription_status'],
                'staff_limit' => (int) $workspace['staff_limit'],
                'active_members' => (int) ($workspace['active_members'] ?? 1),
                'features' => Organization::getFeatureFlags($workspace),
            ],
        ]);
    }

    public function getMembers()
    {
        $user = AuthMiddleware::getUser();
        if (!$user) {
            return Response::error('Unauthorized', 401);
        }

        $workspace = Organization::getForUser((int) $user['id']);
        if (!$workspace) {
            return Response::error('Workspace not found', 404);
        }

        return Response::success([
            'members' => Organization::getMembers((int) $workspace['id']),
        ]);
    }

    public function inviteMember()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $workspace = Organization::getForUser($userId);
        $member = Organization::getMemberByUser((int) ($workspace['id'] ?? 0), $userId);

        if (!$workspace || !$member || !in_array($member['role'], ['owner', 'admin'], true)) {
            return Response::error('You do not have permission to invite staff to this workspace.', 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $errors = Validator::validate($data, [
            'email' => 'required|email|max:255',
            'role' => 'in:admin,staff',
        ]);

        if ($errors !== []) {
            return Response::error('Validation failed', 422, $errors);
        }

        $invite = Organization::addMember((int) $workspace['id'], [
            'email' => $data['email'],
            'role' => $data['role'] ?? 'staff',
        ]);

        return Response::success([
            'message' => 'Workspace member added.',
            'member' => $invite,
        ], 201);
    }

    public function removeMember($memberId)
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $workspace = Organization::getForUser($userId);
        $requester = Organization::getMemberByUser((int) ($workspace['id'] ?? 0), $userId);

        if (!$workspace || !$requester || !in_array($requester['role'], ['owner', 'admin'], true)) {
            return Response::error('You do not have permission to remove staff from this workspace.', 403);
        }

        Organization::removeMember((int) $workspace['id'], (int) $memberId);

        return Response::success([
            'message' => 'Workspace member removed.',
        ]);
    }
}
