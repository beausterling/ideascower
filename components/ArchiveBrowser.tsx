import React, { useEffect, useState } from 'react';
import { getIdeaArchive, DailyIdea } from '../services/supabaseService';
import { ArchiveBoxIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const ArchiveBrowser: React.FC = () => {
  const [ideas, setIdeas] = useState<DailyIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<DailyIdea | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const { ideas: data, total: count } = await getIdeaArchive(
          ITEMS_PER_PAGE,
          page * ITEMS_PER_PAGE
        );
        setIdeas(data);
        setTotal(count || 0);
      } catch (error) {
        console.error('Failed to fetch archive:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchive();
  }, [page]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-t-transparent border-tower-neon rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-lg text-tower-neon">Loading archive...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-white mb-3 flex items-center justify-center gap-3">
          <ArchiveBoxIcon className="w-10 h-10 text-tower-neon" />
          The Archive
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Browse {total} failed ideas from the past
        </p>
      </div>

      {selectedIdea ? (
        <div className="border border-tower-gray bg-tower-dark p-8 relative">
          <button
            onClick={() => setSelectedIdea(null)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white font-mono text-sm"
          >
            Close
          </button>

          <div className="flex items-center gap-3 mb-6 text-gray-400">
            <CalendarDaysIcon className="w-5 h-5" />
            <span className="font-mono text-sm">
              Issue #{selectedIdea.issue_number} - {new Date(selectedIdea.date).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-4xl font-serif text-white mb-6">{selectedIdea.title}</h1>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-mono text-sm uppercase text-tower-neon mb-3">The Pitch</h3>
              <p className="text-gray-300 leading-relaxed">{selectedIdea.pitch}</p>
            </div>
            <div>
              <h3 className="font-mono text-sm uppercase text-tower-accent mb-3">The Fatal Flaw</h3>
              <p className="text-gray-300 leading-relaxed">{selectedIdea.fatal_flaw}</p>
            </div>
          </div>

          <div className="border-t border-tower-gray pt-6">
            <p className="font-mono italic text-lg text-tower-accent text-center">
              "{selectedIdea.verdict}"
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-8">
            {ideas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className="border border-tower-gray bg-tower-dark hover:bg-tower-gray p-6 text-left transition group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-serif text-white group-hover:text-tower-neon transition">
                    {idea.title}
                  </h3>
                  <span className="text-xs font-mono text-gray-500">
                    Issue #{idea.issue_number}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{idea.pitch}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-tower-accent font-mono">
                    {new Date(idea.date).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-600 group-hover:text-white transition">
                    Click to read →
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-6 py-2 border border-tower-gray text-white disabled:opacity-30 hover:bg-tower-gray transition"
            >
              Previous
            </button>
            <span className="px-6 py-2 font-mono text-gray-400">
              Page {page + 1} of {Math.ceil(total / ITEMS_PER_PAGE) || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * ITEMS_PER_PAGE >= total}
              className="px-6 py-2 border border-tower-gray text-white disabled:opacity-30 hover:bg-tower-gray transition"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ArchiveBrowser;
