import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'outline' | 'success' | 'danger';
    loading?: boolean;
}

export function AuraButton({
    children,
    className = '',
    active,
    size = 'md',
    variant = 'outline',
    style,
    loading,
    ...props
}: ButtonProps) {
    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.78rem' },
        md: { height: '2.5rem', padding: '0 1.25rem', fontSize: '0.85rem' },
        lg: { height: '3rem', padding: '0 2rem', fontSize: '1rem' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: 'var(--primary)',
            color: 'var(--surface)',
            border: 'none',
        },
        outline: {
            background: active ? 'var(--hover-overlay)' : 'transparent',
            color: 'var(--primary)',
            border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
        },
        success: {
            background: 'var(--pastel-mint)',
            color: 'var(--success)',
            border: '1px solid var(--border)',
        },
        danger: {
            background: 'var(--pastel-rose)',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
        },
    };

    return (
        <button
            className={className}
            style={{
                fontWeight: 600,
                borderRadius: '10px',
                cursor: (props.disabled || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                opacity: (props.disabled || loading) ? 0.5 : 1,
                ...sizeStyles[size],
                ...variantStyles[variant],
                ...style,
            }}
            disabled={props.disabled || loading}
            {...props}
        >
            {loading && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '1em', height: '1em', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid currentColor', borderRadius: '50%' }}
                />
            )}
            {children}
        </button>
    );
}

export function GetStartedButton({ children, className = '', ...props }: ButtonProps) {
    return (
        <button className={`btn-get-started ${className}`} {...props}>
            {children}
            <div className="icon">
                <svg
                    height="24"
                    width="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path
                        d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                        fill="currentColor"
                    ></path>
                </svg>
            </div>
        </button>
    );
}
