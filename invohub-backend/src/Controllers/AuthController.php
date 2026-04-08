<?php

namespace InvoHub\Controllers;

use InvoHub\Config\Database;
use InvoHub\Models\Organization;
use InvoHub\Services\EmailService;
use InvoHub\Utils\JWT;
use InvoHub\Utils\Response;
use InvoHub\Utils\Validator;

class AuthController
{
    private $db;
    private $emailService;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->emailService = new EmailService();
    }
    
    /**
     * Register new user
     * POST /api/auth/register
     */
    public function register()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate input
        $errors = Validator::validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:8',
            'full_name' => 'required',
            'company_name' => 'string'
        ]);
        
        if (!empty($errors)) {
            return Response::error('Validation failed', 422, $errors);
        }
        
        // Check if email already exists
        $existingUser = Database::fetchOne(
            "SELECT id FROM users WHERE email = ?",
            [$data['email']]
        );
        
        if ($existingUser) {
            return Response::error('Email already registered', 409);
        }
        
        // Hash password
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Create user
        try {
            $userId = Database::insert('users', [
                'email' => $data['email'],
                'password_hash' => $passwordHash,
                'full_name' => $data['full_name'],
                'company_name' => $data['company_name'] ?? null,
                'subscription_tier' => 'free',
                'subscription_status' => 'none'
            ]);

            $workspaceId = null;
            if (Database::tableHasColumn('organizations', 'id')) {
                $workspaceId = Organization::createForUser(
                    $userId,
                    $data['company_name'] ?? ($data['full_name'] . "'s Workspace"),
                    $data['email']
                );
            }
            
            // Create default settings
            $settingsInsert = ['user_id' => $userId];
            if ($workspaceId && Database::tableHasColumn('user_settings', 'organization_id')) {
                $settingsInsert['organization_id'] = $workspaceId;
            }

            Database::insert('user_settings', $settingsInsert);
            
            // Send verification email
            $this->sendVerificationEmail($data['email']);
            
            return Response::success([
                'message' => 'Registration successful',
                'user' => [
                    'id' => $userId,
                    'email' => $data['email'],
                    'full_name' => $data['full_name'],
                    'primary_organization_id' => $workspaceId,
                ],
            ], 201);
            
        } catch (\Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return Response::error('Registration failed', 500);
        }
    }
    
    /**
     * Send 6-digit login code
     * POST /api/auth/send-code
     */
    public function sendCode()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return Response::error('Valid email required', 400);
        }
        
        // Check if user exists
        $user = Database::fetchOne(
            "SELECT id, full_name, is_active FROM users WHERE email = ?",
            [$data['email']]
        );
        
        if (!$user) {
            return Response::error('User not found', 404);
        }
        
        if (!$user['is_active']) {
            return Response::error('Account is inactive', 403);
        }
        
        // Check rate limiting (max 5 codes per hour)
        $recentCodes = Database::fetchOne(
            "SELECT COUNT(*) as count FROM auth_codes 
             WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            [$user['id']]
        );
        
        if ($recentCodes['count'] >= 5) {
            return Response::error('Too many requests. Please try again later.', 429);
        }
        
        // Generate 6-digit code
        $code = sprintf('%06d', random_int(0, 999999));
        
        // Store code
        Database::insert('auth_codes', [
            'user_id' => $user['id'],
            'code' => $code,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+10 minutes')),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        // Send email
        $this->emailService->send(
            $data['email'],
            'Your InvoHub Login Code',
            $this->getCodeEmailTemplate($code, $user['full_name'])
        );
        
        return Response::success([
            'message' => 'Verification code sent to your email',
            'expires_in' => 600
        ]);
    }
    
    /**
     * Verify code and login
     * POST /api/auth/verify-code
     */
    public function verifyCode()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['code'])) {
            return Response::error('Email and code required', 400);
        }
        
        // Get user
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            [$data['email']]
        );
        
        if (!$user) {
            return Response::error('Invalid credentials', 401);
        }
        
        // Check code validity
        $validCode = Database::fetchOne(
            "SELECT id FROM auth_codes 
             WHERE user_id = ? 
             AND code = ? 
             AND expires_at > NOW() 
             AND used_at IS NULL
             ORDER BY created_at DESC 
             LIMIT 1",
            [$user['id'], $data['code']]
        );
        
        if (!$validCode) {
            return Response::error('Invalid or expired code', 401);
        }
        
        // Mark code as used
        Database::update('auth_codes', ['used_at' => date('Y-m-d H:i:s')], 'id = ?', [$validCode['id']]);
        
        // Update last login
        Database::update('users', ['last_login_at' => date('Y-m-d H:i:s')], 'id = ?', [$user['id']]);
        
        // Generate JWT token
        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'organization_id' => $user['primary_organization_id'] ?? null,
            'iat' => time(),
            'exp' => time() + ($_ENV['JWT_EXPIRY'] ?? 604800) // 7 days default
        ]);
        
        // Log activity
        $this->logActivity($user['id'], 'login', 'user', $user['id']);
        
        $workspace = Organization::getForUser((int) $user['id']);

        return Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'company_name' => $user['company_name'],
                'subscription_tier' => $user['subscription_tier'],
                'subscription_status' => $user['subscription_status'],
                'primary_organization_id' => $user['primary_organization_id'] ?? null,
            ],
            'workspace' => $workspace ? [
                'id' => (int) $workspace['id'],
                'name' => $workspace['name'],
                'plan_code' => $workspace['plan_code'],
                'billing_model' => $workspace['billing_model'],
                'staff_limit' => (int) $workspace['staff_limit'],
                'active_members' => (int) ($workspace['active_members'] ?? 1),
                'features' => Organization::getFeatureFlags($workspace),
            ] : null,
        ]);
    }
    
    /**
     * Refresh JWT token
     * POST /api/auth/refresh-token
     */
    public function refreshToken()
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        
        try {
            $decoded = JWT::decode($token);
            
            // Generate new token
            $newToken = JWT::encode([
                'user_id' => $decoded->user_id,
                'email' => $decoded->email,
                'organization_id' => $decoded->organization_id ?? null,
                'iat' => time(),
                'exp' => time() + ($_ENV['JWT_EXPIRY'] ?? 604800)
            ]);
            
            return Response::success(['token' => $newToken]);
            
        } catch (\Exception $e) {
            return Response::error('Invalid token', 401);
        }
    }
    
    /**
     * Logout
     * POST /api/auth/logout
     */
    public function logout()
    {
        // In stateless JWT, logout is client-side (remove token)
        // But we can log the activity
        $userId = $_SERVER['USER_ID'] ?? null;
        
        if ($userId) {
            $this->logActivity($userId, 'logout', 'user', $userId);
        }
        
        return Response::success(['message' => 'Logged out successfully']);
    }
    
    /**
     * Send verification email
     */
    private function sendVerificationEmail($email)
    {
        // Implementation for email verification link
        // For now, auto-verify in registration
        Database::update('users', 
            ['email_verified_at' => date('Y-m-d H:i:s')], 
            'email = ?', 
            [$email]
        );
    }
    
    /**
     * Get email template for login code
     */
    private function getCodeEmailTemplate($code, $name = '')
    {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;'>
                <h1 style='color: white; margin: 0;'>InvoHub</h1>
            </div>
            <div style='padding: 40px 30px; background: #f9f9f9;'>
                <h2 style='color: #333;'>Your Login Code</h2>
                " . ($name ? "<p>Hi {$name},</p>" : "") . "
                <p style='font-size: 16px; color: #666;'>Your verification code is:</p>
                <div style='background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                    <span style='font-size: 36px; font-weight: bold; color: #ff6b35; letter-spacing: 8px;'>{$code}</span>
                </div>
                <p style='color: #666;'>This code expires in <strong>10 minutes</strong>.</p>
                <p style='color: #999; font-size: 14px;'>If you didn't request this code, please ignore this email.</p>
            </div>
            <div style='background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;'>
                © 2025 InvoHub. All rights reserved.
            </div>
        </body>
        </html>
        ";
    }
    
    /**
     * Log user activity
     */
    private function logActivity($userId, $action, $entityType = null, $entityId = null)
    {
        Database::insert('activity_log', [
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}
