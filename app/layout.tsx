import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Frido ReturnDesk — Support Portal',
  description: 'Frido Return request management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link
                href="/requests"
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                <img
                  src="https://cdn.shopify.com/s/files/1/0553/0419/2034/files/Layer_1_1.png?v=1739439173&width=128"
                  alt="Frido Logo"
                  className="w-10 h-10 object-contain"
                />

                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">

                </span>
              </Link>

              <span className="hidden sm:inline bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Support Desk
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <Link
                href="/requests"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>

              <Link
                href="/requests/new"
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-1.5"
              >
                Create Request
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            &copy; {new Date().getFullYear()} FRIDO Inc. ReturnDesk Support System. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}