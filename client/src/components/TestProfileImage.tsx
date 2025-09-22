import React from 'react';
import { useAuth } from '../context/AuthContext';

const TestProfileImage: React.FC = () => {
  const { user } = useAuth();
  
  // Function to get profile image URL
  const getProfileImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend the API base URL
    if (imagePath.startsWith('/')) {
      return `/api${imagePath}`;
    }
    
    // Otherwise, assume it's in the assets folder
    return `/api/assets/${imagePath}`;
  };
  
  const profileImageUrl = getProfileImageUrl(user?.profileImage);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Profile Image Test</h3>
      
      {user ? (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          
          {profileImageUrl ? (
            <div className="mt-4">
              <p>Profile Image URL: {profileImageUrl}</p>
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover mt-2"
                onError={(e) => {
                  console.error('Image failed to load');
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <p className="mt-4">No profile image set</p>
          )}
        </div>
      ) : (
        <p>Please log in to see profile information</p>
      )}
    </div>
  );
};

export default TestProfileImage;