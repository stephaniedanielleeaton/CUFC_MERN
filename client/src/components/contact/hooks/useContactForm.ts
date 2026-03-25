import { useState, useCallback } from 'react';
import type { ContactFormData } from '../../../types/contact';

interface UseContactFormReturn {
  formData: ContactFormData;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  updateField: (field: keyof ContactFormData, value: string) => void;
  submitForm: () => Promise<void>;
  sendAnother: () => void;
}

export function useContactForm(): UseContactFormReturn {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    emailAddress: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback((field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit contact form');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const sendAnother = useCallback(() => {
    setFormData({
      fullName: '',
      emailAddress: '',
      message: '',
    });
    setIsSubmitted(false);
    setError(null);
  }, []);

  return {
    formData,
    isSubmitting,
    isSubmitted,
    error,
    updateField,
    submitForm,
    sendAnother,
  };
}
