/**
 * Full list of IANA timezones for company/site settings.
 * Uses Intl.supportedValuesOf for all browser-supported timezones.
 */

export interface TimezoneOption {
  value: string;
  label: string;
}

const formatTimezoneLabel = (tz: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const offset = tzPart?.value ?? '';
    return `${tz} (${offset})`;
  } catch {
    return tz;
  }
};

const buildTimezoneOptions = (): TimezoneOption[] => {
  let zones: string[] = [];
  try {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    zones = supportedValuesOf ? supportedValuesOf('timeZone') : [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) {
    zones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
  }
  const sorted = [...zones].sort((a, b) => {
    if (a === 'UTC') return -1;
    if (b === 'UTC') return 1;
    return a.localeCompare(b);
  });
  return sorted.map((tz) => ({ value: tz, label: formatTimezoneLabel(tz) }));
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = buildTimezoneOptions();
