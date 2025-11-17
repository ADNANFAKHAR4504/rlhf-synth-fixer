/**
 * Environment configuration types for the payment processing infrastructure
 */

export type EnvironmentType = 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
  environment: EnvironmentType;
  lambdaConcurrency: number;
  logRetentionDays: number;
  rdsAlarmThreshold: number;
  s3LifecycleDays: number;
  dbInstanceClass: string;
  enableWaf: boolean;
  customDomain: string;
}

export interface TagsConfig {
  Environment: string;
  EnvironmentSuffix: string;
  ManagedBy: string;
  Project: string;
}
