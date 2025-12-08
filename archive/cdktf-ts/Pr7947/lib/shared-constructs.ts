import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { RdsGlobalCluster } from '@cdktf/provider-aws/lib/rds-global-cluster';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { config } from './config/infrastructure-config';

// Generate unique suffix to avoid resource naming conflicts
const uniqueSuffix = 'q8t3';

export interface SharedConstructsProps {
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  environmentSuffix: string;
}

export class SharedConstructs extends Construct {
  public readonly hostedZone: Route53Zone;
  public readonly globalCluster: RdsGlobalCluster;
  public readonly sessionTable: DynamodbTable;
  public readonly configBucket: S3Bucket;
  public readonly auditLogBucket: S3Bucket;
  public readonly primaryHealthCheck: Route53HealthCheck;
  public readonly secondaryHealthCheck: Route53HealthCheck;

  constructor(scope: Construct, id: string, props: SharedConstructsProps) {
    super(scope, id);

    const { primaryProvider, secondaryProvider, environmentSuffix } = props;

    // Route 53 Hosted Zone
    this.hostedZone = new Route53Zone(this, 'hosted-zone', {
      provider: primaryProvider,
      name: config.hostedZoneName,
      tags: {
        Name: `hosted-zone-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    // RDS Global Cluster
    this.globalCluster = new RdsGlobalCluster(this, 'global-cluster', {
      provider: primaryProvider,
      globalClusterIdentifier: `${config.globalDatabaseIdentifier}-${environmentSuffix}-${uniqueSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: config.databaseName,
      storageEncrypted: true,
      deletionProtection: false,
    });

    // DynamoDB Global Table for Sessions
    this.sessionTable = new DynamodbTable(this, 'session-table', {
      provider: primaryProvider,
      name: `${config.sessionTableName}-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'userId',
      rangeKey: 'sessionId',
      attribute: [
        { name: 'userId', type: 'S' },
        { name: 'sessionId', type: 'S' },
      ],
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      pointInTimeRecovery: {
        enabled: true,
      },
      replica: [
        {
          regionName: config.secondaryRegion.region,
          pointInTimeRecovery: true,
        },
      ],
      tags: {
        Name: `session-table-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    // IAM Role for S3 Replication
    const replicationRole = new IamRole(this, 'replication-role', {
      provider: primaryProvider,
      name: `s3-replication-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `replication-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket for Application Configurations (Primary)
    this.configBucket = new S3Bucket(this, 'config-bucket-primary', {
      provider: primaryProvider,
      bucket: `trading-config-${environmentSuffix}-primary`,
      forceDestroy: true,
      tags: {
        Name: `config-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    new S3BucketVersioningA(this, 'config-bucket-versioning', {
      provider: primaryProvider,
      bucket: this.configBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket for Configurations (Secondary)
    const configBucketSecondary = new S3Bucket(
      this,
      'config-bucket-secondary',
      {
        provider: secondaryProvider,
        bucket: `trading-config-${environmentSuffix}-secondary`,
        forceDestroy: true,
        tags: {
          Name: `config-bucket-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'CDKTF',
        },
      }
    );

    const configBucketSecondaryVersioning = new S3BucketVersioningA(
      this,
      'config-bucket-secondary-versioning',
      {
        provider: secondaryProvider,
        bucket: configBucketSecondary.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Replication Policy
    new IamRolePolicy(this, 'replication-policy', {
      provider: primaryProvider,
      role: replicationRole.id,
      name: 'S3ReplicationPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: this.configBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
            ],
            Resource: `${this.configBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            Resource: `${configBucketSecondary.arn}/*`,
          },
        ],
      }),
    });

    // S3 Replication Configuration
    new S3BucketReplicationConfigurationA(this, 'config-replication', {
      provider: primaryProvider,
      role: replicationRole.arn,
      bucket: this.configBucket.id,
      rule: [
        {
          id: 'replicate-all',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: { status: 'Enabled' },
          filter: {},
          destination: {
            bucket: configBucketSecondary.arn,
            replicationTime: {
              status: 'Enabled',
              time: { minutes: 15 },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: { minutes: 15 },
            },
          },
        },
      ],
      dependsOn: [configBucketSecondaryVersioning],
    });

    // S3 Bucket for Audit Logs (Primary)
    this.auditLogBucket = new S3Bucket(this, 'audit-log-bucket-primary', {
      provider: primaryProvider,
      bucket: `trading-audit-logs-${environmentSuffix}-primary`,
      forceDestroy: true,
      tags: {
        Name: `audit-log-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    new S3BucketVersioningA(this, 'audit-bucket-versioning', {
      provider: primaryProvider,
      bucket: this.auditLogBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket for Audit Logs (Secondary)
    const auditLogBucketSecondary = new S3Bucket(
      this,
      'audit-log-bucket-secondary',
      {
        provider: secondaryProvider,
        bucket: `trading-audit-logs-${environmentSuffix}-secondary`,
        forceDestroy: true,
        tags: {
          Name: `audit-log-bucket-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'CDKTF',
        },
      }
    );

    const auditBucketSecondaryVersioning = new S3BucketVersioningA(
      this,
      'audit-bucket-secondary-versioning',
      {
        provider: secondaryProvider,
        bucket: auditLogBucketSecondary.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Audit Log Replication
    const auditReplicationRole = new IamRole(this, 'audit-replication-role', {
      provider: primaryProvider,
      name: `audit-replication-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'audit-replication-policy', {
      provider: primaryProvider,
      role: auditReplicationRole.id,
      name: 'AuditReplicationPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: this.auditLogBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
            ],
            Resource: `${this.auditLogBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            Resource: `${auditLogBucketSecondary.arn}/*`,
          },
        ],
      }),
    });

    new S3BucketReplicationConfigurationA(this, 'audit-replication', {
      provider: primaryProvider,
      role: auditReplicationRole.arn,
      bucket: this.auditLogBucket.id,
      rule: [
        {
          id: 'replicate-audit-logs',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: { status: 'Enabled' },
          filter: {},
          destination: {
            bucket: auditLogBucketSecondary.arn,
            replicationTime: {
              status: 'Enabled',
              time: { minutes: 15 },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: { minutes: 15 },
            },
          },
        },
      ],
      dependsOn: [auditBucketSecondaryVersioning],
    });

    // Route 53 Health Checks (placeholders - will be updated with actual endpoints)
    this.primaryHealthCheck = new Route53HealthCheck(
      this,
      'primary-health-check',
      {
        provider: primaryProvider,
        type: 'HTTPS',
        resourcePath: '/health',
        fqdn: `primary.${config.apiDomainName}`,
        port: 443,
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          Name: `primary-health-check-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    this.secondaryHealthCheck = new Route53HealthCheck(
      this,
      'secondary-health-check',
      {
        provider: primaryProvider,
        type: 'HTTPS',
        resourcePath: '/health',
        fqdn: `secondary.${config.apiDomainName}`,
        port: 443,
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          Name: `secondary-health-check-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );
  }
}
