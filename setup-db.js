const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Setting up Supabase tables...');
  
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log(`
    -- 1. Enable pgvector
    CREATE EXTENSION IF NOT EXISTS vector;

    -- 2. Create Messages Table
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      role TEXT,
      content TEXT,
      model_id TEXT
    );

    -- 3. Create Documents Table for Vector Memory
    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      content TEXT,
      embedding VECTOR(1536)
    );

    -- 4. Create Match Function for Search
    CREATE OR REPLACE FUNCTION match_documents (
      query_embedding VECTOR(1536),
      match_threshold FLOAT,
      match_count INT
    ) RETURNS TABLE (
      id BIGINT,
      content TEXT,
      similarity FLOAT
    ) LANGUAGE plpgsql AS $$
    BEGIN
      RETURN QUERY
      SELECT
        documents.id,
        documents.content,
        1 - (documents.embedding <=> query_embedding) AS similarity
      FROM documents
      WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
      ORDER BY documents.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;

    -- 5. Create Status Table
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
