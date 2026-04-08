<?php

namespace InvoHub\Controllers;

use InvoHub\Middleware\AuthMiddleware;
use InvoHub\Models\Organization;
use InvoHub\Models\User;
use InvoHub\Utils\Response;
use InvoHub\Utils\Validator;

class UserController
{
    public function getProfile()
    {
        $user = AuthMiddleware::getUser();
        if (!$user) {
            return Response::error('Unauthorized', 401);
        }

        $organization = Organization::getForUser((int) $user['id']);

        return Response::success([
            'user' => User::serializeProfile($user),
            'workspace' => $organization ? User::serializeWorkspace($organization) : null,
        ]);
    }

    public function updateProfile()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $errors = Validator::validate($data, [
            'full_name' => 'string|max:255',
            'company_name' => 'string|max:255',
            'email' => 'email|max:255',
        ]);

        if ($errors !== []) {
            return Response::error('Validation failed', 422, $errors);
        }

        $updated = User::update($userId, $data ?? []);

        return Response::success([
            'message' => $updated ? 'Profile updated.' : 'No profile changes were applied.',
            'user' => User::serializeProfile(User::findById($userId)),
        ]);
    }

    public function getSettings()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        return Response::success([
            'settings' => User::getSettings($userId) ?? [],
        ]);
    }

    public function updateSettings()
    {
        $userId = AuthMiddleware::getUserId();
        if (!$userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            return Response::error('A valid JSON payload is required.', 422);
        }

        User::updateSettings($userId, $data);

        return Response::success([
            'message' => 'Settings updated.',
            'settings' => User::getSettings($userId) ?? [],
        ]);
    }

    public function uploadLogo()
    {
        return Response::error('Logo upload is not implemented in this backend package yet.', 501);
    }
}
