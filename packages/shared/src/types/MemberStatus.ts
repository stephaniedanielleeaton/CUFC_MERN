export const MemberStatus = {
  New: 'New',
  Full: 'Full',
} as const;

export type MemberStatus = typeof MemberStatus[keyof typeof MemberStatus];
