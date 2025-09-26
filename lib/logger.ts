type LogFields = Record<string, unknown>;

const SENSITIVE_KEYS = new Set(["image", "imageBase64", "contact", "ip", "ua"]);

function redact(fields?: LogFields) {
  if (!fields) return undefined;
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = SENSITIVE_KEYS.has(key) ? "[redacted]" : value;
  }
  return out;
}

function write(
  level: "info" | "warn" | "error",
  message: string,
  fields?: LogFields
) {
  const entry = {
    level,
    message,
    ts: new Date().toISOString(),
    ...redact(fields),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info(message: string, fields?: LogFields) {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields) {
    write("error", message, fields);
  },
};
