const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function check() {
  const html = await get('https://www.serviyacol.com/solicitar');
  
  if (html.includes('zuihoqkuuvvavgiujymc')) {
    console.log('[HTML] SUPABASE URL FOUND');
  } else {
    console.log('[HTML] SUPABASE URL NOT FOUND');
  }

  if (html.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aWhvcWt1dXZ2YXZnaXVqeW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTYzODAsImV4cCI6MjA5MTc3MjM4MH0.FNSGSAL81aZKH481fFoVFXU9bzSgtTavXJCTXGpdKkU')) {
    console.log('[HTML] EXACT SUPABASE ANON KEY FOUND');
  } else {
    console.log('[HTML] EXACT SUPABASE ANON KEY NOT FOUND');
    // Let's check if the first part exists but the last part is different!
    if (html.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aWhvcWt1dXZ2YXZnaXVqeW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE')) {
      console.log('[HTML] A DIFFERENT SUPABASE ANON KEY WAS FOUND!');
    }
  }

  // extract JS files
  const scripts = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
  console.log('Found JS files:', scripts.length);
  
  for (let script of scripts) {
    if (script.startsWith('/')) script = 'https://www.serviyacol.com' + script;
    const js = await get(script);
    if (js.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      console.log(`[JS] KEY FOUND IN: ${script}`);
      if (js.includes('FNSGSAL81aZKH481fFoVFXU9bzSgtTavXJCTXGpdKkU')) {
         console.log(`[JS] AND IT IS THE CORRECT KEY!`);
      } else {
         console.log(`[JS] BUT IT IS A DIFFERENT KEY AHHH!`);
      }
    }
  }
}

check().catch(console.error);
