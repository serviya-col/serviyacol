// Test Bold API - run with: node test_bold.js
const BOLD_API_KEY = 'W79eYyTLQi6aqOfLBwkOUQoesRwPqQGVoAWgoQhLuYk';
const BOLD_API_URL = 'https://integrations.api.bold.co';

async function testBold() {
  const referencia = `SY-TEST-${Date.now()}`;
  
  // Try option 1: nanoseconds
  const expNano = (Date.now() + 72 * 60 * 60 * 1000) * 1_000_000;
  
  // Try option 2: ISO string  
  const expISO = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  
  // Try option 3: seconds (unix timestamp)
  const expSeconds = Math.floor((Date.now() + 72 * 60 * 60 * 1000) / 1000);

  const bodies = [
    {
      name: 'Test 1 - nanoseconds + CREDIT_CARD',
      body: {
        amount_type: 'CLOSE',
        amount: { currency: 'COP', total_amount: 10000, tip_amount: 0 },
        reference: referencia + '-1',
        description: 'Test ServiYa',
        expiration_date: expNano,
        callback_url: 'https://www.serviyacol.com/pago-exitoso',
        payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
      }
    },
    {
      name: 'Test 2 - ISO date string',
      body: {
        amount_type: 'CLOSE',
        amount: { currency: 'COP', total_amount: 10000, tip_amount: 0 },
        reference: referencia + '-2',
        description: 'Test ServiYa',
        expiration_date: expISO,
        callback_url: 'https://www.serviyacol.com/pago-exitoso',
        payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
      }
    },
    {
      name: 'Test 3 - No expiration, no payment_methods',
      body: {
        amount_type: 'CLOSE',
        amount: { currency: 'COP', total_amount: 10000 },
        reference: referencia + '-3',
        description: 'Test ServiYa',
      }
    },
    {
      name: 'Test 4 - Unix seconds',  
      body: {
        amount_type: 'CLOSE',
        amount: { currency: 'COP', total_amount: 10000, tip_amount: 0 },
        reference: referencia + '-4',
        description: 'Test ServiYa',
        expiration_date: expSeconds,
        callback_url: 'https://www.serviyacol.com/pago-exitoso',
      }
    },
  ];

  for (const test of bodies) {
    console.log(`\n=== ${test.name} ===`);
    console.log('Sending:', JSON.stringify(test.body, null, 2));
    
    try {
      const res = await fetch(`${BOLD_API_URL}/online/link/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `x-api-key ${BOLD_API_KEY}`,
        },
        body: JSON.stringify(test.body),
      });
      
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (res.ok && data.payload?.url) {
        console.log(`✅ SUCCESS! URL: ${data.payload.url}`);
        break; // Found a working format!
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testBold();
