import { ReactNode } from 'react';
import { X } from 'lucide-react';

type titleType = string | ReactNode;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: titleType;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer, description }: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        ></div>

        <div className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full animate-scale-in`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              {description && <p className='text-sm text-gray-500 font-medium mt-1'>{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:bg-gray-100 rounded-lg p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 bg-linear-to-b from-gray-50 to-gray-100 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
