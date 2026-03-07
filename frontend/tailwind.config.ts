import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core palette - deep space black with electric blue/violet
                aura: {
                    bg: "#0A0A0F",
                    surface: "#12121A",
                    card: "#1A1A27",
                    border: "#2A2A3F",
                    primary: "#3B82F6",       // electric blue
                    "primary-light": "#60A5FA",
                    secondary: "#7C3AED",     // electric violet
                    accent: "#06B6D4",        // aurora cyan
                    success: "#10B981",
                    warning: "#F59E0B",
                    danger: "#EF4444",
                    text: "#F1F5F9",
                    muted: "#94A3B8",
                    glow: "rgba(59,130,246,0.3)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Outfit", "Inter", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            backgroundImage: {
                "glow-radial":
                    "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)",
                "card-gradient":
                    "linear-gradient(135deg, rgba(26,26,39,0.9) 0%, rgba(18,18,26,0.9) 100%)",
                "hero-gradient":
                    "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(124,58,237,0.1) 100%)",
                "blue-glow":
                    "radial-gradient(ellipse at top, rgba(59,130,246,0.2) 0%, transparent 60%)",
            },
            boxShadow: {
                glow: "0 0 30px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)",
                "glow-sm": "0 0 15px rgba(59,130,246,0.2)",
                "glow-violet": "0 0 30px rgba(124,58,237,0.3)",
                "glow-cyan": "0 0 30px rgba(6,182,212,0.3)",
                card: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
                "glow-pulse": "glow-pulse 3s ease-in-out infinite",
                "slide-up": "slide-up 0.5s ease-out",
                "fade-in": "fade-in 0.4s ease-out",
                "spin-slow": "spin 8s linear infinite",
                "shimmer": "shimmer 2s linear infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-12px)" },
                },
                "glow-pulse": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(59,130,246,0.2)" },
                    "50%": { boxShadow: "0 0 40px rgba(59,130,246,0.5), 0 0 80px rgba(59,130,246,0.2)" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
        },
    },
    plugins: [],
};

export default config;
