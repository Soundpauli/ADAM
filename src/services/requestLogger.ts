export interface RequestLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  product: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
  field?: string; // Optional for group validations
  type: 'enhancement' | 'validation' | 'group_validation' | 'group_enhancement';
  language: string;
  success: boolean;
  error?: string;
  duration?: number; // in milliseconds
  source: {
    component: string; // Component that triggered the request
    command: string; // User action that triggered it
    effect: string; // What the system is trying to do
  };
  results?: {
    qualityBefore?: number;
    qualityAfter?: number;
    validationPassed?: boolean;
    enhancementAccepted?: boolean;
    contentLength?: number;
    issuesFound?: string[];
    answer?: string; // The actual enhanced content or validation result
  };
  metadata?: {
    fieldCount?: number;
  };
}

class RequestLogger {
  private logs: RequestLog[] = [];
  private readonly STORAGE_KEY = 'requestLogs';
  private readonly MAX_LOGS = 10000; // Keep last 10k logs

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load request logs:', error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      // Keep only the most recent logs to prevent localStorage bloat
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save request logs:', error);
    }
  }

  log(logData: Omit<RequestLog, 'id' | 'timestamp'>): string {
    const logEntry: RequestLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('🔍 Request Log:', {
        type: logEntry.type,
        user: logEntry.user.name,
        product: logEntry.product.name,
        field: logEntry.field || 'N/A',
        success: logEntry.success,
        duration: logEntry.duration ? `${logEntry.duration}ms` : 'N/A'
      });
    }

    return logEntry.id;
  }

  getLogs(filter?: {
    type?: string;
    userId?: string;
    productId?: string;
    field?: string;
    dateFrom?: Date;
    dateTo?: Date;
    success?: boolean;
  }): RequestLog[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.type) {
        filteredLogs = filteredLogs.filter(log => log.type === filter.type);
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.user.id === filter.userId);
      }
      if (filter.productId) {
        filteredLogs = filteredLogs.filter(log => log.product.id === filter.productId);
      }
      if (filter.field) {
        filteredLogs = filteredLogs.filter(log => log.field === filter.field);
      }
      if (filter.dateFrom) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filter.dateTo!);
      }
      if (filter.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === filter.success);
      }
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getStats(): {
    totalRequests: number;
    successRate: number;
    averageDuration: number;
    requestsByType: Record<string, number>;
    requestsByUser: Record<string, number>;
    requestsByDay: Record<string, number>;
  } {
    const total = this.logs.length;
    const successful = this.logs.filter(log => log.success).length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    const durationsWithValues = this.logs.filter(log => log.duration).map(log => log.duration!);
    const averageDuration = durationsWithValues.length > 0 
      ? durationsWithValues.reduce((sum, duration) => sum + duration, 0) / durationsWithValues.length 
      : 0;

    const requestsByType = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByUser = this.logs.reduce((acc, log) => {
      acc[log.user.name] = (acc[log.user.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByDay = this.logs.reduce((acc, log) => {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests: total,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      requestsByType,
      requestsByUser,
      requestsByDay
    };
  }

  exportLogs(): void {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `request_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  clearLogs(): void {
    this.logs = [];
    this.saveLogs();
  }
}

// Create singleton instance
export const requestLogger = new RequestLogger();