# Curl Examples for Role-Based Auth System

## User Registration and Login

### Register a Regular User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John User",
    "email": "john.user@example.com",
    "password": "SecurePass123",
    "phone": "+1234567890",
    "role": "user",
    "address": {
      "city": "User City",
      "state": "UC"
    }
  }'
```

### Login as Regular User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.user@example.com",
    "password": "SecurePass123"
  }'
```

## Factory Registration and Login

### Register a Factory
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Factory Owner",
    "email": "factory@example.com",
    "password": "FactoryPass123",
    "phone": "+1234567891",
    "role": "factory",
    "address": {
      "city": "Factory City",
      "state": "FC"
    },
    "factoryName": "Eco Factory Ltd",
    "ownerName": "Factory Manager",
    "gstNumber": "GST123456789"
  }'
```

### Login as Factory (Pending Approval)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "factory@example.com",
    "password": "FactoryPass123"
  }'
```

## Collector Registration and Login

### Register a Collector
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Collector Owner",
    "email": "collector@example.com",
    "password": "CollectorPass123",
    "phone": "+1234567892",
    "role": "collector",
    "address": {
      "city": "Collector City",
      "state": "CC"
    },
    "companyName": "Green Collectors Inc",
    "contactName": "Collector Manager",
    "serviceArea": ["Area A", "Area B", "Area C"]
  }'
```

### Login as Collector (Pending Approval)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collector@example.com",
    "password": "CollectorPass123"
  }'
```

## Admin Approval Operations

### Get Pending Factory Applications (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/approval/factories/pending \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Get Pending Collector Applications (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/approval/collectors/pending \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Approve a Factory Application (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/approval/factories/FACTORY_APPLICATION_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Reject a Factory Application (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/approval/factories/FACTORY_APPLICATION_ID/reject \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Incomplete documentation"
  }'
```

### Approve a Collector Application (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/approval/collectors/COLLECTOR_APPLICATION_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Reject a Collector Application (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/approval/collectors/COLLECTOR_APPLICATION_ID/reject \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Service area not covered"
  }'
```

## Authentication Headers

For all protected endpoints, include the Authorization header with a valid JWT token:

```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

To obtain a token, first login using the login endpoint, then extract the accessToken from the response.