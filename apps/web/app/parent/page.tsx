'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@gsos/ui';
import { ProtectedRoute } from '../../lib/auth/protected-route';
import { useAuth } from '../../lib/auth/auth-context';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  studentId: string;
  profileImage?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  lastAbsence?: string;
}

interface Grade {
  id: string;
  studentId: string;
  subject: string;
  assignment: string;
  grade: string;
  date: string;
  feedback?: string;
}

export default function ParentDashboard() {
  const { session } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummary[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchParentData();
    }
  }, [session]);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      
      // Fetch linked students (placeholder data for now)
      const studentsData: Student[] = [
        {
          id: 'student-1',
          firstName: 'Emma',
          lastName: 'Johnson',
          grade: '10th Grade',
          class: '10A',
          studentId: 'STU001'
        },
        {
          id: 'student-2',
          firstName: 'Liam',
          lastName: 'Johnson',
          grade: '8th Grade',
          class: '8B',
          studentId: 'STU002'
        }
      ];
      setStudents(studentsData);
      
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id);
      }

      // Fetch invoices for all students
      const invoicesData: Invoice[] = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          studentId: 'student-1',
          studentName: 'Emma Johnson',
          amount: 450.00,
          dueDate: '2024-02-15',
          status: 'pending',
          description: 'Tuition Fee - January 2024'
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2024-002',
          studentId: 'student-2',
          studentName: 'Liam Johnson',
          amount: 350.00,
          dueDate: '2024-02-15',
          status: 'paid',
          description: 'Tuition Fee - January 2024'
        },
        {
          id: 'inv-3',
          invoiceNumber: 'INV-2024-003',
          studentId: 'student-1',
          studentName: 'Emma Johnson',
          amount: 75.00,
          dueDate: '2024-01-30',
          status: 'overdue',
          description: 'Lab Materials Fee'
        }
      ];
      setInvoices(invoicesData);

      // Fetch attendance summaries
      const attendanceData: AttendanceSummary[] = [
        {
          studentId: 'student-1',
          studentName: 'Emma Johnson',
          totalDays: 120,
          presentDays: 118,
          absentDays: 1,
          lateDays: 1,
          attendanceRate: 98.3,
          lastAbsence: '2024-01-10'
        },
        {
          studentId: 'student-2',
          studentName: 'Liam Johnson',
          totalDays: 120,
          presentDays: 115,
          absentDays: 3,
          lateDays: 2,
          attendanceRate: 95.8,
          lastAbsence: '2024-01-15'
        }
      ];
      setAttendanceSummaries(attendanceData);

      // Fetch recent grades
      const gradesData: Grade[] = [
        {
          id: 'grade-1',
          studentId: 'student-1',
          subject: 'Mathematics',
          assignment: 'Algebra Test',
          grade: 'A',
          date: '2024-01-15',
          feedback: 'Excellent work on complex equations'
        },
        {
          id: 'grade-2',
          studentId: 'student-1',
          subject: 'English',
          assignment: 'Essay: Shakespeare',
          grade: 'B+',
          date: '2024-01-12',
          feedback: 'Good analysis, work on structure'
        },
        {
          id: 'grade-3',
          studentId: 'student-2',
          subject: 'Science',
          assignment: 'Chemistry Lab Report',
          grade: 'A-',
          date: '2024-01-14',
          feedback: 'Great experimental design'
        }
      ];
      setRecentGrades(gradesData);

    } catch (error) {
      console.error('Error fetching parent data:', error);
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

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const selectedStudentInvoices = invoices.filter(i => i.studentId === selectedStudent);
  const selectedStudentAttendance = attendanceSummaries.find(a => a.studentId === selectedStudent);
  const selectedStudentGrades = recentGrades.filter(g => g.studentId === selectedStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-gray-600">Monitor your children's academic progress and school activities.</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Student Selector */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Children</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {student.firstName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{student.grade} • {student.class}</p>
                      <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedStudentData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Recent Grades */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Recent Grades - {selectedStudentData.firstName}
                      </h2>
                      <Button variant="outline" size="sm">View All</Button>
                    </div>
                  </div>
                  <div className="p-6">
                    {selectedStudentGrades.length > 0 ? (
                      <div className="space-y-4">
                        {selectedStudentGrades.map((grade) => (
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

                {/* Invoices */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Invoices - {selectedStudentData.firstName}
                      </h2>
                      <Button variant="outline" size="sm">View All</Button>
                    </div>
                  </div>
                  <div className="p-6">
                    {selectedStudentInvoices.length > 0 ? (
                      <div className="space-y-4">
                        {selectedStudentInvoices.map((invoice) => (
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
                              {invoice.status === 'pending' && (
                                <Button size="sm" className="mt-2 w-full">
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No invoices for this student</p>
                    )}
                  </div>
                </div>

                {/* All Students Overview */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">All Students Overview</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Total Outstanding Invoices */}
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0))}
                        </div>
                        <p className="text-sm text-red-600">Outstanding Balance</p>
                      </div>
                      
                      {/* Average Attendance */}
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(attendanceSummaries.reduce((sum, a) => sum + a.attendanceRate, 0) / attendanceSummaries.length).toFixed(1)}%
                        </div>
                        <p className="text-sm text-green-600">Average Attendance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-8">
                
                {/* Attendance Summary */}
                {selectedStudentAttendance && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Attendance - {selectedStudentData.firstName}
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getAttendanceColor(selectedStudentAttendance.attendanceRate)}`}>
                            {selectedStudentAttendance.attendanceRate}%
                          </div>
                          <p className="text-sm text-gray-600">Attendance Rate</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Present</span>
                            <span className="text-sm font-medium">{selectedStudentAttendance.presentDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Absent</span>
                            <span className="text-sm font-medium">{selectedStudentAttendance.absentDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Late</span>
                            <span className="text-sm font-medium">{selectedStudentAttendance.lateDays} days</span>
                          </div>
                          <div className="flex justify-between border-t pt-3">
                            <span className="text-sm font-medium text-gray-900">Total</span>
                            <span className="text-sm font-medium">{selectedStudentAttendance.totalDays} days</span>
                          </div>
                          {selectedStudentAttendance.lastAbsence && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Last Absence</span>
                              <span className="text-sm font-medium">{formatDate(selectedStudentAttendance.lastAbsence)}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      💰 Pay All Outstanding Invoices
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      📊 Download Attendance Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      📚 View All Grades
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      📞 Contact Teachers
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      📅 Schedule Parent Meeting
                    </Button>
                  </div>
                </div>

                {/* Communication */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Math Teacher</p>
                        <p className="text-xs text-blue-700">Emma is doing excellent work in algebra...</p>
                        <p className="text-xs text-blue-600 mt-1">2 days ago</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-900">School Nurse</p>
                        <p className="text-xs text-yellow-700">Liam visited the nurse today for...</p>
                        <p className="text-xs text-yellow-600 mt-1">3 days ago</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View All Messages
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}