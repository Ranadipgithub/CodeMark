import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { X, Save, Check, Eye, Columns, Edit2 } from 'lucide-react';

const NoteModal = ({ isOpen, onClose, problem, onSave }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState('live'); // 'edit', 'live', 'preview'

  useEffect(() => {
    if (isOpen && problem) {
      setNote(problem.note || '');
      setSaved(false);
      // Default to preview (view mode) if they already have notes
      if (problem.note) {
        setViewMode('preview');
      } else {
        setViewMode('live');
      }
    }
  }, [isOpen, problem]);

  if (!isOpen || !problem) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(problem._id, note);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET';
    
    if (cloudName === 'YOUR_CLOUD_NAME' || uploadPreset === 'YOUR_UPLOAD_PRESET') {
      alert("Please configure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your frontend .env file to enable image uploads.");
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Cloudinary upload error:', data);
        alert(`Cloudinary Error: ${data.error?.message || 'Failed to upload image. Please check your upload preset.'}`);
        return null;
      }
      
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const textarea = document.querySelector('.w-md-editor-text-input');
    const startPos = textarea ? textarea.selectionStart : note.length;
    
    const uniqueId = Math.random().toString(36).substring(7);
    const placeholder = `![Uploading image... ${uniqueId}]()`;
    
    setNote((prev) => {
      const currentNote = prev || '';
      if (textarea) {
        return currentNote.substring(0, startPos) + placeholder + currentNote.substring(textarea.selectionEnd);
      }
      return currentNote + `\n${placeholder}\n`;
    });
    
    const imageUrl = await uploadImageToCloudinary(file);
    
    if (imageUrl) {
      const finalMarkdown = `![image](${imageUrl})`;
      setNote((prev) => {
        const currentNote = prev || '';
        return currentNote.replace(placeholder, finalMarkdown);
      });
    } else {
      setNote((prev) => {
        const currentNote = prev || '';
        return currentNote.replace(placeholder, '');
      });
    }
  };

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        event.preventDefault();
        event.stopPropagation();
        const file = items[i].getAsFile();
        await handleImageUpload(file);
        break;
      }
    }
  };

  const handleDrop = async (event) => {
    const items = event.dataTransfer?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        event.preventDefault();
        event.stopPropagation();
        const file = items[i].getAsFile();
        await handleImageUpload(file);
        break;
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      className="animate-fade-in"
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          height: '90vh',
          backgroundColor: '#161616',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .custom-md-editor {
            --color-canvas-default: #161616 !important;
            --color-canvas-subtle: #161616 !important;
            --color-border-default: rgba(255,255,255,0.06) !important;
            background-color: #161616 !important;
          }
          .custom-md-editor .w-md-editor-toolbar {
            background-color: #161616 !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 8px 12px !important;
          }
          .custom-md-editor .w-md-editor-toolbar li > button {
            padding: 6px 8px !important;
            height: auto !important;
            color: rgba(255,255,255,0.7) !important;
          }
          .custom-md-editor .w-md-editor-toolbar svg {
            width: 17px !important;
            height: 17px !important;
          }
          .custom-md-editor .w-md-editor-text-input,
          .custom-md-editor .w-md-editor-text-pre,
          .custom-md-editor .w-md-editor-text-pre > code {
            font-size: 16px !important;
            line-height: 1.6 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
          .custom-md-editor .wmde-markdown {
            font-size: 16px !important;
            line-height: 1.6 !important;
            background-color: #161616 !important;
          }
          .custom-md-editor .w-md-editor-content {
            background-color: #161616 !important;
          }
          .custom-md-editor .wmde-markdown ul {
            list-style-type: disc !important;
            padding-left: 1.5em !important;
          }
          .custom-md-editor .wmde-markdown ol {
            list-style-type: decimal !important;
            padding-left: 1.5em !important;
          }
        `}</style>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#111111'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' }}>
              {problem.title}
            </h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setViewMode('preview')}
                style={{
                  background: viewMode === 'preview' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', color: viewMode === 'preview' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if(viewMode !== 'preview') e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { if(viewMode !== 'preview') e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => setViewMode('live')}
                style={{
                  background: viewMode === 'live' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', color: viewMode === 'live' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if(viewMode !== 'live') e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { if(viewMode !== 'live') e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <Columns size={14} /> Split
              </button>
              <button
                onClick={() => setViewMode('edit')}
                style={{
                  background: viewMode === 'edit' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', color: viewMode === 'edit' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if(viewMode !== 'edit') e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { if(viewMode !== 'edit') e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <Edit2 size={14} /> Edit
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                backgroundColor: saved ? 'rgba(74,222,128,0.1)' : '#238636',
                color: saved ? '#4ADE80' : '#ffffff',
                border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Notes'}
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#161616', minHeight: 0, overflow: 'hidden' }}>
          <div data-color-mode="dark" style={{ height: '100%', width: '100%' }} className="custom-md-editor">
            <MDEditor
              value={note}
              onChange={setNote}
              preview={viewMode}
              height="100%"
              visibleDragbar={false}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              style={{ borderRadius: 0, border: 'none', height: '100%', backgroundColor: '#161616' }}
              textareaProps={{
                placeholder: 'Start typing your solution here... You can use Markdown, paste images, or write code blocks.',
                onPaste: handlePaste,
                onDrop: handleDrop,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
