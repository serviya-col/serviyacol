// Test Bold - intentar endpoint diferente
const IDENTITY_KEY = 'fNuQBhDS9O9x9_4W_ysjjEJrIIbioOZoXdg7aTZ1SkA';
const SECRET_KEY = 'AVzRFjr5uXaZD9cVyvwFCQ';

const endpoints = [
  'https://integrations.api.bold.co/online/link/v1',
  'https://integrations.api.bold.co/online/link/v2',
  'https://api.bold.co/online/link/v1',
  'https://checkout.api.bold.co/online/link/v1',
  'https://integrations.api.bold.co/v1/links',
  'https://api.payments.bold.co/online/link/v1',
];

async function testEndpoint(url, authKey) {
  const body = {
    amount_type: 'CLOSE',
    amount: { currency: 'COP', total_amount: 1000 },
    reference: `SY-${Date.now()}`,
    description: 'test',
  };
  
  console.log(`Testing: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${authKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log(`  Status: ${res.status} — ${text.substring(0, 100)}`);
    if (res.status !== 403 && res.status !== 404) {
      console.log('  >> INTERESANTE! Status no es 403/404');
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

async function main() {
  console.log('=== Testing con llave de identidad ===');
  for (const ep of endpoints) {
    await testEndpoint(ep, IDENTITY_KEY);
    await new Promise(r => setTimeout(r, 300));
  }
}

main();
