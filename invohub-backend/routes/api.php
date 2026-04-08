<?php

/**
 * API Routes Configuration
 * Format: "METHOD /path" => "Controller@method" or callable
 */

return [
    // Health check
    'GET /health' => function() {
        return json_encode([
            'success' => true,
            'status' => 'healthy',
            'timestamp' => time(),
            'version' => '2.0'
        ]);
    },
    
    // ==================== AUTHENTICATION ====================
    'POST /auth/register' => 'AuthController@register',
    'POST /auth/send-code' => 'AuthController@sendCode',
    'POST /auth/verify-code' => 'AuthController@verifyCode',
    'POST /auth/refresh-token' => 'AuthController@refreshToken',
    'POST /auth/logout' => 'AuthController@logout',
    
    // ==================== USER & PROFILE ====================
    'GET /user/profile' => 'UserController@getProfile',
    'PUT /user/profile' => 'UserController@updateProfile',
    'GET /user/settings' => 'UserController@getSettings',
    'PUT /user/settings' => 'UserController@updateSettings',
    'POST /user/upload-logo' => 'UserController@uploadLogo',
    
    // ==================== INVOICES ====================
    'GET /invoices' => 'InvoiceController@index',
    'GET /invoices/{id}' => 'InvoiceController@show',
    'POST /invoices' => 'InvoiceController@create',
    'PUT /invoices/{id}' => 'InvoiceController@update',
    'DELETE /invoices/{id}' => 'InvoiceController@delete',
    'GET /invoices/{id}/pdf' => 'InvoiceController@generatePdf',
    'POST /invoices/{id}/send' => 'InvoiceController@sendEmail',
    'POST /invoices/bulk-delete' => 'InvoiceController@bulkDelete',
    
    // ==================== CUSTOMERS ====================
    'GET /customers' => 'CustomerController@index',
    'GET /customers/{id}' => 'CustomerController@show',
    'POST /customers' => 'CustomerController@create',
    'PUT /customers/{id}' => 'CustomerController@update',
    'DELETE /customers/{id}' => 'CustomerController@delete',
    'GET /customers/export-emails' => 'CustomerController@exportEmails',
    
    // ==================== INVENTORY ====================
    'GET /inventory' => 'InventoryController@index',
    'GET /inventory/{id}' => 'InventoryController@show',
    'POST /inventory' => 'InventoryController@create',
    'PUT /inventory/{id}' => 'InventoryController@update',
    'DELETE /inventory/{id}' => 'InventoryController@delete',
    'POST /inventory/import-excel' => 'InventoryController@importExcel',
    'GET /inventory/export-excel' => 'InventoryController@exportExcel',
    'GET /inventory/template' => 'InventoryController@downloadTemplate',
    'GET /inventory/search' => 'InventoryController@search',
    
    // ==================== SUBSCRIPTIONS ====================
    'GET /subscription' => 'SubscriptionController@getCurrent',
    'GET /subscription/plans' => 'SubscriptionController@getPlans',
    'POST /subscription/checkout' => 'SubscriptionController@createCheckout',
    'POST /subscription/upgrade' => 'SubscriptionController@upgrade',
    'POST /subscription/cancel' => 'SubscriptionController@cancel',

    // ==================== WORKSPACES & STAFF ====================
    'GET /workspace' => 'WorkspaceController@getCurrent',
    'GET /workspace/members' => 'WorkspaceController@getMembers',
    'POST /workspace/members' => 'WorkspaceController@inviteMember',
    'DELETE /workspace/members/{id}' => 'WorkspaceController@removeMember',
    
    // ==================== SYNC (Offline/Online) ====================
    'POST /sync/push' => 'SyncController@push',
    'GET /sync/pull' => 'SyncController@pull',
    'GET /sync/status' => 'SyncController@status',
    
    // ==================== WEBHOOKS ====================
    'POST /webhooks/stripe' => 'WebhookController@stripe',
    
    // ==================== NOTIFICATIONS ====================
    'GET /notifications' => 'NotificationController@index',
    'PUT /notifications/{id}/read' => 'NotificationController@markAsRead',
    'POST /notifications/mark-all-read' => 'NotificationController@markAllAsRead',
];
