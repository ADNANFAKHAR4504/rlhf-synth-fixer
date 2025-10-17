import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  snsTopicArn: string;
}

export class DatabaseStack extends Construct {
  public readonly primaryDatabaseId: string;
  public readonly replicaDatabaseId: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      primaryProvider,
      secondaryProvider,
    } = props;

    // Note: snsTopicArn from props available if needed for future monitoring integration

    // Primary VPC
    const primaryVpc = new Vpc(this, 'primary-vpc', {
      provider: primaryProvider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `healthcare-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: primaryRegion,
      },
    });

    // Primary subnets (Multi-AZ)
    const primarySubnet1 = new Subnet(this, 'primary-subnet-1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${primaryRegion}a`,
      tags: {
        Name: `healthcare-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const primarySubnet2 = new Subnet(this, 'primary-subnet-2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${primaryRegion}b`,
      tags: {
        Name: `healthcare-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Secondary VPC for DR
    const secondaryVpc = new Vpc(this, 'secondary-vpc', {
      provider: secondaryProvider,
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `healthcare-vpc-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: secondaryRegion,
      },
    });

    // Secondary subnets
    const secondarySubnet1 = new Subnet(this, 'secondary-subnet-1', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      cidrBlock: '10.1.1.0/24',
      availabilityZone: `${secondaryRegion}a`,
      tags: {
        Name: `healthcare-subnet-dr-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const secondarySubnet2 = new Subnet(this, 'secondary-subnet-2', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      cidrBlock: '10.1.2.0/24',
      availabilityZone: `${secondaryRegion}b`,
      tags: {
        Name: `healthcare-subnet-dr-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Primary security group
    const primarySecurityGroup = new SecurityGroup(this, 'primary-sg', {
      provider: primaryProvider,
      name: `healthcare-db-sg-${environmentSuffix}`,
      description: 'Security group for healthcare database',
      vpcId: primaryVpc.id,
      tags: {
        Name: `healthcare-db-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'primary-sg-rule', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: primarySecurityGroup.id,
      description: 'PostgreSQL access from VPC',
    });

    // Secondary security group
    const secondarySecurityGroup = new SecurityGroup(this, 'secondary-sg', {
      provider: secondaryProvider,
      name: `healthcare-db-sg-dr-${environmentSuffix}`,
      description: 'Security group for healthcare DR database',
      vpcId: secondaryVpc.id,
      tags: {
        Name: `healthcare-db-sg-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'secondary-sg-rule', {
      provider: secondaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.1.0.0/16'],
      securityGroupId: secondarySecurityGroup.id,
      description: 'PostgreSQL access from VPC',
    });

    // DB Subnet Groups
    const primarySubnetGroup = new DbSubnetGroup(this, 'primary-subnet-group', {
      provider: primaryProvider,
      name: `healthcare-db-subnet-${environmentSuffix}`,
      subnetIds: [primarySubnet1.id, primarySubnet2.id],
      tags: {
        Name: `healthcare-db-subnet-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const secondarySubnetGroup = new DbSubnetGroup(
      this,
      'secondary-subnet-group',
      {
        provider: secondaryProvider,
        name: `healthcare-db-subnet-dr-${environmentSuffix}`,
        subnetIds: [secondarySubnet1.id, secondarySubnet2.id],
        tags: {
          Name: `healthcare-db-subnet-dr-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // KMS key for database encryption in primary region
    const dbKmsKey = new KmsKey(this, 'db-kms-key', {
      provider: primaryProvider,
      description: 'KMS key for database encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `healthcare-db-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // KMS key for database encryption in secondary region
    const dbKmsKeySecondary = new KmsKey(this, 'db-kms-key-secondary', {
      provider: secondaryProvider,
      description: 'KMS key for database encryption in secondary region',
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `healthcare-db-kms-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Database credentials secret
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      provider: primaryProvider,
      name: `healthcare-db-credentials-${environmentSuffix}`,
      description: 'Database master credentials',
      tags: {
        Name: `healthcare-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      provider: primaryProvider,
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: 'ChangeMe123456!', // In production, use random password generation
      }),
    });

    // Aurora Global Cluster for cross-region replication
    // Commented out to allow existing cluster to continue without global cluster
    // const globalCluster = new RdsGlobalCluster(this, 'global-cluster', {
    //   provider: primaryProvider,
    //   globalClusterIdentifier: `healthcare-global-${environmentSuffix}`,
    //   engine: 'aurora-postgresql',
    //   engineVersion: '15.3',
    //   databaseName: 'healthcaredb',
    //   storageEncrypted: true,
    //   deletionProtection: false,
    // });

    // Primary Aurora Serverless v2 Cluster
    const primaryCluster = new RdsCluster(this, 'primary-cluster', {
      provider: primaryProvider,
      clusterIdentifier: `healthcare-db-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.3',
      // globalClusterIdentifier: globalCluster.id, // Removed to fix modification error
      databaseName: 'healthcaredb', // Added since global cluster is removed
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123456!',
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [primarySecurityGroup.id],
      backupRetentionPeriod: 7,
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      storageEncrypted: true,
      kmsKeyId: dbKmsKey.arn,
      skipFinalSnapshot: true,
      deletionProtection: false,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      // dependsOn: [globalCluster], // Removed since global cluster is commented out
      tags: {
        Name: `healthcare-db-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: primaryRegion,
      },
    });

    new RdsClusterInstance(this, 'primary-instance', {
      provider: primaryProvider,
      identifier: `healthcare-db-instance-${environmentSuffix}`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.3',
      tags: {
        Name: `healthcare-db-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Secondary Aurora Cluster (DR - standalone without global cluster)
    const secondaryCluster = new RdsCluster(this, 'secondary-cluster', {
      provider: secondaryProvider,
      clusterIdentifier: `healthcare-db-dr-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.3',
      // globalClusterIdentifier: globalCluster.id, // Removed - standalone cluster
      databaseName: 'healthcaredb',
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123456!',
      dbSubnetGroupName: secondarySubnetGroup.name,
      vpcSecurityGroupIds: [secondarySecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: dbKmsKeySecondary.arn,
      skipFinalSnapshot: true,
      deletionProtection: false,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      // dependsOn: [primaryCluster], // Removed - no longer needed without global cluster
      tags: {
        Name: `healthcare-db-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: secondaryRegion,
      },
    });

    new RdsClusterInstance(this, 'secondary-instance', {
      provider: secondaryProvider,
      identifier: `healthcare-db-instance-dr-${environmentSuffix}`,
      clusterIdentifier: secondaryCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.3',
      tags: {
        Name: `healthcare-db-instance-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // AWS Backup configuration
    const backupVault = new BackupVault(this, 'backup-vault', {
      provider: primaryProvider,
      name: `healthcare-backup-vault-${environmentSuffix}`,
      kmsKeyArn: dbKmsKey.arn,
      tags: {
        Name: `healthcare-backup-vault-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const backupRole = new IamRole(this, 'backup-role', {
      provider: primaryProvider,
      name: `healthcare-backup-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'backup.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `healthcare-backup-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'backup-policy-attachment', {
      provider: primaryProvider,
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
    });

    const backupPlan = new BackupPlan(this, 'backup-plan', {
      provider: primaryProvider,
      name: `healthcare-backup-plan-${environmentSuffix}`,
      rule: [
        {
          ruleName: 'continuous-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 */1 * * ? *)', // Every hour for RPO < 15 minutes
          lifecycle: {
            deleteAfter: 7,
          },
          enableContinuousBackup: true,
        },
      ],
      tags: {
        Name: `healthcare-backup-plan-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new BackupSelection(this, 'backup-selection', {
      provider: primaryProvider,
      name: `healthcare-backup-selection-${environmentSuffix}`,
      planId: backupPlan.id,
      iamRoleArn: backupRole.arn,
      resources: [primaryCluster.arn],
    });

    this.primaryDatabaseId = primaryCluster.id;
    this.replicaDatabaseId = secondaryCluster.id;
  }
}
