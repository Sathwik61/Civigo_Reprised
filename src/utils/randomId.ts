export function numericId():string {
  return String(
    Date.now().toString() +
    Math.floor(Math.random() * 1e6).toString().padStart(6, "0")
  );
}