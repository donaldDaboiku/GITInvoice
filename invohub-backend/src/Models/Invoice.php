<?php

namespace InvoHub\Models;

use InvoHub\Config\Database;

class Invoice
{
    public static function findById(int $id, int $userId): ?array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $invoice = Database::fetchOne(
            "SELECT * FROM invoices WHERE id = ? AND {$column} = ?",
            [$id, $ownerId]
        );
        
        if (!$invoice) return null;
        
        // Get items
        $invoice['items'] = Database::fetchAll(
            "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order",
            [$id]
        );
        
        return $invoice;
    }
    
    public static function getAll(int $userId, array $filters = []): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        // Status filter
        if (!empty($filters['status'])) {
            $where[] = "status = ?";
            $params[] = $filters['status'];
        }
        
        // Customer filter
        if (!empty($filters['customer_id'])) {
            $where[] = "customer_id = ?";
            $params[] = $filters['customer_id'];
        }
        
        // Date range
        if (!empty($filters['from_date'])) {
            $where[] = "invoice_date >= ?";
            $params[] = $filters['from_date'];
        }
        
        if (!empty($filters['to_date'])) {
            $where[] = "invoice_date <= ?";
            $params[] = $filters['to_date'];
        }
        
        // Search
        if (!empty($filters['search'])) {
            $where[] = "(invoice_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)";
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
        
        $sql = "SELECT * FROM invoices WHERE {$whereClause} ORDER BY invoice_date DESC, id DESC LIMIT {$limit} OFFSET {$offset}";
        
        return Database::fetchAll($sql, $params);
    }
    
    public static function count(int $userId, array $filters = []): int
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $where = ["{$column} = ?"];
        $params = [$ownerId];
        
        if (!empty($filters['status'])) {
            $where[] = "status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['customer_id'])) {
            $where[] = "customer_id = ?";
            $params[] = $filters['customer_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(invoice_number LIKE ? OR customer_name LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        $result = Database::fetchOne("SELECT COUNT(*) as count FROM invoices WHERE {$whereClause}", $params);
        
        return (int)($result['count'] ?? 0);
    }
    
    public static function create(int $userId, array $data): int
    {
        Database::beginTransaction();
        
        try {
            [$column, $ownerId] = self::resolveOwnershipScope($userId);
            // Calculate totals
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }
            
            $taxRate = $data['tax_rate'] ?? 0;
            $taxAmount = $subtotal * ($taxRate / 100);
            $discountAmount = $data['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discountAmount;
            
            // Get next invoice number
            $settings = User::getSettings($userId);
            $invoiceNumber = ($settings['invoice_prefix'] ?? 'INV-') . str_pad($settings['next_invoice_number'] ?? 1, 4, '0', STR_PAD_LEFT);
            
            // Insert invoice
            $insertData = [
                'user_id' => $userId,
                'customer_id' => $data['customer_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'status' => $data['status'] ?? 'draft',
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'currency' => $data['currency'] ?? 'USD',
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
                'signature_data' => $data['signature_data'] ?? null,
            ];

            if ($column === 'organization_id') {
                $insertData['organization_id'] = $ownerId;
            }

            $invoiceId = Database::insert('invoices', $insertData);
            
            // Insert items
            foreach ($data['items'] as $index => $item) {
                Database::insert('invoice_items', [
                    'invoice_id' => $invoiceId,
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['quantity'] * $item['unit_price'],
                    'sort_order' => $index
                ]);
            }
            
            // Update invoice counter
            Database::query(
                "UPDATE user_settings SET next_invoice_number = next_invoice_number + 1 WHERE {$column} = ?",
                [$ownerId]
            );
            
            // Update customer totals if customer_id provided
            if (!empty($data['customer_id'])) {
                self::updateCustomerTotals($data['customer_id']);
            }
            
            Database::commit();
            
            return $invoiceId;
            
        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }
    
    public static function update(int $id, int $userId, array $data): bool
    {
        Database::beginTransaction();
        
        try {
            // Verify ownership
            $invoice = self::findById($id, $userId);
            if (!$invoice) {
                throw new \Exception('Invoice not found');
            }
            
            // Calculate new totals if items provided
            if (isset($data['items'])) {
                $subtotal = 0;
                foreach ($data['items'] as $item) {
                    $subtotal += $item['quantity'] * $item['unit_price'];
                }
                
                $taxRate = $data['tax_rate'] ?? $invoice['tax_rate'];
                $taxAmount = $subtotal * ($taxRate / 100);
                $discountAmount = $data['discount_amount'] ?? $invoice['discount_amount'];
                $total = $subtotal + $taxAmount - $discountAmount;
                
                $data['subtotal'] = $subtotal;
                $data['tax_amount'] = $taxAmount;
                $data['total'] = $total;
            }
            
            // Update invoice
            $updateData = [];
            $allowedFields = [
                'status', 'customer_name', 'customer_email', 'customer_phone', 'customer_address',
                'invoice_date', 'due_date', 'subtotal', 'tax_rate', 'tax_amount', 'discount_amount',
                'total', 'currency', 'notes', 'terms', 'signature_data', 'paid_at', 'payment_method'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (!empty($updateData)) {
                [$column, $ownerId] = self::resolveOwnershipScope($userId);
                Database::update('invoices', $updateData, "id = ? AND {$column} = ?", [$id, $ownerId]);
            }
            
            // Update items if provided
            if (isset($data['items'])) {
                // Delete old items
                Database::delete('invoice_items', 'invoice_id = ?', [$id]);
                
                // Insert new items
                foreach ($data['items'] as $index => $item) {
                    Database::insert('invoice_items', [
                        'invoice_id' => $id,
                        'inventory_item_id' => $item['inventory_item_id'] ?? null,
                        'description' => $item['description'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total' => $item['quantity'] * $item['unit_price'],
                        'sort_order' => $index
                    ]);
                }
            }
            
            // Update customer totals
            if (!empty($invoice['customer_id'])) {
                self::updateCustomerTotals($invoice['customer_id']);
            }
            
            Database::commit();
            
            return true;
            
        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }
    
    public static function delete(int $id, int $userId): bool
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $invoice = self::findById($id, $userId);
        if (!$invoice) return false;
        
        Database::beginTransaction();
        
        try {
            // Delete items first (foreign key)
            Database::delete('invoice_items', 'invoice_id = ?', [$id]);
            
            // Delete invoice
            Database::delete('invoices', "id = ? AND {$column} = ?", [$id, $ownerId]);
            
            // Update customer totals
            if (!empty($invoice['customer_id'])) {
                self::updateCustomerTotals($invoice['customer_id']);
            }
            
            Database::commit();
            
            return true;
            
        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }
    
    private static function updateCustomerTotals(int $customerId): void
    {
        $totals = Database::fetchOne(
            "SELECT 
                SUM(total) as total_invoiced,
                SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid
             FROM invoices 
             WHERE customer_id = ?",
            [$customerId]
        );
        
        Database::update('customers', [
            'total_invoiced' => $totals['total_invoiced'] ?? 0,
            'total_paid' => $totals['total_paid'] ?? 0
        ], 'id = ?', [$customerId]);
    }
    
    public static function getStats(int $userId): array
    {
        [$column, $ownerId] = self::resolveOwnershipScope($userId);
        $stats = Database::fetchOne(
            "SELECT 
                COUNT(*) as total_count,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
                SUM(total) as total_revenue,
                SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue,
                SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) as pending_revenue
             FROM invoices 
             WHERE {$column} = ?",
            [$ownerId]
        );
        
        return $stats ?: [];
    }

    private static function resolveOwnershipScope(int $userId): array
    {
        $organizationId = User::getPrimaryOrganizationId($userId);

        if ($organizationId && Database::tableHasColumn('invoices', 'organization_id')) {
            return ['organization_id', $organizationId];
        }

        return ['user_id', $userId];
    }
}
