'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'success' | 'danger';
}

export function AuraButton({ children, className = '', active, size = 'md', variant = 'primary', ...props }: ButtonProps) {
    const sizeClasses = size === 'sm' ? 'h-9 px-4 text-xs' : size === 'lg' ? 'h-14 px-10 text-xl' : 'h-12 px-8 text-base';

    const gradients = {
        primary: {
            layer1: 'linear-gradient(to bottom, #3B82F6, #12121A, #7C3AED)',
            label: 'linear-gradient(to bottom, #60A5FA, #7C3AED)',
            glow: 'rgba(59, 130, 246, 0.4)',
            hover: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1))'
        },
        success: {
            layer1: 'linear-gradient(to bottom, #10B981, #12121A, #059669)',
            label: 'linear-gradient(to bottom, #34D399, #10B981)',
            glow: 'rgba(16, 185, 129, 0.4)',
            hover: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(5, 96, 105, 0.1), rgba(16, 185, 129, 0.1))'
        },
        danger: {
            layer1: 'linear-gradient(to bottom, #EF4444, #12121A, #B91C1C)',
            label: 'linear-gradient(to bottom, #F87171, #EF4444)',
            glow: 'rgba(239, 68, 68, 0.4)',
            hover: 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.1), rgba(239, 68, 68, 0.1))'
        }
    };

    const g = gradients[variant];

    return (
        <button
            className={`btn-aura-gradient ${sizeClasses} ${className}`}
            style={{
                opacity: active === false ? 0.6 : 1,
                transform: active ? 'scale(0.98)' : 'none',
                height: size === 'sm' ? '2.2rem' : size === 'lg' ? '3.5rem' : '2.8rem',
                padding: size === 'sm' ? '0 1rem' : size === 'lg' ? '0 2.5rem' : '0 1.5rem',
            }}
            {...props}
        >
            <div className="bg-layers">
                <div className="layer-1" style={{
                    background: g.layer1,
                    opacity: active === false ? 0.3 : 1
                }}></div>
                <div className="layer-2"></div>
                <div className="layer-3"></div>
                <div className="layer-4"></div>
                <div className="layer-5" style={{
                    background: variant === 'success' ? 'linear-gradient(to bottom, rgba(16, 185, 129, 0.2), #1A1A27, rgba(5, 96, 105, 0.15))' :
                        variant === 'danger' ? 'linear-gradient(to bottom, rgba(239, 68, 68, 0.2), #1A1A27, rgba(185, 28, 28, 0.15))' :
                            'linear-gradient(to bottom, rgba(59, 130, 246, 0.2), #1A1A27, rgba(124, 58, 237, 0.15))'
                }}></div>
                <div className="hover-layer" style={{ background: g.hover }}></div>
                {active && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
                )}
            </div>
            <span className="label" style={{
                background: g.label,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 8px ${g.glow})`,
                fontSize: size === 'sm' ? '0.8rem' : size === 'lg' ? '1.2rem' : '0.95rem'
            }}>{children}</span>
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
