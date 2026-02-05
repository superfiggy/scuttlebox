import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import CommandPage from '@/pages/CommandPage';
import TasksPage from '@/pages/TasksPage';
import QueuePage from '@/pages/QueuePage';
import LogsPage from '@/pages/LogsPage';
import SoulPage from '@/pages/SoulPage';
import UserPage from '@/pages/UserPage';
import MemoryPage from '@/pages/MemoryPage';
import FilesPage from '@/pages/FilesPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ToastContainer from '@/components/common/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="command" element={<CommandPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="soul" element={<SoulPage />} />
          <Route path="user" element={<UserPage />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </QueryClientProvider>
  );
}
