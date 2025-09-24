'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@gsos/ui';

interface AdmissionApplication {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  appliedGrade: string;
  appliedYearGroup: string;
  preferredStartDate: string;
  nationality: string;
  previousSchool: string;
  guardians: Array<{
    firstName: string;
    lastName: string;
    relationship: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
  documents: Array<{
    id: string;
    type: string;
    filename: string;
    s3Key: string;
    uploadedAt: string;
  }>;
  status: 'submitted' | 'pending' | 'under_review' | 'interview_scheduled' | 'assessment_scheduled' | 'offer_made' | 'offer_accepted' | 'offer_declined' | 'rejected' | 'withdrawn' | 'converted_to_student';
  assessmentScore?: number;
  assessmentNotes?: string;
  decisionNotes?: string;
  offerLetterUrl?: string;
  createdAt: string;
  updatedAt: string;
  studentId?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'under_review': return 'bg-blue-100 text-blue-800';
    case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
    case 'assessment_scheduled': return 'bg-indigo-100 text-indigo-800';
    case 'offer_made': return 'bg-green-100 text-green-800';
    case 'offer_accepted': return 'bg-green-200 text-green-900';
    case 'offer_declined': return 'bg-orange-100 text-orange-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'withdrawn': return 'bg-gray-200 text-gray-700';
    case 'converted_to_student': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending' | 'under_review' | 'interview_scheduled' | 'assessment_scheduled' | 'offer_made' | 'offer_accepted' | 'offer_declined' | 'rejected' | 'withdrawn' | 'converted_to_student'>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3003/admissions');
      if (response.ok) {
        const data = await response.json();
        // API returns { admissions: [...], total: number }
        setApplications(data.admissions || []);
      } else {
        console.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`http://localhost:3003/admissions/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, decisionNotes: notes }),
      });

      if (response.ok) {
        await fetchApplications();
        if (selectedApplication?.id === applicationId) {
          const updatedApp = applications.find(app => app.id === applicationId);
          if (updatedApp) {
            setSelectedApplication({ ...updatedApp, status: status as any, decisionNotes: notes });
          }
        }
      } else {
        console.error('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-500">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admission Applications</h1>
          <p className="text-sm text-gray-700">Review and manage student admission applications</p>
        </div>
        <Button onClick={fetchApplications} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Applications', count: applications.length },
            { key: 'submitted', label: 'Submitted', count: applications.filter(a => a.status === 'submitted').length },
            { key: 'pending', label: 'Pending', count: applications.filter(a => a.status === 'pending').length },
            { key: 'under_review', label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
            { key: 'interview_scheduled', label: 'Interview Scheduled', count: applications.filter(a => a.status === 'interview_scheduled').length },
            { key: 'assessment_scheduled', label: 'Assessment Scheduled', count: applications.filter(a => a.status === 'assessment_scheduled').length },
            { key: 'offer_made', label: 'Offer Made', count: applications.filter(a => a.status === 'offer_made').length },
            { key: 'offer_accepted', label: 'Offer Accepted', count: applications.filter(a => a.status === 'offer_accepted').length },
            { key: 'offer_declined', label: 'Offer Declined', count: applications.filter(a => a.status === 'offer_declined').length },
            { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length },
            { key: 'withdrawn', label: 'Withdrawn', count: applications.filter(a => a.status === 'withdrawn').length },
            { key: 'converted_to_student', label: 'Converted to Student', count: applications.filter(a => a.status === 'converted_to_student').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-1 space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications found for the selected filter.
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div
                key={application.id}
                onClick={() => setSelectedApplication(application)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedApplication?.id === application.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    {application.firstName} {application.lastName}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  DOB: {new Date(application.dateOfBirth).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Primary Guardian: {application.guardians[0]?.firstName} {application.guardians[0]?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted: {formatDate(application.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2">
          {selectedApplication ? (
            <ApplicationDetails 
              application={selectedApplication} 
              onStatusUpdate={updateApplicationStatus}
            />
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              Select an application to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApplicationDetailsProps {
  application: AdmissionApplication;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
}

function ApplicationDetails({ application, onStatusUpdate }: ApplicationDetailsProps) {
  const [reviewNotes, setReviewNotes] = useState(application.decisionNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    await onStatusUpdate(application.id, status, reviewNotes);
    setIsUpdating(false);
  };

  return (
    <div className="border rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">
            {application.firstName} {application.lastName}
          </h2>
          <p className="text-gray-600">Application ID: {application.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
          {application.status.replace('_', ' ')}
        </span>
      </div>

      {/* Student Information */}
      <div>
        <h3 className="text-lg font-medium mb-3">Student Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Date of Birth:</span> {new Date(application.dateOfBirth).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Gender:</span> {application.gender}
          </div>
          <div>
            <span className="font-medium">Nationality:</span> {application.nationality}
          </div>
          <div>
            <span className="font-medium">Applied Grade:</span> {application.appliedGrade}
          </div>
          <div>
            <span className="font-medium">Year Group:</span> {application.appliedYearGroup}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Preferred Start Date:</span> {new Date(application.preferredStartDate).toLocaleDateString()}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Previous School:</span> {application.previousSchool}
          </div>
        </div>
      </div>

      {/* Guardian Information */}
      <div>
        <h3 className="text-lg font-medium mb-3">Guardian Information</h3>
        {application.guardians.map((guardian, index) => (
          <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">{guardian.isPrimary ? 'Primary' : 'Secondary'} Guardian</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {guardian.firstName} {guardian.lastName}
              </div>
              <div>
                <span className="font-medium">Relationship:</span> {guardian.relationship}
              </div>
              <div>
                <span className="font-medium">Email:</span> {guardian.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {guardian.phone}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Documents */}
      <div>
        <h3 className="text-lg font-medium mb-3">Submitted Documents</h3>
        <div className="space-y-2">
          {application.documents.map((doc) => (
            <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{doc.type}:</span> {doc.filename}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Notes */}
      <div>
        <h3 className="text-lg font-medium mb-3">Review Notes</h3>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Add review notes..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={() => handleStatusUpdate('under_review')}
          disabled={isUpdating}
          variant="outline"
        >
          Mark Under Review
        </Button>
        <Button
          onClick={() => handleStatusUpdate('interview_scheduled')}
          disabled={isUpdating}
          variant="outline"
        >
          Schedule Interview
        </Button>
        <Button
          onClick={() => handleStatusUpdate('assessment_scheduled')}
          disabled={isUpdating}
          variant="outline"
        >
          Schedule Assessment
        </Button>
        <Button
          onClick={() => handleStatusUpdate('offer_made')}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700"
        >
          Make Offer
        </Button>
        <Button
          onClick={() => handleStatusUpdate('rejected')}
          disabled={isUpdating}
          className="bg-red-600 hover:bg-red-700"
        >
          Reject Application
        </Button>
      </div>
    </div>
  );
}