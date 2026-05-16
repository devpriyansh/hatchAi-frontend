import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';

const BACKEND_URL = 'https://hatchai-backend.onrender.com';

export default function CodeEditor({ selectedFile }) {
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef(null);

  // Fetch file content when selectedFile changes
  useEffect(() => {
    if (!selectedFile) return;

    let cancelled = false;
    const fetchFile = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/files/content`, {
          params: { path: selectedFile }
        });
        if (!cancelled) setCode(res.data.content);
      } catch (error) {
        console.error('Error fetching file:', error);
      }
    };

    fetchFile();
    return () => { cancelled = true; };
  }, [selectedFile]);

  // Debounced save
  const debouncedSave = useCallback((newValue) => {
    if (!selectedFile) return;

    setCode(newValue);
    setIsSaving(true);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/files/write`, {
          filePath: selectedFile,
          content: newValue
        });
        setIsSaving(false);
      } catch (error) {
        console.error('Save failed:', error);
        setIsSaving(false);
      }
    }, 800);
  }, [selectedFile]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  if (!selectedFile) {
    return (
      <div className="editor-placeholder">
        <span className="editor-placeholder-icon">📂</span>
        <p>Select a file to start editing</p>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-topbar">
        <span className="editor-filename">{selectedFile}</span>
        {isSaving && <span className="editor-saving">Saving...</span>}
      </div>
      <MonacoEditor
        height="calc(100% - 36px)"
        theme="vs-dark"
        path={selectedFile}
        value={code}
        onChange={debouncedSave}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}