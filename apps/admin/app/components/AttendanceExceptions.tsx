'use client';

import { Button } from '@gsos/ui';

export function AttendanceExceptions() {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Today's Attendance Exceptions</h2>
        <Button variant="ghost" size="sm">
          <a href="/attendance">View all</a>
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
  );
}