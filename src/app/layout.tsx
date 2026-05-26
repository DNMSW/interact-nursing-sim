import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InterACT',
  description: 'Clinical communication simulation for nursing students — University of Manchester',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-nhs-blue text-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="font-bold text-base tracking-tight">InterACT</span>
            <span className="text-nhs-light-blue text-sm hidden sm:inline">
              Clinical Communication Practice
            </span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
