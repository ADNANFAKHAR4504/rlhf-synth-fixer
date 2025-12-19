import { Construct } from 'constructs';
import { RdsGlobalCluster } from '@cdktf/provider-aws/lib/rds-global-cluster';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

export interface DatabaseStackProps {
  environmentSuffix: string;
  primaryVpcId: string;
  drVpcId: string;
  primaryDbSubnetIds: string[];
  drDbSubnetIds: string[];
  primaryRegion: string;
  drRegion: string;
  primaryProvider?: AwsProvider;
  drProvider?: AwsProvider;
}

export interface DatabaseStackOutputs {
  globalClusterId: string;
  primaryClusterId: string;
  drClusterId: string;
  primaryClusterEndpoint: string;
  primaryClusterReaderEndpoint: string;
  drClusterEndpoint: string;
  drClusterReaderEndpoint: string;
}

export class DatabaseStack extends Construct {
  public readonly outputs: DatabaseStackOutputs;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryVpcId,
      drVpcId,
      primaryDbSubnetIds,
      drDbSubnetIds,
      primaryRegion,
      drRegion,
      primaryProvider,
      drProvider,
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // Security Groups
    const primaryDbSg = new SecurityGroup(this, 'primary-db-sg', {
      name: `payment-db-sg-${environmentSuffix}-${primaryRegion}`,
      description: 'Security group for Aurora database in primary region',
      vpcId: primaryVpcId,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
        Name: `payment-db-sg-${environmentSuffix}-${primaryRegion}`,
      },
      provider: primaryProvider,
    });

    new SecurityGroupRule(this, 'primary-db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: primaryDbSg.id,
      description: 'PostgreSQL access from VPC',
      provider: primaryProvider,
    });

    new SecurityGroupRule(this, 'primary-db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryDbSg.id,
      description: 'Allow all outbound traffic',
      provider: primaryProvider,
    });

    const drDbSg = new SecurityGroup(this, 'dr-db-sg', {
      name: `payment-db-sg-${environmentSuffix}-${drRegion}`,
      description: 'Security group for Aurora database in DR region',
      vpcId: drVpcId,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
        Name: `payment-db-sg-${environmentSuffix}-${drRegion}`,
      },
      provider: drProvider,
    });

    new SecurityGroupRule(this, 'dr-db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.1.0.0/16'],
      securityGroupId: drDbSg.id,
      description: 'PostgreSQL access from VPC',
      provider: drProvider,
    });

    new SecurityGroupRule(this, 'dr-db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drDbSg.id,
      description: 'Allow all outbound traffic',
      provider: drProvider,
    });

    // DB Subnet Groups
    const primarySubnetGroup = new DbSubnetGroup(this, 'primary-subnet-group', {
      name: `payment-db-subnet-${environmentSuffix}-${primaryRegion}`,
      subnetIds: primaryDbSubnetIds,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
    });

    const drSubnetGroup = new DbSubnetGroup(this, 'dr-subnet-group', {
      name: `payment-db-subnet-${environmentSuffix}-${drRegion}`,
      subnetIds: drDbSubnetIds,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    // Global Database Cluster
    const globalCluster = new RdsGlobalCluster(this, 'global-cluster', {
      globalClusterIdentifier: `payment-global-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'payments',
      storageEncrypted: true,
      deletionProtection: false,
    });

    // Primary Regional Cluster
    const primaryCluster = new RdsCluster(this, 'primary-cluster', {
      clusterIdentifier: `payment-primary-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'payments',
      masterUsername: 'dbadmin',
      masterPassword: `Payment${environmentSuffix}SecurePass123!`,
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [primaryDbSg.id],
      globalClusterIdentifier: globalCluster.id,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
      dependsOn: [globalCluster],
    });

    // Primary cluster instances
    const primaryInstance1 = new RdsClusterInstance(
      this,
      'primary-instance-1',
      {
        identifier: `payment-primary-${environmentSuffix}-1`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...commonTags,
          'DR-Role': 'primary',
        },
        provider: primaryProvider,
      }
    );

    new RdsClusterInstance(this, 'primary-instance-2', {
      identifier: `payment-primary-${environmentSuffix}-2`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      publiclyAccessible: false,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
      dependsOn: [primaryInstance1],
    });

    // KMS Key for DR cluster encryption
    const drKmsKey = new KmsKey(this, 'dr-kms-key', {
      description: `KMS key for payment database DR cluster - ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
        Name: `payment-db-kms-${environmentSuffix}-${drRegion}`,
      },
      provider: drProvider,
    });

    new KmsAlias(this, 'dr-kms-alias', {
      name: `alias/payment-db-${environmentSuffix}-${drRegion}`,
      targetKeyId: drKmsKey.id,
      provider: drProvider,
    });

    // DR Regional Cluster (read-only replica)
    // Changed construct ID to force Terraform to treat this as a new resource
    // Also changed cluster identifier to avoid AWS name reservation conflicts
    const drCluster = new RdsCluster(this, 'dr-cluster-v2', {
      clusterIdentifier: `payment-dr-${environmentSuffix}-v2`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      dbSubnetGroupName: drSubnetGroup.name,
      vpcSecurityGroupIds: [drDbSg.id],
      globalClusterIdentifier: globalCluster.id,
      kmsKeyId: drKmsKey.arn,
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
      dependsOn: [primaryCluster],
      lifecycle: {
        createBeforeDestroy: false,
      },
    });

    // DR cluster instance
    new RdsClusterInstance(this, 'dr-instance-1-v2', {
      identifier: `payment-dr-${environmentSuffix}-v2-1`,
      clusterIdentifier: drCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      publiclyAccessible: false,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    this.outputs = {
      globalClusterId: globalCluster.id,
      primaryClusterId: primaryCluster.clusterIdentifier,
      drClusterId: drCluster.clusterIdentifier,
      primaryClusterEndpoint: primaryCluster.endpoint,
      primaryClusterReaderEndpoint: primaryCluster.readerEndpoint,
      drClusterEndpoint: drCluster.endpoint,
      drClusterReaderEndpoint: drCluster.readerEndpoint,
    };
  }
}
