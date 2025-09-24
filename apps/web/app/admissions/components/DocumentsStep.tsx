import React, { useState } from 'react';
import { AdmissionFormData } from '../page';

interface DocumentsStepProps {
  data: AdmissionFormData;
  updateData: (section: keyof AdmissionFormData, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const DOCUMENT_TYPES = {
  birth_certificate: {
    label: 'Birth Certificate',
    description: 'Official birth certificate or passport',
    required: true,
  },
  passport_photo: {
    label: 'Passport Photo',
    description: 'Recent passport-sized photograph',
    required: true,
  },
  previous_school_records: {
    label: 'Previous School Records',
    description: 'Report cards, transcripts, or academic certificates',
    required: true,
  },
  medical_records: {
    label: 'Medical Records',
    description: 'Vaccination records and medical history',
    required: false,
  },
  proof_of_address: {
    label: 'Proof of Address',
    description: 'Utility bill or bank statement (within 3 months)',
    required: false,
  },
};

export function DocumentsStep({ data, updateData, onNext }: DocumentsStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileSelect = async (documentType: string, file: File) => {
    setUploading(documentType);
    
    try {
      // Simulate file upload - in real implementation, this would upload to S3
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedDocuments = data.documents.map(doc => 
        doc.type === documentType 
          ? { ...doc, file, uploaded: true }
          : doc
      );
      
      // Add new document if it doesn't exist
      if (!data.documents.find(doc => doc.type === documentType)) {
        updatedDocuments.push({
          type: documentType,
          file,
          uploaded: true,
        });
      }
      
      updateData('documents', updatedDocuments);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = (documentType: string) => {
    const updatedDocuments = data.documents.map(doc => 
      doc.type === documentType 
        ? { ...doc, file: undefined, uploaded: false }
        : doc
    );
    updateData('documents', updatedDocuments);
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = data.documents.find(d => d.type === documentType);
    return doc?.uploaded || false;
  };

  const getDocumentFile = (documentType: string) => {
    const doc = data.documents.find(d => d.type === documentType);
    return doc?.file;
  };

  const requiredDocumentsUploaded = () => {
    const requiredTypes = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type, _]) => type);
    
    return requiredTypes.every(type => getDocumentStatus(type));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
        <p className="text-gray-600 mb-6">Please upload the following documents to complete your application.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
          const isUploaded = getDocumentStatus(type);
          const file = getDocumentFile(type);
          const isUploading = uploading === type;

          return (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900">
                      {config.label}
                      {config.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {isUploaded && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Uploaded
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                  {file && (
                    <p className="mt-1 text-sm text-blue-600">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="ml-4 flex-shrink-0">
                  {isUploading ? (
                    <div className="flex items-center">
                      <svg 
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span 
                        className="text-sm text-gray-500"
                        aria-live="polite"
                        aria-label={`Uploading ${config.label}`}
                      >
                        Uploading...
                      </span>
                    </div>
                  ) : isUploaded ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => removeDocument(type)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(type, file);
                          }
                        }}
                      />
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Choose File
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              File Upload Guidelines
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Accepted formats: PDF, JPG, PNG, DOC, DOCX</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Ensure documents are clear and legible</li>
                <li>All required documents must be uploaded to proceed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!requiredDocumentsUploaded()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}