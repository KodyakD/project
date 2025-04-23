import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a Firebase Timestamp or date object to a readable string
 */
export const formatDate = (dateObj: any): string => {
  // Handle null or undefined
  if (!dateObj) {
    return 'N/A';
  }
  
  // Convert Firebase Timestamp to Date if needed
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format based on how recent the date is
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  } else if (date.getFullYear() === new Date().getFullYear()) {
    return format(date, 'MMM d, h:mm a');
  } else {
    return format(date, 'MMM d, yyyy, h:mm a');
  }
};

/**
 * Format relative time (e.g. "5 minutes ago")
 */
export const formatRelativeTime = (dateObj: any): string => {
  // Handle null or undefined
  if (!dateObj) {
    return 'N/A';
  }
  
  // Convert Firebase Timestamp to Date if needed
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Calculate duration between two dates in minutes
 */
export const getDurationInMinutes = (
  startDate: any,
  endDate: any = new Date()
): number => {
  // Handle null or undefined
  if (!startDate) {
    return 0;
  }
  
  // Convert Firebase Timestamp to Date if needed
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
  const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
  
  // Handle invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  // Calculate difference in milliseconds and convert to minutes
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Format a duration in minutes to a readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else if (minutes < 1440) { // Less than a day
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
    }
  } else { // Days
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    
    if (remainingHours === 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else {
      return `${days} ${days === 1 ? 'day' : 'days'}, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`;
    }
  }
}; 