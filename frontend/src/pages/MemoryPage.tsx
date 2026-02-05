import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, FileText, Save, X } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { getMemoryFiles, readFile, writeFile } from '@/api';
import { toast } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

interface MemoryEntry {
  path: string;
  name: string;
  date: string | null;
  preview: string | null;
  size: number;
}

export default function MemoryPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memory-files'],
    queryFn: getMemoryFiles,
  });

  const { data: fileData, isLoading: fileLoading } = useQuery({
    queryKey: ['memory-file', selectedFile],
    queryFn: () => readFile(selectedFile!),
    enabled: !!selectedFile,
  });

  const saveMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      writeFile(path, content),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['memory-files'] });
      queryClient.invalidateQueries({ queryKey: ['memory-file', selectedFile] });
      toast.success('File saved successfully');
    },
    onError: () => {
      toast.error('Failed to save file');
    },
  });

  const handleSelectFile = (path: string) => {
    if (hasChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    setSelectedFile(path);
    setHasChanges(false);
  };

  const handleContentChange = (value: string | undefined) => {
    const newValue = value || '';
    setEditContent(newValue);
    setHasChanges(newValue !== fileData?.content);
  };

  const handleSave = () => {
    if (selectedFile) {
      saveMutation.mutate({ path: selectedFile, content: editContent });
    }
  };

  // Update edit content when file loads
  if (fileData?.content && editContent !== fileData.content && !hasChanges) {
    setEditContent(fileData.content);
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="text-purple-400" />
          Memory
        </h1>
        <p className="text-slate-400 mt-1">
          Browse and edit Figgy's memory files
        </p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* File list */}
        <div className="col-span-4 flex flex-col rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Memory Files</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700 rounded-xl" />
                ))}
              </div>
            ) : memories?.length === 0 ? (
              <p className="text-slate-400">No memory files yet</p>
            ) : (
              <div className="space-y-2">
                {memories?.map((entry: MemoryEntry) => (
                  <button
                    key={entry.path}
                    onClick={() => handleSelectFile(entry.path)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedFile === entry.path
                        ? 'bg-emerald-600'
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {entry.path === 'MEMORY.md' ? (
                        <Brain size={16} className="text-purple-400" />
                      ) : (
                        <FileText size={16} className="text-blue-400" />
                      )}
                      <span className="font-medium text-white">{entry.name}</span>
                    </div>
                    {entry.preview && (
                      <p className="text-xs text-slate-400 truncate">
                        {entry.preview}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {formatBytes(entry.size)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-8 flex flex-col rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {selectedFile || 'Select a file'}
            </h2>
            {selectedFile && (
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-sm text-amber-400 font-mono">
                    Unsaved changes
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setHasChanges(false);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saveMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0" data-color-mode="dark">
            {!selectedFile ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Select a memory file to view or edit
              </div>
            ) : fileLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : (
              <MDEditor
                value={editContent}
                onChange={handleContentChange}
                height="100%"
                preview="live"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
