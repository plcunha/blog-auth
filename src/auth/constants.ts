export const JWT_CONSTANTS = {
  /** Fallback secret — overridden by ConfigService in production */
  DEFAULT_SECRET: 'default-dev-secret-change-in-production',
  DEFAULT_EXPIRATION: '3600s',
} as const;
