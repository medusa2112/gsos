import React from 'react';
import { AdmissionFormData } from '../page';

interface StudentInfoStepProps {
  data: AdmissionFormData;
  updateData: (section: keyof AdmissionFormData, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function StudentInfoStep({ data, updateData, onNext }: StudentInfoStepProps) {
  const handleInputChange = (field: string, value: string) => {
    updateData('student', {
      ...data.student,
      [field]: value,
    });
  };

  const isValid = () => {
    const { firstName, lastName, dateOfBirth, gender, nationality } = data.student;
    return firstName && lastName && dateOfBirth && gender && nationality;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
        <p className="text-gray-600 mb-6">Please provide the student's personal details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={data.student.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter first name"
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={data.student.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter last name"
            required
          />
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={data.student.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            id="gender"
            value={data.student.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
            Nationality *
          </label>
          <input
            type="text"
            id="nationality"
            value={data.student.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter nationality"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700 mb-2">
          Medical Conditions
        </label>
        <textarea
          id="medicalConditions"
          value={data.student.medicalConditions}
          onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please list any medical conditions, allergies, or medications (optional)"
        />
      </div>

      <div>
        <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-2">
          Special Educational Needs
        </label>
        <textarea
          id="specialNeeds"
          value={data.student.specialNeeds}
          onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please describe any special educational needs or accommodations required (optional)"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Guardian Information
        </button>
      </div>
    </div>
  );
}