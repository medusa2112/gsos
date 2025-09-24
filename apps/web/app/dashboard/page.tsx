'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@gsos/ui';
import { ProtectedRoute } from '../../lib/auth/protected-route';
import { useAuth } from '../../lib/auth/auth-context';

interface TimetableEntry {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  day: string;
}

interface Grade {
  id: string;
  subject: string;
  assignment: string;
  grade: string;
  maxGrade: string;
  date: string;
  feedback?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export default function StudentDashboard() {
  const { session } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch timetable (placeholder data for now)
      setTimetable([
        {
          id: '1',
          subject: 'Mathematics',
          teacher: 'Mr. Johnson',
          room: 'Room 101',
          startTime: '09:00',
          endTime: '10:00',
          day: 'Monday'
        },
        {
          id: '2',
          subject: 'English Literature',
          teacher: 'Ms. Smith',
          room: 'Room 205',
          startTime: '10:15',
          endTime: '11:15',
          day: 'Monday'
        },
        {
          id: '3',
          subject: 'Science',
          teacher: 'Dr. Brown',
          room: 'Lab 1',
          startTime: '11:30',
          endTime: '12:30',
          day: 'Monday'
        }
      ]);

      // Fetch recent grades (placeholder data)
      setRecentGrades([
        {
          id: '1',
          subject: 'Mathematics',
          assignment: 'Algebra Test',
          grade: 'A',
          maxGrade: 'A',
          date: '2024-01-15',
          feedback: 'Excellent work on complex equations'
        },
        {
          id: '2',
          subject: 'English',
          assignment: 'Essay: Shakespeare',
          grade: 'B+',
          maxGrade: 'A',
          date: '2024-01-12',
          feedback: 'Good analysis, work on structure'
        }
      ]);

      // Fetch invoices
      const invoiceResponse = await fetch('http://localhost:3003/invoices', {
        headers: {
          'x-user-role': 'student',
          'x-student-id': session?.user?.id || 'student-1'
        }
      });
      
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        setInvoices(invoiceData.slice(0, 3)); // Show only recent invoices
      }

      // Fetch attendance summary (placeholder calculation)
      setAttendanceSummary({
        totalDays: 120,
        presentDays: 115,
        absentDays: 3,
        lateDays: 2,
        attendanceRate: 95.8
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {session?.user?.givenName || 'Student'}
              </h1>
              <p className="text-gray-600">Here's what's happening with your studies today.</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Today's Timetable */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                  <p className="text-sm text-gray-600">Monday, January 15, 2024</p>
                </div>
                <div className="p-6">
                  {timetable.length > 0 ? (
                    <div className="space-y-4">
                      {timetable.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{entry.subject}</h3>
                            <p className="text-sm text-gray-600">{entry.teacher} • {entry.room}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {entry.startTime} - {entry.endTime}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No classes scheduled for today</p>
                  )}
                </div>
              </div>

              {/* Recent Grades */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Grades</h2>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </div>
                <div className="p-6">
                  {recentGrades.length > 0 ? (
                    <div className="space-y-4">
                      {recentGrades.map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{grade.subject}</h3>
                            <p className="text-sm text-gray-600">{grade.assignment}</p>
                            {grade.feedback && (
                              <p className="text-xs text-gray-500 mt-1">{grade.feedback}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{grade.grade}</p>
                            <p className="text-xs text-gray-500">{formatDate(grade.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent grades available</p>
                  )}
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </div>
                <div className="p-6">
                  {invoices.length > 0 ? (
                    <div className="space-y-4">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{invoice.description}</h3>
                            <p className="text-sm text-gray-600">Invoice #{invoice.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent invoices</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              
              {/* Attendance Summary */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
                </div>
                <div className="p-6">
                  {attendanceSummary ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {attendanceSummary.attendanceRate}%
                        </div>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Present</span>
                          <span className="text-sm font-medium">{attendanceSummary.presentDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent</span>
                          <span className="text-sm font-medium">{attendanceSummary.absentDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Late</span>
                          <span className="text-sm font-medium">{attendanceSummary.lateDays} days</span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <span className="text-sm font-medium text-gray-900">Total</span>
                          <span className="text-sm font-medium">{attendanceSummary.totalDays} days</span>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No attendance data available</p>
                  )}
                </div>
              </div>

              {/* Quick Profile */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                </div>
                <div className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-blue-600">
                        {session?.user?.givenName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{session?.user?.givenName || 'Student Name'}</h3>
                    <p className="text-sm text-gray-600">{session?.user?.email || 'student@school.edu'}</p>
                    <p className="text-xs text-gray-500 mt-2">Student ID: {session?.user?.id || 'STU001'}</p>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    📚 View All Grades
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    💰 Pay Invoices
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📅 View Full Timetable
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Attendance Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}