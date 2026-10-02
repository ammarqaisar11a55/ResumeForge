import {
  AlignLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Heart,
  Languages,
  Puzzle,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { SectionIcon } from '@resumeforge/core';

export const SECTION_ICONS: Record<SectionIcon, LucideIcon> = {
  'align-left': AlignLeft,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  'folder-git': FolderGit2,
  wrench: Wrench,
  trophy: Trophy,
  'badge-check': BadgeCheck,
  award: Award,
  'book-open': BookOpen,
  languages: Languages,
  heart: Heart,
  puzzle: Puzzle,
};
