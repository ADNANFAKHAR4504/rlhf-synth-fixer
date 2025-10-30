import * as cdk from 'aws-cdk-lib';

export interface PipelineConfig {
  prefix: string;
  team: string;
  project: string;
  environmentSuffix: string;
  runtime: string;
  buildRuntime: string;
  testCoverageThreshold: number;
  retentionDays: number;
  maxRollbackRetries: number;
  notificationEmail?: string;
  lambdaMemorySize?: number;
  lambdaTimeout?: number;
  provisionedConcurrency?: number;
}

/**
 * Determines the removal policy based on environment suffix.
 * If environmentSuffix includes "prod", returns RETAIN, otherwise DESTROY.
 */
export function getRemovalPolicy(environmentSuffix: string): cdk.RemovalPolicy {
  return environmentSuffix.toLowerCase().includes('prod')
    ? cdk.RemovalPolicy.RETAIN
    : cdk.RemovalPolicy.DESTROY;
}

export function getPipelineConfig(
  team: string,
  project: string,
  environmentSuffix: string,
  notificationEmail?: string
): PipelineConfig {
  const isProduction = environmentSuffix.toLowerCase().includes('prod');
  return {
    prefix: `${team}-${project}-${environmentSuffix}`,
    team,
    project,
    environmentSuffix,
    runtime: 'nodejs20.x',
    buildRuntime: 'nodejs20.x',
    testCoverageThreshold: 80,
    retentionDays: 30,
    maxRollbackRetries: 3,
    notificationEmail,
    // Environment-based Lambda configuration
    lambdaMemorySize: isProduction ? 1024 : 512, // Higher memory = more CPU in prod
    lambdaTimeout: isProduction ? 60 : 30, // Longer timeout for prod
    provisionedConcurrency: isProduction ? 10 : undefined, // Provisioned concurrency for prod
  };
}
