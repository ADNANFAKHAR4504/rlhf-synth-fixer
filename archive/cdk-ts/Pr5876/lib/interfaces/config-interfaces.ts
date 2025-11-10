export interface AppConfig {
  environment: string;
  environmentSuffix: string;
  region: string;
  account?: string;
  timestamp: string;
  tags: { [key: string]: string };
}

export interface StackConfig {
  config: AppConfig;
}

export interface VpcConfig {
  cidrBlock: string;
  maxAzs: number;
  natGateways: number;
}

export interface ComputeConfig {
  instanceType: string;
  minCapacity: number;
  maxCapacity: number;
  desiredCapacity: number;
  enableDetailedMonitoring: boolean;
}

export interface DatabaseConfig {
  instanceClass: string;
  allocatedStorage: number;
  maxAllocatedStorage: number;
  multiAz: boolean;
  backupRetentionDays: number;
  enablePerformanceInsights: boolean;
}

export interface MonitoringConfig {
  enableDetailedMonitoring: boolean;
  alarmEvaluationPeriods: number;
  alarmDatapointsToAlarm: number;
  logRetentionDays: number;
}
