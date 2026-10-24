import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000/api/bio-assistant';

async function testEndpoint() {
  console.log('Testing Bio Assistant API Endpoint at', BASE_URL);

  // Test 1: Query about gym and Hevy
  console.log('Test 1: Gym / Hevy query...');
  const res1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', text: '¿Cuál es la meta de Santiago en el gimnasio y su peso actual?' }],
    }),
  });
  assert.strictEqual(res1.status, 200, 'Status should be 200');
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true, 'Success should be true');
  assert.ok(data1.reply.length > 50, 'Reply should be substantial');
  console.log('  -> OK:', data1.reply.slice(0, 80).replace(/\n/g, ' '), '...');

  // Test 2: Academic and structures query
  console.log('Test 2: Academic / Structures query...');
  const res2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', text: '¿Cuánto necesita Santiago en el examen final de Análisis de Estructuras?' }],
    }),
  });
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  assert.ok(data2.reply.includes('2.97') || data2.reply.includes('3.0') || data2.reply.toLowerCase().includes('estructuras'), 'Reply should reference structures details');
  console.log('  -> OK:', data2.reply.slice(0, 80).replace(/\n/g, ' '), '...');

  // Test 3: Fallback semantic local when query is passed without key
  console.log('Test 3: Empty query handling...');
  const res3 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [],
    }),
  });
  const data3 = await res3.json();
  assert.strictEqual(data3.success, false);
  console.log('  -> OK: Graceful error when no query.');

  console.log('\n✔ ALL BIO-ASSISTANT INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

testEndpoint().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
