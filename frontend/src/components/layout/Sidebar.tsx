import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  User,
  Brain,
  FolderOpen,
  Settings,
  Server,
  Clock,
  Layers,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/command', icon: MessageSquare, label: 'Command' },
  { to: '/tasks', icon: Clock, label: 'Tasks' },
  { to: '/queue', icon: Layers, label: 'Queue' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/soul', icon: Sparkles, label: 'Soul' },
  { to: '/user', icon: User, label: 'User Profile' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/admin', icon: Server, label: 'Admin' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
            <span className="text-lg">🎱</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-white">Scuttlebox</span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white',
                sidebarCollapsed && 'justify-center'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
            <p className="text-xs text-slate-500">Scuttlebox v0.1.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}
