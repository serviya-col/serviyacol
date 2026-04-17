// Test Bold PRODUCTION API - diferentes formatos de autenticación
const IDENTITY_KEY = 'fNuQBhDS9O9x9_4W_ysjjEJrIIbioOZoXdg7aTZ1SkA';
const SECRET_KEY = 'AVzRFjr5uXaZD9cVyvwFCQ';
const BOLD_API_URL = 'https://integrations.api.bold.co';

async function tryRequest(name, headers) {
  const referencia = `SY-TEST-${Date.now()}`;
  const body = {
    amount_type: 'CLOSE',
    amount: { currency: 'COP', total_amount: 1000 },
    reference: referencia,
    description: 'ServiYa test',
    callback_url: 'https://www.serviyacol.com/pago-exitoso',
  };

  console.log(`\n=== ${name} ===`);
  console.log('Headers:', headers);
  
  try {
    const res = await fetch(`${BOLD_API_URL}/online/link/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    if (res.ok && data.payload?.url) {
      console.log(`\n✅ ÉXITO con: ${name}`);
      console.log('URL:', data.payload.url);
      return true;
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  return false;
}

async function main() {
  const tests = [
    // Test con llave de identidad en diferentes formatos
    ['Identity Key: x-api-key format', { 'Authorization': `x-api-key ${IDENTITY_KEY}` }],
    ['Identity Key: Bearer format', { 'Authorization': `Bearer ${IDENTITY_KEY}` }],
    ['Secret Key: x-api-key format', { 'Authorization': `x-api-key ${SECRET_KEY}` }],
    ['Secret Key: Bearer format', { 'Authorization': `Bearer ${SECRET_KEY}` }],
    // Combinados
    ['Both keys in headers', { 
      'Authorization': `x-api-key ${IDENTITY_KEY}`,
      'x-secret-key': SECRET_KEY 
    }],
    // Solo con llave de identidad en header personalizado
    ['x-api-key header (identity)', { 'x-api-key': IDENTITY_KEY }],
    ['x-api-key header (secret)', { 'x-api-key': SECRET_KEY }],
  ];

  for (const [name, headers] of tests) {
    const success = await tryRequest(name, headers);
    if (success) break;
    await new Promise(r => setTimeout(r, 500)); // delay entre requests
  }
}

main();
