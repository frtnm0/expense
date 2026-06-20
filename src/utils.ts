const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function getMonday(d: Date): Date {
  const date = new Date(d.getTime());
  const day = date.getDay();
  // Adjust so Monday is 1, Sunday is 7. If day is 0 (Sunday), diff is -6. Otherwise, diff is 1 - day.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(date.getTime());
  result.setDate(diff);
  return result;
}

export function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday.getTime());
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

export function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateRange(monday: Date): string {
  const sunday = new Date(monday.getTime());
  sunday.setDate(monday.getDate() + 6);

  const startMonth = MONTH_NAMES[monday.getMonth()];
  const startDay = monday.getDate();
  const endMonth = MONTH_NAMES[sunday.getMonth()];
  const endDay = sunday.getDate();

  if (monday.getFullYear() !== sunday.getFullYear()) {
    return `${startMonth} ${startDay}, ${monday.getFullYear()} to ${endMonth} ${endDay}, ${sunday.getFullYear()}`;
  }

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startMonth} ${startDay} to ${endDay}`;
  }

  return `${startMonth} ${startDay} to ${endMonth} ${endDay}`;
}

export function formatDayName(d: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[d.getDay()];
  const monthName = SHORT_MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  return `${monthName} ${day} - ${dayName}`;
}
