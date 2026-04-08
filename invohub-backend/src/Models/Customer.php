<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class Customer
{
    public static function findById(int $id, int $userId): ?array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);

        return Database::fetchOne(
            "SELECT * FROM customers WHERE id = ? AND {$column} = ?",
            [$id, $ownerId]
        ) ?: null;
    }
    
    public static function getAll(int $userId, array $filters = []): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        // Search
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE ? OR email LIKE ? OR phone LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Pagination
        $page = $filters['page'] ?? 1;
        $limit = min($filters['limit'] ?? 20, 100);
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM customers WHERE {$whereClause} ORDER BY name ASC LIMIT {$limit} OFFSET {$offset}";
        
        return Database::fetchAll($sql, $params);
    }
    
    public static function count(int $userId, array $filters = []): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE ? OR email LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        $result = Database::fetchOne("SELECT COUNT(*) as count FROM customers WHERE {$whereClause}", $params);
        
        return (int)($result['count'] ?? 0);
    }
    
    public static function create(int $userId, array $data): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $insertData = [
            'user_id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'zip_code' => $data['zip_code'] ?? null,
            'country' => $data['country'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];

        if ($column === 'organization_id') {
            $insertData['organization_id'] = $ownerId;
        }

        return Database::insert('customers', $insertData);
    }
    
    public static function update(int $id, int $userId, array $data): bool
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $updateData = [];
        $allowedFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        return Database::update('customers', $updateData, "id = ? AND {$column} = ?", [$id, $ownerId]) > 0;
    }
    
    public static function delete(int $id, int $userId): bool
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        return Database::delete('customers', "id = ? AND {$column} = ?", [$id, $ownerId]) > 0;
    }
    
    public static function getInvoices(int $customerId, int $userId): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        return Database::fetchAll(
            "SELECT * FROM invoices WHERE customer_id = ? AND {$column} = ? ORDER BY invoice_date DESC",
            [$customerId, $ownerId]
        );
    }

    private static function resolveOwnershipScope(int $userId): array
    {
        $organizationId = User::getPrimaryOrganizationId($userId);

        if ($organizationId && Database::tableHasColumn('customers', 'organization_id')) {
            return ['organization_id', $organizationId];
        }

        return ['user_id', $userId];
    }
}
