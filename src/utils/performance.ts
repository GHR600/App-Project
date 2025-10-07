import React from 'react';
import { InteractionManager, Dimensions } from 'react-native';
import { logger } from './logger';

// Performance monitoring utilities
export interface PerformanceMetrics {
  renderTime: number;
  navigationTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static interactions: Map<string, number> = new Map();

  // Track component render performance
  static startRender(componentName: string): () => void {
    const startTime = Date.now();

    return () => {
      const renderTime = Date.now() - startTime;
      this.metrics.set(`render_${componentName}`, renderTime);

      if (renderTime > 16) { // More than one frame (60fps)
        logger.warn(
          `Slow render detected: ${componentName} took ${renderTime}ms`,
          'PERFORMANCE'
        );
      }

      logger.performance(`Render ${componentName}`, renderTime);
    };
  }

  // Track navigation performance
  static trackNavigation(from: string, to: string): () => void {
    const startTime = Date.now();

    return () => {
      const navigationTime = Date.now() - startTime;
      this.metrics.set(`navigation_${from}_to_${to}`, navigationTime);

      if (navigationTime > 300) { // More than 300ms
        logger.warn(
          `Slow navigation: ${from} -> ${to} took ${navigationTime}ms`,
          'PERFORMANCE'
        );
      }

      logger.navigation(from, to);
      logger.performance(`Navigation ${from} -> ${to}`, navigationTime);
    };
  }

  // Track API call performance
  static trackApiCall(endpoint: string, method: string = 'GET'): () => void {
    const startTime = Date.now();

    return () => {
      const responseTime = Date.now() - startTime;
      this.metrics.set(`api_${method}_${endpoint}`, responseTime);

      if (responseTime > 5000) { // More than 5 seconds
        logger.warn(
          `Slow API call: ${method} ${endpoint} took ${responseTime}ms`,
          'PERFORMANCE'
        );
      }

      logger.apiCall(endpoint, method, responseTime, true);
    };
  }

  // Track user interactions
  static trackInteraction(type: string): void {
    const timestamp = Date.now();
    this.interactions.set(type, timestamp);

    logger.userAction(type);
  }

  // Measure memory usage (mock implementation)
  static getMemoryUsage(): number {
    // In a real React Native app, you'd use native modules to get actual memory usage
    // For now, return a mock value
    return Math.random() * 100;
  }

  // Get all performance metrics
  static getMetrics(): PerformanceMetrics {
    const renderTimes = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('render_'))
      .map(([, value]) => value);

    const navigationTimes = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('navigation_'))
      .map(([, value]) => value);

    const apiTimes = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('api_'))
      .map(([, value]) => value);

    return {
      renderTime: renderTimes.length > 0
        ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
        : 0,
      navigationTime: navigationTimes.length > 0
        ? navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
        : 0,
      apiResponseTime: apiTimes.length > 0
        ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length
        : 0,
      memoryUsage: this.getMemoryUsage(),
      bundleSize: 0, // Would be measured during build
    };
  }

  // Clear metrics
  static clearMetrics(): void {
    this.metrics.clear();
    this.interactions.clear();
  }

  // Report performance issues
  static reportSlowOperation(operation: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      logger.warn(
        `Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
        'PERFORMANCE',
        { operation, duration, threshold }
      );
    }
  }
}

// Image optimization utilities
export const optimizeImageUri = (uri: string, width?: number, height?: number): string => {
  if (!width && !height) {
    const { width: screenWidth } = Dimensions.get('window');
    width = Math.floor(screenWidth * 2); // 2x for retina displays
  }

  // In a real app, you'd use image CDN parameters or react-native-fast-image
  // For now, return the original URI
  return uri;
};

// Lazy loading utilities
export const runAfterInteractions = (callback: () => void): void => {
  InteractionManager.runAfterInteractions(callback);
};

export const deferredTask = (task: () => void, delay: number = 0): void => {
  setTimeout(() => {
    runAfterInteractions(task);
  }, delay);
};

// Bundle size analysis (would be used in build process)
export const analyzeBundleSize = () => {
  // This would typically be done at build time with tools like
  // @react-native-community/cli-plugin-metro or bundle analyzer
  return {
    totalSize: 0,
    vendorSize: 0,
    appSize: 0,
    asyncChunks: [],
  };
};

// Frame rate monitoring
class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = Date.now();
  private fps = 60;

  start(): void {
    const monitor = () => {
      this.frameCount++;
      const currentTime = Date.now();

      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;

        if (this.fps < 55) { // Below 55 FPS
          logger.warn(`Low FPS detected: ${this.fps}`, 'PERFORMANCE');
        }
      }

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  getFPS(): number {
    return this.fps;
  }
}

export const frameRateMonitor = new FrameRateMonitor();

// Cache utilities for performance
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Performance HOC for React components
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const TrackedComponent = (props: P) => {
    const displayName = componentName || Component.displayName || Component.name;

    React.useEffect(() => {
      const endTracking = PerformanceMonitor.startRender(displayName);
      return endTracking;
    }, [displayName]);

    return React.createElement(Component, props);
  };

  TrackedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;
  return TrackedComponent;
};

// Debouncing utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttling utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

// Performance optimization hooks
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    const endTracking = PerformanceMonitor.startRender(componentName);
    return endTracking;
  }, [componentName]);
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Network performance monitoring
export const trackNetworkPerformance = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    logger.info(
      `Network request: ${options?.method || 'GET'} ${url} - ${response.status} (${duration}ms)`,
      'NETWORK'
    );

    if (duration > 3000) {
      logger.warn(`Slow network request: ${url} took ${duration}ms`, 'NETWORK');
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `Network request failed: ${options?.method || 'GET'} ${url} (${duration}ms)`,
      'NETWORK',
      error
    );
    throw error;
  }
};

// Memory management utilities
export const cleanupMemory = (): void => {
  // Clear caches
  cacheManager.cleanup();

  // Clear performance metrics if they're getting large
  if (PerformanceMonitor.getMetrics().renderTime > 1000) {
    PerformanceMonitor.clearMetrics();
  }

  logger.info('Memory cleanup completed', 'PERFORMANCE');
};

// Auto-cleanup on memory pressure
let lastCleanup = Date.now();

export const scheduleMemoryCleanup = (): void => {
  const now = Date.now();

  // Cleanup every 5 minutes
  if (now - lastCleanup > 5 * 60 * 1000) {
    cleanupMemory();
    lastCleanup = now;
  }
};

// Performance recommendations
export const getPerformanceRecommendations = (): string[] => {
  const metrics = PerformanceMonitor.getMetrics();
  const recommendations: string[] = [];

  if (metrics.renderTime > 50) {
    recommendations.push('Consider optimizing component renders - average render time is high');
  }

  if (metrics.navigationTime > 500) {
    recommendations.push('Navigation performance could be improved - consider lazy loading');
  }

  if (metrics.apiResponseTime > 2000) {
    recommendations.push('API response times are slow - consider caching or optimizing requests');
  }

  if (cacheManager.size() > 100) {
    recommendations.push('Cache size is large - consider implementing cache cleanup');
  }

  return recommendations;
};