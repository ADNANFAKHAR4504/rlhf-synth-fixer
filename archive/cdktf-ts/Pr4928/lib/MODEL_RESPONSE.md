# HIPAA-Compliant Disaster Recovery Infrastructure

I'll help you create a HIPAA-compliant disaster recovery solution using CDKTF with TypeScript. Here's the infrastructure code:

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudtrailTrail } from '@cdktf/provider-aws/lib/cloudtrail-trail';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `hipaa-vpc-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `hipaa-igw-${environmentSuffix}`,
      },
    });

    // Create public subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `hipaa-public-subnet-1-${environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `hipaa-public-subnet-2-${environmentSuffix}`,
      },
    });

    // Create private subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: `hipaa-private-subnet-1-${environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: `hipaa-private-subnet-2-${environmentSuffix}`,
      },
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `hipaa-public-rt-${environmentSuffix}`,
      },
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Create KMS key for encryption
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: 'KMS key for HIPAA-compliant data encryption',
      enableKeyRotation: true,
      tags: {
        Name: `hipaa-kms-key-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/hipaa-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    // Create S3 bucket for patient data
    const dataBucket = new S3Bucket(this, 'data-bucket', {
      bucket: `hipaa-patient-data-${environmentSuffix}`,
      tags: {
        Name: `hipaa-patient-data-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new S3BucketVersioningA(this, 'data-bucket-versioning', {
      bucket: dataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'data-bucket-encryption', {
      bucket: dataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
        },
      ],
    });

    // Create security group for database
    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `hipaa-db-sg-${environmentSuffix}`,
      description: 'Security group for Aurora database',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `hipaa-db-sg-${environmentSuffix}`,
      },
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `hipaa-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `hipaa-db-subnet-group-${environmentSuffix}`,
      },
    });

    // Create database master password secret
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `hipaa-db-master-password-${environmentSuffix}`,
      description: 'Master password for Aurora database',
      kmsKeyId: kmsKey.keyId,
      tags: {
        Name: `hipaa-db-secret-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'admin',
        password: 'ChangeMe123!',
      }),
    });

    // Create Aurora cluster
    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `hipaa-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'patientdb',
      masterUsername: 'admin',
      masterPassword: 'ChangeMe123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 30,
      preferredBackupWindow: '03:00-04:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: `hipaa-aurora-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `hipaa-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      publiclyAccessible: false,
    });

    // Create CloudWatch Log Group
    new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/hipaa/application-${environmentSuffix}`,
      retentionInDays: 365,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `hipaa-app-logs-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    // Create CloudTrail S3 bucket
    const cloudtrailBucket = new S3Bucket(this, 'cloudtrail-bucket', {
      bucket: `hipaa-cloudtrail-${environmentSuffix}`,
      tags: {
        Name: `hipaa-cloudtrail-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'cloudtrail-bucket-encryption', {
      bucket: cloudtrailBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
        },
      ],
    });

    // Create CloudTrail
    new CloudtrailTrail(this, 'cloudtrail', {
      name: `hipaa-trail-${environmentSuffix}`,
      s3BucketName: cloudtrailBucket.id,
      enableLogFileValidation: true,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `hipaa-trail-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    // Create IAM role for AWS Backup
    const backupRole = new IamRole(this, 'backup-role', {
      name: `hipaa-backup-role-${environmentSuffix}`,
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
        Name: `hipaa-backup-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'backup-policy-attachment', {
      role: backupRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
    });

    // Create backup vault
    const backupVault = new BackupVault(this, 'backup-vault', {
      name: `hipaa-backup-vault-${environmentSuffix}`,
      kmsKeyArn: kmsKey.arn,
      tags: {
        Name: `hipaa-backup-vault-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    // Create backup plan
    const backupPlan = new BackupPlan(this, 'backup-plan', {
      name: `hipaa-backup-plan-${environmentSuffix}`,
      rule: [
        {
          ruleName: 'daily-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 2 * * ? *)',
          lifecycle: {
            deleteAfter: 30,
          },
        },
      ],
      tags: {
        Name: `hipaa-backup-plan-${environmentSuffix}`,
        Compliance: 'HIPAA',
      },
    });

    new BackupSelection(this, 'backup-selection', {
      name: `hipaa-backup-selection-${environmentSuffix}`,
      planId: backupPlan.id,
      iamRoleArn: backupRole.arn,
      resources: [auroraCluster.arn],
    });
  }
}
```

This infrastructure sets up a HIPAA-compliant environment with:
- VPC with public and private subnets
- KMS encryption with key rotation
- S3 buckets with encryption and versioning
- Aurora PostgreSQL with encryption and backups
- CloudTrail for audit logging
- AWS Backup for automated backups
- Secrets Manager for database credentials