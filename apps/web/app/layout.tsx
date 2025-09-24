'use client';

import './globals.css';
import './globals-accessibility.css';
import { AuthProvider } from '../lib/auth/auth-context';
import { configureAmplify } from '../lib/auth/amplify-config';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth/auth-context';

// Configure Amplify
configureAmplify();

function Navigation() {
  const pathname = usePathname();
  const { session } = useAuth();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/parent', label: 'Parent View', icon: '👨‍👩‍👧‍👦' },
    { href: '/invoices', label: 'Invoices', icon: '💰' },
    { href: '/attendance', label: 'Attendance', icon: '📅' },
    { href: '/apply', label: 'Apply Now', icon: '📝' },
    { href: '/apply/track', label: 'Track Application', icon: '🔍' },
    { href: '/admissions', label: 'Admissions', icon: '📝' },
  ];

  if (!session?.isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold text-blue-600"
                aria-label="GSOS Home - Go to dashboard"
              >
                GSOS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8" role="menubar">
               {navItems.map((item) => (
                 <Link
                   key={item.href}
                   href={item.href as any}
                   role="menuitem"
                   aria-current={isActive(item.href) ? 'page' : undefined}
                   className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                     isActive(item.href)
                       ? 'border-blue-500 text-gray-900'
                       : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                   }`}
                 >
                   <span className="mr-2" aria-hidden="true">{item.icon}</span>
                   {item.label}
                 </Link>
               ))}
            </div>
          </div>
          <div className="flex items-center" role="complementary" aria-label="User information">
            <span className="text-sm text-gray-700">
              {session.user.givenName} {session.user.familyName}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>GSOS - School Management Platform</title>
        <meta name="description" content="Modern school management solutions for the digital age" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main id="main-content" className="flex-1" role="main">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
