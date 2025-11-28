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
// In CI/CD, stack names may be dynamic (e.g., TapStackpr7308), so default to 'dev'
const stack = pulumi.getStack();
const validEnvironments = ['dev', 'staging', 'prod'];
const environment = validEnvironments.includes(stack)
  ? (stack as 'dev' | 'staging' | 'prod')
  : 'dev';

// Get region from config
const region = awsConfig.get('region') || process.env.AWS_REGION || 'us-east-1';

// Determine if we are in CI/CD environment
// CI/CD is detected when ENVIRONMENT_SUFFIX is set
const isCIEnvironment = !!process.env.ENVIRONMENT_SUFFIX;

// Get Docker image URI from config (with default for CI/CD)
// In CI/CD, use the AWS public ECR base image for Node.js Lambda
// This is a valid public image that exists and can be used for testing deployment
const defaultDockerImageUri =
  isCIEnvironment && !config.get('dockerImageUri')
    ? 'public.ecr.aws/lambda/nodejs:20'
    : `${process.env.CURRENT_ACCOUNT_ID || '123456789012'}.dkr.ecr.${region}.amazonaws.com/tap-application:latest`;
const dockerImageUri = config.get('dockerImageUri') || defaultDockerImageUri;

// Get networking stack reference (with default for CI/CD)
const defaultNetworkingStackRef = `organization/networking-stack/${environment}`;
const networkingStackRef =
  config.get('networkingStackRef') || defaultNetworkingStackRef;

// Determine if we should create standalone networking (for CI/CD environments)
// This is triggered when:
// 1. ENVIRONMENT_SUFFIX is set (indicates CI/CD)
// 2. No explicit networking stack reference was configured
// 3. CREATE_STANDALONE_NETWORKING env var is set to 'true'
const createStandaloneNetworking =
  process.env.CREATE_STANDALONE_NETWORKING === 'true' ||
  (isCIEnvironment && !config.get('networkingStackRef'));

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

// Use zip deployment in CI/CD when Docker image is not available
const useZipDeployment = isCIEnvironment && !config.get('dockerImageUri');

// Instantiate the main stack
const stack_instance = new TapStack(
  'tap-infrastructure',
  {
    environmentSuffix,
    config: envConfig,
    dockerImageUri,
    networkingStackRef,
    createStandaloneNetworking,
    useZipDeployment,
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
