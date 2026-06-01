import { format, parseISO, formatDistanceToNow } from "date-fns"

/** "15 Jan 2026" */
export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy")
}

/** "Jan 15" */
export function formatDateShort(iso: string): string {
  return format(parseISO(iso), "MMM dd")
}

/** "Jan 2026" */
export function formatMonthYear(iso: string): string {
  return format(parseISO(iso), "MMM yyyy")
}

/** "3 days ago" */
export function getDaysAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}
