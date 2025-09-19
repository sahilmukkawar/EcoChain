// Test script to verify frontend can fetch applications
const axios = require('axios');

// Use the same token we generated earlier
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q5ZjJiMjgzODc4Nzk0NWQ0NGNkMCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODMwNjExMCwiZXhwIjoxNzU4OTEwOTEwfQ.XRV74Y2TjolF356wuEgJmN2SD5uwx2xXLzr4zDTAIWo';

async function testFrontendApplications() {
  try {
    console.log('Testing frontend applications fetch...');
    
    // Test the actual endpoint that the frontend uses
    const response = await axios.get('http://localhost:4002/api/admin/applications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.applications.length > 0) {
      console.log('✅ SUCCESS: Applications fetched successfully');
      console.log(`Found ${response.data.data.applications.length} applications`);
      
      // Show details of the first application
      const firstApp = response.data.data.applications[0];
      console.log('\nFirst application details:');
      console.log(`- Name: ${firstApp.userId?.personalInfo?.name || 'N/A'}`);
      console.log(`- Email: ${firstApp.userId?.personalInfo?.email || 'N/A'}`);
      console.log(`- Type: ${firstApp.userId?.role || 'N/A'}`);
      console.log(`- Status: ${firstApp.status}`);
      console.log(`- Submitted: ${firstApp.submittedAt}`);
    } else {
      console.log('⚠️  No applications found');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.status, error.response?.data || error.message);
  }
}

testFrontendApplications();