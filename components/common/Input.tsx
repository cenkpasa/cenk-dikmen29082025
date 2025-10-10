import React, { InputHTMLAttributes } from 'react';

// FIX: Changed from interface to type and used an intersection with InputHTMLAttributes.
// This is a more robust way to merge custom props with all standard HTML input attributes,
// resolving errors where props like `type`, `id`, and `value` were not recognized.
export type InputProps = {
    label?: string;
    icon?: string;
    containerClassName?: string;
    variant?: 'default' | 'dark' | 'transparent';
} & InputHTMLAttributes<HTMLInputElement>;

const Input = ({ label, icon, id, containerClassName = '', variant = 'default', ...props }: InputProps) => {
    
    const variantClasses = {
        default: "border-cnk-border-light bg-cnk-panel-light text-cnk-txt-primary-light focus:border-cnk-accent-primary focus:ring-cnk-accent-primary/50",
        dark: "bg-slate-700/50 border-slate-500 text-white placeholder-slate-400 focus:border-white focus:ring-white/50",
        transparent: "bg-transparent border-0 border-b-2 border-slate-400 rounded-none p-2 text-white placeholder-slate-300 focus:ring-0 focus:border-emerald-400"
    };

    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && (
                <label htmlFor={id} className={`mb-2 flex items-center gap-2 text-sm font-semibold ${variant === 'transparent' ? 'text-slate-200' : 'text-cnk-txt-secondary-light'}`}>
                    {icon && <i className={icon}></i>}
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`w-full rounded-cnk-element border shadow-sm focus:outline-none focus:ring-2 ${variantClasses[variant]}`}
                {...props}
            />
        </div>
    );
};

export default Input;