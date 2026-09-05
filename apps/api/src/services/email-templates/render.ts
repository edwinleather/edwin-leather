import { sanitizeInput } from "../email.js";

export function renderTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const safe = value === undefined || value === null ? "" : String(value);
    const escaped = sanitizeInput(safe);
    result = result.replaceAll(`{{${key}}}`, escaped);
  }
  return result;
}
