import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Lock, Save, Eye, EyeOff, Upload, CheckCircle, AlertCircle } from 'lucide-react';

// Utility functions for image handling
const getProfileImageUrl = (imagePath?: string): string | null => {
  if (!imagePath || typeof imagePath !== 'string') return null;

  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;

  // If it's already a full URL, return as is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // If it already starts with /uploads/, it's correctly formatted for static serving
  if (cleanPath.startsWith('/uploads/')) {
    return cleanPath;
  }

  // If it doesn't contain any path separators, it's a filename only
  if (!cleanPath.includes('/') && !cleanPath.includes('\\')) {
    return `/uploads/profile-images/${cleanPath}`;
  }

  // For any other path that doesn't start with /uploads/, prepend /uploads/
  return `/uploads${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
};

const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPG, PNG, GIF, or WebP)'
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'Image size should be less than 2MB'
    };
  }

  return { isValid: true };
};

const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
};

const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve();
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
};

// Extended User interface to match backend model
interface ExtendedUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  ecoWallet?: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
  };
  sustainabilityScore?: number;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      // Type assertion to access extended properties
      const extendedUser = user as ExtendedUser;

      setProfileData({
        name: extendedUser.name || '',
        email: extendedUser.email || '',
        phone: extendedUser.phone || '',
        address: {
          street: extendedUser.address?.street || '',
          city: extendedUser.address?.city || '',
          state: extendedUser.address?.state || '',
          zipCode: extendedUser.address?.zipCode || '',
          country: extendedUser.address?.country || ''
        }
      });

      // Set profile image if exists - fix URL construction
      if (extendedUser.profileImage) {
        setProfileImage(getProfileImageUrl(extendedUser.profileImage));
      }
    }
  }, [user]);

  // Handle profile data changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle password data changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file using shared utility
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showMessage(validation.error!, 'error');
      return;
    }

    setSelectedFile(file);

    // Create preview using shared utility
    try {
      const previewUrl = await createImagePreview(file);
      setPreviewImage(previewUrl);
    } catch (error) {
      showMessage('Failed to read image file', 'error');
      setSelectedFile(null);
    }
  };

  // Show message
  const showMessage = (text: string, type: 'success' | 'error' | 'warning') => {
    setMessage({ type, text });
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  // Validation helper functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateProfileData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required field validation
    if (!profileData.name.trim()) {
      errors.push('Name is required');
    } else if (profileData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!profileData.email.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(profileData.email.trim())) {
      errors.push('Please enter a valid email address');
    }

    // Optional field validation
    if (profileData.phone.trim() && !validatePhone(profileData.phone.trim())) {
      errors.push('Please enter a valid phone number');
    }

    // Address validation (all optional but should be reasonable if provided)
    if (profileData.address.zipCode.trim() && profileData.address.zipCode.trim().length < 3) {
      errors.push('ZIP code should be at least 3 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let response;

      // Validate form data
      const validation = validateProfileData();
      if (!validation.isValid) {
        showMessage(validation.errors[0], 'error'); // Show first error
        setLoading(false);
        return;
      }

      // If a profile image is selected, use multipart form data
      if (selectedFile) {
        const formData = new FormData();

        // Add individual profile fields
        formData.append('name', profileData.name.trim());
        formData.append('email', profileData.email.trim());
        if (profileData.phone.trim()) {
          formData.append('phone', profileData.phone.trim());
        }

        // Add address fields individually to match backend expectations
        if (profileData.address.street.trim()) {
          formData.append('address[street]', profileData.address.street.trim());
        }
        if (profileData.address.city.trim()) {
          formData.append('address[city]', profileData.address.city.trim());
        }
        if (profileData.address.state.trim()) {
          formData.append('address[state]', profileData.address.state.trim());
        }
        if (profileData.address.zipCode.trim()) {
          formData.append('address[zipCode]', profileData.address.zipCode.trim());
        }
        if (profileData.address.country.trim()) {
          formData.append('address[country]', profileData.address.country.trim());
        }

        // Add profile image file
        formData.append('profileImage', selectedFile);

        // Use the specialized API method for file uploads
        response = await authAPI.updateProfileWithImage(formData);
      } else {
        // Otherwise, use regular JSON update
        const cleanProfileData: any = {
          name: profileData.name.trim(),
          email: profileData.email.trim()
        };

        // Add optional fields only if they have values
        if (profileData.phone.trim()) {
          cleanProfileData.phone = profileData.phone.trim();
        }

        // Add address only if at least one field has a value
        const addressFields = {
          street: profileData.address.street.trim(),
          city: profileData.address.city.trim(),
          state: profileData.address.state.trim(),
          zipCode: profileData.address.zipCode.trim(),
          country: profileData.address.country.trim()
        };

        // Filter out empty address fields
        const filteredAddress = Object.fromEntries(
          Object.entries(addressFields).filter(([_, value]) => value !== '')
        );

        // Only include address if we have actual data, and never include location field
        if (Object.keys(filteredAddress).length > 0) {
          // Ensure we never accidentally include a location field
          delete filteredAddress.location;
          cleanProfileData.address = filteredAddress;
        }

        response = await authAPI.updateProfile(cleanProfileData);
      }

      if (response.data.success) {
        // Update user in context with the returned data
        updateUser(response.data.data);
        showMessage('Profile updated successfully', 'success');

        // Update profile image state with proper URL and error handling
        if (response.data.data.profileImage) {
          const imageUrl = getProfileImageUrl(response.data.data.profileImage);
          if (imageUrl) {
            setProfileImage(imageUrl);

            // Preload the image to ensure it's accessible using shared utility
            preloadImage(imageUrl)
              .then(() => {
                console.log('Profile image loaded successfully:', imageUrl);
              })
              .catch(() => {
                console.warn('Profile image failed to load after upload:', imageUrl);
                showMessage('Profile updated but image may not display correctly. Please refresh the page.', 'warning');
              });
          }
        }

        // Clear the selected file after successful upload
        setSelectedFile(null);
        setPreviewImage(null);

        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords
    if (!passwordData.currentPassword.trim()) {
      showMessage('Please enter your current password', 'error');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      showMessage('Please enter a new password', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters long', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showMessage('New password must be different from current password', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        // Reset password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        showMessage('Password changed successfully', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Profile Settings</h1>
        <p className="text-green-600">Manage your personal information and account settings</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : message.type === 'warning'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : message.type === 'warning' ? (
            <AlertCircle size={20} className="text-yellow-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Profile Picture</h2>

            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center overflow-hidden border-2 border-green-200 relative">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profileImage ? (
                    <>
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Profile image failed to load:', profileImage);
                          // Hide the image and show the fallback
                          const imageElement = e.currentTarget;
                          imageElement.style.display = 'none';
                          
                          // Use parent to find the fallback element more reliably
                          const parentElement = imageElement.parentElement;
                          if (parentElement) {
                            const fallbackElement = parentElement.querySelector('.absolute.inset-0');
                            if (fallbackElement) {
                              (fallbackElement as HTMLElement).style.display = 'flex';
                            }
                          }
                          
                          // Show a warning message
                          showMessage('Profile image failed to load. Please try uploading again.', 'warning');
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center hidden">
                        <User size={48} className="text-green-500" />
                      </div>
                    </>
                  ) : (
                    <User size={48} className="text-green-500" />
                  )}
                </div>

                <label className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 cursor-pointer hover:bg-green-600 transition-colors shadow-md">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loading}
                    onClick={handleUpdateProfile}
                  >
                    <Upload size={16} />
                    {loading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <button
                    className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewImage(null);
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  disabled={loading}
                  onClick={() => {
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                    fileInput?.click();
                  }}
                >
                  Upload New Photo
                </button>
              )}

              <p className="text-sm text-green-600 mt-2 text-center">
                JPG, GIF or PNG. Max size of 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Personal Information</h2>

            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="border-t border-green-100 pt-6">
                <h3 className="text-lg font-medium text-green-800 mb-4">Address Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-green-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={profileData.address.street}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={profileData.address.city}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      name="address.state"
                      value={profileData.address.state}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={profileData.address.zipCode}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your ZIP code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={profileData.address.country}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your country"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Change Password</h2>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={20} className="text-green-500" /> : <Eye size={20} className="text-green-500" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} className="text-green-500" /> : <Eye size={20} className="text-green-500" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} className="text-green-500" /> : <Eye size={20} className="text-green-500" />}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Lock size={18} />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;