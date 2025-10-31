/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Get configuration values with defaults
const sourceRegion = config.get('sourceRegion') || 'us-east-1';
const targetRegion = config.get('targetRegion') || 'eu-central-1';
const sourceCidr = config.get('sourceCidr') || '10.0.0.0/16';
const targetCidr = config.get('targetCidr') || '10.1.0.0/16';

// EC2 configuration
const instanceType = config.get('instanceType') || 't3.medium';
const instanceCount = config.getNumber('instanceCount') || 3;
const amiId = config.get('amiId') || 'ami-0abcdef1234567890';

// RDS configuration
// Note: AWS RDS supports using just major version (e.g., "16") to auto-select latest minor version
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.medium';
const dbEngine = config.get('dbEngine') || 'postgres';
const dbEngineVersion = config.get('dbEngineVersion') || '16'; // Use major version only
const dbUsername = config.get('dbUsername') || 'admin';
const dbAllocatedStorage = config.getNumber('dbAllocatedStorage') || 100;

// Migration configuration
const maxDowntimeMinutes = config.getNumber('maxDowntimeMinutes') || 15;
const enableRollback = config.getBoolean('enableRollback') ?? true;

// Route53 configuration
const hostedZoneName = config.get('hostedZoneName');
const createNewZone = config.getBoolean('createNewZone') ?? true;

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  sourceRegion,
  targetRegion,
  vpcConfig: {
    sourceCidr,
    targetCidr,
  },
  dbConfig: {
    instanceClass: dbInstanceClass,
    engine: dbEngine,
    engineVersion: dbEngineVersion,
    username: dbUsername,
    allocatedStorage: dbAllocatedStorage,
  },
  ec2Config: {
    instanceType,
    instanceCount,
    amiId,
  },
  migrationConfig: {
    maxDowntimeMinutes,
    enableRollback,
  },
  route53Config: {
    hostedZoneName,
    createNewZone,
  },
  tags: defaultTags,
});

// Export stack outputs
export const migrationStatus = stack.outputs.apply(o => o.migrationStatus);
export const targetEndpoints = stack.outputs.apply(o => o.targetEndpoints);
export const validationResults = stack.outputs.apply(o => o.validationResults);
export const rollbackAvailable = stack.outputs.apply(o => o.rollbackAvailable);
export const sourceVpcId = stack.outputs.apply(o => o.sourceVpcId);
export const targetVpcId = stack.outputs.apply(o => o.targetVpcId);
export const vpcPeeringConnectionId = stack.outputs.apply(o => o.vpcPeeringConnectionId);
export const migrationTimestamp = stack.outputs.apply(o => o.migrationTimestamp);
