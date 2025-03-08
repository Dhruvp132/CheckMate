import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string and properly handles Tailwind CSS class conflicts.
 *
 * @param inputs - Class names or conditional class expressions
 * @returns A merged string of class names with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

