const prefix = "[Patrimoine Bankin Exporter]";

export const logger = {
  info(message: string, ...args: unknown[]) {
    console.info(prefix, message, ...args);
  },
  warn(message: string, ...args: unknown[]) {
    console.warn(prefix, message, ...args);
  },
  error(message: string, ...args: unknown[]) {
    console.error(prefix, message, ...args);
  }
};
