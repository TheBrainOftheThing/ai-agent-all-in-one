const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Setting up Supabase tables...');
  
  // We can't create tables directly via JS client without SQL access
  // But we can try to insert into them to see if they exist
  // Usually the user does this via SQL Editor
  
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      role TEXT,
      content TEXT,
      model_id TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_status (
      id BIGSERIAL PRIMARY KEY,
      model_name TEXT UNIQUE,
      status TEXT,
      health TEXT,
      last_active TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO agent_status (model_name, status, health) 
    VALUES 
      ('Gemini 1.5', 'Online', 'Healthy'),
      ('Claude 3.5', 'Online', 'Healthy'),
      ('GPT-4o', 'Online', 'Healthy'),
      ('DeepSeek', 'Online', 'Healthy'),
      ('Mistral', 'Online', 'Healthy'),
      ('Kimi 2.5', 'Online', 'Healthy')
    ON CONFLICT (model_name) DO NOTHING;
  `);
}

setup();
