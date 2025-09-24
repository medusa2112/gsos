'use client';

import { useState, useEffect } from 'react';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  period: string;
  markedBy: string;
  markedAt: string;
  students: AttendanceRecord[];
}

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  attendanceData?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

const API_BASE_URL = 'http://localhost:3003';

export default function StudentAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceSession[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentId] = useState('student-001'); // In real app, this would come from auth context

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `${API_BASE_URL}/attendance?studentId=${studentId}&from=${startOfMonth.toISOString().split('T')[0]}&to=${endOfMonth.toISOString().split('T')[0]}`,
        {
          headers: {
            'x-user-role': 'student',
            'x-user-id': studentId
          }
        }
      );
      
      const data = await response.json();
      setAttendanceData(data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Calculate attendance data for this date
      const dayAttendance = attendanceData.filter(session => session.date === dateString);
      let attendanceStats = null;
      
      if (dayAttendance.length > 0) {
        const myRecords = dayAttendance.flatMap(session => 
          session.students.filter(student => student.studentId === studentId)
        );
        
        if (myRecords.length > 0) {
          attendanceStats = {
            present: myRecords.filter(r => r.status === 'present').length,
            absent: myRecords.filter(r => r.status === 'absent').length,
            late: myRecords.filter(r => r.status === 'late').length,
            total: myRecords.length
          };
        }
      }
      
      days.push({
        date: dateString,
        isCurrentMonth: true,
        attendanceData: attendanceStats || undefined
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getAttendanceColor = (day: CalendarDay) => {
    if (!day.attendanceData || !day.isCurrentMonth) return '';
    
    const { present, absent, late, total } = day.attendanceData;
    
    if (absent > 0) return 'bg-red-100 border-red-300';
    if (late > 0) return 'bg-yellow-100 border-yellow-300';
    if (present === total) return 'bg-green-100 border-green-300';
    
    return 'bg-gray-100 border-gray-300';
  };

  const getAttendanceIcon = (day: CalendarDay) => {
    if (!day.attendanceData || !day.isCurrentMonth) return null;
    
    const { present, absent, late } = day.attendanceData;
    
    if (absent > 0) return '❌';
    if (late > 0) return '⏰';
    if (present > 0) return '✅';
    
    return null;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;
    
    const dayAttendance = attendanceData.filter(session => session.date === selectedDate);
    const myRecords = dayAttendance.flatMap(session => 
      session.students.filter(student => student.studentId === studentId)
    );
    
    return {
      date: selectedDate,
      sessions: dayAttendance.map(session => ({
        ...session,
        myRecord: session.students.find(s => s.studentId === studentId)
      })).filter(s => s.myRecord)
    };
  };

  const calendarDays = generateCalendarDays();
  const selectedDateDetails = getSelectedDateDetails();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance</h1>
        <p className="text-gray-600">Track your attendance record and view detailed information for each day.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ←
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day.isCurrentMonth ? setSelectedDate(day.date) : null}
                    className={`
                      p-2 h-16 border rounded-lg text-sm relative transition-colors
                      ${day.isCurrentMonth ? 'hover:bg-gray-50 cursor-pointer' : 'text-gray-300 cursor-default'}
                      ${selectedDate === day.date ? 'ring-2 ring-blue-500' : ''}
                      ${getAttendanceColor(day)}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                        {new Date(day.date).getDate()}
                      </span>
                      {getAttendanceIcon(day) && (
                        <span className="text-xs mt-1">{getAttendanceIcon(day)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span>No Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {/* Attendance Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">This Month</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const monthlyStats = attendanceData.reduce((acc, session) => {
                    const myRecord = session.students.find(s => s.studentId === studentId);
                    if (myRecord) {
                      acc[myRecord.status] = (acc[myRecord.status] || 0) + 1;
                      acc.total = (acc.total || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Present:</span>
                        <span className="text-sm font-medium text-green-600">
                          {monthlyStats.present || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Late:</span>
                        <span className="text-sm font-medium text-yellow-600">
                          {monthlyStats.late || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Absent:</span>
                        <span className="text-sm font-medium text-red-600">
                          {monthlyStats.absent || 0}
                        </span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Total Sessions:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {monthlyStats.total || 0}
                          </span>
                        </div>
                        {monthlyStats.total > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-600">Attendance Rate:</span>
                            <span className="text-sm font-medium text-blue-600">
                              {Math.round(((monthlyStats.present || 0) / monthlyStats.total) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Selected Date Details */}
          {selectedDateDetails && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {new Date(selectedDateDetails.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              
              <div className="space-y-3">
                {selectedDateDetails.sessions.map((session, index) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Period {session.period}
                        </p>
                        <p className="text-xs text-gray-500">Class: {session.classId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.myRecord?.status === 'present' ? 'bg-green-100 text-green-800' :
                        session.myRecord?.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.myRecord?.status}
                      </span>
                    </div>
                    {session.myRecord?.notes && (
                      <p className="text-xs text-gray-600 mt-1">
                        Note: {session.myRecord.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Marked at: {new Date(session.markedAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDate && !selectedDateDetails && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-sm text-gray-500">No attendance data for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}