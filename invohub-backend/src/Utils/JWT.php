<?php

namespace InvoHub\Utils;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;

class JWT
{
    private static function getSecret(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'change-this-secret-in-production';
    }
    
    private static function getExpiry(): int
    {
        return (int)($_ENV['JWT_EXPIRY'] ?? 604800); // 7 days default
    }
    
    public static function encode(array $payload): string
    {
        $payload['iat'] = $payload['iat'] ?? time();
        $payload['exp'] = $payload['exp'] ?? (time() + self::getExpiry());
        
        return FirebaseJWT::encode($payload, self::getSecret(), 'HS256');
    }
    
    public static function decode(string $token): object
    {
        try {
            return FirebaseJWT::decode($token, new Key(self::getSecret(), 'HS256'));
        } catch (\Exception $e) {
            throw new \Exception('Invalid or expired token');
        }
    }
    
    public static function verify(string $token): bool
    {
        try {
            self::decode($token);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    public static function getUserIdFromToken(string $token): ?int
    {
        try {
            $decoded = self::decode($token);
            return $decoded->user_id ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
