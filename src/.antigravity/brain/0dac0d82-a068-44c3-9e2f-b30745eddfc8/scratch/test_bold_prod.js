// Test Bold PRODUCTION API - run with: node test_bold_prod.js
const BOLD_API_KEY = 'AVzRFjr5uXaZD9cVyvwFCQ';  // Llave secreta de producción
const BOLD_API_URL = 'https://integrations.api.bold.co';

async function testBoldProd() {
  const referencia = `SY-PROD-TEST-${Date.now()}`;

  const boldBody = {
    amount_type: 'CLOSE',
    amount: {
      currency: 'COP',
      total_amount: 1000,  // mínimo $1.000
    },
    reference: referencia,
    description: 'ServiYa: Prueba de integración',
    callback_url: 'https://www.serviyacol.com/pago-exitoso',
    payment_methods: [
      'CREDIT_CARD',
      'DEBIT_CARD',
      'PSE',
      'NEQUI',
      'BOTON_BANCOLOMBIA',
      'DAVIPLATA',
      'EFECTY',
    ],
  };

  console.log('=== Test Bold PRODUCCIÓN ===');
  console.log('API Key:', BOLD_API_KEY);
  console.log('Sending:', JSON.stringify(boldBody, null, 2));

  try {
    const res = await fetch(`${BOLD_API_URL}/online/link/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${BOLD_API_KEY}`,
      },
      body: JSON.stringify(boldBody),
    });

    const data = await res.json();
    console.log(`\nStatus: ${res.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok && data.payload?.url) {
      console.log('\n✅ ¡ÉXITO! Link de pago generado:');
      console.log(data.payload.url);
    } else {
      console.log('\n❌ Error al crear el link');
    }
  } catch (err) {
    console.error('Error de red:', err.message);
  }
}

testBoldProd();
