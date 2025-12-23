export interface EnvironmentConfig {
  name: string;
  cidrBlock: string;
  accountId: string;
  instanceType: string;
  minCapacity: number;
  maxCapacity: number;
  certificateArn?: string;
  costCenter: string;
  enableCrossEnvironmentReplication?: boolean;
  replicationSourceArn?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeploymentManifest {
  environment: string;
  timestamp: string;
  resources: ResourceInfo[];
  tags: Record<string, string>;
}

export interface ResourceInfo {
  type: string;
  name: string;
  arn: string;
  properties: Record<string, any>;
}
