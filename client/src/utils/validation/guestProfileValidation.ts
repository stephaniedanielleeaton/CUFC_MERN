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

export function validateGuestProfile(formData: GuestProfileFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formData.displayFirstName.trim()) {
    errors.displayFirstName = 'Display first name is required.';
  }
  if (!formData.displayLastName.trim()) {
    errors.displayLastName = 'Display last name is required.';
  }
  if (!formData.legalFirstName.trim()) {
    errors.legalFirstName = 'Legal first name is required.';
  }
  if (!formData.legalLastName.trim()) {
    errors.legalLastName = 'Legal last name is required.';
  }
  if (!formData.email.trim()) {
    errors.email = 'Email is required.';
  }

  if (formData.dateOfBirth.trim()) {
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    const age =
      today.getFullYear() -
      dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 16) {
      errors.dateOfBirth = 'Members must be at least 16 years old to register.';
    }
  } else {
    errors.dateOfBirth = 'Date of birth is required.';
  }

  if (!formData.street.trim()) errors.street = 'Street is required.';
  if (!formData.city.trim()) errors.city = 'City is required.';
  if (!formData.state.trim()) errors.state = 'State is required.';
  if (!formData.zip.trim()) errors.zip = 'ZIP is required.';
  if (!formData.country.trim()) errors.country = 'Country is required.';

  if (formData.isMinor) {
    if (!formData.guardianFirstName.trim()) {
      errors.guardianFirstName = 'Guardian first name is required.';
    }
    if (!formData.guardianLastName.trim()) {
      errors.guardianLastName = 'Guardian last name is required.';
    }
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
