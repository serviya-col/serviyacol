// Test Bold v2 API con diferentes formatos de auth
const IDENTITY_KEY = 'fNuQBhDS9O9x9_4W_ysjjEJrIIbioOZoXdg7aTZ1SkA';
const SECRET_KEY = 'AVzRFjr5uXaZD9cVyvwFCQ';
const BASE = 'https://integrations.api.bold.co';

async function tryV2(authHeader) {
  const body = {
    amount_type: 'CLOSE',
    amount: { currency: 'COP', total_amount: 1000 },
    reference: `SY-${Date.now()}`,
    description: 'ServiYa test',
    callback_url: 'https://www.serviyacol.com/pago-exitoso',
    payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
  };
  
  console.log(`\n=== Auth: ${authHeader.substring(0, 40)}... ===`);
  const res = await fetch(`${BASE}/online/link/v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text.substring(0, 200)}`);
  if (res.ok) console.log('✅ SUCCESS!');
  await new Promise(r => setTimeout(r, 400));
}

async function main() {
  // Bold v2 podría usar formato diferente
  await tryV2(`ApiKey ${IDENTITY_KEY}`);
  await tryV2(`ApiKey ${SECRET_KEY}`);
  await tryV2(`ApiKey key=${IDENTITY_KEY}`);
  await tryV2(`ApiKey key=${SECRET_KEY}`);
  await tryV2(`key=${IDENTITY_KEY}`);
  await tryV2(`key=${SECRET_KEY}`);
  
  // v1 con el nuevo endpoint que Bold usa
  console.log('\n\n=== Intentando v1 con "x-api-key: {key}" directo en query === SKIP');
  
  // Intento con Basic Auth
  const basicIdent = Buffer.from(`${IDENTITY_KEY}:`).toString('base64');
  const basicSecret = Buffer.from(`${SECRET_KEY}:`).toString('base64');
  const basicBoth = Buffer.from(`${IDENTITY_KEY}:${SECRET_KEY}`).toString('base64');
  
  await tryV2(`Basic ${basicIdent}`);
  await tryV2(`Basic ${basicSecret}`);
  await tryV2(`Basic ${basicBoth}`);
}

main().catch(console.error);
