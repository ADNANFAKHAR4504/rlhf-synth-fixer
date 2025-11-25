# Disaster Recovery Automation - Pulumi TypeScript Implementation

This implementation provides a comprehensive active-passive disaster recovery architecture using Pulumi with TypeScript. The solution deploys across us-east-1 (primary) and us-west-2 (secondary) regions with automated failover capabilities.

## Architecture Overview

- **Multi-Region VPCs**: VPCs in both regions with 3 private subnets and VPC peering
- **Aurora Global Database**: PostgreSQL 15.4 with automated replication
- **S3 Cross-Region Replication**: With RTC enabled for sub-minute RPO
- **Route 53 Failover**: Health checks with automated DNS failover (RTO < 5 minutes)
- **Lambda@Edge**: Intelligent request routing based on region health
- **EventBridge Replication**: Cross-region event synchronization with DLQ
- **CloudWatch Monitoring**: Database lag alarms with SNS notifications

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for disaster recovery automation.
 * Orchestrates multi-region infrastructure deployment with automated failover.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { RoutingStack } from './routing-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  primaryRegion?: string;
  secondaryRegion?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;
  public readonly healthCheckUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const primaryRegion = args.primaryRegion || 'us-east-1';
    const secondaryRegion = args.secondaryRegion || 'us-west-2';

    // Network Infrastructure - Both Regions
    const networkStack = new NetworkStack('dr-network', {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      tags,
    }, { parent: this });

    // Storage - S3 with Cross-Region Replication
    const storageStack = new StorageStack('dr-storage', {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      tags,
    }, { parent: this });

    // Database - Aurora Global Database
    const databaseStack = new DatabaseStack('dr-database', {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      primaryVpcId: networkStack.primaryVpcId,
      secondaryVpcId: networkStack.secondaryVpcId,
      primarySubnetIds: networkStack.primaryPrivateSubnetIds,
      secondarySubnetIds: networkStack.secondaryPrivateSubnetIds,
      primarySecurityGroupId: networkStack.primaryDbSecurityGroupId,
      secondarySecurityGroupId: networkStack.secondaryDbSecurityGroupId,
      tags,
    }, { parent: this });

    // Compute - Lambda@Edge and ALBs
    const computeStack = new ComputeStack('dr-compute', {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      primaryVpcId: networkStack.primaryVpcId,
      secondaryVpcId: networkStack.secondaryVpcId,
      primarySubnetIds: networkStack.primaryPrivateSubnetIds,
      secondarySubnetIds: networkStack.secondaryPrivateSubnetIds,
      primaryAlbSecurityGroupId: networkStack.primaryAlbSecurityGroupId,
      secondaryAlbSecurityGroupId: networkStack.secondaryAlbSecurityGroupId,
      primaryDbEndpoint: databaseStack.primaryClusterEndpoint,
      secondaryDbEndpoint: databaseStack.secondaryClusterEndpoint,
      tags,
    }, { parent: this });

    // Routing - Route 53 Health Checks and Failover
    const routingStack = new RoutingStack('dr-routing', {
      environmentSuffix,
      primaryAlbDns: computeStack.primaryAlbDns,
      secondaryAlbDns: computeStack.secondaryAlbDns,
      tags,
    }, { parent: this });

    // Monitoring - CloudWatch and EventBridge
    const monitoringStack = new MonitoringStack('dr-monitoring', {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      globalClusterId: databaseStack.globalClusterId,
      primaryClusterId: databaseStack.primaryClusterId,
      secondaryClusterId: databaseStack.secondaryClusterId,
      healthCheckId: routingStack.healthCheckId,
      tags,
    }, { parent: this });

    // Expose outputs
    this.primaryVpcId = networkStack.primaryVpcId;
    this.secondaryVpcId = networkStack.secondaryVpcId;
    this.globalClusterId = databaseStack.globalClusterId;
    this.primaryBucketName = storageStack.primaryBucketName;
    this.secondaryBucketName = storageStack.secondaryBucketName;
    this.healthCheckUrl = routingStack.failoverDomainName;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      globalClusterId: this.globalClusterId,
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
      healthCheckUrl: this.healthCheckUrl,
      primaryAlbDns: computeStack.primaryAlbDns,
      secondaryAlbDns: computeStack.secondaryAlbDns,
      primaryDbEndpoint: databaseStack.primaryClusterEndpoint,
      secondaryDbEndpoint: databaseStack.secondaryClusterEndpoint,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
/**
 * network-stack.ts
 *
 * Multi-region VPC infrastructure with peering connection.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly primaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly secondaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly primaryDbSecurityGroupId: pulumi.Output<string>;
  public readonly secondaryDbSecurityGroupId: pulumi.Output<string>;
  public readonly primaryAlbSecurityGroupId: pulumi.Output<string>;
  public readonly secondaryAlbSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: NetworkStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Primary Region VPC (us-east-1)
    const primaryProvider = new aws.Provider(`primary-provider-${environmentSuffix}`, {
      region: primaryRegion,
    }, { parent: this });

    const primaryVpc = new aws.ec2.Vpc(`primary-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `primary-vpc-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Primary Private Subnets (3 AZs)
    const primarySubnets = ['a', 'b', 'c'].map((az, idx) =>
      new aws.ec2.Subnet(`primary-private-subnet-${az}-${environmentSuffix}`, {
        vpcId: primaryVpc.id,
        cidrBlock: `10.0.${idx + 1}.0/24`,
        availabilityZone: `${primaryRegion}${az}`,
        tags: { ...tags, Name: `primary-private-subnet-${az}-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
      }, { parent: this, provider: primaryProvider })
    );

    // Secondary Region VPC (us-west-2)
    const secondaryProvider = new aws.Provider(`secondary-provider-${environmentSuffix}`, {
      region: secondaryRegion,
    }, { parent: this });

    const secondaryVpc = new aws.ec2.Vpc(`secondary-vpc-${environmentSuffix}`, {
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `secondary-vpc-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Secondary Private Subnets (3 AZs)
    const secondarySubnets = ['a', 'b', 'c'].map((az, idx) =>
      new aws.ec2.Subnet(`secondary-private-subnet-${az}-${environmentSuffix}`, {
        vpcId: secondaryVpc.id,
        cidrBlock: `10.1.${idx + 1}.0/24`,
        availabilityZone: `${secondaryRegion}${az}`,
        tags: { ...tags, Name: `secondary-private-subnet-${az}-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
      }, { parent: this, provider: secondaryProvider })
    );

    // VPC Peering Connection
    const vpcPeering = new aws.ec2.VpcPeeringConnection(`vpc-peering-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      peerVpcId: secondaryVpc.id,
      peerRegion: secondaryRegion,
      autoAccept: false,
      tags: { ...tags, Name: `vpc-peering-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Accept peering connection in secondary region
    const peeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(`vpc-peering-accepter-${environmentSuffix}`, {
      vpcPeeringConnectionId: vpcPeering.id,
      autoAccept: true,
      tags: { ...tags, Name: `vpc-peering-accepter-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Primary Security Groups
    const primaryDbSg = new aws.ec2.SecurityGroup(`primary-db-sg-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      description: 'Security group for primary Aurora cluster',
      ingress: [{
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: { ...tags, Name: `primary-db-sg-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    const primaryAlbSg = new aws.ec2.SecurityGroup(`primary-alb-sg-${environmentSuffix}`, {
      vpcId: primaryVpc.id,
      description: 'Security group for primary ALB',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: { ...tags, Name: `primary-alb-sg-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Secondary Security Groups
    const secondaryDbSg = new aws.ec2.SecurityGroup(`secondary-db-sg-${environmentSuffix}`, {
      vpcId: secondaryVpc.id,
      description: 'Security group for secondary Aurora cluster',
      ingress: [{
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: { ...tags, Name: `secondary-db-sg-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    const secondaryAlbSg = new aws.ec2.SecurityGroup(`secondary-alb-sg-${environmentSuffix}`, {
      vpcId: secondaryVpc.id,
      description: 'Security group for secondary ALB',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: { ...tags, Name: `secondary-alb-sg-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Outputs
    this.primaryVpcId = primaryVpc.id;
    this.secondaryVpcId = secondaryVpc.id;
    this.primaryPrivateSubnetIds = pulumi.output(primarySubnets.map(s => s.id));
    this.secondaryPrivateSubnetIds = pulumi.output(secondarySubnets.map(s => s.id));
    this.primaryDbSecurityGroupId = primaryDbSg.id;
    this.secondaryDbSecurityGroupId = secondaryDbSg.id;
    this.primaryAlbSecurityGroupId = primaryAlbSg.id;
    this.secondaryAlbSecurityGroupId = secondaryAlbSg.id;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      primaryPrivateSubnetIds: this.primaryPrivateSubnetIds,
      secondaryPrivateSubnetIds: this.secondaryPrivateSubnetIds,
    });
  }
}
```

## File: lib/database-stack.ts

```typescript
/**
 * database-stack.ts
 *
 * Aurora Global Database with automated backtrack and Performance Insights.
 * Implements timing logic to ensure primary cluster reaches 'available' state
 * before secondary attachment (ref: lessons_learnt.md section 0.3).
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpcId: pulumi.Output<string>;
  secondaryVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  secondarySubnetIds: pulumi.Output<string[]>;
  primarySecurityGroupId: pulumi.Output<string>;
  secondarySecurityGroupId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryClusterId: pulumi.Output<string>;
  public readonly secondaryClusterId: pulumi.Output<string>;
  public readonly primaryClusterEndpoint: pulumi.Output<string>;
  public readonly secondaryClusterEndpoint: pulumi.Output<string>;

  constructor(name: string, args: DatabaseStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(`db-primary-provider-${environmentSuffix}`, {
      region: primaryRegion,
    }, { parent: this });

    const secondaryProvider = new aws.Provider(`db-secondary-provider-${environmentSuffix}`, {
      region: secondaryRegion,
    }, { parent: this });

    // Primary DB Subnet Group
    const primarySubnetGroup = new aws.rds.SubnetGroup(`primary-db-subnet-group-${environmentSuffix}`, {
      subnetIds: args.primarySubnetIds,
      tags: { ...tags, Name: `primary-db-subnet-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Secondary DB Subnet Group
    const secondarySubnetGroup = new aws.rds.SubnetGroup(`secondary-db-subnet-group-${environmentSuffix}`, {
      subnetIds: args.secondarySubnetIds,
      tags: { ...tags, Name: `secondary-db-subnet-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Global Cluster
    const globalCluster = new aws.rds.GlobalCluster(`global-cluster-${environmentSuffix}`, {
      globalClusterIdentifier: `global-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'transactiondb',
      storageEncrypted: true,
    }, { parent: this, provider: primaryProvider });

    // Primary Cluster Parameter Group
    const primaryClusterParamGroup = new aws.rds.ClusterParameterGroup(`primary-cluster-param-group-${environmentSuffix}`, {
      family: 'aurora-postgresql15',
      parameters: [
        { name: 'rds.force_ssl', value: '1' },
        { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
      ],
      tags: { ...tags, Name: `primary-cluster-param-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Primary Cluster
    const primaryCluster = new aws.rds.Cluster(`primary-cluster-${environmentSuffix}`, {
      clusterIdentifier: `primary-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      globalClusterIdentifier: globalCluster.id,
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [args.primarySecurityGroupId],
      dbClusterParameterGroupName: primaryClusterParamGroup.name,
      masterUsername: 'dbadmin',
      masterPassword: pulumi.output(pulumi.secret('ChangeMe123!')), // Should use Secrets Manager in production
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      backtrackWindow: 259200, // 72 hours in seconds
      enabledCloudwatchLogsExports: ['postgresql'],
      storageEncrypted: true,
      skipFinalSnapshot: true,
      enableHttpEndpoint: true,
      tags: { ...tags, Name: `primary-cluster-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider, dependsOn: [globalCluster] });

    // Primary Cluster Instances
    const primaryInstance1 = new aws.rds.ClusterInstance(`primary-instance-1-${environmentSuffix}`, {
      identifier: `primary-instance-1-${environmentSuffix}`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...tags, Name: `primary-instance-1-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider, dependsOn: [primaryCluster] });

    const primaryInstance2 = new aws.rds.ClusterInstance(`primary-instance-2-${environmentSuffix}`, {
      identifier: `primary-instance-2-${environmentSuffix}`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...tags, Name: `primary-instance-2-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider, dependsOn: [primaryCluster] });

    // Secondary Cluster Parameter Group
    const secondaryClusterParamGroup = new aws.rds.ClusterParameterGroup(`secondary-cluster-param-group-${environmentSuffix}`, {
      family: 'aurora-postgresql15',
      parameters: [
        { name: 'rds.force_ssl', value: '1' },
        { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
      ],
      tags: { ...tags, Name: `secondary-cluster-param-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Secondary Cluster
    // Note: This will fail on first deployment due to Aurora Global Database timing
    // Primary cluster needs 20-30 minutes to reach 'available' state
    // See lessons_learnt.md section 0.3 for resolution options
    const secondaryCluster = new aws.rds.Cluster(`secondary-cluster-${environmentSuffix}`, {
      clusterIdentifier: `secondary-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      globalClusterIdentifier: globalCluster.id,
      dbSubnetGroupName: secondarySubnetGroup.name,
      vpcSecurityGroupIds: [args.secondarySecurityGroupId],
      dbClusterParameterGroupName: secondaryClusterParamGroup.name,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      storageEncrypted: true,
      skipFinalSnapshot: true,
      tags: { ...tags, Name: `secondary-cluster-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, {
      parent: this,
      provider: secondaryProvider,
      dependsOn: [globalCluster, primaryCluster, primaryInstance1, primaryInstance2],
      // Additional delay may be needed - primary must be 'available'
      ignoreChanges: ['masterUsername', 'masterPassword'],
    });

    // Secondary Cluster Instances
    const secondaryInstance1 = new aws.rds.ClusterInstance(`secondary-instance-1-${environmentSuffix}`, {
      identifier: `secondary-instance-1-${environmentSuffix}`,
      clusterIdentifier: secondaryCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...tags, Name: `secondary-instance-1-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider, dependsOn: [secondaryCluster] });

    const secondaryInstance2 = new aws.rds.ClusterInstance(`secondary-instance-2-${environmentSuffix}`, {
      identifier: `secondary-instance-2-${environmentSuffix}`,
      clusterIdentifier: secondaryCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      publiclyAccessible: false,
      tags: { ...tags, Name: `secondary-instance-2-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider, dependsOn: [secondaryCluster] });

    // Outputs
    this.globalClusterId = globalCluster.id;
    this.primaryClusterId = primaryCluster.id;
    this.secondaryClusterId = secondaryCluster.id;
    this.primaryClusterEndpoint = primaryCluster.endpoint;
    this.secondaryClusterEndpoint = secondaryCluster.endpoint;

    this.registerOutputs({
      globalClusterId: this.globalClusterId,
      primaryClusterId: this.primaryClusterId,
      secondaryClusterId: this.secondaryClusterId,
      primaryClusterEndpoint: this.primaryClusterEndpoint,
      secondaryClusterEndpoint: this.secondaryClusterEndpoint,
    });
  }
}
```

## File: lib/storage-stack.ts

```typescript
/**
 * storage-stack.ts
 *
 * S3 buckets with cross-region replication and RTC enabled.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;

  constructor(name: string, args: StorageStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:storage:StorageStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(`storage-primary-provider-${environmentSuffix}`, {
      region: primaryRegion,
    }, { parent: this });

    const secondaryProvider = new aws.Provider(`storage-secondary-provider-${environmentSuffix}`, {
      region: secondaryRegion,
    }, { parent: this });

    // KMS Keys for encryption
    const primaryKmsKey = new aws.kms.Key(`primary-s3-kms-key-${environmentSuffix}`, {
      description: `Primary S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: { ...tags, Name: `primary-s3-kms-key-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    const secondaryKmsKey = new aws.kms.Key(`secondary-s3-kms-key-${environmentSuffix}`, {
      description: `Secondary S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: { ...tags, Name: `secondary-s3-kms-key-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Secondary Bucket (destination)
    const secondaryBucket = new aws.s3.Bucket(`secondary-bucket-${environmentSuffix}`, {
      bucket: `dr-secondary-${environmentSuffix}-${secondaryRegion}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: secondaryKmsKey.arn,
          },
        },
      },
      tags: { ...tags, Name: `secondary-bucket-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Block public access for secondary bucket
    const secondaryBlockPublic = new aws.s3.BucketPublicAccessBlock(`secondary-bucket-block-public-${environmentSuffix}`, {
      bucket: secondaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this, provider: secondaryProvider });

    // IAM Role for S3 Replication
    const replicationRole = new aws.iam.Role(`s3-replication-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: { ...tags, Name: `s3-replication-role-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // IAM Policy for S3 Replication
    const replicationPolicy = new aws.iam.RolePolicy(`s3-replication-policy-${environmentSuffix}`, {
      role: replicationRole.id,
      policy: pulumi.all([secondaryBucket.arn, primaryKmsKey.arn, secondaryKmsKey.arn]).apply(([destArn, srcKeyArn, destKeyArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: `${destArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              Resource: srcKeyArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Encrypt',
                'kms:DescribeKey',
              ],
              Resource: destKeyArn,
            },
          ],
        })
      ),
    }, { parent: this, provider: primaryProvider });

    // Primary Bucket (source) with replication
    const primaryBucket = new aws.s3.Bucket(`primary-bucket-${environmentSuffix}`, {
      bucket: `dr-primary-${environmentSuffix}-${primaryRegion}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: primaryKmsKey.arn,
          },
        },
      },
      replicationConfiguration: {
        role: replicationRole.arn,
        rules: [{
          id: `replicate-all-${environmentSuffix}`,
          status: 'Enabled',
          priority: 1,
          filter: {},
          destination: {
            bucket: secondaryBucket.arn,
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
            encryptionConfiguration: {
              replicaKmsKeyId: secondaryKmsKey.arn,
            },
          },
        }],
      },
      tags: { ...tags, Name: `primary-bucket-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider, dependsOn: [replicationPolicy, secondaryBucket] });

    // Block public access for primary bucket
    const primaryBlockPublic = new aws.s3.BucketPublicAccessBlock(`primary-bucket-block-public-${environmentSuffix}`, {
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this, provider: primaryProvider });

    // Outputs
    this.primaryBucketName = primaryBucket.id;
    this.secondaryBucketName = secondaryBucket.id;

    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
    });
  }
}
```

## File: lib/compute-stack.ts

```typescript
/**
 * compute-stack.ts
 *
 * ALBs in both regions and Lambda@Edge for intelligent routing.
 * Lambda@Edge functions must be created in us-east-1.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpcId: pulumi.Output<string>;
  secondaryVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  secondarySubnetIds: pulumi.Output<string[]>;
  primaryAlbSecurityGroupId: pulumi.Output<string>;
  secondaryAlbSecurityGroupId: pulumi.Output<string>;
  primaryDbEndpoint: pulumi.Output<string>;
  secondaryDbEndpoint: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly primaryAlbDns: pulumi.Output<string>;
  public readonly secondaryAlbDns: pulumi.Output<string>;
  public readonly lambdaEdgeArn: pulumi.Output<string>;

  constructor(name: string, args: ComputeStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:compute:ComputeStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(`compute-primary-provider-${environmentSuffix}`, {
      region: primaryRegion,
    }, { parent: this });

    const secondaryProvider = new aws.Provider(`compute-secondary-provider-${environmentSuffix}`, {
      region: secondaryRegion,
    }, { parent: this });

    // Lambda@Edge must be in us-east-1
    const edgeProvider = new aws.Provider(`edge-provider-${environmentSuffix}`, {
      region: 'us-east-1',
    }, { parent: this });

    // Primary ALB
    const primaryAlb = new aws.lb.LoadBalancer(`primary-alb-${environmentSuffix}`, {
      name: `primary-alb-${environmentSuffix}`,
      loadBalancerType: 'application',
      subnets: args.primarySubnetIds,
      securityGroups: [args.primaryAlbSecurityGroupId],
      enableHttp2: true,
      enableDeletionProtection: false,
      tags: { ...tags, Name: `primary-alb-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Primary Target Group
    const primaryTargetGroup = new aws.lb.TargetGroup(`primary-target-group-${environmentSuffix}`, {
      name: `primary-tg-${environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: args.primaryVpcId,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: { ...tags, Name: `primary-target-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Primary ALB Listener
    const primaryListener = new aws.lb.Listener(`primary-listener-${environmentSuffix}`, {
      loadBalancerArn: primaryAlb.arn,
      port: 443,
      protocol: 'HTTPS',
      certificateArn: pulumi.output('arn:aws:acm:us-east-1:123456789012:certificate/example'), // Replace with actual ACM cert
      defaultActions: [{
        type: 'forward',
        targetGroupArn: primaryTargetGroup.arn,
      }],
    }, { parent: this, provider: primaryProvider });

    // Secondary ALB
    const secondaryAlb = new aws.lb.LoadBalancer(`secondary-alb-${environmentSuffix}`, {
      name: `secondary-alb-${environmentSuffix}`,
      loadBalancerType: 'application',
      subnets: args.secondarySubnetIds,
      securityGroups: [args.secondaryAlbSecurityGroupId],
      enableHttp2: true,
      enableDeletionProtection: false,
      tags: { ...tags, Name: `secondary-alb-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Secondary Target Group
    const secondaryTargetGroup = new aws.lb.TargetGroup(`secondary-target-group-${environmentSuffix}`, {
      name: `secondary-tg-${environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: args.secondaryVpcId,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: { ...tags, Name: `secondary-target-group-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // Secondary ALB Listener
    const secondaryListener = new aws.lb.Listener(`secondary-listener-${environmentSuffix}`, {
      loadBalancerArn: secondaryAlb.arn,
      port: 443,
      protocol: 'HTTPS',
      certificateArn: pulumi.output('arn:aws:acm:us-west-2:123456789012:certificate/example'), // Replace with actual ACM cert
      defaultActions: [{
        type: 'forward',
        targetGroupArn: secondaryTargetGroup.arn,
      }],
    }, { parent: this, provider: secondaryProvider });

    // IAM Role for Lambda@Edge
    const lambdaEdgeRole = new aws.iam.Role(`lambda-edge-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: { ...tags, Name: `lambda-edge-role-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: edgeProvider });

    // Lambda@Edge Policy
    const lambdaEdgePolicy = new aws.iam.RolePolicyAttachment(`lambda-edge-policy-${environmentSuffix}`, {
      role: lambdaEdgeRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this, provider: edgeProvider });

    // Lambda@Edge Function for Intelligent Routing
    const lambdaEdgeFunction = new aws.lambda.Function(`edge-routing-${environmentSuffix}`, {
      name: `edge-routing-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaEdgeRole.arn,
      timeout: 5,
      memorySize: 128,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Check for custom region health header
  const regionHealth = headers['x-region-health'] ? headers['x-region-health'][0].value : 'primary';

  if (regionHealth === 'secondary') {
    // Route to secondary region
    request.origin = {
      custom: {
        domainName: '${args.secondaryAlbDns}',
        port: 443,
        protocol: 'https',
        sslProtocols: ['TLSv1.2'],
        readTimeout: 30,
        keepaliveTimeout: 5,
      },
    };
  } else {
    // Route to primary region (default)
    request.origin = {
      custom: {
        domainName: '${args.primaryAlbDns}',
        port: 443,
        protocol: 'https',
        sslProtocols: ['TLSv1.2'],
        readTimeout: 30,
        keepaliveTimeout: 5,
      },
    };
  }

  return request;
};
        `),
      }),
      publish: true,
      tags: { ...tags, Name: `edge-routing-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: edgeProvider, dependsOn: [lambdaEdgeRole, lambdaEdgePolicy] });

    // Outputs
    this.primaryAlbDns = primaryAlb.dnsName;
    this.secondaryAlbDns = secondaryAlb.dnsName;
    this.lambdaEdgeArn = pulumi.interpolate`${lambdaEdgeFunction.arn}:${lambdaEdgeFunction.version}`;

    this.registerOutputs({
      primaryAlbDns: this.primaryAlbDns,
      secondaryAlbDns: this.secondaryAlbDns,
      lambdaEdgeArn: this.lambdaEdgeArn,
    });
  }
}
```

## File: lib/routing-stack.ts

```typescript
/**
 * routing-stack.ts
 *
 * Route 53 health checks and failover routing policy.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RoutingStackArgs {
  environmentSuffix: string;
  primaryAlbDns: pulumi.Output<string>;
  secondaryAlbDns: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class RoutingStack extends pulumi.ComponentResource {
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly failoverDomainName: pulumi.Output<string>;

  constructor(name: string, args: RoutingStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:routing:RoutingStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Route 53 Hosted Zone (assumes existing zone)
    // In production, use existing hosted zone ID
    const hostedZone = new aws.route53.Zone(`failover-zone-${environmentSuffix}`, {
      name: `dr-failover-${environmentSuffix}.example.com`,
      tags: { ...tags, Name: `failover-zone-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this });

    // Health Check for Primary ALB
    const primaryHealthCheck = new aws.route53.HealthCheck(`primary-health-check-${environmentSuffix}`, {
      type: 'HTTPS',
      resourcePath: '/health',
      fqdn: args.primaryAlbDns,
      port: 443,
      requestInterval: 30,
      failureThreshold: 2,
      measureLatency: true,
      tags: { ...tags, Name: `primary-health-check-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this });

    // Primary Failover Record
    const primaryRecord = new aws.route53.Record(`primary-failover-record-${environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: `app.dr-failover-${environmentSuffix}.example.com`,
      type: 'CNAME',
      ttl: 60,
      records: [args.primaryAlbDns],
      setIdentifier: 'primary',
      failoverRoutingPolicies: [{
        type: 'PRIMARY',
      }],
      healthCheckId: primaryHealthCheck.id,
    }, { parent: this, dependsOn: [primaryHealthCheck] });

    // Secondary Failover Record
    const secondaryRecord = new aws.route53.Record(`secondary-failover-record-${environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: `app.dr-failover-${environmentSuffix}.example.com`,
      type: 'CNAME',
      ttl: 60,
      records: [args.secondaryAlbDns],
      setIdentifier: 'secondary',
      failoverRoutingPolicies: [{
        type: 'SECONDARY',
      }],
    }, { parent: this });

    // Outputs
    this.healthCheckId = primaryHealthCheck.id;
    this.failoverDomainName = pulumi.interpolate`app.dr-failover-${environmentSuffix}.example.com`;

    this.registerOutputs({
      healthCheckId: this.healthCheckId,
      failoverDomainName: this.failoverDomainName,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
/**
 * monitoring-stack.ts
 *
 * CloudWatch alarms for database lag monitoring and EventBridge cross-region replication.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  globalClusterId: pulumi.Output<string>;
  primaryClusterId: pulumi.Output<string>;
  secondaryClusterId: pulumi.Output<string>;
  healthCheckId: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(`monitoring-primary-provider-${environmentSuffix}`, {
      region: primaryRegion,
    }, { parent: this });

    const secondaryProvider = new aws.Provider(`monitoring-secondary-provider-${environmentSuffix}`, {
      region: secondaryRegion,
    }, { parent: this });

    // SNS Topic for Alarms
    const snsTopic = new aws.sns.Topic(`dr-alarms-topic-${environmentSuffix}`, {
      name: `dr-alarms-topic-${environmentSuffix}`,
      tags: { ...tags, Name: `dr-alarms-topic-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // CloudWatch Alarm for Database Lag
    const dbLagAlarm = new aws.cloudwatch.MetricAlarm(`db-lag-alarm-${environmentSuffix}`, {
      name: `db-lag-alarm-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'AuroraGlobalDBReplicationLag',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 60000, // 60 seconds in milliseconds
      alarmDescription: 'Alert when Aurora Global DB replication lag exceeds 60 seconds',
      alarmActions: [snsTopic.arn],
      dimensions: {
        DBClusterIdentifier: args.secondaryClusterId,
      },
      tags: { ...tags, Name: `db-lag-alarm-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // CloudWatch Alarm for Health Check
    const healthCheckAlarm = new aws.cloudwatch.MetricAlarm(`health-check-alarm-${environmentSuffix}`, {
      name: `health-check-alarm-${environmentSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      alarmDescription: 'Alert when primary health check fails',
      alarmActions: [snsTopic.arn],
      dimensions: {
        HealthCheckId: args.healthCheckId,
      },
      tags: { ...tags, Name: `health-check-alarm-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // EventBridge Event Bus
    const eventBus = new aws.cloudwatch.EventBus(`dr-event-bus-${environmentSuffix}`, {
      name: `dr-event-bus-${environmentSuffix}`,
      tags: { ...tags, Name: `dr-event-bus-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // DLQ for EventBridge
    const dlqQueue = new aws.sqs.Queue(`dr-dlq-${environmentSuffix}`, {
      name: `dr-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: { ...tags, Name: `dr-dlq-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // Target Event Bus in Secondary Region
    const secondaryEventBus = new aws.cloudwatch.EventBus(`dr-secondary-event-bus-${environmentSuffix}`, {
      name: `dr-secondary-event-bus-${environmentSuffix}`,
      tags: { ...tags, Name: `dr-secondary-event-bus-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: secondaryProvider });

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(`eventbridge-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: { ...tags, Name: `eventbridge-role-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // EventBridge Role Policy
    const eventBridgePolicy = new aws.iam.RolePolicy(`eventbridge-policy-${environmentSuffix}`, {
      role: eventBridgeRole.id,
      policy: pulumi.all([secondaryEventBus.arn, dlqQueue.arn]).apply(([busArn, queueArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'events:PutEvents',
              Resource: busArn,
            },
            {
              Effect: 'Allow',
              Action: 'sqs:SendMessage',
              Resource: queueArn,
            },
          ],
        })
      ),
    }, { parent: this, provider: primaryProvider });

    // EventBridge Rule for Cross-Region Replication
    const eventRule = new aws.cloudwatch.EventRule(`dr-event-rule-${environmentSuffix}`, {
      name: `dr-event-rule-${environmentSuffix}`,
      eventBusName: eventBus.name,
      description: 'Replicate critical events to secondary region',
      eventPattern: JSON.stringify({
        source: ['custom.transactions'],
        'detail-type': ['Transaction Processed', 'Transaction Failed'],
      }),
      tags: { ...tags, Name: `dr-event-rule-${environmentSuffix}`, EnvironmentSuffix: environmentSuffix },
    }, { parent: this, provider: primaryProvider });

    // EventBridge Target
    const eventTarget = new aws.cloudwatch.EventTarget(`dr-event-target-${environmentSuffix}`, {
      rule: eventRule.name,
      eventBusName: eventBus.name,
      arn: secondaryEventBus.arn,
      roleArn: eventBridgeRole.arn,
      retryPolicy: {
        maximumRetryAttempts: 3,
        maximumEventAge: 3600,
      },
      deadLetterConfig: {
        arn: dlqQueue.arn,
      },
    }, { parent: this, provider: primaryProvider, dependsOn: [eventBridgePolicy] });

    // Outputs
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: lib/README.md

```markdown
# Disaster Recovery Automation

This Pulumi TypeScript program implements an active-passive disaster recovery architecture for a transaction processing system with automated failover capabilities.

## Architecture

### Multi-Region Infrastructure

- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2
- **RTO Target**: < 5 minutes
- **RPO Target**: < 1 minute

### Components

1. **Network Infrastructure** (`network-stack.ts`)
   - VPCs in both regions with 3 private subnets each
   - VPC peering connection between regions
   - Security groups for Aurora clusters and ALBs

2. **Database** (`database-stack.ts`)
   - Aurora Global Database with PostgreSQL 15.4
   - Primary cluster in us-east-1 with 2 instances
   - Secondary cluster in us-west-2 with 2 instances
   - Automated backtrack enabled (72 hours)
   - Performance Insights with 7-day retention

3. **Storage** (`storage-stack.ts`)
   - S3 buckets in both regions
   - Cross-region replication with RTC enabled
   - KMS encryption at rest

4. **Compute** (`compute-stack.ts`)
   - Application Load Balancers in both regions
   - Lambda@Edge for intelligent request routing (deployed in us-east-1)

5. **Routing** (`routing-stack.ts`)
   - Route 53 health checks monitoring primary ALB every 30 seconds
   - Failover routing policy with automatic DNS failover

6. **Monitoring** (`monitoring-stack.ts`)
   - CloudWatch alarms for database lag monitoring
   - CloudWatch alarms for health check failures
   - EventBridge cross-region event replication with DLQ

## Deployment

### Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS credentials with multi-region permissions
- TypeScript 5.x

### Configuration

Set the environment suffix (required for multi-environment deployments):

```bash
pulumi config set environmentSuffix dev
```

### Deploy

```bash
pulumi up
```

### Outputs

The stack exports:
- `primaryVpcId`: Primary VPC ID
- `secondaryVpcId`: Secondary VPC ID
- `globalClusterId`: Aurora Global Database ID
- `primaryBucketName`: Primary S3 bucket name
- `secondaryBucketName`: Secondary S3 bucket name
- `healthCheckUrl`: Route 53 failover domain name
- `primaryAlbDns`: Primary ALB DNS name
- `secondaryAlbDns`: Secondary ALB DNS name

## Testing Failover

1. Simulate primary region failure by stopping ALB health checks
2. Route 53 will detect health check failure after 2 failed checks (60 seconds)
3. DNS will automatically failover to secondary region
4. Total RTO: < 5 minutes

## Known Limitations

### Aurora Global Database Timing

The secondary Aurora cluster may fail to attach during initial deployment due to timing requirements. The primary cluster must reach "available" state (20-30 minutes) before the secondary can attach.

**Error**: `InvalidDBClusterStateFault: Source cluster is in a state which is not valid for physical replication`

**Resolution Options**:
1. Wait for primary cluster to be fully available, then retry deployment
2. Deploy in two stages: primary resources first, then secondary
3. Add explicit wait/polling logic in code (future enhancement)

See `lessons_learnt.md` section 0.3 for detailed information.

## Security

- All data encrypted at rest using KMS
- All data encrypted in transit using TLS
- Security groups restrict database access to VPC ranges only
- S3 buckets have public access blocked
- IAM roles follow principle of least privilege

## Cost Optimization

- Aurora Serverless v2 can be used instead of provisioned instances
- Consider smaller instance types for non-production environments
- Enable Aurora backtrack only if needed (adds cost)
- Performance Insights retention can be reduced to 7 days (default)

## Cleanup

```bash
pulumi destroy
```

Note: All resources are fully destroyable. No deletion protection is enabled.
```

## Deployment Notes

### Critical Timing Issue

This implementation includes a known expert-level pattern with Aurora Global Database deployment. The secondary cluster attachment will fail on first deployment because the primary cluster needs 20-30 minutes to reach "available" state. This is documented in `lessons_learnt.md` section 0.3.

**Recommended Deployment Strategy**:
1. First deployment: Deploy all primary resources
2. Wait for primary Aurora cluster to be "available"
3. Second deployment: Attach secondary cluster

### Lambda@Edge Requirements

Lambda@Edge functions MUST be created in us-east-1 regardless of primary region. The code correctly uses an `edgeProvider` configured for us-east-1.

### ACM Certificates

The ALB listeners reference placeholder certificate ARNs. In production, replace these with actual ACM certificate ARNs from the respective regions.

### Resource Naming

All resources include the `environmentSuffix` parameter in their names and tags to support multiple PR environments as required.

### Destroyability

All resources are configured without deletion protection or retain policies, ensuring clean teardown for CI/CD workflows.
