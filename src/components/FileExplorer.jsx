import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function FileExplorer({ onSelectFile, selectedFile }) {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const response = await api.get('/files');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderTree = (items, parentPath = '') => {
    return items.map(item => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isExpanded = expandedFolders[fullPath] ?? false;

      if (item.type === 'folder') {
        return (
          <div key={fullPath} className="file-tree-folder">
            <div
              className="folder-header"
              onClick={() => toggleFolder(fullPath)}
            >
              <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
              <span className="folder-name">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div className="folder-children">
                {renderTree(item.children, fullPath)}
              </div>
            )}
          </div>
        );
      }

      // file
      return (
        <div
          key={fullPath}
          className={`file-item ${selectedFile === fullPath ? 'file-item--active' : ''}`}
          onClick={() => onSelectFile(fullPath)}
        >
          <span className="file-icon">📄</span>
          <span className="file-name">{item.name}</span>
        </div>
      );
    });
  };

  return (
    <div className="file-explorer">
      <h2 className="explorer-title">Explorer</h2>
      <div className="file-tree">{renderTree(files)}</div>
    </div>
  );
}