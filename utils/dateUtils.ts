// utils/dateUtils.ts
/**
 * Formatea una fecha en español
 * @param date Fecha a formatear
 * @returns Fecha formateada (ej: "Lun, 10 de Enero a las 15:00")
 */
export function formatDate(date: Date): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  // Formatear la hora (15:00)
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  return `${dayName}, ${day} de ${month} a las ${time}`;
}

/**
 * Comprueba si una fecha es hoy
 * @param date Fecha a comprobar
 * @returns true si la fecha es hoy, false en caso contrario
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Obtiene una fecha formateada más simple (solo día y mes)
 * @param date Fecha a formatear
 * @returns Fecha formateada (ej: "10 Ene")
 */
export function getShortDate(date: Date): string {
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${day} ${month}`;
}

/**
 * Formatea la hora de una fecha
 * @param date Fecha de la que obtener la hora
 * @returns Hora formateada (ej: "15:00")
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
