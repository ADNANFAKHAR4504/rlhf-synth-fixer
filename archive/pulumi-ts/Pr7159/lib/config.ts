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
  // Use explicit project name to match Pulumi.yaml
  const config = new pulumi.Config('TapStack');
  const stack = pulumi.getStack();

  // Get environment suffix from environment variable, config, or stack name
  let environmentSuffix =
    process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix');

  // If not set, extract from stack name (e.g., "TapStackpr7159" -> "pr7159")
  if (!environmentSuffix && stack) {
    // Handle test environment where stack might be "stack" or "dev"
    if (stack === 'stack' || stack === 'dev') {
      environmentSuffix = 'dev';
    } else {
      environmentSuffix = stack.replace(/^TapStack/, '') || 'dev';
    }
  }

  // Final fallback
  if (!environmentSuffix) {
    environmentSuffix = 'dev';
  }

  // Determine environment type from suffix
  const envType = environmentSuffix.toLowerCase();
  const isDev =
    envType.includes('dev') || envType === 'dev' || envType === 'stack';
  const isStaging = envType.includes('staging') || envType === 'staging';

  return {
    environment:
      config.get('environment') || (isDev ? 'dev' : environmentSuffix),
    region: config.get('region') || process.env.AWS_REGION || 'us-east-1',
    vpcCidr:
      config.get('vpcCidr') ||
      (isDev ? '10.0.0.0/16' : isStaging ? '10.1.0.0/16' : '10.2.0.0/16'),
    availabilityZones: config.getObject<string[]>('availabilityZones') || [
      'us-east-1a',
      'us-east-1b',
      'us-east-1c',
    ],
    ecsTaskCount:
      config.getNumber('ecsTaskCount') || (isDev ? 1 : isStaging ? 2 : 4),
    ecsTaskCpu:
      config.get('ecsTaskCpu') || (isDev ? '256' : isStaging ? '512' : '1024'),
    ecsTaskMemory:
      config.get('ecsTaskMemory') ||
      (isDev ? '512' : isStaging ? '1024' : '2048'),
    rdsInstanceClass:
      config.get('rdsInstanceClass') ||
      (isDev ? 'db.t3.medium' : isStaging ? 'db.r5.large' : 'db.r5.xlarge'),
    rdsEngineMode: config.get('rdsEngineMode'),
    enableAutoScaling: config.getBoolean('enableAutoScaling') ?? !isDev,
    sslCertificateArn: config.get('sslCertificateArn'),
    tags: {
      Environment:
        config.get('environment') || (isDev ? 'dev' : environmentSuffix),
      Owner:
        config.get('owner') || process.env.COMMIT_AUTHOR || 'platform-team',
      CostCenter: config.get('costCenter') || 'engineering',
      ManagedBy: 'pulumi',
      Stack: stack,
      Repository: process.env.REPOSITORY || 'unknown',
      PRNumber: process.env.PR_NUMBER || 'unknown',
      Team: process.env.TEAM || 'synth',
    },
    s3LifecycleRules: {
      enabled: config.getBoolean('s3LifecycleEnabled') ?? true,
      transitionDays:
        config.getNumber('s3TransitionDays') ||
        (isDev ? 30 : isStaging ? 60 : 90),
      expirationDays:
        config.getNumber('s3ExpirationDays') ||
        (isDev ? 90 : isStaging ? 180 : 365),
    },
    rdsBackupRetentionDays:
      config.getNumber('rdsBackupRetentionDays') ||
      (isDev ? 1 : isStaging ? 7 : 14),
    permissionBoundaryArn: config.get('permissionBoundaryArn'),
  };
}
