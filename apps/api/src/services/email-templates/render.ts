import { sanitizeInput } from "../email.js";

export function renderTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  let result = template;

  // Process {{#if variable}}...{{/if}} blocks: show content only when the
  // variable is truthy (non-empty, non-undefined, non-null).  Also supports
  // negated form: {{#unless variable}}...{{/unless}}.
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key: string, body: string) => {
    const val = vars[key];
    return val !== undefined && val !== null && val !== "" ? body : "";
  });

  result = result.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_match, key: string, body: string) => {
    const val = vars[key];
    return val === undefined || val === null || val === "" ? body : "";
  });

  for (const [key, value] of Object.entries(vars)) {
    const safe = value === undefined || value === null ? "" : String(value);
    const escaped = sanitizeInput(safe);
    result = result.replaceAll(`{{${key}}}`, escaped);
  }
  return result;
}
