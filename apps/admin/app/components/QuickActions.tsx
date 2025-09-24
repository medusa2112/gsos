'use client';

import { Button } from '@gsos/ui';

export function QuickActions() {
  return (
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
  );
}