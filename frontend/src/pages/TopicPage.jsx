import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import NoteModal from '../components/NoteModal';
import {
  Search, X, RotateCcw, ChevronDown,
  CheckCircle2, Clock, Filter, ExternalLink,
  ArrowLeft, Trash2, FileText
} from 'lucide-react';

const STATUS_CYCLE = ['To Revise', 'Solved', 'Attempted'];

const TopicPage = () => {
  const { api } = useContext(AuthContext);
  const { topicName } = useParams();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteProblem, setActiveNoteProblem] = useState(null);

  const activeTopic = topicName ? decodeURIComponent(topicName) : '';

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowDiffDropdown(false);
      setShowStatusDropdown(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Toggle problem status
  const toggleStatus = async (e, problemId, currentStatus) => {
    e.stopPropagation();
    const currentIdx = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    setProblems(prev =>
      prev.map(p => p._id === problemId ? { ...p, status: nextStatus } : p)
    );
    try {
      await api.patch(`/problems/${problemId}/status`, { status: nextStatus });
    } catch (err) {
      setProblems(prev =>
        prev.map(p => p._id === problemId ? { ...p, status: currentStatus } : p)
      );
      console.error('Failed to update status:', err);
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

  const filteredProblems = useMemo(() => {
    let result = problems;
    if (activeTopic) {
      result = result.filter(p =>
        (p.customTopics || []).some(t => t.toLowerCase() === activeTopic.toLowerCase()) ||
        (p.leetcodeTags || []).some(t => t.toLowerCase() === activeTopic.toLowerCase())
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.leetcodeTags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (difficultyFilter) {
      result = result.filter(p => p.difficulty === difficultyFilter);
    }
    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter);
    }
    return result;
  }, [problems, activeTopic, searchQuery, difficultyFilter, statusFilter]);

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
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.12)',
      }} />
    );
  };

  const hasActiveFilters = difficultyFilter || statusFilter || searchQuery;

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
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Loading problems...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Topic Header Bar */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17,17,17,0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '20px 48px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            id="topic-back-btn"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{activeTopic}</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
              {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '28px 48px',
        }}
        className="animate-fade-in"
      >
        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            marginBottom: 28,
          }}
          id="topic-filter-bar"
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 220 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.25)',
              }}
            />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="topic-search-input"
              style={{
                width: '100%',
                padding: '10px 36px 10px 40px',
                borderRadius: 10,
                fontSize: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(74,222,128,0.3)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Difficulty Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDiffDropdown(!showDiffDropdown);
                setShowStatusDropdown(false);
              }}
              id="topic-difficulty-filter"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: difficultyFilter ? difficultyColor(difficultyFilter) : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {difficultyFilter || 'Difficulty'}
              <ChevronDown size={14} style={{ opacity: 0.4 }} />
            </button>
            {showDiffDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: '#1e1e1e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: 4,
                  zIndex: 50,
                  minWidth: 140,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}
              >
                {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDifficultyFilter(d === 'All' ? '' : d);
                      setShowDiffDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 14px',
                      fontSize: 14,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: d === 'All' ? 'rgba(255,255,255,0.6)' : difficultyColor(d),
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowDiffDropdown(false);
              }}
              id="topic-status-filter"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {statusFilter || 'Status'}
              <ChevronDown size={14} style={{ opacity: 0.4 }} />
            </button>
            {showStatusDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: '#1e1e1e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: 4,
                  zIndex: 50,
                  minWidth: 140,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}
              >
                {['All', 'To Revise', 'Solved', 'Attempted'].map(s => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilter(s === 'All' ? '' : s);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 14px',
                      fontSize: 14,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setDifficultyFilter(''); setStatusFilter(''); setSearchQuery(''); }}
              id="topic-reset-filters"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(255,55,95,0.06)',
                border: '1px solid rgba(255,55,95,0.15)',
                color: '#FF375F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,55,95,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,55,95,0.06)'}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>

        {/* Problems Table */}
        {filteredProblems.length === 0 ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '64px 24px',
              textAlign: 'center',
            }}
          >
            <Filter size={48} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 500, margin: 0 }}>
              No problems found
            </p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, marginTop: 6 }}>
              Try adjusting your filters or save more problems.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
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
                  {filteredProblems.map((problem, idx) => (
                    <tr
                      key={problem._id}
                      id={`topic-problem-${idx}`}
                      style={{
                        borderBottom:
                          idx < filteredProblems.length - 1
                            ? '1px solid rgba(255,255,255,0.04)'
                            : 'none',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
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
                      <td style={{ padding: '16px 20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                          {idx + 1}. {problem.title}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <a
                          href={problem.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
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
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                          {(problem.leetcodeTags || []).slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500,
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.45)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
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
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: difficultyColor(problem.difficulty) }}>
                          {problem.difficulty || 'Unknown'}
                        </span>
                      </td>
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

export default TopicPage;
