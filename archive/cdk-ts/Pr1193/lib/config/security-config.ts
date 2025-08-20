/**
 * Security configuration constants for the SecureApp infrastructure
 * These values define security boundaries and compliance requirements
 */
export class SecurityConfig {
  // Network security configuration
  public static readonly ALLOWED_SSH_CIDR = '10.0.0.0/8'; // Restrict to internal network only
  public static readonly VPC_CIDR = '10.0.0.0/16';
  public static readonly PRIVATE_SUBNET_CIDRS = ['10.0.1.0/24', '10.0.2.0/24'];
  public static readonly PUBLIC_SUBNET_CIDRS = [
    '10.0.101.0/24',
    '10.0.102.0/24',
  ];

  // Encryption and compliance
  public static readonly MINIMUM_TLS_VERSION = '1.2';
  public static readonly KMS_KEY_ROTATION_ENABLED = true;

  // Tagging standards
  public static readonly RESOURCE_PREFIX = 'SecureApp';
  public static readonly STANDARD_TAGS = {
    Project: 'SecureApp',
    Environment: 'Production',
    Owner: 'DevSecOps-Team',
    CostCenter: 'Engineering',
    Compliance: 'SOC2-PCI',
    BackupRequired: 'true',
    MonitoringLevel: 'High',
  };

  // Region configuration
  public static readonly PRIMARY_REGION = 'us-east-1';

  // Security monitoring
  public static readonly ENABLE_DETAILED_MONITORING = true;
  public static readonly LOG_RETENTION_DAYS = 365;
}
