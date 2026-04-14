/**
 * Utility functions for seat booking business logic
 */

interface User {
  id: string;
  name: string;
  squad_id: number;
  batch: 1 | 2;
}

interface Booking {
  id: string;
  user_id: string;
  seat_id: number;
  date: string;
  status: 'booked' | 'released';
}

/**
 * Get week type for a given date
 * Determines if we're in Week 1 or Week 2 of the batch cycle
 */
export function getWeekType(date: Date): 'week1' | 'week2' {
  // Get the week number from the beginning of the year
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.floor(diff / oneWeek);

  // Odd weeks are week1, even weeks are week2
  return weekNumber % 2 === 0 ? 'week1' : 'week2';
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Check if a user is allowed to book on a given date based on batch schedule
 */
export function isUserAllowedOnDay(user: User, date: Date): boolean {
  const dayOfWeek = getDayOfWeek(date);
  const weekType = getWeekType(date);

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Batch 1 schedule
  if (user.batch === 1) {
    if (weekType === 'week1') {
      // Week 1: Monday-Wednesday (days 1-3)
      return dayOfWeek >= 1 && dayOfWeek <= 3;
    } else {
      // Week 2: Thursday-Friday (days 4-5)
      return dayOfWeek >= 4 && dayOfWeek <= 5;
    }
  }

  // Batch 2 schedule
  if (user.batch === 2) {
    if (weekType === 'week1') {
      // Week 1: Thursday-Friday (days 4-5)
      return dayOfWeek >= 4 && dayOfWeek <= 5;
    } else {
      // Week 2: Monday-Wednesday (days 1-3)
      return dayOfWeek >= 1 && dayOfWeek <= 3;
    }
  }

  return false;
}

/**
 * Check if booking time is valid for a given date
 * Next day booking only allowed after 3 PM
 */
export function isBookingTimeValid(bookingDate: Date, currentTime: Date = new Date()): boolean {
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
    return hour >= 13; // After 1 PM (13:00)
  }

  // Can't book for past dates
  return false;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get day name (Monday, Tuesday, etc.)
 */
export function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  bookingTime: Date = new Date()
): { eligible: boolean; reason?: string } {
  if (isHoliday) {
    return { eligible: false, reason: 'This date is a holiday' };
  }

  if (isWeekend(date)) {
    return { eligible: false, reason: 'Cannot book on weekends' };
  }

  if (!isUserAllowedOnDay(user, date)) {
    return { eligible: false, reason: 'Not scheduled for this day' };
  }

  if (!isBookingTimeValid(date, bookingTime)) {
    return { eligible: false, reason: 'Booking only allowed after 3 PM for next day' };
  }

  return { eligible: true };
}
