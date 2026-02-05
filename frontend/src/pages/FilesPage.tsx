import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Folder,
  FileText,
  ChevronRight,
  Home,
  Plus,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { listFiles, readFile, writeFile, deleteFile } from '@/api';
import { toast } from '@/stores/notificationStore';

interface FileListItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  modified: string | null;
}

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);

  const { data: filesData, isLoading } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => listFiles(currentPath),
  });

  const { data: fileContent, isLoading: fileLoading } = useQuery({
    queryKey: ['file-content', selectedFile],
    queryFn: () => readFile(selectedFile!),
    enabled: !!selectedFile,
  });

  const saveMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      writeFile(path, content),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file-content', selectedFile] });
      toast.success('File saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteFile(path),
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const createMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      writeFile(path, content),
    onSuccess: (_, variables) => {
      setShowNewFile(false);
      setNewFileName('');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setSelectedFile(variables.path);
      toast.success('File created');
    },
    onError: () => toast.error('Failed to create'),
  });

  const handleNavigate = (item: FileListItem) => {
    if (item.is_dir) {
      setCurrentPath(item.path);
      setSelectedFile(null);
    } else {
      setSelectedFile(item.path);
      setHasChanges(false);
    }
  };

  const handleGoUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSelectedFile(null);
  };

  const handleContentChange = (value: string | undefined) => {
    const newValue = value || '';
    setEditContent(newValue);
    setHasChanges(newValue !== fileContent?.content);
  };

  const handleSave = () => {
    if (selectedFile) {
      saveMutation.mutate({ path: selectedFile, content: editContent });
    }
  };

  const handleDelete = () => {
    if (selectedFile && confirm('Delete this file?')) {
      deleteMutation.mutate(selectedFile);
    }
  };

  const handleCreateFile = () => {
    if (!newFileName) return;
    const path = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    createMutation.mutate({ path, content: '' });
  };

  if (fileContent?.content !== undefined && editContent !== fileContent.content && !hasChanges) {
    setEditContent(fileContent.content);
  }

  const pathParts = currentPath.split('/').filter(Boolean);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Folder className="text-amber-400" />
          Files
        </h1>
        <p className="text-slate-400 mt-1">Browse and edit workspace files</p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* File browser */}
        <div className="col-span-4 flex flex-col rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">Workspace</h2>
            <button
              onClick={() => setShowNewFile(true)}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
              <button
                onClick={() => { setCurrentPath(''); setSelectedFile(null); }}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                <Home size={14} />
              </button>
              {pathParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-slate-500" />
                  <button
                    onClick={() => { setCurrentPath(pathParts.slice(0, i + 1).join('/')); setSelectedFile(null); }}
                    className="text-slate-400 hover:text-white"
                  >
                    {part}
                  </button>
                </span>
              ))}
            </div>

            {/* New file input */}
            {showNewFile && (
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.md"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white"
                  autoFocus
                />
                <button onClick={handleCreateFile} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-sm">Create</button>
                <button onClick={() => { setShowNewFile(false); setNewFileName(''); }} className="p-1">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            )}

            {/* File list */}
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-700 rounded" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {currentPath && (
                  <button onClick={handleGoUp} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700 text-slate-400">
                    <Folder size={16} />
                    <span>..</span>
                  </button>
                )}
                {filesData?.items?.map((item: FileListItem) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      selectedFile === item.path ? 'bg-emerald-600' : 'hover:bg-slate-700'
                    }`}
                  >
                    {item.is_dir ? (
                      <Folder size={16} className="text-amber-400" />
                    ) : (
                      <FileText size={16} className="text-blue-400" />
                    )}
                    <span className="flex-1 text-left truncate text-white">{item.name}</span>
                    {!item.is_dir && item.size !== null && (
                      <span className="text-xs text-slate-500">{formatBytes(item.size)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-8 flex flex-col rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white truncate">{selectedFile || 'Select a file'}</h2>
            {selectedFile && (
              <div className="flex items-center gap-2">
                {hasChanges && <span className="text-sm text-amber-400 font-mono">Unsaved</span>}
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="p-2 hover:bg-red-600/20 rounded-lg">
                  <Trash2 size={16} className="text-red-400" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saveMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0" data-color-mode="dark">
            {!selectedFile ? (
              <div className="h-full flex items-center justify-center text-slate-400">Select a file</div>
            ) : fileLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : (
              <MDEditor value={editContent} onChange={handleContentChange} height="100%" preview="live" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
