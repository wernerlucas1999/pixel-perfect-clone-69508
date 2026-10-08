// Texto de la antigüedad de los datos ("hace X min"), para la barra de la pantalla.
export function dataAgeLabel(fetchedAt: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - fetchedAt) / 60_000);
  if (minutes < 1) return "hace menos de 1 min";
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}
