export interface GuestProfileFormData {
  displayFirstName: string;
  displayLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isMinor: boolean;
  guardianFirstName: string;
  guardianLastName: string;
}

export const INITIAL_GUEST_PROFILE_FORM_DATA: GuestProfileFormData = {
  displayFirstName: '',
  displayLastName: '',
  legalFirstName: '',
  legalLastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA',
  isMinor: false,
  guardianFirstName: '',
  guardianLastName: '',
};

export type ValidationErrors = Record<string, string>;

type StringField = Exclude<
  keyof GuestProfileFormData,
  'isMinor' | 'guardianFirstName' | 'guardianLastName' | 'dateOfBirth' | 'phone'
>;

const REQUIRED_FIELDS: Array<{ field: StringField; message: string }> = [
  { field: 'displayFirstName', message: 'Display first name is required.' },
  { field: 'displayLastName', message: 'Display last name is required.' },
  { field: 'legalFirstName', message: 'Legal first name is required.' },
  { field: 'legalLastName', message: 'Legal last name is required.' },
  { field: 'email', message: 'Email is required.' },
  { field: 'street', message: 'Street is required.' },
  { field: 'city', message: 'City is required.' },
  { field: 'state', message: 'State is required.' },
  { field: 'zip', message: 'ZIP is required.' },
  { field: 'country', message: 'Country is required.' },
];

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const hasBirthdayPassed = today >= new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  return today.getFullYear() - dob.getFullYear() - (hasBirthdayPassed ? 0 : 1);
}

function validateDateOfBirth(dateOfBirth: string): string | undefined {
  if (!dateOfBirth.trim()) {
    return 'Date of birth is required.';
  }
  const age = calculateAge(dateOfBirth);
  if (age < 16) {
    return 'Members must be at least 16 years old to register.';
  }
  return undefined;
}

function validateGuardianFields(formData: GuestProfileFormData): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!formData.guardianFirstName.trim()) {
    errors.guardianFirstName = 'Guardian first name is required.';
  }
  if (!formData.guardianLastName.trim()) {
    errors.guardianLastName = 'Guardian last name is required.';
  }
  return errors;
}

export function validateGuestProfile(formData: GuestProfileFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const { field, message } of REQUIRED_FIELDS) {
    if (!formData[field].trim()) {
      errors[field] = message;
    }
  }

  const dobError = validateDateOfBirth(formData.dateOfBirth);
  if (dobError) {
    errors.dateOfBirth = dobError;
  }

  if (formData.isMinor) {
    Object.assign(errors, validateGuardianFields(formData));
  }

  return errors;
}

export function buildGuestProfilePayload(formData: GuestProfileFormData) {
  return {
    displayFirstName: formData.displayFirstName.trim(),
    displayLastName: formData.displayLastName.trim(),
    personalInfo: {
      legalFirstName: formData.legalFirstName.trim(),
      legalLastName: formData.legalLastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
        country: formData.country.trim(),
      },
    },
    ...(formData.isMinor
      ? {
          guardian: {
            firstName: formData.guardianFirstName.trim(),
            lastName: formData.guardianLastName.trim(),
          },
        }
      : {}),
    profileComplete: true,
  };
}
