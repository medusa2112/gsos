import React from 'react';
import { AdmissionFormData } from '../page';

interface GuardianInfoStepProps {
  data: AdmissionFormData;
  updateData: (section: keyof AdmissionFormData, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function GuardianInfoStep({ data, updateData, onNext }: GuardianInfoStepProps) {
  const updateGuardian = (index: number, field: string, value: any) => {
    const updatedGuardians = [...data.guardians];
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      const guardian = updatedGuardians[index];
      if (guardian && typeof guardian === 'object' && parentField in guardian) {
        updatedGuardians[index] = {
          ...guardian,
          [parentField]: {
            ...(guardian[parentField as keyof typeof guardian] as any),
            [childField]: value,
          },
        };
      }
    } else {
      updatedGuardians[index] = {
        ...updatedGuardians[index],
        [field]: value,
      };
    }
    updateData('guardians', updatedGuardians);
  };

  const addGuardian = () => {
    const newGuardian = {
      type: 'secondary' as const,
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
      emergencyContact: false,
    };
    updateData('guardians', [...data.guardians, newGuardian]);
  };

  const removeGuardian = (index: number) => {
    if (data.guardians.length > 1) {
      const updatedGuardians = data.guardians.filter((_, i) => i !== index);
      updateData('guardians', updatedGuardians);
    }
  };

  const isValid = () => {
    return data.guardians.every(guardian => 
      guardian.firstName && 
      guardian.lastName && 
      guardian.relationship && 
      guardian.email && 
      guardian.phone &&
      guardian.address.street &&
      guardian.address.city &&
      guardian.address.postalCode &&
      guardian.address.country
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Guardian Information</h2>
        <p className="text-gray-600 mb-6">Please provide details for at least one guardian or parent.</p>
      </div>

      {data.guardians.map((guardian, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {guardian.type === 'primary' ? 'Primary Guardian' : `Guardian ${index + 1}`}
            </h3>
            {data.guardians.length > 1 && (
              <button
                onClick={() => removeGuardian(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={guardian.firstName}
                onChange={(e) => updateGuardian(index, 'firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={guardian.lastName}
                onChange={(e) => updateGuardian(index, 'lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <select
                value={guardian.relationship}
                onChange={(e) => updateGuardian(index, 'relationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select relationship</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="guardian">Legal Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={guardian.email}
                onChange={(e) => updateGuardian(index, 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={guardian.phone}
                onChange={(e) => updateGuardian(index, 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <input
                type="text"
                value={guardian.occupation}
                onChange={(e) => updateGuardian(index, 'occupation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter occupation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employer
              </label>
              <input
                type="text"
                value={guardian.employer}
                onChange={(e) => updateGuardian(index, 'employer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter employer"
              />
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={guardian.address.street}
                  onChange={(e) => updateGuardian(index, 'address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter street address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={guardian.address.city}
                  onChange={(e) => updateGuardian(index, 'address.city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={guardian.address.state}
                  onChange={(e) => updateGuardian(index, 'address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter state/province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={guardian.address.postalCode}
                  onChange={(e) => updateGuardian(index, 'address.postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter postal code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={guardian.address.country}
                  onChange={(e) => updateGuardian(index, 'address.country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter country"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`emergencyContact-${index}`}
              checked={guardian.emergencyContact}
              onChange={(e) => updateGuardian(index, 'emergencyContact', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`emergencyContact-${index}`} className="ml-2 block text-sm text-gray-900">
              This person can be contacted in case of emergency
            </label>
          </div>
        </div>
      ))}

      <div className="flex justify-center">
        <button
          onClick={addGuardian}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Another Guardian
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Previous School
        </button>
      </div>
    </div>
  );
}