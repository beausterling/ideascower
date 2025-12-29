// IdeasCower localStorage to Supabase Migration Script
// Run this in your browser console while on your app

async function migrateLocalStorageToSupabase() {
  console.log('🚀 Starting localStorage migration to Supabase...\n');

  const STORAGE_PREFIX = 'ideascower_idea_';
  const LAUNCH_DATE = new Date('2025-12-13T00:00:00Z').getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const ideas = [];

  // Extract all ideas from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const dateStr = key.replace(STORAGE_PREFIX, '');
        const data = JSON.parse(localStorage.getItem(key));

        // Calculate issue number
        const targetDate = new Date(dateStr);
        const issueNumber = Math.max(
          1,
          Math.floor((targetDate.getTime() - LAUNCH_DATE) / MS_PER_DAY) + 1
        );

        ideas.push({
          date: dateStr,
          issue_number: issueNumber,
          title: data.title,
          pitch: data.pitch,
          fatal_flaw: data.fatalFlaw,
          verdict: data.verdict,
        });

        console.log(`✓ Extracted: ${dateStr} - ${data.title}`);
      } catch (error) {
        console.error(`✗ Failed to parse ${key}:`, error);
      }
    }
  }

  console.log(`\n📊 Found ${ideas.length} ideas to migrate\n`);

  if (ideas.length === 0) {
    console.log('✨ No ideas found in localStorage. Migration complete!');
    return;
  }

  // Get Supabase credentials from environment or prompt user
  // These should be set in your .env file or passed when running the script
  const supabaseUrl = process.env.VITE_SUPABASE_URL || prompt('Enter your Supabase URL:');
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || prompt('Enter your Supabase Anon Key:');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return;
  }

  // Create Supabase client
  const { createClient } = window.supabase || {};

  if (!createClient) {
    console.error('❌ Supabase client not found. Make sure you are running this on your app page.');
    console.log('\n💡 Alternative: Run this command to load Supabase:');
    console.log('   const script = document.createElement("script");');
    console.log('   script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";');
    console.log('   document.head.appendChild(script);');
    return;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);

  console.log('📤 Uploading ideas to Supabase...\n');

  try {
    const { data, error } = await client
      .from('daily_ideas')
      .upsert(ideas, { onConflict: 'date' });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log(`\n✅ Successfully migrated ${ideas.length} ideas to Supabase!`);
    console.log('\n🗑️  You can now clear localStorage if you want:');
    console.log('   localStorage.clear()');
    console.log('\nOr keep it as a backup.');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run the migration
migrateLocalStorageToSupabase();
