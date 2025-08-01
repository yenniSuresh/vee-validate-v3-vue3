export function warn(message) {
  console.warn(`[vee-validate] ${message}`);
}
export function interpolate(template, values) {
  return template.replace(/{([^}]+)}/g, (_, p) => (p in values ? values[p] : `{${p}}`));
}
