const fs = require('fs');

async function testApi() {
  const payload = JSON.parse(fs.readFileSync('./test_payload.json', 'utf8'));

  console.log('Sending request to http://localhost:3000/api/ingest...');
  try {
    const res = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testApi();

