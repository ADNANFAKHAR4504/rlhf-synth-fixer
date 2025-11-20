// Environment configuration interface
export interface EnvironmentConfig {
  name: string;
  logRetentionDays: number;
  lambdaConcurrency: number;
  rdsAlarmThreshold: number;
  enableWaf: boolean;
}

// Component props interface
export interface PaymentInfraProps {
  environment: string;
  environmentSuffix: string;
  config: EnvironmentConfig;
}
