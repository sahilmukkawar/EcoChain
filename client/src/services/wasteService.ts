import api from './api';

export interface WasteSubmission {
  _id: string;
  userId: string;
  wasteType: string;
  quantity: number;
  description: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTimeSlot: string;
  images: string[];
  status: 'pending' | 'approved' | 'collected' | 'rejected';
  estimatedTokens: number;
  actualTokens: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWasteSubmissionData {
  wasteType: string;
  quantity: number;
  description: string;
  pickupAddress: string;
  pickupDate: string;
  pickupTimeSlot: string;
  images?: File[];
}

const wasteService = {
  // Get all waste submissions for the current user
  getUserSubmissions: async (): Promise<WasteSubmission[]> => {
    const response = await api.get<WasteSubmission[]>('/waste/user');
    return response.data;
  },

  // Get waste submission by ID
  getSubmissionById: async (id: string): Promise<WasteSubmission> => {
    const response = await api.get<WasteSubmission>(`/waste/${id}`);
    return response.data;
  },

  // Create new waste submission
  createSubmission: async (submissionData: CreateWasteSubmissionData): Promise<WasteSubmission> => {
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add all form fields to the FormData
    Object.entries(submissionData).forEach(([key, value]) => {
      if (key !== 'images') {
        formData.append(key, String(value));
      }
    });
    
    // Add each image file if they exist
    if (submissionData.images) {
      submissionData.images.forEach((file, index) => {
        formData.append(`images`, file);
      });
    }
    
    const response = await api.post<WasteSubmission>('/waste', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Cancel waste submission
  cancelSubmission: async (id: string): Promise<void> => {
    await api.delete(`/waste/${id}`);
  },

  // Calculate estimated tokens based on waste type and quantity
  calculateEstimatedTokens: (wasteType: string, quantity: number): number => {
    const tokenRates: Record<string, number> = {
      'plastic': 5,
      'paper': 3,
      'glass': 4,
      'metal': 6,
      'electronics': 10,
      'organic': 2,
      'other': 1
    };
    
    const rate = tokenRates[wasteType] || 1;
    return Math.round(rate * quantity);
  }
};

export default wasteService;