import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg bg-slate-900/50 border px-4 py-3 text-sm text-white',
            'placeholder-slate-500 transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25'
              : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/25',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
