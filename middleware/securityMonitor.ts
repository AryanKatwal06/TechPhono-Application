import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityEnhanced } from '@/config/securityEnhanced';
import { APISecurity } from '@/middleware/apiSecurity';

// Security Monitoring System
export class SecurityMonitor {
  private static readonly MONITORING_KEY = 'security_monitoring_data';
  private static readonly ALERT_THRESHOLDS = {
    failedLoginAttempts: 5,
    suspiciousRequests: 10,
    dataAccessAnomalies: 20,
    unusualLocations: 1
  };

  // Real-time security monitoring
  static async monitorSecurityEvent(event: {
    type: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'suspicious_activity' | 'data_access';
    userId?: string;
    identifier: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    // Log the event
    await SecurityEnhanced.logSecurityEvent(event);

    // Check for security alerts
    await this.checkForSecurityAlerts(event);
  }

  // Check for security alerts based on patterns
  private static async checkForSecurityAlerts(event: any): Promise<void> {
    const alerts: string[] = [];

    // Failed login attempts
    if (event.type === 'login_failure') {
      const recentFailures = await this.getRecentFailedLogins(event.identifier);
      if (recentFailures >= this.ALERT_THRESHOLDS.failedLoginAttempts) {
        alerts.push(`Multiple failed login attempts detected for ${event.identifier}`);
      }
    }

    // Suspicious request patterns
    if (event.type === 'suspicious_activity') {
      const suspiciousCount = await this.getSuspiciousActivityCount(event.identifier);
      if (suspiciousCount >= this.ALERT_THRESHOLDS.suspiciousRequests) {
        alerts.push(`Suspicious activity detected from ${event.identifier}`);
      }
    }

    // Data access anomalies
    if (event.type === 'data_access') {
      const accessCount = await this.getDataAccessCount(event.userId);
      if (accessCount >= this.ALERT_THRESHOLDS.dataAccessAnomalies) {
        alerts.push(`Unusual data access pattern detected for user ${event.userId}`);
      }
    }

    // Trigger alerts if any found
    if (alerts.length > 0) {
      await this.triggerSecurityAlerts(alerts, event);
    }
  }

  // Get recent failed login attempts
  private static async getRecentFailedLogins(identifier: string): Promise<number> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const failedLogins = monitoringData.failedLogins?.filter((login: any) => 
        login.identifier === identifier && 
        login.timestamp > oneHourAgo
      ) || [];

      return failedLogins.length;
    } catch (error) {
      console.error('❌ Error getting failed logins:', error);
      return 0;
    }
  }

  // Get suspicious activity count
  private static async getSuspiciousActivityCount(identifier: string): Promise<number> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const suspiciousActivities = monitoringData.suspiciousActivities?.filter((activity: any) => 
        activity.identifier === identifier && 
        activity.timestamp > oneHourAgo
      ) || [];

      return suspiciousActivities.length;
    } catch (error) {
      console.error('❌ Error getting suspicious activities:', error);
      return 0;
    }
  }

  // Get data access count
  private static async getDataAccessCount(userId?: string): Promise<number> {
    if (!userId) return 0;
    
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const dataAccesses = monitoringData.dataAccesses?.filter((access: any) => 
        access.userId === userId && 
        access.timestamp > oneHourAgo
      ) || [];

      return dataAccesses.length;
    } catch (error) {
      console.error('❌ Error getting data accesses:', error);
      return 0;
    }
  }

  // Trigger security alerts
  private static async triggerSecurityAlerts(alerts: string[], event: any): Promise<void> {
    const alertData = {
      timestamp: Date.now(),
      alerts,
      event,
      severity: 'high',
      requiresAction: true
    };

    // Store alert
    await this.storeSecurityAlert(alertData);

    // Log critical alert
    await SecurityEnhanced.logSecurityEvent({
      type: 'suspicious_activity',
      identifier: 'security_monitor',
      details: alertData,
      severity: 'critical'
    });

    // In production, send to security team
    console.warn('🚨 SECURITY ALERTS:', alerts);
  }

  // Store security alert
  private static async storeSecurityAlert(alertData: any): Promise<void> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      if (!monitoringData.alerts) {
        monitoringData.alerts = [];
      }
      
      monitoringData.alerts.push(alertData);
      
      // Keep only last 100 alerts
      if (monitoringData.alerts.length > 100) {
        monitoringData.alerts = monitoringData.alerts.slice(-100);
      }
      
      await AsyncStorage.setItem(this.MONITORING_KEY, JSON.stringify(monitoringData));
    } catch (error) {
      console.error('❌ Error storing security alert:', error);
    }
  }

  // Get security dashboard data
  static async getSecurityDashboard(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    recentAlerts: any[];
    failedLogins: number;
    suspiciousActivities: number;
  }> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
      
      const recentAlerts = monitoringData.alerts?.filter((alert: any) => 
        alert.timestamp > twentyFourHoursAgo
      ) || [];

      const criticalEvents = monitoringData.events?.filter((event: any) => 
        event.severity === 'critical' && event.timestamp > twentyFourHoursAgo
      ) || [];

      return {
        totalEvents: monitoringData.events?.length || 0,
        criticalEvents: criticalEvents.length,
        recentAlerts: recentAlerts.slice(-10),
        failedLogins: await this.getRecentFailedLogins('all'),
        suspiciousActivities: await this.getSuspiciousActivityCount('all')
      };
    } catch (error) {
      console.error('❌ Error getting security dashboard:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        recentAlerts: [],
        failedLogins: 0,
        suspiciousActivities: 0
      };
    }
  }

  // Automated security response
  static async automatedSecurityResponse(event: any): Promise<void> {
    const responses: string[] = [];

    // Automatic lockout for too many failed attempts
    if (event.type === 'login_failure') {
      const failedCount = await this.getRecentFailedLogins(event.identifier);
      if (failedCount >= this.ALERT_THRESHOLDS.failedLoginAttempts) {
        await this.initiateAccountLockout(event.identifier);
        responses.push(`Account ${event.identifier} locked due to multiple failed attempts`);
      }
    }

    // Block suspicious IPs
    if (event.type === 'suspicious_activity' && event.details?.ipAddress) {
      const suspiciousCount = await this.getSuspiciousActivityCount(event.details.ipAddress);
      if (suspiciousCount >= this.ALERT_THRESHOLDS.suspiciousRequests) {
        await this.blockIPAddress(event.details.ipAddress);
        responses.push(`IP ${event.details.ipAddress} blocked due to suspicious activity`);
      }
    }

    // Log automated responses
    if (responses.length > 0) {
      await SecurityEnhanced.logSecurityEvent({
        type: 'suspicious_activity',
        identifier: 'automated_response',
        details: { responses, originalEvent: event },
        severity: 'high'
      });
    }
  }

  // Initiate account lockout
  private static async initiateAccountLockout(identifier: string): Promise<void> {
    const lockoutData = {
      identifier,
      lockedAt: Date.now(),
      lockedUntil: Date.now() + (15 * 60 * 1000), // 15 minutes
      reason: 'Multiple failed login attempts'
    };

    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      if (!monitoringData.lockouts) {
        monitoringData.lockouts = [];
      }
      
      monitoringData.lockouts.push(lockoutData);
      await AsyncStorage.setItem(this.MONITORING_KEY, JSON.stringify(monitoringData));
    } catch (error) {
      console.error('❌ Error initiating account lockout:', error);
    }
  }

  // Block IP address
  private static async blockIPAddress(ipAddress: string): Promise<void> {
    const blockData = {
      ipAddress,
      blockedAt: Date.now(),
      blockedUntil: Date.now() + (60 * 60 * 1000), // 1 hour
      reason: 'Suspicious activity detected'
    };

    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      if (!monitoringData.blockedIPs) {
        monitoringData.blockedIPs = [];
      }
      
      monitoringData.blockedIPs.push(blockData);
      await AsyncStorage.setItem(this.MONITORING_KEY, JSON.stringify(monitoringData));
    } catch (error) {
      console.error('❌ Error blocking IP address:', error);
    }
  }

  // Check if account is locked
  static async isAccountLocked(identifier: string): Promise<boolean> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const lockouts = monitoringData.lockouts || [];
      const now = Date.now();
      
      const activeLockout = lockouts.find((lockout: any) => 
        lockout.identifier === identifier && 
        lockout.lockedUntil > now
      );

      return !!activeLockout;
    } catch (error) {
      console.error('❌ Error checking account lock:', error);
      return false;
    }
  }

  // Check if IP is blocked
  static async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const blockedIPs = monitoringData.blockedIPs || [];
      const now = Date.now();
      
      const activeBlock = blockedIPs.find((block: any) => 
        block.ipAddress === ipAddress && 
        block.blockedUntil > now
      );

      return !!activeBlock;
    } catch (error) {
      console.error('❌ Error checking IP block:', error);
      return false;
    }
  }

  // Clean up expired security data
  static async cleanupExpiredData(): Promise<void> {
    try {
      const logData = await AsyncStorage.getItem(this.MONITORING_KEY);
      const monitoringData = logData ? JSON.parse(logData) : {};
      
      const now = Date.now();
      let hasChanges = false;

      // Clean expired lockouts
      if (monitoringData.lockouts) {
        monitoringData.lockouts = monitoringData.lockouts.filter((lockout: any) => 
          lockout.lockedUntil > now
        );
        hasChanges = true;
      }

      // Clean expired IP blocks
      if (monitoringData.blockedIPs) {
        monitoringData.blockedIPs = monitoringData.blockedIPs.filter((block: any) => 
          block.blockedUntil > now
        );
        hasChanges = true;
      }

      // Clean old events (keep last 1000)
      if (monitoringData.events && monitoringData.events.length > 1000) {
        monitoringData.events = monitoringData.events.slice(-1000);
        hasChanges = true;
      }

      if (hasChanges) {
        await AsyncStorage.setItem(this.MONITORING_KEY, JSON.stringify(monitoringData));
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired security data:', error);
    }
  }
}
