import React from 'react';
import { AdmissionFormData } from '../page';

interface PreviousSchoolStepProps {
  data: AdmissionFormData;
  updateData: (section: keyof AdmissionFormData, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function PreviousSchoolStep({ data, updateData, onNext }: PreviousSchoolStepProps) {
  const handleInputChange = (field: string, value: string) => {
    updateData('previousSchool', {
      ...data.previousSchool,
      [field]: value,
    });
  };

  const isValid = () => {
    const { name, address, lastGrade, reasonForLeaving } = data.previousSchool;
    return name && address && lastGrade && reasonForLeaving;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous School Information</h2>
        <p className="text-gray-600 mb-6">Please provide details about the student's previous educational institution.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
            School Name *
          </label>
          <input
            type="text"
            id="schoolName"
            value={data.previousSchool.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the name of the previous school"
            required
          />
        </div>

        <div>
          <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-2">
            School Address *
          </label>
          <textarea
            id="schoolAddress"
            value={data.previousSchool.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the complete address of the previous school"
            required
          />
        </div>

        <div>
          <label htmlFor="lastGrade" className="block text-sm font-medium text-gray-700 mb-2">
            Last Grade/Year Completed *
          </label>
          <select
            id="lastGrade"
            value={data.previousSchool.lastGrade}
            onChange={(e) => handleInputChange('lastGrade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select last grade completed</option>
            <option value="nursery">Nursery</option>
            <option value="reception">Reception</option>
            <option value="year-1">Year 1</option>
            <option value="year-2">Year 2</option>
            <option value="year-3">Year 3</option>
            <option value="year-4">Year 4</option>
            <option value="year-5">Year 5</option>
            <option value="year-6">Year 6</option>
            <option value="year-7">Year 7</option>
            <option value="year-8">Year 8</option>
            <option value="year-9">Year 9</option>
            <option value="year-10">Year 10</option>
            <option value="year-11">Year 11</option>
            <option value="year-12">Year 12</option>
            <option value="year-13">Year 13</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="reasonForLeaving" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Leaving Previous School *
          </label>
          <select
            id="reasonForLeaving"
            value={data.previousSchool.reasonForLeaving}
            onChange={(e) => handleInputChange('reasonForLeaving', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select reason for leaving</option>
            <option value="relocation">Family relocation</option>
            <option value="academic-fit">Better academic fit</option>
            <option value="curriculum">Curriculum preferences</option>
            <option value="facilities">Better facilities</option>
            <option value="distance">Distance/Transportation</option>
            <option value="financial">Financial reasons</option>
            <option value="disciplinary">Disciplinary issues</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="academicRecords" className="block text-sm font-medium text-gray-700 mb-2">
            Academic Performance Summary
          </label>
          <textarea
            id="academicRecords"
            value={data.previousSchool.academicRecords}
            onChange={(e) => handleInputChange('academicRecords', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide a brief summary of the student's academic performance, achievements, or any relevant information from the previous school (optional)"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Academic Records Required
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                You will need to upload official academic records from the previous school in the next step. 
                These may include report cards, transcripts, or certificates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Documents
        </button>
      </div>
    </div>
  );
}