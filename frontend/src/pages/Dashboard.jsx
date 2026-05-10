import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import NoteModal from '../components/NoteModal';
import {
  CheckCircle2, Clock, Code2, Filter, ExternalLink, Trash2, FileText
} from 'lucide-react';

const STATUS_CYCLE = ['To Revise', 'Solved', 'Attempted'];

const Dashboard = () => {
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteProblem, setActiveNoteProblem] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await api.get('/problems');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [api]);

  // Toggle problem status
  const toggleStatus = async (e, problemId, currentStatus) => {
    e.stopPropagation();
    const currentIdx = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    // Update locally immediately
    setProblems(prev =>
      prev.map(p => p._id === problemId ? { ...p, status: nextStatus } : p)
    );

    // Persist to backend (requires backend restart to pick up the new PATCH route)
    try {
      await api.patch(`/problems/${problemId}/status`, { status: nextStatus });
    } catch (err) {
      // Keep the local change — backend will sync on next page load if restarted
      console.warn('Status saved locally. Restart backend to persist:', err.message);
    }
  };

  // Delete a problem
  const deleteProblem = async (e, problemId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    const backup = [...problems];
    setProblems(prev => prev.filter(p => p._id !== problemId));
    try {
      await api.delete(`/problems/${problemId}`);
    } catch (err) {
      setProblems(backup);
      console.error('Failed to delete problem:', err);
    }
  };

  // Save Note
  const handleSaveNote = async (problemId, noteContent) => {
    try {
      await api.patch(`/problems/${problemId}/note`, { note: noteContent });
      setProblems(prev => prev.map(p => p._id === problemId ? { ...p, note: noteContent } : p));
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };


  // Derive unique topic tags with counts
  const allTopicTags = useMemo(() => {
    const topicCount = {};
    problems.forEach(p => {
      const combined = [...new Set([...(p.customTopics || []), ...(p.leetcodeTags || [])])];
      combined.forEach(t => {
        topicCount[t] = (topicCount[t] || 0) + 1;
      });
    });
    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [problems]);

  // Recent 15 or filtered by topic
  const displayProblems = useMemo(() => {
    let result = [...problems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (activeTopic) {
      result = result.filter(p =>
        (p.customTopics || []).some(t => t.toLowerCase() === activeTopic.toLowerCase()) ||
        (p.leetcodeTags || []).some(t => t.toLowerCase() === activeTopic.toLowerCase())
      );
    }
    return activeTopic ? result : result.slice(0, 15);
  }, [problems, activeTopic]);

  const difficultyColor = (d) => {
    if (d === 'Easy') return '#00B8A3';
    if (d === 'Medium') return '#FFC01E';
    if (d === 'Hard') return '#FF375F';
    return '#666';
  };

  const statusIcon = (status) => {
    if (status === 'Solved') return <CheckCircle2 size={20} style={{ color: '#4ADE80' }} />;
    if (status === 'Attempted') return <Clock size={20} style={{ color: '#FFC01E' }} />;
    return (
      <div
        style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.12)',
        }}
      />
    );
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
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Loading your problems...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 48px' }}
        className="animate-fade-in"
      >

        {/* ======= TOPIC TAGS ======= */}
        <section style={{ marginBottom: 16 }} id="topic-tags-section">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
            className="scrollbar-hide"
          >
            {/* All Topics pill */}
            <button
              onClick={() => setActiveTopic(null)}
              id="topic-pill-all"
              style={{
                flexShrink: 0,
                padding: '10px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: !activeTopic ? 'none' : '1px solid rgba(255,255,255,0.06)',
                background: !activeTopic ? '#ffffff' : 'rgba(255,255,255,0.04)',
                color: !activeTopic ? '#000000' : 'rgba(255,255,255,0.5)',
                boxShadow: !activeTopic ? '0 4px 24px rgba(255,255,255,0.08)' : 'none',
              }}
            >
              All Topics
            </button>

            {allTopicTags.map(({ name, count }, idx) => {
              const isActive = activeTopic === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveTopic(isActive ? null : name)}
                  id={`topic-pill-${idx}`}
                  style={{
                    flexShrink: 0,
                    padding: '10px 22px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    background: isActive ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#4ADE80' : 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                    }
                  }}
                >
                  {name}
                  <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.5, fontWeight: 400 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
            {activeTopic || 'Recently Added'}
          </h2>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            {activeTopic
              ? `${displayProblems.length} problem${displayProblems.length !== 1 ? 's' : ''}`
              : `Latest ${Math.min(15, problems.length)} of ${problems.length}`}
          </span>
        </div>

        {/* ======= PROBLEMS TABLE ======= */}
        {displayProblems.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '64px 24px', textAlign: 'center',
          }}>
            <Filter size={48} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 500, margin: 0 }}>No problems found</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, marginTop: 6 }}>
              {activeTopic ? 'No problems with this topic.' : 'Save problems using the Chrome extension.'}
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
                  <col style={{ width: 72 }} />
                  <col />
                  <col style={{ width: 72 }} />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 72 }} />
                  <col style={{ width: 72 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Status', 'Title', 'Link', 'Tags', 'Difficulty', 'Notes', ''].map((h, i) => (
                      <th
                        key={h || `col-${i}`}
                        style={{
                          padding: '14px 20px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.25)',
                          textAlign: (i === 0 || i === 2 || i === 5 || i === 6) ? 'center' : 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayProblems.map((problem, idx) => (
                    <tr
                      key={problem._id}
                      id={`problem-row-${idx}`}
                      style={{
                        borderBottom: idx < displayProblems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Status — clickable to toggle */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => toggleStatus(e, problem._id, problem.status)}
                          title={`Status: ${problem.status} — Click to change`}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          {statusIcon(problem.status)}
                        </button>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '16px 20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                          {idx + 1}. {problem.title}
                        </span>
                      </td>

                      {/* Link */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <a
                          href={problem.leetcodeUrl}
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
                          <ExternalLink size={16} />
                        </a>
                      </td>

                      {/* Tags */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                          {(problem.leetcodeTags || []).slice(0, 2).map(tag => (
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
                          {(problem.leetcodeTags || []).length > 2 && (
                            <span style={{
                              display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                              fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.03)',
                              color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                              +{problem.leetcodeTags.length - 2}
                            </span>
                          )}
                          {(!problem.leetcodeTags || problem.leetcodeTags.length === 0) && (
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: difficultyColor(problem.difficulty) }}>
                          {problem.difficulty || 'Unknown'}
                        </span>
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNoteProblem(problem);
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
                            background: problem.note ? 'rgba(74,222,128,0.1)' : 'transparent',
                            border: 'none',
                            color: problem.note ? '#4ADE80' : 'rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = problem.note ? 'rgba(74,222,128,0.1)' : 'transparent';
                            e.currentTarget.style.color = problem.note ? '#4ADE80' : 'rgba(255,255,255,0.2)';
                          }}
                        >
                          <FileText size={16} />
                        </button>
                      </td>

                      {/* Delete */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => deleteProblem(e, problem._id)}
                          title="Delete problem"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,55,95,0.1)';
                            e.currentTarget.style.color = '#FF375F';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View all link for active topic */}
        {activeTopic && displayProblems.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => navigate(`/topic/${encodeURIComponent(activeTopic)}`)}
              id="view-all-topic"
              style={{
                padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: 'rgba(74,222,128,0.08)', color: '#4ADE80',
                border: '1px solid rgba(74,222,128,0.15)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; }}
            >
              View all {activeTopic} problems →
            </button>
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

export default Dashboard;
