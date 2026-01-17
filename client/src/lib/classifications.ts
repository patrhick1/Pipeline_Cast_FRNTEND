/**
 * Shared classification constants for email threads
 * Used by both client and admin inboxes
 */

export interface ClassificationConfig {
  value: string;
  label: string;
  color: string;
  category: 'ai' | 'workflow';
}

/**
 * All available classification types
 * 8 AI classifications + 5 Workflow classifications
 */
export const CLASSIFICATION_TYPES: ClassificationConfig[] = [
  // AI Classifications (8 types)
  {
    value: 'Accepted',
    label: 'Accepted',
    color: 'bg-green-500',
    category: 'ai'
  },
  {
    value: 'Conditional',
    label: 'Conditional',
    color: 'bg-blue-500',
    category: 'ai'
  },
  {
    value: 'No Guests',
    label: 'No Guests',
    color: 'bg-gray-500',
    category: 'ai'
  },
  {
    value: 'Identity-based rejection',
    label: 'Identity Mismatch',
    color: 'bg-red-500',
    category: 'ai'
  },
  {
    value: 'Topic-based rejection',
    label: 'Topic Mismatch',
    color: 'bg-orange-500',
    category: 'ai'
  },
  {
    value: 'Qualification-based rejection',
    label: 'Soft Rejection',
    color: 'bg-yellow-500',
    category: 'ai'
  },
  {
    value: 'Pay-to-Play',
    label: 'Pay-to-Play',
    color: 'bg-gold-500',
    category: 'ai'
  },
  {
    value: 'Others',
    label: 'Others',
    color: 'bg-gray-400',
    category: 'ai'
  },
  // Workflow Classifications (5 types)
  {
    value: 'Follow up',
    label: 'Follow up',
    color: 'bg-teal-500',
    category: 'workflow'
  },
  {
    value: 'Need more info',
    label: 'Need more info',
    color: 'bg-amber-500',
    category: 'workflow'
  },
  {
    value: 'Pending review',
    label: 'Pending review',
    color: 'bg-navy-500',
    category: 'workflow'
  },
  {
    value: 'Archive later',
    label: 'Archive later',
    color: 'bg-slate-500',
    category: 'workflow'
  },
  {
    value: 'Hard reject',
    label: 'Hard Reject',
    color: 'bg-rose-600',
    category: 'workflow'
  }
];

/**
 * Get AI classification types only
 */
export const getAIClassifications = () =>
  CLASSIFICATION_TYPES.filter(c => c.category === 'ai');

/**
 * Get workflow classification types only
 */
export const getWorkflowClassifications = () =>
  CLASSIFICATION_TYPES.filter(c => c.category === 'workflow');

/**
 * Get color for a classification value
 * Returns default color if classification not found
 */
export const getClassificationColor = (classification: string | null | undefined): string => {
  if (!classification) return 'bg-gray-400';

  const config = CLASSIFICATION_TYPES.find(c => c.value === classification);
  return config?.color || 'bg-gray-400';
};

/**
 * Get label for a classification value
 * Returns the value itself if no specific label found
 */
export const getClassificationLabel = (classification: string | null | undefined): string => {
  if (!classification) return 'Unclassified';

  const config = CLASSIFICATION_TYPES.find(c => c.value === classification);
  return config?.label || classification;
};

/**
 * Check if a classification is a predefined type
 */
export const isPredefinedClassification = (classification: string): boolean => {
  return CLASSIFICATION_TYPES.some(c => c.value === classification);
};

/**
 * Get all classification values as array
 */
export const getAllClassificationValues = (): string[] => {
  return CLASSIFICATION_TYPES.map(c => c.value);
};
