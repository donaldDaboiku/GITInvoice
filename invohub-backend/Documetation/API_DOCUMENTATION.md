# InvoHub Cloud - Complete API Documentation
**Version:** 2.0  
**Base URL:** `https://api.invohub.com` or `http://localhost:8000`  
**Authentication:** Bearer Token (JWT)

---

## 📚 Table of Contents

1. [Authentication](#authentication)
2. [Users & Profile](#users--profile)
3. [Invoices](#invoices)
4. [Customers](#customers)
5. [Inventory](#inventory)
6. [Subscriptions](#subscriptions)
7. [Sync](#sync-offlineonline)
8. [Error Codes](#error-codes)

---

## 🔐 Authentication

### Register New User
**Endpoint:** `POST /api/auth/register`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "company_name": "Acme Inc"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "full_name": "John Doe"
  }
}
```

---

### Send Login Code
**Endpoint:** `POST /api/auth/send-code`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "expires_in": 600
}
```

**Rate Limit:** 5 codes per hour per email

---

### Verify Code & Login
**Endpoint:** `POST /api/auth/verify-code`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Inc",
    "subscription_tier": "pro",
    "subscription_status": "active"
  }
}
```

**Error Responses:**
- `401` - Invalid or expired code
- `404` - User not found
- `429` - Too many attempts

---

## 👤 Users & Profile

### Get User Profile
**Endpoint:** `GET /api/user/profile`  
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Inc",
    "subscription_tier": "pro",
    "subscription_status": "active",
    "trial_ends_at": null,
    "email_verified_at": "2025-01-15T10:30:00Z",
    "created_at": "2025-01-01T12:00:00Z"
  }
}
```

---

### Update Profile
**Endpoint:** `PUT /api/user/profile`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "full_name": "John Smith",
  "company_name": "Smith Corp"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### Get Settings
**Endpoint:** `GET /api/user/settings`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "settings": {
    "currency": "USD",
    "tax_rate": 10.00,
    "invoice_prefix": "INV-",
    "next_invoice_number": 42,
    "date_format": "Y-m-d",
    "theme": "dark",
    "language": "en",
    "company_logo_url": "https://storage.invohub.com/logos/1.png",
    "terms_and_conditions": "Payment due within 30 days"
  }
}
```

---

### Update Settings
**Endpoint:** `PUT /api/user/settings`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "currency": "EUR",
  "tax_rate": 20.00,
  "invoice_prefix": "BILL-",
  "theme": "light"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 📄 Invoices

### Get All Invoices
**Endpoint:** `GET /api/invoices`  
**Auth Required:** Yes

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `status` (string: draft, pending, paid, overdue, canceled)
- `customer_id` (integer)
- `from_date` (date: Y-m-d)
- `to_date` (date: Y-m-d)
- `search` (string)

**Example:** `GET /api/invoices?page=1&limit=20&status=pending&from_date=2025-01-01`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "invoice_number": "INV-0042",
      "customer_name": "Acme Corp",
      "customer_email": "billing@acme.com",
      "invoice_date": "2025-01-15",
      "due_date": "2025-02-15",
      "subtotal": 1500.00,
      "tax_amount": 150.00,
      "total": 1650.00,
      "status": "pending",
      "currency": "USD",
      "pdf_url": "https://storage.invohub.com/invoices/42.pdf",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_items": 52
  }
}
```

---

### Get Single Invoice
**Endpoint:** `GET /api/invoices/{id}`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": 42,
    "invoice_number": "INV-0042",
    "customer_id": 5,
    "customer_name": "Acme Corp",
    "customer_email": "billing@acme.com",
    "customer_phone": "+1234567890",
    "customer_address": "123 Main St, City 12345",
    "invoice_date": "2025-01-15",
    "due_date": "2025-02-15",
    "status": "pending",
    "subtotal": 1500.00,
    "tax_rate": 10.00,
    "tax_amount": 150.00,
    "total": 1650.00,
    "currency": "USD",
    "notes": "Payment due within 30 days",
    "signature_data": "data:image/png;base64,...",
    "items": [
      {
        "id": 1,
        "description": "Website Design",
        "quantity": 1.00,
        "unit_price": 1500.00,
        "total": 1500.00,
        "inventory_item_id": null
      }
    ],
    "pdf_url": "https://storage.invohub.com/invoices/42.pdf",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### Create Invoice
**Endpoint:** `POST /api/invoices`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "customer_id": 5,
  "invoice_date": "2025-01-15",
  "due_date": "2025-02-15",
  "status": "pending",
  "items": [
    {
      "description": "Website Design",
      "quantity": 1,
      "unit_price": 1500.00
    },
    {
      "inventory_item_id": 10,
      "quantity": 2,
      "unit_price": 50.00
    }
  ],
  "tax_rate": 10,
  "discount_amount": 0,
  "notes": "Payment due within 30 days",
  "signature_data": "data:image/png;base64,..."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "invoice": {
    "id": 43,
    "invoice_number": "INV-0043",
    "total": 1705.00,
    "status": "pending",
    "pdf_url": "https://storage.invohub.com/invoices/43.pdf"
  }
}
```

---

### Update Invoice
**Endpoint:** `PUT /api/invoices/{id}`  
**Auth Required:** Yes

**Request Body:** (Same as create, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice updated successfully"
}
```

---

### Delete Invoice
**Endpoint:** `DELETE /api/invoices/{id}`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

---

### Generate PDF
**Endpoint:** `GET /api/invoices/{id}/pdf`  
**Auth Required:** Yes

**Response:** PDF file download

---

### Send Invoice Email
**Endpoint:** `POST /api/invoices/{id}/send`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "recipient_email": "client@example.com",
  "subject": "Invoice #INV-0042 from Acme Inc",
  "message": "Please find attached invoice."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice sent successfully"
}
```

---

## 👥 Customers

### Get All Customers
**Endpoint:** `GET /api/customers`  
**Auth Required:** Yes

**Query Parameters:**
- `page` (integer)
- `limit` (integer)
- `search` (string)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Acme Corp",
      "email": "billing@acme.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "total_invoiced": 5000.00,
      "total_paid": 3000.00,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### Create Customer
**Endpoint:** `POST /api/customers`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State 12345",
  "notes": "Preferred payment: Bank transfer"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "customer": {
    "id": 15,
    "name": "Acme Corporation",
    "email": "billing@acme.com"
  }
}
```

---

### Update Customer
**Endpoint:** `PUT /api/customers/{id}`  
**Auth Required:** Yes

---

### Delete Customer
**Endpoint:** `DELETE /api/customers/{id}`  
**Auth Required:** Yes

---

## 📦 Inventory

### Get All Inventory
**Endpoint:** `GET /api/inventory`  
**Auth Required:** Yes

**Query Parameters:**
- `page`, `limit`, `search`
- `tag` (filter by category/tag)
- `is_active` (boolean)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Website Design",
      "description": "Custom website design service",
      "sku": "WEB-001",
      "quantity": 5.00,
      "unit_price": 1500.00,
      "tag": "Services",
      "is_active": true
    }
  ]
}
```

---

### Create Inventory Item
**Endpoint:** `POST /api/inventory`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Website Design",
  "description": "Custom website design service",
  "sku": "WEB-001",
  "quantity": 10,
  "unit_price": 1500.00,
  "cost_price": 500.00,
  "tag": "Services",
  "low_stock_threshold": 2
}
```

---

### Import Excel
**Endpoint:** `POST /api/inventory/import-excel`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request:**
```
file: [Excel file]
```

**Excel Format:**
| Name | Description | Quantity | Price | Tag |
|------|-------------|----------|-------|-----|
| Website Design | Custom design | 10 | 1500.00 | Services |

**Success Response (200):**
```json
{
  "success": true,
  "imported": 45,
  "errors": [
    "Row 10: Invalid price"
  ],
  "message": "45 items imported successfully"
}
```

---

### Export Excel Template
**Endpoint:** `GET /api/inventory/template`  
**Auth Required:** Yes

**Response:** Excel file download with sample data

---

### Search Inventory
**Endpoint:** `GET /api/inventory/search?q=design&limit=10`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "items": [
    {
      "id": 10,
      "name": "Website Design",
      "unit_price": 1500.00,
      "quantity": 5.00
    }
  ]
}
```

---

## 💳 Subscriptions

### Get Current Subscription
**Endpoint:** `GET /api/subscription`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "subscription": {
    "plan": "pro",
    "status": "active",
    "amount": 19.00,
    "currency": "USD",
    "current_period_end": "2025-02-15T00:00:00Z",
    "cancel_at_period_end": false
  },
  "usage": {
    "invoices_this_month": 15,
    "invoices_limit": -1,
    "customers": 42,
    "customers_limit": -1
  }
}
```

---

### Upgrade Subscription
**Endpoint:** `POST /api/subscription/upgrade`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "plan": "pro"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/session_xyz"
}
```

---

## 🔄 Sync (Offline/Online)

### Push Local Changes
**Endpoint:** `POST /api/sync/push`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "invoices": [
    {
      "local_id": "temp-1",
      "data": {
        "customer_name": "New Client",
        "total": 1000.00,
        "items": [...]
      }
    }
  ],
  "customers": [
    {
      "local_id": "temp-2",
      "data": {...}
    }
  ],
  "timestamp": 1704528000
}
```

**Success Response (200):**
```json
{
  "success": true,
  "mappings": {
    "temp-1": 44,
    "temp-2": 16
  },
  "conflicts": []
}
```

---

### Pull Server Changes
**Endpoint:** `GET /api/sync/pull?since=1704528000`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "customers": [...],
    "inventory": [...],
    "settings": {...}
  },
  "timestamp": 1704628000
}
```

---

## ❌ Error Codes

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid credentials |
| `AUTH_EXPIRED` | 401 | Token expired |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Access denied |
| `RATE_LIMIT` | 429 | Too many requests |
| `SUBSCRIPTION_REQUIRED` | 402 | Paid plan required |
| `SUBSCRIPTION_LIMIT` | 403 | Plan limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 🔒 Authentication Headers

All protected endpoints require:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

JWT Payload:
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "iat": 1704528000,
  "exp": 1705132800
}
```

---

## 📊 Rate Limiting

- **Anonymous:** 10 requests/minute
- **Authenticated:** 60 requests/minute
- **Send Code:** 5 codes/hour per email

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704528600
```

---

## 🌍 Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/invoices?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "current_page": 2,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 87,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## 📝 Webhooks (Stripe)

**Endpoint:** `POST /api/webhooks/stripe`  
**Auth:** Stripe signature verification

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 🧪 Testing

**Postman Collection:** [Download](https://api.invohub.com/docs/postman.json)

**Example with cURL:**
```bash
# Register
curl -X POST https://api.invohub.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'

# Send code
curl -X POST https://api.invohub.com/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify code
curl -X POST https://api.invohub.com/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# Get invoices
curl -X GET https://api.invohub.com/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**📧 Support:** dev@invohub.com  
**🔗 API Status:** https://status.invohub.com  
**📚 Full Docs:** https://docs.invohub.com
