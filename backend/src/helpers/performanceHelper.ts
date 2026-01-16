import { performance } from 'perf_hooks';
import { recordMetric } from '../middlewares/performanceMonitoring';

/**
 * Measure and record performance metric with automatic cleanup
 * @param metricName - Name of the metric to record (e.g., 'DriverMatching/Duration')
 * @param measureName - Name for the performance measure (e.g., 'driver-matching')
 * @param startMark - Start mark identifier
 * @returns Cleanup function to be called in finally block
 */
export function measurePerformance(
  metricName: string,
  measureName: string,
  startMark: string
): () => void {
  return () => {
    const endMark = `${measureName}-end-${performance.now()}`;
    performance.mark(endMark);
    const measure = performance.measure(measureName, startMark, endMark);
    recordMetric(metricName, measure.duration);
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  };
}

/**
 * Start performance measurement
 * @param measureName - Name for the performance measure (e.g., 'driver-matching')
 * @returns Start mark identifier
 */
export function startPerformanceMeasure(measureName: string): string {
  const startMark = `${measureName}-${performance.now()}`;
  performance.mark(startMark);
  return startMark;
}
