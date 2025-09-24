'use client';

import { Button } from '@gsos/ui';
import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load dashboard components
const AttendanceExceptions = lazy(() => import('./components/AttendanceExceptions').then(module => ({ default: module.AttendanceExceptions })));
const InvoicesDue = lazy(() => import('./components/InvoicesDue').then(module => ({ default: module.InvoicesDue })));
const QuickActions = lazy(() => import('./components/QuickActions').then(module => ({ default: module.QuickActions })));

interface DashboardStats {
  totalStudents: number;
  pendingAdmissions: number;
  attendanceExceptions: number;
  overdueInvoices: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingAdmissions: 0,
    attendanceExceptions: 0,
    overdueInvoices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch students count
      const studentsResponse = await fetch('http://localhost:3003/students', {
        headers: { 'x-user-role': 'admin' }
      });
      const students = studentsResponse.ok ? await studentsResponse.json() : [];

      // Fetch admissions
      const admissionsResponse = await fetch('http://localhost:3003/admissions', {
        headers: { 'x-user-role': 'admin' }
      });
      const admissionsData = admissionsResponse.ok ? await admissionsResponse.json() : [];
      const admissions = Array.isArray(admissionsData) ? admissionsData : [];

      // Fetch invoices
      const invoicesResponse = await fetch('http://localhost:3003/invoices', {
        headers: { 'x-user-role': 'admin' }
      });
      const invoicesData = invoicesResponse.ok ? await invoicesResponse.json() : [];
      const invoices = Array.isArray(invoicesData) ? invoicesData : [];

      // Calculate stats
      const pendingAdmissions = admissions.filter((a: any) => a.status === 'pending').length;
      const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue').length;

      setStats({
        totalStudents: students.length,
        pendingAdmissions,
        attendanceExceptions: 3, // Mock data for now
        overdueInvoices
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-700">Monitor school operations, admissions, and finance at a glance.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingAdmissions}</div>
          <div className="text-sm text-gray-600">Pending Admissions</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.attendanceExceptions}</div>
          <div className="text-sm text-gray-600">Attendance Exceptions</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
          <div className="text-sm text-gray-600">Overdue Invoices</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admissions Inbox */}
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Admissions Inbox</h2>
            <Button variant="ghost" size="sm">
              <a href="/admissions">View all</a>
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">New Application: Sarah Johnson</div>
                <div className="text-xs text-gray-600">Year 7 admission - requires review</div>
              </div>
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">Pending</span>
            </div>
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">Interview Scheduled: Michael Chen</div>
                <div className="text-xs text-gray-600">Tomorrow at 2:00 PM</div>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Scheduled</span>
            </div>
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">Documents Missing: Emma Wilson</div>
                <div className="text-xs text-gray-600">Birth certificate required</div>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">Incomplete</span>
            </div>
          </div>
        </div>

        {/* Today's Attendance Exceptions */}
        <Suspense fallback={
          <div className="rounded-xl border bg-white p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <AttendanceExceptions />
        </Suspense>
      </div>

      {/* Invoices Due */}
      <Suspense fallback={
        <div className="rounded-xl border bg-white p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <InvoicesDue overdueInvoices={stats.overdueInvoices} />
      </Suspense>

      {/* Quick Actions */}
      <Suspense fallback={
        <div className="rounded-xl border bg-white p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <QuickActions />
      </Suspense>
    </div>
  );
}
