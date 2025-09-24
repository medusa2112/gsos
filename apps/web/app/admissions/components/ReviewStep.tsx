import React, { useState } from 'react';
import { AdmissionFormData } from '../page';

interface ReviewStepProps {
  data: AdmissionFormData;
  updateData?: (section: keyof AdmissionFormData, data: any) => void;
  onNext?: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function ReviewStep({ data, onPrev, onSubmit }: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const getUploadedDocuments = () => {
    return data.documents.filter(doc => doc.uploaded);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Application</h2>
        <p className="text-gray-600 mb-6">Please review all information before submitting your application.</p>
      </div>

      {/* Student Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Full Name:</span>
            <p className="text-gray-900">{data.student.firstName} {data.student.lastName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
            <p className="text-gray-900">{formatDate(data.student.dateOfBirth)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Gender:</span>
            <p className="text-gray-900">{data.student.gender || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Nationality:</span>
            <p className="text-gray-900">{data.student.nationality || 'Not specified'}</p>
          </div>
          {data.student.medicalConditions && (
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-500">Medical Conditions:</span>
              <p className="text-gray-900">{data.student.medicalConditions}</p>
            </div>
          )}
          {data.student.specialNeeds && (
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-500">Special Educational Needs:</span>
              <p className="text-gray-900">{data.student.specialNeeds}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guardian Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
        {data.guardians.map((guardian, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h4 className="text-md font-medium text-gray-800 mb-3">Guardian {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <p className="text-gray-900">{guardian.firstName} {guardian.lastName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Relationship:</span>
                <p className="text-gray-900">{guardian.relationship}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <p className="text-gray-900">{guardian.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{guardian.email}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-500">Address:</span>
                <p className="text-gray-900">
                  {guardian.address.street}, {guardian.address.city}, {guardian.address.state} {guardian.address.postalCode}, {guardian.address.country}
                </p>
              </div>
              {guardian.occupation && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Occupation:</span>
                  <p className="text-gray-900">{guardian.occupation}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Emergency Contact:</span>
                <p className="text-gray-900">{guardian.emergencyContact ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Previous School Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Previous School Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">School Name:</span>
            <p className="text-gray-900">{data.previousSchool.name || 'Not provided'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Last Grade Completed:</span>
            <p className="text-gray-900">{data.previousSchool.lastGrade || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-gray-500">School Address:</span>
            <p className="text-gray-900">{data.previousSchool.address || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-gray-500">Reason for Leaving:</span>
            <p className="text-gray-900">{data.previousSchool.reasonForLeaving || 'Not provided'}</p>
          </div>
          {data.previousSchool.academicRecords && (
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-500">Academic Records:</span>
              <p className="text-gray-900">{data.previousSchool.academicRecords}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
        <div className="space-y-2">
          {getUploadedDocuments().map((doc, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{doc.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              {doc.file && (
                <span className="text-sm text-gray-500">{doc.file.name}</span>
              )}
            </div>
          ))}
          {getUploadedDocuments().length === 0 && (
            <p className="text-gray-500 text-sm">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
            I confirm that all information provided is accurate and complete. I understand that providing false information may result in the rejection of this application. I agree to the school's terms and conditions and privacy policy.
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back to Documents
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span aria-live="polite">Submitting...</span>
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </div>
  );
}