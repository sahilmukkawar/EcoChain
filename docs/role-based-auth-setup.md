# Role-Based Authentication with Approval System

This document provides setup instructions and API documentation for the role-based authentication system with admin approval for factory and collector roles.

## Setup Instructions

### Prerequisites
- Node.js v14 or higher
- MongoDB v4.4 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EcoChain
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory with the following variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecochain

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (optional - for development, emails will be logged to console)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=no-reply@ecochain.com

# Server
PORT=5000
NODE_ENV=development
```

5. Start the development server:
```bash
# In the root directory
npm run dev

# In a separate terminal, start the frontend
cd client
npm start
```

### Seeding an Admin User

To create an admin user, run the following script:
```bash
node scripts/make-admin.js <admin-email>
```

Example:
```bash
node scripts/make-admin.js admin@ecochain.com
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "user", // or "factory" or "collector"
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zipCode": "12345",
    "country": "India"
  },
  // Factory specific fields (required if role is "factory")
  "factoryName": "Eco Factory Ltd",
  "ownerName": "Jane Smith",
  "gstNumber": "GST123456789",
  
  // Collector specific fields (required if role is "collector")
  "companyName": "Green Collectors Inc",
  "contactName": "Mike Johnson",
  "serviceArea": ["Area 1", "Area 2", "Area 3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Waiting for admin approval.",
  "data": {
    "user": {
      "id": "user_id",
      "userId": "USR123456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "factory",
      "approvalStatus": "pending",
      "ecoWallet": {
        "currentBalance": 0,
        "totalEarned": 0,
        "totalSpent": 0
      },
      "sustainabilityScore": 0
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (for approved users):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "userId": "USR123456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": null,
      "role": "factory",
      "approvalStatus": "approved",
      "ecoWallet": {
        "currentBalance": 0,
        "totalEarned": 0,
        "totalSpent": 0
      },
      "sustainabilityScore": 0
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

**Response (for pending approval):**
```json
{
  "success": true,
  "message": "Login successful. Account pending approval.",
  "data": {
    "user": {
      "id": "user_id",
      "userId": "USR123456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": null,
      "role": "factory",
      "approvalStatus": "pending",
      "ecoWallet": {
        "currentBalance": 0,
        "totalEarned": 0,
        "totalSpent": 0
      },
      "sustainabilityScore": 0
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    },
    "pendingApproval": true
  }
}
```

### Admin Approval Endpoints

All admin approval endpoints require authentication with an admin account.

#### Get Pending Factory Applications
```http
GET /api/admin/approval/factories/pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "factories": [
      {
        "_id": "factory_application_id",
        "userId": {
          "_id": "user_id",
          "personalInfo": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890"
          }
        },
        "factoryName": "Eco Factory Ltd",
        "ownerName": "Jane Smith",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": {
          "street": "123 Main St",
          "city": "Anytown",
          "state": "ST",
          "zipCode": "12345",
          "country": "India"
        },
        "gstNumber": "GST123456789",
        "submittedAt": "2023-01-01T00:00:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

#### Get Pending Collector Applications
```http
GET /api/admin/approval/collectors/pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collectors": [
      {
        "_id": "collector_application_id",
        "userId": {
          "_id": "user_id",
          "personalInfo": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890"
          }
        },
        "companyName": "Green Collectors Inc",
        "contactName": "Mike Johnson",
        "email": "john@example.com",
        "phone": "+1234567890",
        "serviceArea": ["Area 1", "Area 2", "Area 3"],
        "submittedAt": "2023-01-01T00:00:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

#### Get All Applications (with filtering)
```http
GET /api/admin/approval/applications?type=factory&status=pending&page=1&limit=10
```

**Query Parameters:**
- `type`: "factory" or "collector" (optional)
- `status`: "pending", "approved", or "rejected" (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      // Array of applications
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 5
    }
  }
}
```

#### Approve Factory Application
```http
PUT /api/admin/approval/factories/:id/approve
```

**Response:**
```json
{
  "success": true,
  "message": "Factory application approved successfully",
  "data": {
    "application": {
      // Updated application object
    }
  }
}
```

#### Reject Factory Application
```http
PUT /api/admin/approval/factories/:id/reject
```

**Request Body:**
```json
{
  "rejectionReason": "Incomplete documentation provided"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Factory application rejected successfully",
  "data": {
    "application": {
      // Updated application object
    }
  }
}
```

#### Approve Collector Application
```http
PUT /api/admin/approval/collectors/:id/approve
```

**Response:**
```json
{
  "success": true,
  "message": "Collector application approved successfully",
  "data": {
    "application": {
      // Updated application object
    }
  }
}
```

#### Reject Collector Application
```http
PUT /api/admin/approval/collectors/:id/reject
```

**Request Body:**
```json
{
  "rejectionReason": "Service area not covered"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collector application rejected successfully",
  "data": {
    "application": {
      // Updated application object
    }
  }
}
```

## Testing Instructions

### Backend Tests

1. Run the test suite:
```bash
npm test
```

2. Run tests with coverage:
```bash
npm run test:coverage
```

### Manual Testing

1. **User Registration and Login:**
   - Register a new user with role "user"
   - Login and verify access to user dashboard
   - Register a factory or collector
   - Login and verify redirect to pending approval page

2. **Admin Approval Workflow:**
   - Login as admin
   - Navigate to Admin Dashboard → Approvals
   - View pending applications
   - Approve a factory application
   - Verify the factory user can now access the factory dashboard
   - Reject a collector application
   - Verify the collector user sees rejection message

3. **Email Notifications:**
   - Check console logs for email notifications
   - In production, configure SMTP settings in `.env` file

### Postman Collection

A Postman collection is available in the `docs` directory: `EcoChain-Auth-API.postman_collection.json`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret for signing JWT tokens | Yes |
| JWT_EXPIRES_IN | Access token expiration time | Yes |
| JWT_REFRESH_SECRET | Secret for signing refresh tokens | Yes |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiration time | Yes |
| SMTP_HOST | SMTP server host (optional) | No |
| SMTP_PORT | SMTP server port (optional) | No |
| SMTP_SECURE | Use TLS (optional) | No |
| SMTP_USER | SMTP username (optional) | No |
| SMTP_PASS | SMTP password (optional) | No |
| SMTP_FROM | Sender email address (optional) | No |
| PORT | Server port | No (defaults to 5000) |
| NODE_ENV | Environment (development/production) | No (defaults to development) |

## Security Considerations

1. **Password Security:**
   - Passwords are hashed using bcrypt with 10 rounds
   - Minimum password length is 8 characters

2. **Token Security:**
   - JWT tokens are signed with separate secrets for access and refresh tokens
   - Tokens have appropriate expiration times

3. **Role-Based Access Control:**
   - Middleware ensures only authorized roles can access specific endpoints
   - Approval status is checked for factory and collector roles

4. **Input Validation:**
   - All inputs are validated and sanitized
   - Email format is validated
   - Required fields are enforced

5. **Rate Limiting:**
   - Auth endpoints should implement rate limiting in production

## Deployment

### Production Considerations

1. Set `NODE_ENV=production` in environment variables
2. Use a production MongoDB instance
3. Configure proper SMTP settings for email notifications
4. Implement rate limiting for auth endpoints
5. Use HTTPS in production
6. Set secure JWT secrets
7. Monitor logs for security events

### Docker Deployment

A Dockerfile is available in the root directory:
```bash
docker build -t ecochain .
docker run -p 5000:5000 ecochain
```

### Heroku Deployment

1. Create a new Heroku app
2. Connect to your GitHub repository
3. Set environment variables in Heroku dashboard
4. Deploy using Heroku CLI or GitHub integration