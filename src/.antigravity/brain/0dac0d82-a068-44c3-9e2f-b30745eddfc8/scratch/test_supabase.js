const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zuihoqkuuvvavgiujymc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aWhvcWt1dXZ2YXZnaXVqeW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTYzODAsImV4cCI6MjA5MTc3MjM4MH0.FNSGSAL81aZKH481fFoVFXU9bzSgtTavXJCTXGpdKkU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('solicitudes').insert([{
    cliente_nombre: 'Test Model',
    cliente_telefono: '1234567890',
    ciudad: 'Bogotá',
    categoria: 'Plomería',
    descripcion: 'Test from script',
    estado: 'pendiente'
  }]);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
