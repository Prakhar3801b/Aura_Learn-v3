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
                aura: {
                    bg: "#FAF7F2",
                    surface: "#FFFFFF",
                    card: "#FFFFFF",
                    border: "#E8E2DA",
                    primary: "#1A1A2E",
                    "primary-light": "#2D2D44",
                    secondary: "#7C7C8A",
                    accent: "#E07B5A",
                    success: "#34A853",
                    warning: "#F5A623",
                    danger: "#EA4335",
                    text: "#1A1A2E",
                    muted: "#7C7C8A",
                    rose: "#FFD6D6",
                    peach: "#FFE4C8",
                    mint: "#D4F5E9",
                    lavender: "#E8D5F5",
                    sky: "#D5E8F5",
                    cream: "#FFF5D6",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Outfit", "Inter", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            boxShadow: {
                card: "0 2px 12px rgba(0, 0, 0, 0.06)",
                "card-hover": "0 8px 24px rgba(0, 0, 0, 0.1)",
                sidebar: "2px 0 12px rgba(0, 0, 0, 0.04)",
                soft: "0 1px 3px rgba(0, 0, 0, 0.06)",
            },
            animation: {
                "slide-up": "slide-up 0.5s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
            },
            keyframes: {
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
