import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig, EnvironmentType } from './types';

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const config = new pulumi.Config();
  const environment = (config.get('environment') || 'dev') as EnvironmentType;

  const configs: Record<EnvironmentType, EnvironmentConfig> = {
    dev: {
      environment: 'dev',
      lambdaConcurrency: 10,
      logRetentionDays: 7,
      rdsAlarmThreshold: 80,
      s3LifecycleDays: 30,
      dbInstanceClass: 'db.t3.micro',
      enableWaf: false,
      customDomain: 'api-dev.payments.internal',
    },
    staging: {
      environment: 'staging',
      lambdaConcurrency: 50,
      logRetentionDays: 30,
      rdsAlarmThreshold: 75,
      s3LifecycleDays: 60,
      dbInstanceClass: 'db.t3.small',
      enableWaf: false,
      customDomain: 'api-staging.payments.internal',
    },
    prod: {
      environment: 'prod',
      lambdaConcurrency: 200,
      logRetentionDays: 90,
      rdsAlarmThreshold: 70,
      s3LifecycleDays: 90,
      dbInstanceClass: 'db.t3.medium',
      enableWaf: true,
      customDomain: 'api-prod.payments.internal',
    },
  };

  return configs[environment];
}
