/**
 * Pulumi application entry point for PostgreSQL Database Migration infrastructure.
 *
 * This module orchestrates the phased migration of PostgreSQL databases from on-premises
 * to AWS using DMS, RDS, and supporting services.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get configuration values
const config = new pulumi.Config();
// Support both Pulumi config and environment variable for CI/CD compatibility
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const migrationPhase = config.get('migrationPhase') || 'dev';
const costCenter = config.get('costCenter') || 'migration-team';
const complianceScope = config.get('complianceScope') || 'PCI-DSS';

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || 'database-migration';
const commitAuthor = process.env.COMMIT_AUTHOR || 'migration-team';
const prNumber = process.env.PR_NUMBER || 'n/a';
const team = process.env.TEAM || 'infrastructure';
const createdAt = new Date().toISOString();

// Define comprehensive tags as per requirements
const defaultTags = {
  Environment: environmentSuffix,
  MigrationPhase: migrationPhase,
  CostCenter: costCenter,
  ComplianceScope: complianceScope,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

// Configure AWS provider for us-east-2 with default tags
const provider = new aws.Provider('aws-provider', {
  region: 'us-east-2',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main migration stack
const migrationStack = new TapStack(
  'db-migration-stack',
  {
    environmentSuffix,
    migrationPhase,
    costCenter,
    complianceScope,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for Direct Connect integration and monitoring
export const vpcId = migrationStack.vpcId;
export const rdsEndpoint = migrationStack.rdsEndpoint;
export const dmsReplicationInstanceArn =
  migrationStack.dmsReplicationInstanceArn;
export const secretsManagerArn = migrationStack.secretsManagerArn;
export const replicationLagAlarmArn = migrationStack.replicationLagAlarmArn;
export const directConnectVirtualInterfaceId =
  migrationStack.directConnectVifId;
export const directConnectAttachmentId =
  migrationStack.directConnectAttachmentId;
export const kmsKeyId = migrationStack.kmsKeyId;
