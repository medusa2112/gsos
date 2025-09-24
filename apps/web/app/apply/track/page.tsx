'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@gsos/ui';
import { useSearchParams } from 'next/navigation';

interface ApplicationStatus {
  applicationId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'waitlisted';
  lastUpdated: string;
  nextSteps?: string;
  interviewDate?: string;
  notes?: string;
  contactEmail: string;
  contactPhone: string;
}

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-orange-100 text-orange-800',
};

const STATUS_DESCRIPTIONS = {
  submitted: 'Your application has been received and is in our system.',
  under_review: 'Our admissions team is currently reviewing your application.',
  interview_scheduled: 'An interview has been scheduled. Check your email for details.',
  accepted: 'Congratulations! Your application has been accepted.',
  rejected: 'Unfortunately, we cannot offer admission at this time.',
  waitlisted: 'You have been placed on our waiting list.',
};

export default function ApplicationTrackingPage() {
  const searchParams = useSearchParams();
  const [applicationId, setApplicationId] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setApplicationId(id);
      fetchApplicationStatus(id);
    }
  }, [searchParams]);

  const fetchApplicationStatus = async (id: string) => {
    try {
      setLoading(true);
      setError('');

      // For demo purposes, we'll simulate API response
      // In real implementation, this would fetch from the API
      const mockResponse: ApplicationStatus = {
        applicationId: id,
        studentName: 'John Doe',
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        lastUpdated: new Date().toISOString(),
        nextSteps: 'We will review your application and contact you within 5-7 business days.',
        contactEmail: 'admissions@school.edu',
        contactPhone: '+1 (555) 123-4567',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplicationStatus(mockResponse);
    } catch (err) {
      setError('Failed to fetch application status. Please try again.');
      console.error('Error fetching application status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (applicationId.trim()) {
      fetchApplicationStatus(applicationId.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return '📝';
      case 'under_review':
        return '👀';
      case 'interview_scheduled':
        return '🗓️';
      case 'accepted':
        return '🎉';
      case 'rejected':
        return '❌';
      case 'waitlisted':
        return '⏳';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Track Your Application</h1>
            <p className="mt-2 text-gray-600">Check the status of your admission application</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700 mb-2">
                Application ID
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  id="applicationId"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="Enter your application ID (e.g., APP-1234567890)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Track Application'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your application ID was provided in the confirmation email sent after submission.
            </p>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Application Status */}
        {applicationStatus && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[applicationStatus.status]}`}>
                  <span className="mr-2">{getStatusIcon(applicationStatus.status)}</span>
                  {applicationStatus.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Application Details</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Application ID:</span> {applicationStatus.applicationId}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Student Name:</span> {applicationStatus.studentName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Submitted:</span> {formatDate(applicationStatus.submittedAt)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Last Updated:</span> {formatDate(applicationStatus.lastUpdated)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> 
                      <a href={`mailto:${applicationStatus.contactEmail}`} className="text-blue-600 hover:text-blue-800 ml-1">
                        {applicationStatus.contactEmail}
                      </a>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> 
                      <a href={`tel:${applicationStatus.contactPhone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                        {applicationStatus.contactPhone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Current Status</h3>
              <p className="text-blue-800">{STATUS_DESCRIPTIONS[applicationStatus.status]}</p>
              {applicationStatus.nextSteps && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900">Next Steps:</h4>
                  <p className="text-blue-800 mt-1">{applicationStatus.nextSteps}</p>
                </div>
              )}
            </div>

            {/* Interview Information */}
            {applicationStatus.interviewDate && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-purple-900 mb-2">Interview Scheduled</h3>
                <p className="text-purple-800">
                  Your interview is scheduled for {formatDate(applicationStatus.interviewDate)}
                </p>
                <p className="text-purple-700 mt-2 text-sm">
                  Please check your email for detailed instructions and location information.
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {applicationStatus.notes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Notes</h3>
                <p className="text-gray-700">{applicationStatus.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(applicationStatus.submittedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    ['under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                      ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className={`text-sm ${
                      ['under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                        ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {['under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status) ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Application Under Review</p>
                    <p className="text-sm text-gray-500">
                      {['under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                        ? formatDate(applicationStatus.lastUpdated)
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>

                {applicationStatus.status === 'interview_scheduled' && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm">📅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Interview Scheduled</p>
                      <p className="text-sm text-gray-500">{applicationStatus.interviewDate && formatDate(applicationStatus.interviewDate)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    ['accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                      ? applicationStatus.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                      : 'bg-gray-100'
                  }`}>
                    <span className={`text-sm ${
                      ['accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                        ? applicationStatus.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {['accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status) ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Final Decision</p>
                    <p className="text-sm text-gray-500">
                      {['accepted', 'rejected', 'waitlisted'].includes(applicationStatus.status)
                        ? formatDate(applicationStatus.lastUpdated)
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  📧 Email Admissions Office
                </Button>
                <Button variant="outline" className="justify-start">
                  📞 Call Admissions Office
                </Button>
                <Button variant="outline" className="justify-start">
                  📄 Download Application Copy
                </Button>
                <Button variant="outline" className="justify-start">
                  🔄 Update Application
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">How long does the review process take?</h4>
              <p className="text-sm text-gray-600 mt-1">
                We typically review applications within 5-7 business days. You will be notified via email of any status changes.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I update my application after submission?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Yes, you can submit additional documents or updates by contacting our admissions office directly.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What happens if I'm waitlisted?</h4>
              <p className="text-sm text-gray-600 mt-1">
                If you're placed on our waiting list, we'll contact you if a spot becomes available. Your position on the waitlist depends on various factors including application date and qualifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}