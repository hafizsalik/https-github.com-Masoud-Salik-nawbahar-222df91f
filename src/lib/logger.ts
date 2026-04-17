/**
 * Environment-aware logger utility
 * Only logs in development mode to avoid console pollution in production
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export const logger = {
    dev: (message: string, data?: any) => {
        if (import.meta.env.DEV) {
            console.log(`[DEV] ${message}`, data);
        }
    },

    info: (message: string, data?: any) => {
        if (import.meta.env.DEV) {
            console.info(`[INFO] ${message}`, data);
        }
    },

    warn: (message: string, data?: any) => {
        if (import.meta.env.DEV) {
            console.warn(`[WARN] ${message}`, data);
        }
    },

    error: (message: string, error?: any) => {
        if (import.meta.env.DEV) {
            console.error(`[ERROR] ${message}`, error);
        }
    },

    debug: (message: string, data?: any) => {
        if (import.meta.env.DEV) {
            console.debug(`[DEBUG] ${message}`, data);
        }
    },
};