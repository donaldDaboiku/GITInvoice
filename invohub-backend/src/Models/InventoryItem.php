<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class InventoryItem
{
    public static function findById(int $id, int $userId): ?array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        return Database::fetchOne(
            "SELECT * FROM inventory_items WHERE id = ? AND {$column} = ?",
            [$id, $ownerId]
        ) ?: null;
    }
    
    public static function getAll(int $userId, array $filters = []): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        // Active filter
        if (isset($filters['is_active'])) {
            $where[] = "is_active = ?";
            $params[] = $filters['is_active'] ? 1 : 0;
        }
        
        // Tag filter
        if (!empty($filters['tag'])) {
            $where[] = "tag = ?";
            $params[] = $filters['tag'];
        }
        
        // Search
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE ? OR description LIKE ? OR sku LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Pagination
        $page = $filters['page'] ?? 1;
        $limit = min($filters['limit'] ?? 50, 100);
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM inventory_items WHERE {$whereClause} ORDER BY name ASC LIMIT {$limit} OFFSET {$offset}";
        
        return Database::fetchAll($sql, $params);
    }
    
    public static function count(int $userId, array $filters = []): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        if (isset($filters['is_active'])) {
            $where[] = "is_active = ?";
            $params[] = $filters['is_active'] ? 1 : 0;
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE ? OR sku LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        $result = Database::fetchOne("SELECT COUNT(*) as count FROM inventory_items WHERE {$whereClause}", $params);
        
        return (int)($result['count'] ?? 0);
    }
    
    public static function search(int $userId, string $query, int $limit = 10): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        return Database::fetchAll(
            "SELECT id, name, description, unit_price, quantity, tag 
             FROM inventory_items 
             WHERE {$column} = ? AND is_active = 1 AND name LIKE ? 
             ORDER BY name ASC 
             LIMIT ?",
            [$ownerId, "%{$query}%", $limit]
        );
    }
    
    public static function create(int $userId, array $data): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $insertData = [
            'user_id' => $userId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sku' => $data['sku'] ?? null,
            'quantity' => $data['quantity'] ?? 0,
            'unit_price' => $data['unit_price'],
            'cost_price' => $data['cost_price'] ?? null,
            'tag' => $data['tag'] ?? null,
            'category' => $data['category'] ?? null,
            'low_stock_threshold' => $data['low_stock_threshold'] ?? null,
            'is_active' => $data['is_active'] ?? 1,
        ];

        if ($column === 'organization_id') {
            $insertData['organization_id'] = $ownerId;
        }

        return Database::insert('inventory_items', $insertData);
    }
    
    public static function update(int $id, int $userId, array $data): bool
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $updateData = [];
        $allowedFields = [
            'name', 'description', 'sku', 'quantity', 'unit_price', 'cost_price',
            'tag', 'category', 'low_stock_threshold', 'is_active'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        return Database::update('inventory_items', $updateData, "id = ? AND {$column} = ?", [$id, $ownerId]) > 0;
    }
    
    public static function delete(int $id, int $userId): bool
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        return Database::delete('inventory_items', "id = ? AND {$column} = ?", [$id, $ownerId]) > 0;
    }
    
    public static function getTags(int $userId): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $result = Database::fetchAll(
            "SELECT DISTINCT tag FROM inventory_items WHERE {$column} = ? AND tag IS NOT NULL ORDER BY tag",
            [$ownerId]
        );
        
        return array_column($result, 'tag');
    }
    
    public static function bulkCreate(int $userId, array $items): array
    {
        $imported = [];
        $errors = [];
        
        foreach ($items as $index => $item) {
            try {
                $id = self::create($userId, $item);
                $imported[] = $id;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }
        
        return [
            'imported' => count($imported),
            'errors' => $errors
        ];
    }

    private static function resolveOwnershipScope(int $userId): array
    {
        $organizationId = User::getPrimaryOrganizationId($userId);

        if ($organizationId && Database::tableHasColumn('inventory_items', 'organization_id')) {
            return ['organization_id', $organizationId];
        }

        return ['user_id', $userId];
    }
}
