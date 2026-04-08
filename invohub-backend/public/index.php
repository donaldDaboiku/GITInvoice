<?php
/**
 * InvoHub Cloud API - Entry Point
 * Version: 2.0
 */

use Dotenv\Dotenv;
use InvoHub\Middleware\AuthMiddleware;

// Load Composer autoloader
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    die('Composer dependencies not installed. Run: composer install');
}
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
if (!class_exists('Dotenv\\Dotenv')) {
    die('Dotenv package not found. Run: composer require vlucas/phpdotenv');
}
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Error handling based on environment
if ($_ENV['APP_DEBUG'] === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// Set timezone
date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'UTC');

// CORS headers
$allowedOrigins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? '*');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
    header("Access-Control-Allow-Origin: {$origin}");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request details
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove /api prefix if present
$requestUri = preg_replace('#^/api#', '', $requestUri);
$requestUri = rtrim($requestUri, '/');

// Simple router
try {
    // Load routes
    $routes = require __DIR__ . '/../routes/api.php';
    
    // Find matching route
    $routeFound = false;
    
    foreach ($routes as $pattern => $handler) {
        // Extract method and path from pattern (e.g., "POST /auth/login")
        list($method, $path) = explode(' ', $pattern, 2);
        
        // Check if method matches
        if ($method !== $requestMethod) {
            continue;
        }
        
        // Convert route pattern to regex
        $regex = '#^' . preg_replace('#\{[^\}]+\}#', '([^/]+)', $path) . '$#';
        
        // Check if path matches
        if (preg_match($regex, $requestUri, $matches)) {
            array_shift($matches); // Remove full match
            
            // Call handler
            $routeFound = true;

            $publicRoutes = [
                'GET /health',
                'POST /auth/register',
                'POST /auth/send-code',
                'POST /auth/verify-code',
                'POST /webhooks/stripe',
            ];

            if (!in_array($pattern, $publicRoutes, true) && !AuthMiddleware::handle()) {
                exit;
            }
            
            if (is_callable($handler)) {
                echo $handler(...$matches);
            } else {
                list($controller, $action) = explode('@', $handler);
                $controllerClass = "InvoHub\\Controllers\\{$controller}";

                if (!class_exists($controllerClass)) {
                    http_response_code(501);
                    echo json_encode([
                        'success' => false,
                        'error' => "Controller {$controller} is not implemented yet."
                    ]);
                    break;
                }

                $controllerInstance = new $controllerClass();

                if (!method_exists($controllerInstance, $action)) {
                    http_response_code(501);
                    echo json_encode([
                        'success' => false,
                        'error' => "Action {$action} is not implemented on {$controller}."
                    ]);
                    break;
                }

                echo $controllerInstance->$action(...$matches);
            }
            
            break;
        }
    }
    
    if (!$routeFound) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint not found',
            'path' => $requestUri,
            'method' => $requestMethod
        ]);
    }
    
} catch (Throwable $e) {
    error_log("API Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : 'Internal server error',
        'trace' => $_ENV['APP_DEBUG'] === 'true' ? $e->getTrace() : null
    ]);
}
