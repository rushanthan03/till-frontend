import { EyeIcon, EyeOffIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isAddButton?: boolean;
  isPassword?: boolean;
  showButton?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isAddButton = false, showButton = false, onAdd, onRemove, suffix, className = '', isPassword = false, ...props }, ref) => {

    const [showPassword, setShowPassword] = useState<boolean>(false)

    const handleRevealPassword = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className="w-full relative">
        {label ? (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        ) : <div className='mb-6.5' />}
        <div className='flex items-center mb-1.5 justify-between relative'>
          <input
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : 'text'}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
              } ${suffix ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
              {suffix}
            </div>
          )}
          {showButton && (
            <>
              {isAddButton ? (
                <PlusCircle onClick={onAdd} className='absolute cursor-pointer right-2 w-4' color='#1D4ED8' />
              ) : (
                <MinusCircle onClick={onRemove} className='absolute cursor-pointer right-2 w-4' color='#1D4ED8' />
              )
              }
            </>
          )}

          {isPassword && (
            <div>
              {
                showPassword ? (
                  <EyeIcon className="absolute right-3 top-1/2 w-5 h-5 text-gray-400 select-none cursor-pointer hover:text-gray-500"
                    onClick={handleRevealPassword} />) : (
                  <EyeOffIcon className="absolute right-3 top-1/2 w-5 h-5 text-gray-400 select-none cursor-pointer hover:text-gray-500"
                    onClick={handleRevealPassword} />
                )}
            </div>
          )}

        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
