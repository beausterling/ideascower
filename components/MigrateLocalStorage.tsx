import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const MigrateLocalStorage: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [migrating, setMigrating] = useState(false);

  const handleMigration = async () => {
    setMigrating(true);
    setStatus('Checking localStorage...');

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
          const data = JSON.parse(localStorage.getItem(key)!);

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
        } catch (error) {
          console.error(`Failed to parse ${key}:`, error);
        }
      }
    }

    if (ideas.length === 0) {
      setStatus('No localStorage ideas found. Nothing to migrate.');
      setMigrating(false);
      return;
    }

    setStatus(`Found ${ideas.length} ideas. Uploading to Supabase...`);

    try {
      const { error } = await supabase
        .from('daily_ideas')
        .upsert(ideas, { onConflict: 'date' });

      if (error) {
        setStatus(`Migration failed: ${error.message}`);
      } else {
        setStatus(`✅ Successfully migrated ${ideas.length} ideas!`);
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setMigrating(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-tower-dark border border-tower-gray p-4 rounded-sm max-w-sm">
      <h3 className="text-white font-mono text-sm mb-2">Migration Tool</h3>
      <button
        onClick={handleMigration}
        disabled={migrating}
        className="bg-tower-accent text-white px-4 py-2 text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
      >
        {migrating ? 'Migrating...' : 'Migrate localStorage to Supabase'}
      </button>
      {status && (
        <p className="text-gray-300 text-xs mt-2">{status}</p>
      )}
    </div>
  );
};

export default MigrateLocalStorage;
