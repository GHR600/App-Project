/**
 * Centralized Icon System
 * All app icons using lucide-react-native for consistency
 */

import React from 'react';
import {
  Menu,
  Search,
  X,
  Flame,
  Trophy,
  Crown,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  Target,
  User,
  Check,
  Info,
  ChevronRight as ArrowRight,
  Calendar,
  BarChart3,
  Plus,
  Filter,
  Tag,
  MessageSquare,
  Type,
  Brain,
  TrendingUp,
  Sparkles,
  Lock,
  Zap,
  Award,
  Star,
  LogOut,
  Trash2,
  Upload,
  Image,
} from 'lucide-react-native';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Navigation Icons
export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Menu size={size} color={color} strokeWidth={strokeWidth} />
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <ChevronLeft size={size} color={color} strokeWidth={strokeWidth} />
);

export const ForwardIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <ChevronRight size={size} color={color} strokeWidth={strokeWidth} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <ArrowRight size={size} color={color} strokeWidth={strokeWidth} />
);

// Search & Filter Icons
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Search size={size} color={color} strokeWidth={strokeWidth} />
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <X size={size} color={color} strokeWidth={strokeWidth} />
);

export const FilterIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Filter size={size} color={color} strokeWidth={strokeWidth} />
);

export const TagIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Tag size={size} color={color} strokeWidth={strokeWidth} />
);

// Streak & Achievement Icons
export const FlameIcon: React.FC<IconProps & { fill?: string }> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2,
  fill
}) => (
  <Flame size={size} color={color} strokeWidth={strokeWidth} fill={fill} />
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Trophy size={size} color={color} strokeWidth={strokeWidth} />
);

export const CrownIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Crown size={size} color={color} strokeWidth={strokeWidth} />
);

// Journal Icons
export const FileTextIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <FileText size={size} color={color} strokeWidth={strokeWidth} />
);

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Plus size={size} color={color} strokeWidth={strokeWidth} />
);

// Theme Icons
export const SunIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Sun size={size} color={color} strokeWidth={strokeWidth} />
);

export const MoonIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Moon size={size} color={color} strokeWidth={strokeWidth} />
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Settings size={size} color={color} strokeWidth={strokeWidth} />
);

// AI Style Icons
export const TargetIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Target size={size} color={color} strokeWidth={strokeWidth} />
);

export const UserIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <User size={size} color={color} strokeWidth={strokeWidth} />
);

// UI State Icons
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Check size={size} color={color} strokeWidth={strokeWidth} />
);

export const InfoIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Info size={size} color={color} strokeWidth={strokeWidth} />
);

// Bottom Navigation Icons
export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Calendar size={size} color={color} strokeWidth={strokeWidth} />
);

export const StatsIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <BarChart3 size={size} color={color} strokeWidth={strokeWidth} />
);

// Content & Writing Icons
export const MessageSquareIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <MessageSquare size={size} color={color} strokeWidth={strokeWidth} />
);

export const TypeIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Type size={size} color={color} strokeWidth={strokeWidth} />
);

// Feature & Premium Icons
export const BrainIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Brain size={size} color={color} strokeWidth={strokeWidth} />
);

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <TrendingUp size={size} color={color} strokeWidth={strokeWidth} />
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Sparkles size={size} color={color} strokeWidth={strokeWidth} />
);

export const LockIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Lock size={size} color={color} strokeWidth={strokeWidth} />
);

export const ZapIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Zap size={size} color={color} strokeWidth={strokeWidth} />
);

export const AwardIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Award size={size} color={color} strokeWidth={strokeWidth} />
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Star size={size} color={color} strokeWidth={strokeWidth} />
);

// Account & Profile Icons
export const LogOutIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <LogOut size={size} color={color} strokeWidth={strokeWidth} />
);

export const Trash2Icon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Trash2 size={size} color={color} strokeWidth={strokeWidth} />
);

export const UploadIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Upload size={size} color={color} strokeWidth={strokeWidth} />
);

export const ImageIcon: React.FC<IconProps> = ({ size = 24, color = '#000', strokeWidth = 2 }) => (
  <Image size={size} color={color} strokeWidth={strokeWidth} />
);

// Mood Emojis - Keep as constants since emojis work well for emotions
export const MOOD_EMOJIS = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😄',
} as const;

export const getMoodEmoji = (rating?: number): string => {
  if (!rating || rating < 1 || rating > 5) return '';
  return MOOD_EMOJIS[rating as keyof typeof MOOD_EMOJIS];
};
