import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Need service role key for write access
);

// Generate all dates from Dec 13 to Dec 22 (10 ideas total)
const startDate = new Date('2025-12-13');
const endDate = new Date('2025-12-22');
const dates = [];

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  dates.push(d.toISOString().split('T')[0]);
}

console.log(`Recovering ${dates.length} ideas from ${dates[0]} to ${dates[dates.length - 1]}...\n`);

for (const date of dates) {
  console.log(`Generating idea for ${date}...`);

  const { data, error } = await supabase.functions.invoke('generate-daily-idea', {
    body: { targetDate: date }
  });

  if (error) {
    console.error(`❌ Error generating ${date}:`, error);
  } else {
    console.log(`✅ Generated idea for ${date}: "${data.title}"`);
  }
}

console.log('\n✅ Recovery complete! Verifying...');

// Verify all ideas were created
const { data: ideas, error: fetchError } = await supabase
  .from('ideas')
  .select('date, title')
  .order('date', { ascending: true });

if (fetchError) {
  console.error('Error fetching ideas:', fetchError);
} else {
  console.log(`\n📊 Total ideas in database: ${ideas.length}`);
  ideas.forEach((idea, index) => {
    console.log(`  Issue #${index + 1} (${idea.date}): ${idea.title}`);
  });
}
