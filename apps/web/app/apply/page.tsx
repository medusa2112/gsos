'use client';

import React, { useState } from 'react';
import { Button } from '@gsos/ui';
import { useRouter } from 'next/navigation';

export interface PublicAdmissionFormData {
  // Student Information
  student: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationality: string;
    medicalConditions: string;
    specialNeeds: string;
  };
  
  // Guardian Information
  guardians: Array<{
    type: 'primary' | 'secondary';
    firstName: string;
    lastName: string;
    relationship: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    occupation: string;
    employer: string;
    emergencyContact: boolean;
  }>;
  
  // Previous School Information
  previousSchool: {
    name: string;
    address: string;
    lastGrade: string;
    reasonForLeaving: string;
    academicRecords: string;
  };
  
  // Preferred Grade and Additional Info
  application: {
    preferredGrade: string;
    startDate: string;
    additionalInfo: string;
    hearAboutUs: string;
  };
}

export default function PublicAdmissionsPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PublicAdmissionFormData>({
    student: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      nationality: '',
      medicalConditions: '',
      specialNeeds: '',
    },
    guardians: [{
      type: 'primary',
      firstName: '',
      lastName: '',
      relationship: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      occupation: '',
      employer: '',
      emergencyContact: true,
    }],
    previousSchool: {
      name: '',
      address: '',
      lastGrade: '',
      reasonForLeaving: '',
      academicRecords: '',
    },
    application: {
      preferredGrade: '',
      startDate: '',
      additionalInfo: '',
      hearAboutUs: '',
    },
  });

  const STEPS = [
    { id: 'student', title: 'Student Information' },
    { id: 'guardians', title: 'Guardian Information' },
    { id: 'previous-school', title: 'Previous School' },
    { id: 'application', title: 'Application Details' },
    { id: 'review', title: 'Review & Submit' },
  ];

  const updateFormData = (section: keyof PublicAdmissionFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data,
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    try {
      setIsSubmitting(true);
      
      // Transform form data to match API expectations
      const submissionData = {
        studentFirstName: formData.student.firstName,
        studentLastName: formData.student.lastName,
        dateOfBirth: formData.student.dateOfBirth,
        gender: formData.student.gender,
        nationality: formData.student.nationality,
        medicalConditions: formData.student.medicalConditions,
        specialNeeds: formData.student.specialNeeds,
        guardians: formData.guardians,
        previousSchool: formData.previousSchool,
        preferredGrade: formData.application.preferredGrade,
        startDate: formData.application.startDate,
        additionalInfo: formData.application.additionalInfo,
        hearAboutUs: formData.application.hearAboutUs,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        applicationId: `APP-${Date.now()}`, // Generate a simple application ID
      };

      // Submit to API
      const response = await fetch('http://localhost:3003/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      const result = await response.json();
      
      // Redirect to tracking page with application ID
      router.push(`/apply/track?id=${result.applicationId || submissionData.applicationId}` as any);
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStudentStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            required
            value={formData.student.firstName}
            onChange={(e) => updateFormData('student', { ...formData.student, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.student.lastName}
            onChange={(e) => updateFormData('student', { ...formData.student, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            required
            value={formData.student.dateOfBirth}
            onChange={(e) => updateFormData('student', { ...formData.student, dateOfBirth: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            required
            value={formData.student.gender}
            onChange={(e) => updateFormData('student', { ...formData.student, gender: e.target.value as 'male' | 'female' | 'other' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nationality
          </label>
          <input
            type="text"
            value={formData.student.nationality}
            onChange={(e) => updateFormData('student', { ...formData.student, nationality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical Conditions (if any)
          </label>
          <textarea
            value={formData.student.medicalConditions}
            onChange={(e) => updateFormData('student', { ...formData.student, medicalConditions: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Needs (if any)
          </label>
          <textarea
            value={formData.student.specialNeeds}
            onChange={(e) => updateFormData('student', { ...formData.student, specialNeeds: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderGuardianStep = () => {
    const guardian = formData.guardians[0];
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Primary Guardian Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={guardian.firstName}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, firstName: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={guardian.lastName}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, lastName: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship *
            </label>
            <select
              required
              value={guardian.relationship}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, relationship: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={guardian.email}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, email: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={guardian.phone}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, phone: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation
            </label>
            <input
              type="text"
              value={guardian.occupation}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { ...guardian, occupation: e.target.value };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              required
              placeholder="Street Address"
              value={guardian.address.street}
              onChange={(e) => {
                const updatedGuardians = [...formData.guardians];
                updatedGuardians[0] = { 
                  ...guardian, 
                  address: { ...guardian.address, street: e.target.value }
                };
                updateFormData('guardians', updatedGuardians);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="City"
                value={guardian.address.city}
                onChange={(e) => {
                  const updatedGuardians = [...formData.guardians];
                  updatedGuardians[0] = { 
                    ...guardian, 
                    address: { ...guardian.address, city: e.target.value }
                  };
                  updateFormData('guardians', updatedGuardians);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="State"
                value={guardian.address.state}
                onChange={(e) => {
                  const updatedGuardians = [...formData.guardians];
                  updatedGuardians[0] = { 
                    ...guardian, 
                    address: { ...guardian.address, state: e.target.value }
                  };
                  updateFormData('guardians', updatedGuardians);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={guardian.address.postalCode}
                onChange={(e) => {
                  const updatedGuardians = [...formData.guardians];
                  updatedGuardians[0] = { 
                    ...guardian, 
                    address: { ...guardian.address, postalCode: e.target.value }
                  };
                  updateFormData('guardians', updatedGuardians);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Country"
                value={guardian.address.country}
                onChange={(e) => {
                  const updatedGuardians = [...formData.guardians];
                  updatedGuardians[0] = { 
                    ...guardian, 
                    address: { ...guardian.address, country: e.target.value }
                  };
                  updateFormData('guardians', updatedGuardians);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviousSchoolStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Previous School Information</h2>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Name
          </label>
          <input
            type="text"
            value={formData.previousSchool.name}
            onChange={(e) => updateFormData('previousSchool', { ...formData.previousSchool, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Address
          </label>
          <input
            type="text"
            value={formData.previousSchool.address}
            onChange={(e) => updateFormData('previousSchool', { ...formData.previousSchool, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Grade Completed
          </label>
          <select
            value={formData.previousSchool.lastGrade}
            onChange={(e) => updateFormData('previousSchool', { ...formData.previousSchool, lastGrade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select grade</option>
            <option value="kindergarten">Kindergarten</option>
            <option value="1st">1st Grade</option>
            <option value="2nd">2nd Grade</option>
            <option value="3rd">3rd Grade</option>
            <option value="4th">4th Grade</option>
            <option value="5th">5th Grade</option>
            <option value="6th">6th Grade</option>
            <option value="7th">7th Grade</option>
            <option value="8th">8th Grade</option>
            <option value="9th">9th Grade</option>
            <option value="10th">10th Grade</option>
            <option value="11th">11th Grade</option>
            <option value="12th">12th Grade</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Leaving
          </label>
          <textarea
            value={formData.previousSchool.reasonForLeaving}
            onChange={(e) => updateFormData('previousSchool', { ...formData.previousSchool, reasonForLeaving: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderApplicationStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Grade *
          </label>
          <select
            required
            value={formData.application.preferredGrade}
            onChange={(e) => updateFormData('application', { ...formData.application, preferredGrade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select grade</option>
            <option value="kindergarten">Kindergarten</option>
            <option value="1st">1st Grade</option>
            <option value="2nd">2nd Grade</option>
            <option value="3rd">3rd Grade</option>
            <option value="4th">4th Grade</option>
            <option value="5th">5th Grade</option>
            <option value="6th">6th Grade</option>
            <option value="7th">7th Grade</option>
            <option value="8th">8th Grade</option>
            <option value="9th">9th Grade</option>
            <option value="10th">10th Grade</option>
            <option value="11th">11th Grade</option>
            <option value="12th">12th Grade</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Start Date *
          </label>
          <input
            type="date"
            required
            value={formData.application.startDate}
            onChange={(e) => updateFormData('application', { ...formData.application, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.application.hearAboutUs}
            onChange={(e) => updateFormData('application', { ...formData.application, hearAboutUs: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select option</option>
            <option value="website">School Website</option>
            <option value="social_media">Social Media</option>
            <option value="referral">Friend/Family Referral</option>
            <option value="advertisement">Advertisement</option>
            <option value="school_visit">School Visit</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={formData.application.additionalInfo}
            onChange={(e) => updateFormData('application', { ...formData.application, additionalInfo: e.target.value })}
            rows={4}
            placeholder="Please share any additional information about your child or specific requirements..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Review Your Application</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900">Student Information</h3>
          <p className="text-gray-700">
            {formData.student.firstName} {formData.student.lastName} • {formData.student.gender} • {formData.student.dateOfBirth}
          </p>
          {formData.student.nationality && <p className="text-gray-600">Nationality: {formData.student.nationality}</p>}
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900">Primary Guardian</h3>
          <p className="text-gray-700">
            {formData.guardians[0].firstName} {formData.guardians[0].lastName} ({formData.guardians[0].relationship})
          </p>
          <p className="text-gray-600">{formData.guardians[0].email} • {formData.guardians[0].phone}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900">Application Details</h3>
          <p className="text-gray-700">Preferred Grade: {formData.application.preferredGrade}</p>
          <p className="text-gray-700">Start Date: {formData.application.startDate}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          By submitting this application, you confirm that all information provided is accurate and complete. 
          You will receive a confirmation email with your application tracking number.
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStudentStep();
      case 1:
        return renderGuardianStep();
      case 2:
        return renderPreviousSchoolStep();
      case 3:
        return renderApplicationStep();
      case 4:
        return renderReviewStep();
      default:
        return renderStudentStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900">School Admission Application</h1>
            <p className="mt-2 text-gray-600">Apply for admission to our school - no account required</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    index <= currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`ml-4 h-0.5 w-16 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={submitApplication}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}