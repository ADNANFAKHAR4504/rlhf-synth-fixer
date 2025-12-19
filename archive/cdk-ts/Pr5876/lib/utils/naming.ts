import { AppConfig } from '../interfaces/config-interfaces';

export class NamingUtil {
  /**
   * Generate resource name following pattern: [environment]-[service]-[suffix]-[timestamp]
   * For cross-account executability and uniqueness
   */
  static generateResourceName(
    config: AppConfig,
    service: string,
    includeTimestamp: boolean = true
  ): string {
    const parts = [config.environment, service, config.environmentSuffix];
    if (includeTimestamp) {
      parts.push(config.timestamp);
    }
    return parts.join('-').toLowerCase();
  }

  /**
   * Generate unique bucket name (must be globally unique)
   */
  static generateBucketName(config: AppConfig, service: string): string {
    return `${config.environment}-${service}-${config.environmentSuffix}-${config.timestamp}`.toLowerCase();
  }

  /**
   * Generate role name for cross-account access
   */
  static generateRoleName(config: AppConfig, roleType: string): string {
    return `${config.environment}-${roleType}-role-${config.environmentSuffix}`;
  }

  /**
   * Generate secret name
   */
  static generateSecretName(config: AppConfig, secretType: string): string {
    return `${config.environment}/${secretType}/${config.environmentSuffix}`;
  }

  /**
   * Generate CloudFormation output key for flat-outputs discovery
   */
  static generateOutputKey(config: AppConfig, outputType: string): string {
    return `${config.environmentSuffix}${outputType}`;
  }
}

export class TimestampUtil {
  /**
   * Generate timestamp for resource naming
   * Format: YYYYMMDD-HHMMSS
   */
  static generateTimestamp(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    const second = String(now.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hour}${minute}${second}`;
  }

  /**
   * Generate short timestamp for resource naming (8 chars)
   */
  static generateShortTimestamp(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
