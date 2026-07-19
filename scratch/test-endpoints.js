const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting API Verification...');
  
  try {
    // 1. Get Herbs
    console.log('Fetching GET /api/herbs...');
    const herbsResult = await get('http://localhost:3000/api/herbs');
    console.log('Status:', herbsResult.status);
    console.log('Total Herbs:', herbsResult.data?.meta?.total);
    console.log('First Herb Name:', herbsResult.data?.data?.[0]?.name);
    
    if (herbsResult.status !== 200 || !herbsResult.data?.data?.length) {
      throw new Error('Failed GET /api/herbs test');
    }

    // 2. Post Recommendations
    console.log('\nFetching POST /api/recommendations...');
    const recsResult = await post('http://localhost:3000/api/recommendations', {
      symptoms: ['Stress', 'Inflammation'],
      limit: 5
    });
    console.log('Status:', recsResult.status);
    console.log('Recommendations Count:', recsResult.data?.data?.length);
    console.log('First Recommendation:', recsResult.data?.data?.[0]?.name, 'with score:', recsResult.data?.data?.[0]?.score);
    
    if (recsResult.status !== 200 || !recsResult.data?.data?.length) {
      throw new Error('Failed POST /api/recommendations test');
    }

    console.log('\n✨ All API endpoints verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    process.exit(1);
  }
}

// Wait a bit to ensure Next.js dev server is ready
setTimeout(runTests, 2000);
