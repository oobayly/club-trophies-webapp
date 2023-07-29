export type NgColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

export const NgIconMap = new Map<NgColor, string>([
  ["success", "bi-check-circle"],
  ["danger", "bi-exclamation-octagon"],
  ["warning", "bi-exclamation-triangle"],
  ["info", "bi-info-circle"],
]);

export const getIconForColor = (color: NgColor): string | undefined => {
  return NgIconMap.get(color);
}
