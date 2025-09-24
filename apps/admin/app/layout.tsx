import './globals.css';
import './globals-accessibility.css';

export const metadata = { 
  title: 'GSOS Admin - School Management Console',
  description: 'Administrative console for school management platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="min-h-screen">
          <header className="border-b bg-white" role="banner">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-black" aria-hidden="true" />
                  <span className="text-sm font-medium tracking-wide">GSOS Admin</span>
                </div>
                <div className="text-sm text-gray-600">
                  School Management Console
                </div>
              </div>
              <nav className="mt-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <a href="/" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Dashboard
                  </a>
                  <a href="/students" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Students
                  </a>
                  <a href="/attendance" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Attendance
                  </a>
                  <a href="/admissions" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Admissions
                  </a>
                  <a href="/invoices" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Invoices
                  </a>
                  <a href="/payments" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Payments
                  </a>
                  <a href="/finance-dashboard" className="text-sm font-medium text-gray-900 hover:text-gray-700">
                    Finance Dashboard
                  </a>
                </div>
              </nav>
            </div>
          </header>
          <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" role="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
