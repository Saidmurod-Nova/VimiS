export function formatUzbekPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return `+998${groups.length ? ` ${groups.join(" ")}` : " "}`;
}

export function normalizeUzbekPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const nationalDigits = digits.startsWith("998") ? digits.slice(3) : digits;
  return `+998${nationalDigits}`;
}

export function isValidUzbekPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 9 || (digits.startsWith("998") && digits.length === 12);
}