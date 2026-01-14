import { Request, Response, NextFunction } from 'express';
import { performance, PerformanceObserver } from 'perf_hooks';
import Logger from '../core/Logger';

// New Relic client (lazy loaded)
let newrelic: any = null;
try {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    newrelic = require('newrelic');
  }
} catch (error) {
  Logger.warn('New Relic not available');
}

/**
 * Lightweight performance monitoring middleware
 * Tracks API latency and error rates using perf_hooks
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startMark = `${req.method}-${req.path}-start-${Date.now()}`;
  const endMark = `${req.method}-${req.path}-end-${Date.now()}`;
  const measureName = `${req.method} ${req.path}`;

  // Mark request start
  performance.mark(startMark);

  // Capture original end function
  const originalEnd = res.end;

  // Override end to measure performance
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Mark request end
    performance.mark(endMark);

    try {
      // Measure duration
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      const duration = measure.duration;

      // Log performance
      Logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);

      // Send to New Relic if available
      if (newrelic) {
        try {
          // Record custom metric
          newrelic.recordMetric(`Custom/API/${req.method}${req.path}/ResponseTime`, duration);
          
          // Record success/error count
          if (res.statusCode >= 200 && res.statusCode < 400) {
            newrelic.recordMetric(`Custom/API/${req.method}${req.path}/Success`, 1);
          } else {
            newrelic.recordMetric(`Custom/API/${req.method}${req.path}/Error`, 1);
          }

          // Add custom attributes to transaction
          newrelic.addCustomAttributes({
            route: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime: duration,
          });
        } catch (error) {
          // Silent fail - don't crash on metric errors
          Logger.warn('Failed to send metrics to New Relic:', error);
        }
      }

      // Clean up performance entries
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch (error) {
      Logger.warn('Performance measurement failed:', error);
    }

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

/**
 * Record custom business metrics
 */
export const recordMetric = (name: string, value: number) => {
  if (newrelic) {
    try {
      newrelic.recordMetric(`Custom/${name}`, value);
    } catch (error) {
      Logger.warn(`Failed to record metric ${name}:`, error);
    }
  }
};

/**
 * Add custom attributes to current transaction
 */
export const addCustomAttributes = (attributes: Record<string, string | number | boolean>) => {
  if (newrelic) {
    try {
      newrelic.addCustomAttributes(attributes);
    } catch (error) {
      Logger.warn('Failed to add custom attributes:', error);
    }
  }
};
