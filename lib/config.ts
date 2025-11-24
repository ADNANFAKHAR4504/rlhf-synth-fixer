import * as pulumi from '@pulumi/pulumi';

export interface EnvironmentConfig {
  environment: string;
  region: string;
  vpcCidr: string;
  availabilityZones: string[];
  ecsTaskCount: number;
  ecsTaskCpu: string;
  ecsTaskMemory: string;
  rdsInstanceClass: string;
  rdsEngineMode?: string;
  enableAutoScaling: boolean;
  sslCertificateArn?: string;
  tags: { [key: string]: string };
  s3LifecycleRules: {
    enabled: boolean;
    transitionDays?: number;
    expirationDays?: number;
  };
  rdsBackupRetentionDays: number;
  permissionBoundaryArn?: string;
}

export function getConfig(): EnvironmentConfig {
  const config = new pulumi.Config();
  const stack = pulumi.getStack();

  return {
    environment: config.require('environment'),
    region: config.get('region') || 'us-east-1',
    vpcCidr: config.require('vpcCidr'),
    availabilityZones: config.requireObject<string[]>('availabilityZones'),
    ecsTaskCount: config.requireNumber('ecsTaskCount'),
    ecsTaskCpu: config.require('ecsTaskCpu'),
    ecsTaskMemory: config.require('ecsTaskMemory'),
    rdsInstanceClass: config.require('rdsInstanceClass'),
    rdsEngineMode: config.get('rdsEngineMode'),
    enableAutoScaling: config.requireBoolean('enableAutoScaling'),
    sslCertificateArn: config.get('sslCertificateArn'),
    tags: {
      Environment: config.require('environment'),
      Owner: config.get('owner') || 'platform-team',
      CostCenter: config.get('costCenter') || 'engineering',
      ManagedBy: 'pulumi',
      Stack: stack,
    },
    s3LifecycleRules: {
      enabled: config.requireBoolean('s3LifecycleEnabled'),
      transitionDays: config.getNumber('s3TransitionDays'),
      expirationDays: config.getNumber('s3ExpirationDays'),
    },
    rdsBackupRetentionDays: config.getNumber('rdsBackupRetentionDays') || 7,
    permissionBoundaryArn: config.get('permissionBoundaryArn'),
  };
}
