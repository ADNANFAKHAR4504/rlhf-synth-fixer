/**
 * Pulumi application entry point for multi-environment infrastructure
 * with drift detection and configuration validation.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

// Get Pulumi configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');

// Get environment suffix from environment variable or config
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Get environment from stack name or config
const stack = pulumi.getStack();
const environment = (stack as 'dev' | 'staging' | 'prod') || 'dev';

// Get region from config
const region = awsConfig.get('region') || process.env.AWS_REGION || 'us-east-1';

// Get Docker image URI from config (with default for CI/CD)
const defaultDockerImageUri = `${process.env.CURRENT_ACCOUNT_ID || '123456789012'}.dkr.ecr.${region}.amazonaws.com/tap-application:latest`;
const dockerImageUri = config.get('dockerImageUri') || defaultDockerImageUri;

// Get networking stack reference (with default for CI/CD)
const defaultNetworkingStackRef = `organization/networking-stack/${environment}`;
const networkingStackRef =
  config.get('networkingStackRef') || defaultNetworkingStackRef;

// Environment-specific configuration
const envConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    environment: 'dev',
    region: 'us-east-2',
    lambda: {
      memory: 1024,
      cpu: 0.5,
    },
    database: {
      instanceClass: 'db.t4g.medium',
    },
    monitoring: {
      errorThreshold: 10,
      latencyThreshold: 5000,
    },
  },
  staging: {
    environment: 'staging',
    region: 'us-west-2',
    lambda: {
      memory: 2048,
      cpu: 1,
    },
    database: {
      instanceClass: 'db.r6g.large',
    },
    monitoring: {
      errorThreshold: 5,
      latencyThreshold: 3000,
    },
  },
  prod: {
    environment: 'prod',
    region: 'us-east-1',
    lambda: {
      memory: 4096,
      cpu: 2,
    },
    database: {
      instanceClass: 'db.r6g.large',
    },
    monitoring: {
      errorThreshold: 3,
      latencyThreshold: 2000,
    },
  },
};

const envConfig = envConfigs[environment];
if (!envConfig) {
  throw new Error(
    `Invalid environment: ${environment}. Must be dev, staging, or prod`
  );
}

// Validate region matches environment
if (envConfig.region !== region) {
  console.warn(
    `Warning: Region ${region} does not match expected region ${envConfig.region} for ${environment}`
  );
}

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags
const defaultTags = {
  Environment: environment,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: region,
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack
const stack_instance = new TapStack(
  'tap-infrastructure',
  {
    environmentSuffix,
    config: envConfig,
    dockerImageUri,
    networkingStackRef,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const databaseEndpoint = stack_instance.databaseEndpoint;
export const lambdaFunctionArn = stack_instance.lambdaFunctionArn;
export const secretArn = stack_instance.secretArn;
export const configManifest = stack_instance.configManifest;
export const configHash = stack_instance.configHash;
export const environmentName = environment;
export const environmentSuffixOutput = environmentSuffix;
