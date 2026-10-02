import type { ContactKind } from '@resumeforge/core';

export const CONTACT_LABELS: Record<ContactKind, string> = {
  email: 'Email',
  phone: 'Phone',
  location: 'City, Country',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  leetcode: 'LeetCode',
  other: 'Other link',
};

export const PLACEHOLDERS: Record<ContactKind, string> = {
  email: 'you@example.com',
  phone: '+1 555 0100 200',
  location: 'Lahore, Pakistan',
  website: 'yourname.dev',
  linkedin: 'linkedin.com/in/yourname',
  github: 'github.com/yourname',
  portfolio: 'portfolio.yourname.dev',
  leetcode: 'leetcode.com/u/yourname',
  other: 'example.com/profile',
};
