#!/usr/bin/env node

const axios = require('axios');

async function getServiceToken() {
  try {
    console.log('🔑 Getting Service Account token for Flowise...');
    
    const response = await axios.post(
      'http://localhost:18080/realms/evently/protocol/openid-connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'evently-confidential-client',
        client_secret: 'PzotcrvZRF9BHCKcUxdKfHWlIPECG49k'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    if (response.data.access_token) {
      console.log('✅ Token obtained successfully!');
      console.log('🔗 Token:', response.data.access_token);
      console.log('⏰ Expires in:', response.data.expires_in, 'seconds');
      console.log('');
      console.log('📋 Add this to docker-compose.yml:');
      console.log('   EVENTLY_API_TOKEN=' + response.data.access_token);
      
      return response.data.access_token;
    } else {
      console.error('❌ No access token received');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  getServiceToken();
}

module.exports = { getServiceToken };
