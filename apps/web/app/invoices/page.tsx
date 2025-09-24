'use client';

import { useState, useEffect } from 'react';
import { Button } from '@gsos/ui';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
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
  lineItems: LineItem[];
  createdAt: string;
  paidAt?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('http://localhost:3003/invoices', {
        headers: {
          'x-user-role': 'student',
          'x-student-id': 'student-1'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    setPayingInvoice(invoiceId);
    
    try {
      // Create payment intent
      const paymentResponse = await fetch('http://localhost:3003/payments/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'student',
          'x-student-id': 'student-1'
        },
        body: JSON.stringify({
          invoiceId,
          amount: invoices.find(inv => inv.id === invoiceId)?.amount || 0
        })
      });

      if (paymentResponse.ok) {
        const { paymentIntentId } = await paymentResponse.json();
        
        // Simulate payment success (in real app, this would redirect to Stripe)
        setTimeout(async () => {
          // Simulate webhook call
          await fetch('http://localhost:3003/payments/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'payment_intent.succeeded',
              data: {
                object: {
                  id: paymentIntentId,
                  status: 'succeeded'
                }
              }
            })
          });
          
          // Refresh invoices
          await fetchInvoices();
          setPayingInvoice(null);
          alert('Payment successful!');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPayingInvoice(null);
      alert('Payment failed. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg">Loading invoices...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Invoices</h1>
          <p className="text-gray-600">View and pay your school invoices</p>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500">You don't have any invoices at the moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <p className="text-gray-600">{invoice.description}</p>
                    </div>
                    <div className="text-right">
                      <div 
                        className="inline-flex px-3 py-1 rounded-full text-sm font-medium text-white mb-2"
                        style={{ backgroundColor: getStatusColor(invoice.status) }}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L16 7" />
                      </svg>
                      Due: {formatDate(invoice.dueDate)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created: {formatDate(invoice.createdAt)}
                    </div>
                    {invoice.paidAt && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Paid: {formatDate(invoice.paidAt)}
                      </div>
                    )}
                  </div>

                  {invoice.lineItems && invoice.lineItems.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {invoice.lineItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <div className="font-medium text-gray-900">{item.description}</div>
                              <div className="text-sm text-gray-600">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </div>
                            </div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Download PDF
                    </Button>
                    {invoice.status !== 'paid' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={payingInvoice === invoice.id}
                      >
                        {payingInvoice === invoice.id ? 'Processing...' : 'Pay Now'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}