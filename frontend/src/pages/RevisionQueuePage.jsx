import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import NoteModal from '../components/NoteModal';
import { CheckCircle2, FileText } from 'lucide-react';

const RevisionQueuePage = () => {
  const { api } = useContext(AuthContext);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQueueIds, setExpandedQueueIds] = useState(new Set());
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteProblem, setActiveNoteProblem] = useState(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data } = await api.get('/problems/daily-queue');
        setQueue(data);
      } catch (error) {
        console.error('Error fetching daily queue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [api]);

  const handleSaveNote = async (problemId, noteContent) => {
    try {
      await api.patch(`/problems/${problemId}/note`, { note: noteContent });
      setQueue(prev => prev.map(p => p._id === problemId ? { ...p, note: noteContent } : p));
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleReviewFeedback = async (problemId, feedback) => {
    // optimistic UI
    setQueue(prev => prev.filter(p => p._id !== problemId));
    setExpandedQueueIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(problemId);
      return newSet;
    });

    try {
      await api.patch(`/problems/${problemId}/review`, { feedback });
    } catch (err) {
      console.error('Failed to save review feedback', err);
    }
  };

  const difficultyColor = (d) => {
    if (d === 'Easy') return '#00B8A3';
    if (d === 'Medium') return '#FFC01E';
    if (d === 'Hard') return '#FF375F';
    return '#666';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.08)',
              borderTopColor: '#4ADE80',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Loading your queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '48px' }}
        className="animate-fade-in"
      >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 8 }}>
            Daily Revision Queue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0 }}>
            Tackle these problems today to optimize your spaced repetition.
          </p>
        </div>

        {queue.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '64px 24px', textAlign: 'center',
          }}>
            <CheckCircle2 size={48} style={{ color: '#4ADE80', marginBottom: 16, opacity: 0.8, display: 'inline-block' }} />
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>All caught up for today!</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
              Check back tomorrow for more review problems, or keep saving new ones.
            </p>
          </div>
        ) : (
          <div style={{
            background: '#161616', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col />
                  <col style={{ width: 72 }} />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 240 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Title', 'Link', 'Tags', 'Difficulty', 'Notes', 'Action'].map((h, i) => (
                      <th
                        key={h || `col-${i}`}
                        style={{
                          padding: '14px 20px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.25)',
                          textAlign: (i === 1 || i === 4 || i === 5) ? 'center' : 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((qProb, idx) => {
                    const isExpanded = expandedQueueIds.has(qProb._id);
                    return (
                      <tr
                        key={qProb._id}
                        style={{
                          borderBottom: idx < queue.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Title */}
                        <td style={{ padding: '16px 20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                            {idx + 1}. {qProb.title}
                          </span>
                        </td>

                        {/* Link */}
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <a
                            href={qProb.leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open on LeetCode"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              color: 'rgba(255,255,255,0.25)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(74,222,128,0.1)';
                              e.currentTarget.style.color = '#4ADE80';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                          </a>
                        </td>

                        {/* Tags */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                            {(qProb.leetcodeTags || []).slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                style={{
                                  display: 'inline-block', padding: '4px 10px', borderRadius: 6,
                                  fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.06)',
                                  color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.04)',
                                  whiteSpace: 'nowrap', flexShrink: 0,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {(qProb.leetcodeTags || []).length > 2 && (
                              <span style={{
                                display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                                fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.03)',
                                color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', flexShrink: 0,
                              }}>
                                +{qProb.leetcodeTags.length - 2}
                              </span>
                            )}
                            {(!qProb.leetcodeTags || qProb.leetcodeTags.length === 0) && (
                              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: difficultyColor(qProb.difficulty) }}>
                            {qProb.difficulty || 'Unknown'}
                          </span>
                        </td>

                        {/* Notes */}
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveNoteProblem(qProb);
                              setNoteModalOpen(true);
                            }}
                            title="Add/Edit Notes"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: qProb.note ? 'rgba(74,222,128,0.1)' : 'transparent',
                              border: 'none',
                              color: qProb.note ? '#4ADE80' : 'rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = qProb.note ? 'rgba(74,222,128,0.1)' : 'transparent';
                              e.currentTarget.style.color = qProb.note ? '#4ADE80' : 'rgba(255,255,255,0.2)';
                            }}
                          >
                            <FileText size={16} />
                          </button>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          {!isExpanded ? (
                            <button
                              onClick={() => setExpandedQueueIds(prev => new Set(prev).add(qProb._id))}
                              style={{
                                width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                                background: 'rgba(74,222,128,0.15)', color: '#4ADE80', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.25)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
                            >
                              Mark Complete
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, animation: 'fade-in 0.2s ease' }}>
                              <button
                                onClick={() => handleReviewFeedback(qProb._id, 'Hard')}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(255,55,95,0.15)', color: '#FF375F', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,55,95,0.25)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,55,95,0.15)'}
                              >Hard</button>
                              <button
                                onClick={() => handleReviewFeedback(qProb._id, 'Good')}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(255,192,30,0.15)', color: '#FFC01E', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,192,30,0.25)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,192,30,0.15)'}
                              >Good</button>
                              <button
                                onClick={() => handleReviewFeedback(qProb._id, 'Easy')}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(74,222,128,0.15)', color: '#4ADE80', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.25)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
                              >Easy</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setActiveNoteProblem(null);
        }}
        problem={activeNoteProblem}
        onSave={handleSaveNote}
      />
    </div>
  );
};

export default RevisionQueuePage;
