import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RefreshCw, Sparkles } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { getSoul, updateSoul } from '@/api';
import { toast } from '@/stores/notificationStore';

export default function SoulPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['soul'],
    queryFn: getSoul,
  });

  // Log errors for debugging
  if (error) {
    console.error('Soul fetch error:', error);
  }

  const mutation = useMutation({
    mutationFn: (newContent: string) => updateSoul(newContent),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['soul'] });
      toast.success('SOUL.md saved successfully');
    },
    onError: () => {
      toast.error('Failed to save SOUL.md');
    },
  });

  useEffect(() => {
    if (data?.content) {
      setContent(data.content);
      setHasChanges(false);
    }
  }, [data]);

  const handleChange = (value: string | undefined) => {
    const newValue = value || '';
    setContent(newValue);
    setHasChanges(newValue !== data?.content);
  };

  const handleSave = () => {
    mutation.mutate(content);
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-emerald-400" />
            Soul
          </h1>
          <p className="text-slate-400 mt-1">
            Edit SOUL.md — Figgy's personality and core identity
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-400 font-mono">Unsaved changes</span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || mutation.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700" data-color-mode="dark">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-slate-800 text-red-400">
            <div className="text-center">
              <p className="mb-2">Error loading SOUL.md</p>
              <p className="text-sm text-slate-500">{String(error)}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-xl"
              >
                Retry
              </button>
            </div>
          </div>
        ) : !data?.exists ? (
          <div className="h-full flex items-center justify-center bg-slate-800 text-slate-400">
            <div className="text-center">
              <p className="mb-4">SOUL.md doesn't exist yet</p>
              <button
                onClick={() => setContent('# SOUL.md - Who You Are\n\nDescribe your agent\'s personality here.')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl"
              >
                Create SOUL.md
              </button>
            </div>
          </div>
        ) : (
          <MDEditor
            value={content}
            onChange={handleChange}
            height="100%"
            preview="live"
            hideToolbar={false}
          />
        )}
      </div>
    </div>
  );
}
