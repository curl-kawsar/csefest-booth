import { Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const spaceMono = Space_Mono({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata = {
  title: "BAIUST CSE FEST | Event Registration System",
  description: "Register for CSE department events: Hackathon, IUPC, Typing Speed Contest, E-Football, and ICT Quiz",
  keywords: "BAIUST, CSE, event registration, hackathon, IUPC, typing contest, e-football, ICT quiz",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${inter.variable}`}>
      <body className="tech-bg">
        <main>{children}</main>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b', 
              color: '#94a3b8',
              border: '1px solid #334155',
              fontFamily: 'var(--font-space-mono)'
            }
          }} 
        />
      </body>
    </html>
  );
}
