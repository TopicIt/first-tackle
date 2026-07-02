function readBooleanFlag(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const SERVER_AUTHORITATIVE_CATCH = readBooleanFlag(
  import.meta.env?.VITE_SERVER_AUTHORITATIVE_CATCH,
  false,
);
