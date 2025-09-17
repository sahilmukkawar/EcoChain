# Design Document

## Overview

The user profile management system provides a comprehensive interface for users to manage their personal information, address details, password security, and profile photos. The design addresses the current validation errors, photo loading issues, and provides a robust, user-friendly experience with proper error handling and real-time feedback.

## Architecture

### Frontend Architecture
- **React Component**: Single-page profile management interface with modular sections
- **State Management**: Local React state with proper validation and error handling
- **API Integration**: RESTful API calls with proper error handling and loading states
- **File Upload**: Multipart form data handling for profile images with preview functionality

### Backend Architecture
- **Express Routes**: Separate endpoints for profile updates and image uploads
- **Mongoose Models**: Enhanced User schema with proper validation and pre-save middleware
- **File Storage**: Local file system storage with proper path handling and URL construction
- **Validation**: Server-side validation with graceful error handling for undefined values

## Components and Interfaces

### Frontend Components

#### ProfilePage Component
```typescript
interface ProfilePageProps {
  // No props - uses AuthContext for user data
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

#### ProfileImageUpload Component
```typescript
interface ProfileImageUploadProps {
  currentImage?: string;
  onImageSelect: (file: File) => void;
  onImageUpload: () => Promise<void>;
  loading: boolean;
}
```

### Backend Interfaces

#### Enhanced User Model
```javascript
// Address schema with proper validation
address: {
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      validate: {
        validator: function(v) {
          // Allow null/undefined but validate when present
          if (!v || v === undefined) return true;
          return Array.isArray(v) && v.length === 2;
        }
      }
    }
  }
}
```

#### API Response Interfaces
```typescript
interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
    address?: AddressData;
    // ... other user fields
  };
}
```

## Data Models

### User Profile Data Flow
1. **Frontend State**: Local React state manages form data and UI state
2. **API Layer**: Axios interceptors handle authentication and error responses
3. **Backend Validation**: Mongoose schema validation with custom validators
4. **Database Storage**: MongoDB with proper indexing and validation

### Address Validation Fix
The current "Cast to Object failed" error occurs because the address.location field receives undefined values. The solution involves:

1. **Pre-save Middleware**: Clean undefined values before saving
2. **Conditional Validation**: Only validate location when coordinates are provided
3. **Default Values**: Provide sensible defaults for optional fields
4. **Error Handling**: Graceful handling of validation failures

### Profile Image Handling
1. **Upload Process**: Multipart form data with file validation
2. **Storage**: Local filesystem with organized directory structure
3. **URL Construction**: Consistent URL building for image access
4. **Fallback Handling**: Default images when upload fails or image missing

## Error Handling

### Frontend Error Handling
```typescript
interface ErrorState {
  type: 'success' | 'error' | 'warning';
  message: string;
  field?: string; // For field-specific errors
}

// Error handling patterns
try {
  const response = await authAPI.updateProfile(profileData);
  showMessage('Profile updated successfully', 'success');
} catch (error) {
  const errorMessage = error.response?.data?.message || 'Update failed';
  showMessage(errorMessage, 'error');
}
```

### Backend Error Handling
```javascript
// Validation error handling
userSchema.pre('save', function(next) {
  // Clean undefined address.location values
  if (this.address && this.address.location === undefined) {
    delete this.address.location;
  }
  
  // Remove empty address objects
  if (this.address && Object.keys(this.address).length === 0) {
    this.address = undefined;
  }
  
  next();
});

// Route error handling
router.put('/profile', authenticate, async (req, res) => {
  try {
    // ... update logic
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors // Mongoose validation errors
    });
  }
});
```

### Validation Error Resolution
1. **Address Location Field**: Handle undefined values gracefully
2. **Required Field Validation**: Clear error messages for missing data
3. **File Upload Validation**: Size, type, and format validation
4. **Password Validation**: Strength requirements and confirmation matching

## Testing Strategy

### Frontend Testing
1. **Component Testing**: React Testing Library for UI interactions
2. **Form Validation**: Test all validation scenarios and error states
3. **API Integration**: Mock API responses for different scenarios
4. **File Upload**: Test image selection, preview, and upload flow

### Backend Testing
1. **Route Testing**: Test all profile update endpoints
2. **Validation Testing**: Test schema validation and error handling
3. **File Upload Testing**: Test multipart form data handling
4. **Authentication Testing**: Test protected route access

### Integration Testing
1. **End-to-End Flow**: Complete profile update workflow
2. **Error Scenarios**: Network failures, validation errors, file upload failures
3. **Cross-browser Testing**: Ensure compatibility across browsers
4. **Mobile Responsiveness**: Test on various device sizes

## Security Considerations

### Authentication & Authorization
- JWT token validation for all profile operations
- User can only update their own profile data
- Secure password change with current password verification

### File Upload Security
- File type validation (images only)
- File size limits (2MB maximum)
- Secure file storage with proper permissions
- Path traversal prevention

### Data Validation
- Server-side validation for all input data
- SQL injection prevention through Mongoose
- XSS prevention through input sanitization
- Rate limiting for profile update operations

## Performance Optimizations

### Frontend Optimizations
- Image preview without server upload
- Debounced form validation
- Lazy loading for large profile images
- Optimistic UI updates with rollback on error

### Backend Optimizations
- Efficient database queries with proper indexing
- File upload streaming for large images
- Caching for frequently accessed profile data
- Compression for image storage

### Network Optimizations
- Image compression before upload
- Progressive image loading
- CDN integration for profile images
- Efficient API response payloads

## Navigation Bar Integration

### Profile Photo Display
The navigation bar should display the user's profile photo when available:

```typescript
// Navigation component integration
const ProfileAvatar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden">
      {user?.profileImage ? (
        <img 
          src={getProfileImageUrl(user.profileImage)} 
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji on image load error
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-full bg-green-100 flex items-center justify-center">
          👤
        </div>
      )}
    </div>
  );
};
```

### Real-time Updates
- Profile photo updates should immediately reflect in navigation
- Context state updates trigger re-renders across components
- Fallback handling for failed image loads