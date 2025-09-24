'use client';

import { Button } from '@gsos/ui';
import { useState, useEffect } from 'react';

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
      const admissions = admissionsResponse.ok ? await admissionsResponse.json() : [];

      // Fetch invoices
      const invoicesResponse = await fetch('http://localhost:3003/invoices', {
        headers: { 'x-user-role': 'admin' }
      });
      const invoices = invoicesResponse.ok ? await invoicesResponse.json() : [];

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
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Today's Attendance</h2>
            <Button variant="ghost" size="sm">
              <a href="/attendance">View register</a>
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">Late Arrival: James Smith</div>
                <div className="text-xs text-gray-600">Year 9B - Arrived 9:15 AM</div>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">Late</span>
            </div>
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">Absent: Lucy Brown</div>
                <div className="text-xs text-gray-600">Year 8A - No notification</div>
              </div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Absent</span>
            </div>
            <div className="flex items-start justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">Medical Leave: Tom Davis</div>
                <div className="text-xs text-gray-600">Year 10C - Doctor's appointment</div>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Due */}
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Invoices Due</h2>
          <Button variant="ghost" size="sm">
            <a href="/invoices">Manage invoices</a>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-600">Due Today</div>
            <div className="text-lg font-bold text-red-600">£2,450</div>
            <div className="text-xs text-gray-500">3 invoices</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-600">Due This Week</div>
            <div className="text-lg font-bold text-orange-600">£8,750</div>
            <div className="text-xs text-gray-500">12 invoices</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <div className="text-lg font-bold text-red-600">£1,200</div>
            <div className="text-xs text-gray-500">{stats.overdueInvoices} invoices</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="h-auto flex-col gap-2 p-4" variant="outline">
            <a href="/students" className="flex flex-col items-center gap-2">
              <div className="text-lg">👥</div>
              <span className="text-sm">Manage Students</span>
            </a>
          </Button>
          <Button className="h-auto flex-col gap-2 p-4" variant="outline">
            <a href="/attendance" className="flex flex-col items-center gap-2">
              <div className="text-lg">📋</div>
              <span className="text-sm">Take Attendance</span>
            </a>
          </Button>
          <Button className="h-auto flex-col gap-2 p-4" variant="outline">
            <a href="/invoices" className="flex flex-col items-center gap-2">
              <div className="text-lg">💰</div>
              <span className="text-sm">Create Invoice</span>
            </a>
          </Button>
          <Button className="h-auto flex-col gap-2 p-4" variant="outline">
            <a href="/admissions" className="flex flex-col items-center gap-2">
              <div className="text-lg">📝</div>
              <span className="text-sm">Review Applications</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
