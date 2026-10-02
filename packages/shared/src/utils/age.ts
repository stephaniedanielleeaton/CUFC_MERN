export const MINIMUM_MEMBER_AGE = 18;

/**
 * Calculates age in whole years from a date of birth, as of today.
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const hasHadBirthdayThisYear = today >= new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  return today.getFullYear() - dob.getFullYear() - (hasHadBirthdayThisYear ? 0 : 1);
}

/**
 * Returns true if the given date of birth meets the club's minimum member age (18+).
 */
export function isAtLeastMinimumAge(dateOfBirth: string | Date): boolean {
  return calculateAge(dateOfBirth) >= MINIMUM_MEMBER_AGE;
}
