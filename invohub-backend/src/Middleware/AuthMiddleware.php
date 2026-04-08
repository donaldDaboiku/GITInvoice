<?php

namespace InvoHub\Middleware;

use InvoHub\Utils\JWT;
use InvoHub\Utils\Response;
use InvoHub\Models\User;

class AuthMiddleware
{
    /**
     * Verify JWT token and set user ID in $_SERVER
     */
    public static function handle(): bool
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (empty($authHeader)) {
            http_response_code(401);
            echo Response::error('Authorization header required', 401);
            return false;
        }
        
        // Extract token
        $token = str_replace('Bearer ', '', $authHeader);
        
        try {
            // Decode and verify token
            $decoded = JWT::decode($token);
            
            // Verify user exists and is active
            $user = User::findById($decoded->user_id);
            
            if (!$user) {
                http_response_code(401);
                echo Response::error('Invalid token: user not found', 401);
                return false;
            }
            
            // Store user ID for controllers
            $_SERVER['USER_ID'] = $decoded->user_id;
            $_SERVER['USER_EMAIL'] = $decoded->email;
            $_SERVER['USER_ORGANIZATION_ID'] = $user['primary_organization_id'] ?? ($decoded->organization_id ?? null);
            
            return true;
            
        } catch (\Exception $e) {
            http_response_code(401);
            echo Response::error('Invalid or expired token', 401);
            return false;
        }
    }
    
    /**
     * Get current authenticated user ID
     */
    public static function getUserId(): ?int
    {
        return $_SERVER['USER_ID'] ?? null;
    }
    
    /**
     * Get current authenticated user
     */
    public static function getUser(): ?array
    {
        $userId = self::getUserId();
        return $userId ? User::findById($userId) : null;
    }
}
