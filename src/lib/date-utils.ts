// PV_MOLDES V2.4
/**
 * Intenta parsear una fecha en varios formatos comunes (ISO, MM/DD/YYYY, DD/MM/YYYY)
 */
export function parseFlexibleDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;

    // 1. Intentar parseo directo
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // 2. Intentar formato MM/DD/YYYY (común en tu DB)
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Asumiendo MM/DD/YYYY
            const mm = parseInt(parts[0], 10) - 1;
            const dd = parseInt(parts[1], 10);
            const yyyy = parseInt(parts[2], 10);
            date = new Date(yyyy, mm, dd);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return null;
}

/**
 * Calcula la fecha final sumando días hábiles a una fecha inicial.
 * Los días hábiles son Lunes a Viernes.
 */
export function addBusinessDays(startDate: Date | string | null, daysToSum: number): Date {
    let date: Date;

    if (startDate instanceof Date) {
        date = new Date(startDate.getTime());
    } else {
        const parsed = parseFlexibleDate(startDate);
        date = parsed ? new Date(parsed.getTime()) : new Date();
    }

    // Si la fecha inicial es inválida por algún motivo, usar hoy
    if (isNaN(date.getTime())) date = new Date();

    // Si es 0 o menos, retornamos la misma fecha
    if (daysToSum <= 0 || isNaN(daysToSum)) return date;

    let addedDays = 0;
    const fullDays = Math.floor(daysToSum);
    const partialDay = daysToSum - fullDays;

    // Evitar bucles infinitos por fechas extremas o errores
    let iterations = 0;
    while (addedDays < fullDays && iterations < 1000) {
        iterations++;
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }

    if (partialDay > 0) {
        date.setDate(date.getDate() + 1);
        let partialIterations = 0;
        while ((date.getDay() === 0 || date.getDay() === 6) && partialIterations < 7) {
            partialIterations++;
            date.setDate(date.getDate() + 1);
        }
    }

    return date;
}
