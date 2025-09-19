// scripts/testApplicationsAPI.js
const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing /api/admin/applications endpoint...');
    
    // Use a real admin token from the database if available
    const response = await axios.get('http://localhost:4002/api/admin/applications', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q5ZjJiMjgzODc4Nzk0NWQ0NGNkMCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODMwNjExMCwiZXhwIjoxNzU4OTEwOTEwfQ.XRV74Y2TjolF356wuEgJmN2SD5uwx2xXLzr4zDTAIWo'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testAPI();