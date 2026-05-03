import type { Student } from "../../quiz-core";

export const NO_IMAGE_URL = "/no-image.svg";

export function getPortraitImageUrl(student: Student): string {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? "/images/portrait/";
  return `${base}${student.id}.png`;
}

export function preloadPortraitImage(student: Student): void {
  const img = new Image();
  img.src = getPortraitImageUrl(student);
}
