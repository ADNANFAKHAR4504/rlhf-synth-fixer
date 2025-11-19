/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/**
 * Environment-specific configuration interface
 */
export interface EnvironmentConfig {
  environment: 'dev' | 'staging' | 'prod';
  vpcCidr: string;
  rdsInstanceClass: string;
  apiGatewayRateLimit: number;
  dynamoReadCapacity: number;
  dynamoWriteCapacity: number;
  s3RetentionDays: number;
  cloudWatchThreshold: number;
  kmsKeyAlias: string;
}

/**
 * Tags interface for resource tagging
 */
export interface ResourceTags {
  Environment: string;
  ManagedBy: string;
  CostCenter: string;
  [key: string]: string;
}

/**
 * Drift detection result interface
 */
export interface DriftReport {
  environment: string;
  resources: Array<{
    resourceType: string;
    resourceName: string;
    drift: boolean;
    differences?: Record<string, any>;
  }>;
  timestamp: string;
}

/**
 * Configuration comparison interface
 */
export interface ConfigComparison {
  dev: Partial<EnvironmentConfig>;
  staging: Partial<EnvironmentConfig>;
  prod: Partial<EnvironmentConfig>;
  differences: string[];
}
