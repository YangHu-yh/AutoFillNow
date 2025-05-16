/**
 * AutoFill Debug Utilities
 * This file provides debugging and logging utilities for the AutoFill extension.
 */

const AutoFillDebug = {
    // Configuration
    enabled: true,  // Set to false to disable all debugging
    logToConsole: true,
    logToStorage: true,
    maxStoredLogs: 100,
    
    // Log storage
    logs: [],
    errors: [],
    
    /**
     * Initialize the debug system
     */
    init: function() {
        if (!this.enabled) return;
        
        // Add some global error handling
        window.addEventListener('error', (event) => {
            this.logError('window.onerror', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        // Load existing logs if needed
        if (this.logToStorage) {
            this.loadLogs();
        }
        
        this.log('Debug system initialized');
    },
    
    /**
     * Log a message
     * @param {string} category - Category for the log
     * @param {...any} args - Arguments to log
     */
    log: function(category, ...args) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            category,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '),
            data: args
        };
        
        this.logs.push(logEntry);
        
        // Trim logs if they exceed maximum
        if (this.logs.length > this.maxStoredLogs) {
            this.logs = this.logs.slice(-this.maxStoredLogs);
        }
        
        // Log to console if enabled
        if (this.logToConsole) {
            console.log(`[${category}]`, ...args);
        }
        
        // Save logs if storage is enabled
        if (this.logToStorage) {
            this.saveLogs();
        }
    },
    
    /**
     * Log an error
     * @param {string} category - Category for the error
     * @param {Error|object|string} error - The error to log
     * @param {object} [context] - Additional context
     */
    logError: function(category, error, context = {}) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const errorEntry = {
            timestamp,
            category,
            message: error.message || String(error),
            stack: error.stack || '',
            context
        };
        
        this.errors.push(errorEntry);
        
        // Trim errors if they exceed maximum
        if (this.errors.length > this.maxStoredLogs) {
            this.errors = this.errors.slice(-this.maxStoredLogs);
        }
        
        // Log to console if enabled
        if (this.logToConsole) {
            console.error(`[${category}] Error:`, error, context);
        }
        
        // Save logs if storage is enabled
        if (this.logToStorage) {
            this.saveLogs();
        }
    },
    
    /**
     * Save logs to Chrome storage
     */
    saveLogs: function() {
        if (!this.enabled || !this.logToStorage) return;
        
        try {
            chrome.storage.local.set({
                'autofill_debug_logs': this.logs.slice(-this.maxStoredLogs),
                'autofill_debug_errors': this.errors.slice(-this.maxStoredLogs)
            });
        } catch (e) {
            console.error('Failed to save logs to storage:', e);
        }
    },
    
    /**
     * Load logs from Chrome storage
     */
    loadLogs: function() {
        if (!this.enabled || !this.logToStorage) return;
        
        try {
            chrome.storage.local.get(['autofill_debug_logs', 'autofill_debug_errors'], (result) => {
                if (result.autofill_debug_logs) {
                    this.logs = result.autofill_debug_logs;
                }
                if (result.autofill_debug_errors) {
                    this.errors = result.autofill_debug_errors;
                }
                console.log('Loaded debug logs from storage');
            });
        } catch (e) {
            console.error('Failed to load logs from storage:', e);
        }
    },
    
    /**
     * Get all logs and errors
     */
    getAllLogs: function() {
        return {
            logs: this.logs,
            errors: this.errors
        };
    },
    
    /**
     * Clear all logs and errors
     */
    clearLogs: function() {
        this.logs = [];
        this.errors = [];
        
        if (this.logToStorage) {
            try {
                chrome.storage.local.remove(['autofill_debug_logs', 'autofill_debug_errors']);
            } catch (e) {
                console.error('Failed to clear logs from storage:', e);
            }
        }
    },
    
    /**
     * Get debugging info about the current page
     */
    getPageInfo: function() {
        const info = {
            url: window.location.href,
            title: document.title,
            forms: document.forms.length,
            inputs: document.querySelectorAll('input').length,
            selects: document.querySelectorAll('select').length,
            textareas: document.querySelectorAll('textarea').length,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        return info;
    }
};

// Initialize the debug system
AutoFillDebug.init();

// Make it available globally
window.AutoFillDebug = AutoFillDebug; 