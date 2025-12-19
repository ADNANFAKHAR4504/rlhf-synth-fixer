/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the infrastructure with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

import * as aws from '@pulumi/aws';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MigrationStack } from '../lib/migration-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkStack } from '../lib/network-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Get AWS region from environment or default to us-east-1
const region = process.env.AWS_REGION || 'us-east-1';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: 'prod-migration',
  CostCenter: 'finance',
  MigrationPhase: 'active',
  ManagedBy: 'pulumi',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: region,
  defaultTags: {
    tags: defaultTags,
  },
});

// Create VPC and networking infrastructure
const network = new NetworkStack(
  'network',
  {
    environmentSuffix,
    vpcCidr: '10.0.0.0/16',
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
    tags: defaultTags,
  },
  { provider }
);

// Create RDS Aurora PostgreSQL cluster
const database = new DatabaseStack(
  'database',
  {
    environmentSuffix,
    vpcId: network.vpcId,
    privateSubnetIds: network.privateSubnetIds,
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
    tags: defaultTags,
  },
  { provider }
);

// Create ECS Fargate service with ALB
const compute = new ComputeStack(
  'compute',
  {
    environmentSuffix,
    vpcId: network.vpcId,
    publicSubnetIds: network.publicSubnetIds,
    privateSubnetIds: network.privateSubnetIds,
    databaseEndpoint: database.clusterEndpoint,
    databaseSecurityGroupId: database.securityGroupId,
    tags: defaultTags,
  },
  { provider }
);

// Create DMS replication infrastructure and validation Lambda
const migration = new MigrationStack(
  'migration',
  {
    environmentSuffix,
    vpcId: network.vpcId,
    privateSubnetIds: network.privateSubnetIds,
    sourceDbEndpoint: process.env.SOURCE_DB_ENDPOINT || 'source-db.example.com',
    sourceDbPort: parseInt(process.env.SOURCE_DB_PORT || '5432'),
    targetDbEndpoint: database.clusterEndpoint,
    targetDbPort: 5432,
    databaseSecurityGroupId: database.securityGroupId,
    tags: defaultTags,
  },
  { provider }
);

// Create CloudWatch alarms and monitoring
new MonitoringStack(
  'monitoring',
  {
    environmentSuffix,
    dmsReplicationTaskArn: migration.replicationTaskArn,
    ecsClusterName: compute.clusterName,
    ecsServiceName: compute.serviceName,
    rdsClusterId: database.clusterId,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for networking
export const vpcId = network.vpcId;
export const internetGatewayId = network.internetGatewayId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;

// Export stack outputs for database
export const rdsClusterEndpoint = database.clusterEndpoint;
export const rdsReaderEndpoint = database.readerEndpoint;
export const rdsClusterId = database.clusterId;
export const databaseSecurityGroupId = database.securityGroupId;

// Export stack outputs for compute
export const ecsClusterName = compute.clusterName;
export const ecsServiceName = compute.serviceName;
export const albDnsName = compute.albDnsName;

// Export stack outputs for migration
export const dmsReplicationTaskArn = migration.replicationTaskArn;
export const validationLambdaArn = migration.validationLambdaArn;
