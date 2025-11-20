/**
 * Main Pulumi program entry point for payment processing migration infrastructure.
 * This module defines all core infrastructure resources and exports stack outputs.
 */

import * as aws from '@pulumi/aws';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { MigrationStack } from './migration-stack';
import { MonitoringStack } from './monitoring-stack';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get AWS region from environment or default to us-east-1
const region = process.env.AWS_REGION || 'us-east-1';

// Define default tags for all resources
const defaultTags = {
  Environment: 'prod-migration',
  CostCenter: 'finance',
  MigrationPhase: 'active',
  ManagedBy: 'pulumi',
  Repository: process.env.REPOSITORY || 'unknown',
  Team: process.env.TEAM || 'unknown',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws-provider', {
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
    sourceDbEndpoint: 'source-db.example.com', // This would be provided as config
    sourceDbPort: 5432,
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

// Export stack outputs
export const vpcId = network.vpcId;
export const albDnsName = compute.albDnsName;
export const rdsClusterEndpoint = database.clusterEndpoint;
export const rdsReaderEndpoint = database.readerEndpoint;
export const dmsReplicationTaskArn = migration.replicationTaskArn;
export const validationLambdaArn = migration.validationLambdaArn;
export const ecsClusterName = compute.clusterName;
export const ecsServiceName = compute.serviceName;
