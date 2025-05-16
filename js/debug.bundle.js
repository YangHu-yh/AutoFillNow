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
            // Filter out non-critical browser warnings
            if (this.isNonCriticalError(event.message)) {
                console.log(`[Filtered] Non-critical browser warning: ${event.message}`);
                return;
            }
            
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
     * Check if an error message is a non-critical browser warning
     * @param {string} message - The error message
     * @returns {boolean} - True if the error is non-critical
     */
    isNonCriticalError: function(message) {
        if (!message) return false;
        
        // List of known non-critical browser warnings
        const nonCriticalPatterns = [
            'ResizeObserver loop', 
            'ResizeObserver loop completed with undelivered notifications',
            'Script error',
            'Load failed',
            'Cannot read properties of null',
            'Extension context invalidated',
            'The specified value is non-finite',
            // Greenhouse-specific errors
            'Failed to load resource',
            'Uncaught TypeError: Cannot read properties',
            'Uncaught ReferenceError',
            'Error loading script',
            'Access to fetch at',
            'Cross-Origin Read Blocking',
            'Refused to connect',
            'Refused to execute inline script'
        ];
        
        return nonCriticalPatterns.some(pattern => message.includes(pattern));
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
        
        // Safely extract error information
        let errorMessage, errorStack;
        
        try {
            errorMessage = error.message || String(error);
            errorStack = error.stack || '';
        } catch (e) {
            errorMessage = "Error object could not be stringified";
            errorStack = "No stack available";
        }
        
        // Filter out non-critical browser warnings
        if (this.isNonCriticalError(errorMessage)) {
            console.log(`[Filtered] Non-critical browser warning in ${category}: ${errorMessage}`);
            return;
        }
        
        // Safely process context
        let safeContext = {};
        try {
            // If context is an object, process its properties
            if (context && typeof context === 'object') {
                Object.keys(context).forEach(key => {
                    try {
                        const value = context[key];
                        if (value === null) {
                            safeContext[key] = 'null';
                        } else if (value === undefined) {
                            safeContext[key] = 'undefined';
                        } else if (typeof value === 'object') {
                            // For objects, just store type info to avoid circular references
                            safeContext[key] = `[object ${value.constructor?.name || 'Object'}]`;
                        } else {
                            safeContext[key] = String(value);
                        }
                    } catch (e) {
                        safeContext[key] = `[Error processing value: ${e.message}]`;
                    }
                });
            } else {
                safeContext = { value: String(context) };
            }
            
            // Add current URL for debugging
            safeContext.url = window.location.href;
        } catch (e) {
            safeContext = { error: "Context could not be processed: " + e.message };
        }
        
        const errorEntry = {
            timestamp,
            category,
            message: errorMessage,
            stack: errorStack,
            context: safeContext
        };
        
        this.errors.push(errorEntry);
        
        // Trim errors if they exceed maximum
        if (this.errors.length > this.maxStoredLogs) {
            this.errors = this.errors.slice(-this.maxStoredLogs);
        }
        
        // Log to console if enabled
        if (this.logToConsole) {
            console.error(`[${category}] Error:`, errorMessage);
            if (errorStack) console.error("Stack:", errorStack);
            console.error("Context:", safeContext);
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