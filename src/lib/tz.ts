// Resolve an IANA time zone (e.g. 'Europe/London') to its current UTC offset in
// hours, using the JS Intl database (no extra dependency). Handles half-hour and
// 45-min zones (e.g. India +5.5, Nepal +5.75). Brazil has no DST since 2019, but
// this stays correct for the rest of the world by evaluating the offset "now".
export function offsetHoursForZone(timeZone: string, at: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(at);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0';
    const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    const h = parseInt(m[2], 10);
    const min = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (h + min / 60);
  } catch {
    return 0;
  }
}
