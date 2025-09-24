import './globals.css';

export const metadata = { 
  title: 'GSOS - School Management Platform',
  description: 'Modern school management solutions for the digital age'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <div className="min-h-screen">
          <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
