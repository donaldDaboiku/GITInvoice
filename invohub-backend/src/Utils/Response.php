<?php

namespace InvoHub\Utils;

class Response
{
    public static function json($data, int $statusCode = 200): string
    {
        http_response_code($statusCode);
        return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    
    public static function success($data = [], int $statusCode = 200): string
    {
        return self::json([
            'success' => true,
            ...(is_array($data) ? $data : ['data' => $data])
        ], $statusCode);
    }
    
    public static function error(string $message, int $statusCode = 400, $details = null): string
    {
        $response = [
            'success' => false,
            'error' => $message,
            'status' => $statusCode
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        return self::json($response, $statusCode);
    }
    
    public static function paginated(array $data, int $currentPage, int $perPage, int $total): string
    {
        return self::success([
            'data' => $data,
            'pagination' => [
                'current_page' => $currentPage,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
                'total_items' => $total,
                'has_next' => $currentPage < ceil($total / $perPage),
                'has_prev' => $currentPage > 1
            ]
        ]);
    }
}
