import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ChatSidebar from "@/components/Chatbox";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Aura Learn — AI-Powered Study Engine",
  description:
    "Upload any study material. Get targeted exam points, predictive flashcards, interactive mind maps, and WebXR AR labs — backed by real-time AI analytics.",
  keywords: ["AI study", "flashcards", "mind map", "AR labs", "WebXR", "exam prep"],
  openGraph: {
    title: "Aura Learn V3",
    description: "The unified AI study engine built to guarantee academic success.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <div className="app-main">
            <main className="page-content">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
          <ChatSidebar />
        </div>
      </body>
    </html>
  );
}
