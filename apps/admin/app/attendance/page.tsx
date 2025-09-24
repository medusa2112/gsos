'use client';

import { useState, useEffect } from 'react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  yearGroup: string;
}

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

interface BehaviourRecord {
  id: string;
  studentId: string;
  type: 'positive' | 'negative';
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  safeguardingFlag: boolean;
  recordedBy: string;
  recordedAt: string;
  followUpRequired: boolean;
  followUpNotes?: string;
  classId?: string;
  subject?: string;
}

const API_BASE_URL = 'http://localhost:3003';

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0 });
  const [selectedClass, setSelectedClass] = useState('class-7a');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setPeriod] = useState('1');
  const [loading, setLoading] = useState(false);
  const [behaviourRecords, setBehaviourRecords] = useState<BehaviourRecord[]>([]);
  const [showBehaviourModal, setShowBehaviourModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students for the selected class
  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  // Fetch existing attendance for the selected date/period/class
  useEffect(() => {
    fetchAttendance();
  }, [selectedClass, selectedDate, selectedPeriod]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        headers: {
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        }
      });
      const data = await response.json();
      // Filter students by class (in real app, this would be done server-side)
      const classStudents = data.students.filter((student: Student) => 
        student.yearGroup === selectedClass.replace('class-', '')
      );
      setStudents(classStudents);
      
      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      classStudents.forEach((student: Student) => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: 'present',
          notes: ''
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      console.log('Fetching attendance data...');
      const url = `${API_BASE_URL}/attendance?classId=${selectedClass}&from=${selectedDate}&to=${selectedDate}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data && Array.isArray(data)) {
        // Find attendance records for the selected period and date
        const relevantRecords = data.filter((record: any) => 
          record.date === selectedDate && record.period === selectedPeriod
        );
        
        if (relevantRecords.length > 0) {
          const existingAttendance: Record<string, AttendanceRecord> = {};
          relevantRecords.forEach((record: any) => {
            if (record.students && Array.isArray(record.students)) {
              record.students.forEach((studentRecord: AttendanceRecord) => {
                existingAttendance[studentRecord.studentId] = studentRecord;
              });
            }
          });
          setAttendance(prev => ({ ...prev, ...existingAttendance }));
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late', notes?: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        notes: notes || ''
      }
    }));
  };

  const markAttendance = async () => {
    setLoading(true);
    try {
      const attendanceData = Object.values(attendance);
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          period: selectedPeriod,
          students: attendanceData
        })
      });

      if (response.ok) {
        alert('Attendance marked successfully!');
      } else {
        alert('Error marking attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance');
    } finally {
      setLoading(false);
    }
  };

  const openBehaviourModal = (student: Student) => {
    setSelectedStudent(student);
    setShowBehaviourModal(true);
    fetchBehaviourRecords(student.id);
  };

  const fetchBehaviourRecords = async (studentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/behaviour?studentId=${studentId}`, {
        headers: {
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        }
      });
      const data = await response.json();
      setBehaviourRecords(data.behaviour || []);
    } catch (error) {
      console.error('Error fetching behaviour records:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Class Register</h1>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="class-7a">Class 7A</option>
              <option value="class-7b">Class 7B</option>
              <option value="class-8a">Class 8A</option>
              <option value="class-8b">Class 8B</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Period 1</option>
              <option value="2">Period 2</option>
              <option value="3">Period 3</option>
              <option value="4">Period 4</option>
              <option value="5">Period 5</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={markAttendance}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Students ({students.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {['present', 'absent', 'late'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateAttendance(student.id, status as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            attendance[student.id]?.status === status
                              ? getStatusColor(status)
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={attendance[student.id]?.notes || ''}
                      onChange={(e) => updateAttendance(
                        student.id,
                        attendance[student.id]?.status || 'present',
                        e.target.value
                      )}
                      placeholder="Add notes..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openBehaviourModal(student)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Behaviour
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Behaviour Modal */}
      {showBehaviourModal && selectedStudent && (
        <BehaviourModal
          student={selectedStudent}
          behaviourRecords={behaviourRecords}
          onClose={() => setShowBehaviourModal(false)}
          onRecordAdded={() => fetchBehaviourRecords(selectedStudent.id)}
        />
      )}
    </div>
  );
}

// Behaviour Modal Component
interface BehaviourModalProps {
  student: Student;
  behaviourRecords: BehaviourRecord[];
  onClose: () => void;
  onRecordAdded: () => void;
}

function BehaviourModal({ student, behaviourRecords, onClose, onRecordAdded }: BehaviourModalProps) {
  const [newRecord, setNewRecord] = useState({
    type: 'positive' as 'positive' | 'negative',
    category: '',
    description: '',
    severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
    safeguardingFlag: false,
    followUpRequired: false,
    followUpNotes: '',
    classId: 'class-7a',
    subject: ''
  });
  const [loading, setLoading] = useState(false);

  const submitBehaviourRecord = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/behaviour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        },
        body: JSON.stringify({
          studentId: student.id,
          ...newRecord
        })
      });

      if (response.ok) {
        alert('Behaviour record added successfully!');
        setNewRecord({
          type: 'positive',
          category: '',
          description: '',
          severity: 'low',
          safeguardingFlag: false,
          followUpRequired: false,
          followUpNotes: '',
          classId: 'class-7a',
          subject: ''
        });
        onRecordAdded();
      } else {
        alert('Error adding behaviour record');
      }
    } catch (error) {
      console.error('Error adding behaviour record:', error);
      alert('Error adding behaviour record');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Behaviour Records - {student.firstName} {student.lastName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Record */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Add New Record</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newRecord.type}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={newRecord.severity}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newRecord.category}
                onChange={(e) => setNewRecord(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., academic, disciplinary, social"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newRecord.description}
                onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRecord.safeguardingFlag}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, safeguardingFlag: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-red-600 font-medium">Safeguarding Concern</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRecord.followUpRequired}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Follow-up Required</span>
              </label>
            </div>

            {newRecord.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes</label>
                <textarea
                  value={newRecord.followUpNotes}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, followUpNotes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              onClick={submitBehaviourRecord}
              disabled={loading || !newRecord.description || !newRecord.category}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Record'}
            </button>
          </div>

          {/* Existing Records */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Recent Records</h4>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {behaviourRecords.length === 0 ? (
                <p className="text-gray-500 text-sm">No behaviour records found.</p>
              ) : (
                behaviourRecords.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.type === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(record.severity)}`}>
                          {record.severity}
                        </span>
                        {record.safeguardingFlag && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Safeguarding
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(record.recordedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-1">{record.description}</p>
                    <p className="text-xs text-gray-600">Category: {record.category}</p>
                    {record.followUpNotes && (
                      <p className="text-xs text-blue-600 mt-1">Follow-up: {record.followUpNotes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}