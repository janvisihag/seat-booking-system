/**
 * Utility functions for seat booking business logic
 * Refactored to work with new batch scheduling system
 */

/**
 * User interface for booking validation
 */
interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: number;
}

/**
 * Format a date to YYYY-MM-DD string
 */
// export function formatDate(date: Date): string {
//   return date.toISOString().split('T')[0];
// }

// /**
//  * Parse a date string YYYY-MM-DD to Date
//  */
// export function parseDate(dateStr: string): Date {
//   return new Date(dateStr + 'T00:00:00Z');
// }

// /**
//  * Get the name of a day
//  */
// export function getDayName(date: Date): string {
//   const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//   return days[date.getDay()];
// }

// /**
//  * Get week dates (Monday to Friday for a given date's week)
//  */
// export function getWeekDates(date: Date): Date[] {
//   const d = new Date(date);
//   const day = d.getDay();

//   // Adjust to Monday of the week
//   const diff = d.getDate() - day + (day === 0 ? -6 : 1);
//   const monday = new Date(d.setDate(diff));

//   const weekDates: Date[] = [];
//   for (let i = 0; i < 7; i++) {
//     const date = new Date(monday);
//     date.setDate(date.getDate() + i);
//     weekDates.push(date);
//   }

//   return weekDates;
// }

/**
 * Check if a date is a working day (Monday-Friday)
 */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Get the number of working days between two dates
 */
export function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWorkingDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Get next working day
 */
export function getNextWorkingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (!isWorkingDay(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Check if current time has passed 3 PM
 */
export function hasPassedThreePM(): boolean {
  const now = new Date();
  return now.getHours() >= 15;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if booking time is valid for a given date
 * Next day booking only allowed after 3 PM
 */
export function isBookingTimeValid(
  bookingDate: Date,
  currentTime: Date = new Date(),
): boolean {
  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(bookingDate);
  targetDate.setHours(0, 0, 0, 0);

  // If booking for today, always allowed
  if (today.getTime() === targetDate.getTime()) {
    return true;
  }

  // If booking for future, check if after 3 PM
  if (targetDate.getTime() > today.getTime()) {
    const hour = currentTime.getHours();
    return hour >= 3; // After 1 PM (13:00)
  }

  // Can't book for past dates
  return false;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get day of week (0-6, where 0 is Sunday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get day name (Monday, Tuesday, etc.)
 */
export function getDayName(date: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[getDayOfWeek(date)];
}

/**
 * Get the week's Monday date
 */
export function getWeekMonday(date: Date): Date {
  const day = getDayOfWeek(date);
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

/**
 * Get dates for the current/specified week (Monday-Friday)
 */
export function getWeekDates(startDate: Date): Date[] {
  const monday = getWeekMonday(startDate);
  const dates: Date[] = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = getDayOfWeek(date);
  return day === 0 || day === 6;
}

/**
 * Validate booking eligibility
 */
export function validateBookingEligibility(
  user: User,
  date: Date,
  isHoliday: boolean,
  bookingTime: Date = new Date(),
): { eligible: boolean; reason?: string } {
  if (isHoliday) {
    return { eligible: false, reason: "This date is a holiday" };
  }

  if (isWeekend(date)) {
    return { eligible: false, reason: "Cannot book on weekends" };
  }

  // Note: User batch scheduling check should be done via the batch-scheduling-service
  // This is a simplified validation that can be enhanced

  if (!isBookingTimeValid(date, bookingTime)) {
    return {
      eligible: false,
      reason: "Booking only allowed after 3 PM for next day",
    };
  }

  return { eligible: true };
}

/**
 * Check if user is allowed to book on a given day (simplified version)
 * Full batch scheduling logic is in batch-scheduling-service
 */
function isUserAllowedOnDay(user: User, date: Date): boolean {
  // In production, this should call to batch-scheduling-service
  // For now, we check basic constraints
  return isWorkingDay(date);
}
