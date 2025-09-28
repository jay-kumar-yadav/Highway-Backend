// Simple CORS test script
// Run with: node test-cors.js

const https = require('https');

const testCors = () => {
  const options = {
    hostname: 'highway-backend-2.onrender.com',
    port: 443,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Origin': 'https://highway-frontend-6n97.vercel.app',
      'Content-Type': 'application/json'
    }
  };

  console.log('🧪 Testing CORS configuration...');
  console.log('Origin:', options.headers.Origin);
  console.log('Target:', `https://${options.hostname}${options.path}`);

  const req = https.request(options, (res) => {
    console.log('✅ Response Status:', res.statusCode);
    console.log('📋 CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response Body:', data);
      
      if (res.headers['access-control-allow-origin']) {
        console.log('🎉 CORS is properly configured!');
      } else {
        console.log('❌ CORS headers missing - check your configuration');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.end();
};

// Test preflight request
const testPreflight = () => {
  const options = {
    hostname: 'highway-backend-2.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://highway-frontend-6n97.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };

  console.log('\n🧪 Testing preflight request...');
  console.log('Method: OPTIONS');
  console.log('Origin:', options.headers.Origin);

  const req = https.request(options, (res) => {
    console.log('✅ Preflight Status:', res.statusCode);
    console.log('📋 Preflight Headers:');
    console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    if (res.statusCode === 204) {
      console.log('🎉 Preflight request handled correctly!');
    } else {
      console.log('❌ Preflight request failed');
    }
  });

  req.on('error', (error) => {
    console.error('❌ Preflight request failed:', error.message);
  });

  req.end();
};

// Run tests
console.log('🚀 Starting CORS tests...\n');
testCors();
setTimeout(testPreflight, 2000);
