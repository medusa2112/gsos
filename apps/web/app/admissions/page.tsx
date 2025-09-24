'use client';

import React, { useState, lazy, Suspense } from 'react';
import { Button } from '@gsos/ui';

// Lazy load heavy form components
const StudentInfoStep = lazy(() => import('./components/StudentInfoStep').then(module => ({ default: module.StudentInfoStep })));
const GuardianInfoStep = lazy(() => import('./components/GuardianInfoStep').then(module => ({ default: module.GuardianInfoStep })));
const PreviousSchoolStep = lazy(() => import('./components/PreviousSchoolStep').then(module => ({ default: module.PreviousSchoolStep })));
const DocumentsStep = lazy(() => import('./components/DocumentsStep').then(module => ({ default: module.DocumentsStep })));
const ReviewStep = lazy(() => import('./components/ReviewStep').then(module => ({ default: module.ReviewStep })));

export interface AdmissionFormData {
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
  
  // Documents
  documents: Array<{
    type: string;
    file?: File;
    uploaded: boolean;
  }>;
}

const STEPS = [
  { id: 'student', title: 'Student Information', component: StudentInfoStep },
  { id: 'guardians', title: 'Guardian Information', component: GuardianInfoStep },
  { id: 'previous-school', title: 'Previous School', component: PreviousSchoolStep },
  { id: 'documents', title: 'Documents', component: DocumentsStep },
  { id: 'review', title: 'Review & Submit', component: ReviewStep },
];

export default function AdmissionsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AdmissionFormData>({
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
    documents: [
      { type: 'birth_certificate', uploaded: false },
      { type: 'passport_photo', uploaded: false },
      { type: 'previous_school_records', uploaded: false },
      { type: 'medical_records', uploaded: false },
    ],
  });

  const updateFormData = (section: keyof AdmissionFormData, data: any) => {
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
      // Transform form data to match API expectations
      const submissionData = {
        studentFirstName: formData.student.firstName,
        studentLastName: formData.student.lastName,
        dateOfBirth: formData.student.dateOfBirth,
        gender: formData.student.gender,
        nationality: formData.student.nationality,
        medicalConditions: formData.student.medicalConditions,
        specialNeeds: formData.student.specialNeeds,
        guardians: formData.guardians.map(guardian => ({
          type: guardian.type,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          relationship: guardian.relationship,
          email: guardian.email,
          phone: guardian.phone,
          address: guardian.address,
          occupation: guardian.occupation,
          employer: guardian.employer,
          emergencyContact: guardian.emergencyContact,
        })),
        previousSchool: formData.previousSchool,
        documents: formData.documents.filter(doc => doc.uploaded).map(doc => ({
          type: doc.type,
          fileName: doc.file?.name || '',
        })),
        status: 'submitted',
        submittedAt: new Date().toISOString(),
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
      
      // Show success message and redirect or reset form
      alert(`Application submitted successfully! Application ID: ${result.id}`);
      
      // Reset form or redirect to success page
      setCurrentStep(0);
      setFormData({
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
        documents: [
          { type: 'birth_certificate', uploaded: false },
          { type: 'passport_photo', uploaded: false },
          { type: 'previous_school_records', uploaded: false },
          { type: 'medical_records', uploaded: false },
        ],
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">School Admission Application</h1>
          <p className="mt-2 text-gray-600">Please complete all sections to submit your application</p>
        </div>

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
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                aria-hidden="true"
              ></div>
              <span 
                className="ml-3 text-gray-600"
                aria-live="polite"
                aria-label="Loading admission form"
              >
                Loading form...
              </span>
            </div>
          }>
            <CurrentStepComponent
              data={formData}
              updateData={updateFormData}
              onNext={nextStep}
              onPrev={prevStep}
              onSubmit={submitApplication}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
            />
          </Suspense>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          
          <Button
            onClick={nextStep}
            disabled={currentStep === STEPS.length - 1}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {currentStep === STEPS.length - 1 ? 'Submit Application' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}