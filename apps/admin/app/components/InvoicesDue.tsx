'use client';

import { Button } from '@gsos/ui';

interface InvoicesDueProps {
  overdueInvoices: number;
}

export function InvoicesDue({ overdueInvoices }: InvoicesDueProps) {
  return (
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
          <div className="text-xs text-gray-500">{overdueInvoices} invoices</div>
        </div>
      </div>
    </div>
  );
}