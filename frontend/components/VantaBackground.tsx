'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        VANTA: any;
        THREE: any;
    }
}

export default function VantaBackground() {
    const vantaRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load THREE.js first, then Vanta
        const loadScripts = async () => {
            if (!window.THREE) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
            }
            if (!window.VANTA) {
                await loadScript('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.globe.min.js');
            }

            if (vantaRef.current) vantaRef.current.destroy();

            vantaRef.current = window.VANTA.GLOBE({
                el: '#vanta-bg',
                THREE: window.THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: 1.0,
                scaleMobile: 1.0,
                color: 0x3b82f6,         // electric blue
                color2: 0x7c3aed,        // violet accent
                backgroundColor: 0x0a0a0f, // deep space black
                size: 1.2,
                points: 12.0,
                maxDistance: 22.0,
                spacing: 16.0,
            });
        };

        loadScripts();

        return () => {
            if (vantaRef.current) vantaRef.current.destroy();
        };
    }, []);

    return <div id="vanta-bg" ref={containerRef} />;
}

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
