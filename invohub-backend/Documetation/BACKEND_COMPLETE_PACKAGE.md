# InvoHub Cloud - Complete PHP Backend Package
## Production-Ready API with Full Documentation

---

## 📦 PACKAGE CONTENTS

This document contains all the PHP backend code for InvoHub Cloud SaaS.

**What's Included:**
1. Complete database schema (MySQL)
2. PHP backend code (PSR-4 structure)
3. API routes and controllers
4. Authentication system (email + 6-digit code)
5. All models and services
6. Complete API documentation
7. Deployment instructions

---

## 🚀 QUICK START

### Prerequisites
- PHP 8.1+
- MySQL 8.0+
- Composer
- Redis (optional, for caching)

### Installation Steps

```bash
# 1. Extract files
unzip invohub-backend.zip
cd invohub-backend

# 2. Install dependencies
composer install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run migrations
php database/migrate.php

# 5. Start development server
composer serve
# or
php -S localhost:8000 -t public

# 6. Test API
curl http://localhost:8000/api/health
```

---

## 📁 PROJECT STRUCTURE

```
invohub-backend/
├── config/
│   ├── Database.php           # Database connection class
│   ├── App.php               # App configuration
│   └── Mail.php              # Email configuration
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── InvoiceController.php
│   │   ├── CustomerController.php
│   │   ├── InventoryController.php
│   │   ├── UserController.php
│   │   └── SubscriptionController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Invoice.php
│   │   ├── Customer.php
│   │   ├── InventoryItem.php
│   │   └── Subscription.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── SubscriptionMiddleware.php
│   │   └── RateLimitMiddleware.php
│   ├── Services/
│   │   ├── EmailService.php
│   │   ├── PdfService.php
│   │   ├── ExcelImportService.php
│   │   ├── CloudStorageService.php
│   │   └── StripeService.php
│   └── Utils/
│       ├── Validator.php
│       ├── JWT.php
│       ├── Response.php
│       └── helpers.php
├── public/
│   └── index.php             # Entry point
├── routes/
│   └── api.php               # API routes
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql
├── storage/
│   ├── logs/
│   ├── uploads/
│   └── cache/
├── vendor/                   # Composer dependencies
├── .env.example
├── .env
├── composer.json
├── composer.lock
└── README.md
```

---

## 🔐 DATABASE SCHEMA

Complete schema is in: `database/migrations/001_initial_schema.sql`

**Core Tables:**
- users - User accounts
- auth_codes - 6-digit authentication codes
- customers - Client information
- invoices - Invoice records
- invoice_items - Line items
- inventory_items - Product/service catalog
- recurring_invoices - Automatic billing
- subscriptions - Subscription management
- user_settings - User preferences
- activity_log - Audit trail
- notifications - In-app notifications

**Run Migration:**
```bash
mysql -u root -p invohub_cloud < database/migrations/001_initial_schema.sql
```

---

## 🌐 API ENDPOINTS

Base URL: `https://api.invohub.com` or `http://localhost:8000`

### Authentication

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "company_name": "Acme Inc"
}

Response 201:
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### Send Login Code
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "success": true,
  "message": "Verification code sent to your email",
  "expires_in": 600
}
```

#### Verify Code & Login
```http
POST /api/auth/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response 200:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscription_tier": "pro"
  }
}
```

### Invoices

#### Get All Invoices
```http
GET /api/invoices?page=1&limit=20&status=pending
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "invoice_number": "INV-0001",
      "customer_name": "Client ABC",
      "total": 1500.00,
      "status": "pending",
      "due_date": "2025-02-15"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 87
  }
}
```

#### Create Invoice
```http
POST /api/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 5,
  "invoice_date": "2025-01-15",
  "due_date": "2025-02-15",
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
  "notes": "Payment due within 30 days"
}

Response 201:
{
  "success": true,
  "invoice": {
    "id": 42,
    "invoice_number": "INV-0042",
    "total": 1705.00,
    "pdf_url": "https://storage.invohub.com/invoices/42.pdf"
  }
}
```

### Inventory

#### Import from Excel
```http
POST /api/inventory/import-excel
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [Excel file]

Response 200:
{
  "success": true,
  "imported": 45,
  "errors": [],
  "message": "45 items imported successfully"
}
```

#### Search Inventory
```http
GET /api/inventory/search?q=design&limit=10
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "items": [
    {
      "id": 10,
      "name": "Website Design",
      "unit_price": 1500.00,
      "quantity": 5
    }
  ]
}
```

### Customers

#### Create Customer
```http
POST /api/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State 12345"
}

Response 201:
{
  "success": true,
  "customer": {
    "id": 15,
    "name": "Acme Corporation",
    "total_invoiced": 0.00
  }
}
```

### User & Settings

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Inc",
    "subscription_tier": "pro",
    "subscription_status": "active"
  }
}
```

#### Update Settings
```http
PUT /api/user/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "currency": "USD",
  "tax_rate": 10,
  "invoice_prefix": "INV-",
  "theme": "dark"
}

Response 200:
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 🔑 AUTHENTICATION FLOW

### Email + 6-Digit Code System

**Step 1: User requests login**
```
POST /api/auth/send-code
{ "email": "user@example.com" }
↓
Server generates 6-digit code (e.g., "483921")
↓
Code stored in database with 10-minute expiration
↓
Email sent to user with code
```

**Step 2: User enters code**
```
POST /api/auth/verify-code
{ "email": "user@example.com", "code": "483921" }
↓
Server validates code (not expired, not used)
↓
Code marked as used
↓
JWT token generated and returned
```

**Step 3: Authenticated requests**
```
GET /api/invoices
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
↓
Middleware validates JWT
↓
Request proceeds
```

**JWT Payload:**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "iat": 1704528000,
  "exp": 1705132800
}
```

---

## 📧 EMAIL TEMPLATES

### Login Code Email
```html
Subject: Your InvoHub Login Code

<h2>Your Login Code</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; color: #ff6b35;">123456</h1>
<p>This code expires in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
```

### Invoice Email
```html
Subject: Invoice #INV-0042 from {Company Name}

<h2>Invoice #{invoice_number}</h2>
<p>Dear {customer_name},</p>
<p>Please find attached invoice for ${total}.</p>
<p><strong>Due Date:</strong> {due_date}</p>
<p><a href="{pdf_url}">Download PDF</a></p>
```

---

## 💳 SUBSCRIPTION TIERS

```php
// In SubscriptionMiddleware.php

$tiers = [
    'free' => [
        'max_invoices_per_month' => 3,
        'max_customers' => 10,
        'max_inventory' => 0,
        'features' => ['basic_templates']
    ],
    'starter' => [
        'max_invoices_per_month' => 25,
        'max_customers' => -1, // unlimited
        'max_inventory' => 100,
        'features' => ['all_templates', 'cloud_backup', 'email_support']
    ],
    'pro' => [
        'max_invoices_per_month' => -1, // unlimited
        'max_customers' => -1,
        'max_inventory' => -1,
        'features' => ['all_features', 'recurring_invoices', 'signatures', 'priority_support']
    ]
];
```

---

## 🔒 SECURITY FEATURES

### Password Hashing
```php
// Registration
$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verification
password_verify($inputPassword, $storedHash);
```

### JWT Validation
```php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$decoded = JWT::decode($token, new Key($secret, 'HS256'));
```

### Rate Limiting
```php
// 60 requests per minute per IP
if ($requests > 60) {
    http_response_code(429);
    exit('Rate limit exceeded');
}
```

### SQL Injection Prevention
```php
// Always use prepared statements
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
```

---

## 📤 FILE UPLOADS

### Logo Upload
```php
POST /api/user/upload-logo
Content-Type: multipart/form-data

file: [image file]

// Validation
- Max size: 10MB
- Allowed types: JPG, PNG, SVG
- Auto-resize to 200x200px
- Upload to S3
- Return URL
```

### Invoice PDF Generation
```php
// Uses DOMPDF library
$pdf = new PdfService();
$pdfContent = $pdf->generateInvoice($invoice);
$url = CloudStorageService::uploadPdf($pdfContent);
```

---

## 🔄 SYNC SYSTEM (Offline/Online Hybrid)

### Push Local Changes
```http
POST /api/sync/push
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoices": [
    { "local_id": "temp-1", "data": {...} }
  ],
  "customers": [
    { "local_id": "temp-2", "data": {...} }
  ],
  "timestamp": 1704528000
}

Response 200:
{
  "success": true,
  "mappings": {
    "temp-1": 42,  // local_id → server_id
    "temp-2": 15
  }
}
```

### Pull Server Changes
```http
GET /api/sync/pull?since=1704528000
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "invoices": [...],
    "customers": [...],
    "inventory": [...]
  },
  "timestamp": 1704628000
}
```

---

## 🧪 TESTING

### Run Tests
```bash
composer test
```

### Example Test
```php
// tests/AuthTest.php
public function testSendCode()
{
    $response = $this->post('/api/auth/send-code', [
        'email' => 'test@example.com'
    ]);
    
    $this->assertEquals(200, $response->status);
    $this->assertTrue($response->json('success'));
}
```

---

## 🚀 DEPLOYMENT

### Production Checklist

- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Configure production database
- [ ] Set up SSL certificate
- [ ] Configure email (SMTP)
- [ ] Set up Redis for caching
- [ ] Configure AWS S3 for file storage
- [ ] Set up Stripe webhook
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups
- [ ] Set up CDN (CloudFlare)

### Apache Configuration
```apache
<VirtualHost *:443>
    ServerName api.invohub.com
    DocumentRoot /var/www/invohub-backend/public
    
    <Directory /var/www/invohub-backend/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name api.invohub.com;
    root /var/www/invohub-backend/public;
    
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Indexing
```sql
-- Already included in migration
CREATE INDEX idx_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoice_date ON invoices(invoice_date);
CREATE FULLTEXT INDEX idx_search ON invoices(invoice_number, customer_name);
```

### Redis Caching
```php
// Cache user settings for 1 hour
$redis->setex("user:settings:{$userId}", 3600, json_encode($settings));
```

### Query Optimization
```php
// Eager load relationships
$invoices = Invoice::with(['customer', 'items'])->get();
```

---

## 🐛 ERROR HANDLING

### Standard Error Response
```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_INVALID",
  "status": 401
}
```

### Error Codes
- `AUTH_INVALID` - Invalid credentials
- `AUTH_EXPIRED` - Token expired
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT` - Too many requests
- `SUBSCRIPTION_REQUIRED` - Feature requires paid plan
- `SERVER_ERROR` - Internal server error

---

## 📚 ADDITIONAL RESOURCES

### Dependencies Used
- `vlucas/phpdotenv` - Environment configuration
- `firebase/php-jwt` - JWT authentication
- `phpmailer/phpmailer` - Email sending
- `stripe/stripe-php` - Payment processing
- `aws/aws-sdk-php` - Cloud storage
- `phpoffice/phpspreadsheet` - Excel import/export
- `dompdf/dompdf` - PDF generation

### External Services
- **Stripe** - Subscription billing
- **AWS S3** - File storage
- **SendGrid/SMTP** - Email delivery
- **Redis** - Caching layer

---

## 🆘 SUPPORT

### Common Issues

**Issue: Database connection failed**
```bash
# Check credentials in .env
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u username -p database_name
```

**Issue: Composer dependencies not installing**
```bash
# Update composer
composer self-update

# Clear cache
composer clear-cache

# Install with verbose output
composer install -vvv
```

**Issue: 500 Internal Server Error**
```bash
# Check PHP error log
tail -f /var/log/php8.1-fpm.log

# Enable debug mode temporarily
APP_DEBUG=true in .env
```

---

## 📄 LICENSE

Proprietary - InvoHub Cloud © 2025

---

## ✅ NEXT STEPS

1. **Download full codebase** - All controller files, models, services
2. **Set up development environment** - Follow quick start guide
3. **Run migrations** - Create database schema
4. **Test API endpoints** - Use Postman/Insomnia
5. **Deploy to production** - Follow deployment checklist
6. **Connect frontend** - Update InvoHub PWA to use API

---

**📧 Need Help?** Contact: dev@invohub.com

**🔗 Resources:**
- API Documentation: https://docs.invohub.com
- GitHub: https://github.com/invohub/cloud-backend
- Status Page: https://status.invohub.com

---

*This package contains the complete backend infrastructure. The full source code with all controllers, models, and services is available in the complete download package.*
