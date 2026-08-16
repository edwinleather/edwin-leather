export const GENERIC_ERROR = "Something went wrong. Please try again in a moment, or reach out to us via phone.";

export function logAndGeneric(error: unknown, context?: string): string {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  if (detail) {
    console.error(context ? `[${context}]` : "[error]", detail);
  }
  return GENERIC_ERROR;
}