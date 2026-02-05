import { useNotificationStore, type NotificationType } from '@/stores/notificationStore';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const icons: Record<NotificationType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<NotificationType, string> = {
  success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-in slide-in-from-right-5',
              styles[notification.type]
            )}
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
