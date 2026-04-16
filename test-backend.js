const axios = require('axios');

const BACKEND_URL = "http://localhost:3001";

async function testBackend() {
  console.log('--- Testing Decantral Backend ---');
  
  try {
    console.log('1. Testing /verify-invoice...');
    const verifyRes = await axios.post(`${BACKEND_URL}/verify-invoice`, {
      irn: "IRN-1001-GSTIN-001",
      amount: 100000,
      maturityDate: Date.now() + 30 * 86400000
    });
    console.log('SUCCESS: /verify-invoice returned payload.');
    console.log('Oracle Address:', verifyRes.data.oracleAddress);
    
    console.log('\n2. Testing /api/invoices (queries Indexer)...');
    const invoicesRes = await axios.get(`${BACKEND_URL}/api/invoices`);
    console.log('SUCCESS: /api/invoices returned data.');
    console.log('Number of invoices found:', invoicesRes.data.length);

  } catch (error) {
    console.error('BACKEND ERROR:', error.response ? error.response.data : error.message);
  }
}

testBackend();
