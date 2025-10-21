import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { RdsGlobalCluster } from '@cdktf/provider-aws/lib/rds-global-cluster';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupPlan } from '@cdktf/provider-aws/lib/backup-plan';
import { BackupSelection } from '@cdktf/provider-aws/lib/backup-selection';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

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
    const drRegion = 'us-west-2';

    // Configure AWS Provider for primary region
    const primaryProvider = new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
      alias: 'primary',
    });

    // Configure AWS Provider for DR region
    const drProvider = new AwsProvider(this, 'aws-dr', {
      region: drRegion,
      defaultTags: defaultTags,
      alias: 'dr',
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get caller identity
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {
      provider: primaryProvider,
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
      provider: primaryProvider,
    });

    // === NETWORKING ===
    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `hipaa-vpc-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
        CostCenter: 'Healthcare',
      },
      provider: primaryProvider,
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `hipaa-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create public subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `hipaa-public-subnet-1-${environmentSuffix}`,
        Type: 'Public',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `hipaa-public-subnet-2-${environmentSuffix}`,
        Type: 'Public',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create private subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: Fn.element(azs.names, 0),
      tags: {
        Name: `hipaa-private-subnet-1-${environmentSuffix}`,
        Type: 'Private',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: Fn.element(azs.names, 1),
      tags: {
        Name: `hipaa-private-subnet-2-${environmentSuffix}`,
        Type: 'Private',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create EIP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `hipaa-nat-eip-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create NAT Gateway
    const natGw = new NatGateway(this, 'nat-gw', {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `hipaa-nat-gw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `hipaa-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
      provider: primaryProvider,
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
      provider: primaryProvider,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
      provider: primaryProvider,
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `hipaa-private-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw.id,
      provider: primaryProvider,
    });

    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
      provider: primaryProvider,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
      provider: primaryProvider,
    });

    // Create VPC Endpoints for S3 and Secrets Manager
    new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [privateRouteTable.id],
      tags: {
        Name: `hipaa-s3-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // === ENCRYPTION ===
    // Create KMS key policy
    const kmsKeyPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'kms-key-policy',
      {
        statement: [
          {
            sid: 'Enable IAM User Permissions',
            effect: 'Allow',
            principals: [
              {
                type: 'AWS',
                identifiers: [`arn:aws:iam::${callerIdentity.accountId}:root`],
              },
            ],
            actions: ['kms:*'],
            resources: ['*'],
          },
          {
            sid: 'Allow CloudWatch Logs',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: [`logs.${awsRegion}.amazonaws.com`],
              },
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          },
          {
            sid: 'Allow CloudTrail',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudtrail.amazonaws.com'],
              },
            ],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
          },
        ],
        provider: primaryProvider,
      }
    );

    const kmsKey = new KmsKey(this, 'kms-key', {
      description: 'KMS key for HIPAA-compliant data encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      policy: kmsKeyPolicyDoc.json,
      tags: {
        Name: `hipaa-kms-key-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/hipaa-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
      provider: primaryProvider,
    });

    // Create KMS key for DR region
    const kmsKeyDr = new KmsKey(this, 'kms-key-dr', {
      description: 'KMS key for HIPAA-compliant data encryption in DR region',
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: {
        Name: `hipaa-kms-key-dr-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: drProvider,
    });

    // === ALERTING ===
    // Create SNS topic for alerts
    const alertTopic = new SnsTopic(this, 'alert-topic', {
      name: `hipaa-alerts-${environmentSuffix}`,
      displayName: 'HIPAA Infrastructure Alerts',
      kmsMasterKeyId: kmsKey.id,
      tags: {
        Name: `hipaa-alerts-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // === STORAGE ===
    // Create IAM role for S3 replication
    const replicationRole = new IamRole(this, 's3-replication-role', {
      name: `hipaa-s3-replication-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `hipaa-s3-replication-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create S3 bucket for patient data in primary region
    const dataBucket = new S3Bucket(this, 'data-bucket', {
      bucket: `hipaa-patient-data-${environmentSuffix}-${awsRegion}`,
      forceDestroy: true,
      tags: {
        Name: `hipaa-patient-data-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
        CostCenter: 'Healthcare',
      },
      provider: primaryProvider,
    });

    new S3BucketVersioningA(this, 'data-bucket-versioning', {
      bucket: dataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: primaryProvider,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'data-bucket-encryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
        provider: primaryProvider,
      }
    );

    new S3BucketPublicAccessBlock(this, 'data-bucket-public-access-block', {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: primaryProvider,
    });

    // Create S3 bucket lifecycle configuration
    new S3BucketLifecycleConfiguration(this, 'data-bucket-lifecycle', {
      bucket: dataBucket.id,
      rule: [
        {
          id: 'archive-old-versions',
          status: 'Enabled',
          filter: [{}],
          noncurrentVersionTransition: [
            {
              noncurrentDays: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              noncurrentDays: 90,
              storageClass: 'GLACIER',
            },
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 2555, // 7 years
            },
          ],
        },
        {
          id: 'abort-incomplete-multipart-upload',
          status: 'Enabled',
          filter: [{}],
          abortIncompleteMultipartUpload: [
            {
              daysAfterInitiation: 7,
            },
          ],
        },
      ],
      provider: primaryProvider,
    });

    // Create DR S3 bucket
    const dataBucketDr = new S3Bucket(this, 'data-bucket-dr', {
      bucket: `hipaa-patient-data-${environmentSuffix}-${drRegion}`,
      forceDestroy: true,
      tags: {
        Name: `hipaa-patient-data-dr-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
        CostCenter: 'Healthcare',
      },
      provider: drProvider,
    });

    new S3BucketVersioningA(this, 'data-bucket-dr-versioning', {
      bucket: dataBucketDr.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: drProvider,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'data-bucket-dr-encryption',
      {
        bucket: dataBucketDr.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyDr.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
        provider: drProvider,
      }
    );

    new S3BucketPublicAccessBlock(this, 'data-bucket-dr-public-access-block', {
      bucket: dataBucketDr.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: drProvider,
    });

    // Create S3 replication policy
    const replicationPolicy = new IamRolePolicy(this, 's3-replication-policy', {
      role: replicationRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: [dataBucket.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: [`${dataBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: [`${dataBucketDr.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: [kmsKey.arn],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Encrypt'],
            Resource: [kmsKeyDr.arn],
          },
        ],
      }),
      provider: primaryProvider,
    });

    // Configure S3 replication
    new S3BucketReplicationConfigurationA(this, 'data-bucket-replication', {
      bucket: dataBucket.id,
      role: replicationRole.arn,
      rule: [
        {
          id: 'replicate-all',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          filter: {},
          destination: {
            bucket: dataBucketDr.arn,
            storageClass: 'STANDARD',
            encryptionConfiguration: {
              replicaKmsKeyId: kmsKeyDr.arn,
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
          },
        },
      ],
      dependsOn: [replicationPolicy],
      provider: primaryProvider,
    });

    // === DATABASE ===
    // Create security group for database
    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `hipaa-db-sg-${environmentSuffix}`,
      description:
        'Security group for Aurora database - allows PostgreSQL from VPC only',
      vpcId: vpc.id,
      tags: {
        Name: `hipaa-db-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new SecurityGroupRule(this, 'db-sg-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow PostgreSQL from VPC',
      provider: primaryProvider,
    });

    new SecurityGroupRule(this, 'db-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow all outbound traffic',
      provider: primaryProvider,
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `hipaa-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `hipaa-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create database master password secret
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `hipaa-db-master-password-${environmentSuffix}`,
      description: 'Master password for Aurora database',
      kmsKeyId: kmsKey.keyId,
      recoveryWindowInDays: 30,
      tags: {
        Name: `hipaa-db-secret-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'admin',
        password: 'ChangeMe123!ComplexP@ssw0rd',
        engine: 'postgres',
        host: 'placeholder',
        port: 5432,
        dbname: 'patientdb',
      }),
      provider: primaryProvider,
    });

    // Create RDS Global Cluster for cross-region replication
    const globalCluster = new RdsGlobalCluster(this, 'aurora-global', {
      globalClusterIdentifier: `hipaa-aurora-global-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'patientdb',
      storageEncrypted: true,
      provider: primaryProvider,
    });

    // Create Aurora cluster in primary region
    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `hipaa-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'patientdb',
      masterUsername: 'admin',
      masterPassword: 'ChangeMe123!ComplexP@ssw0rd',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 30,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      applyImmediately: false,
      skipFinalSnapshot: true,
      deletionProtection: false,
      globalClusterIdentifier: globalCluster.id,
      tags: {
        Name: `hipaa-aurora-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
        CostCenter: 'Healthcare',
      },
      provider: primaryProvider,
    });

    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `hipaa-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      publiclyAccessible: false,
      performanceInsightsEnabled: true,
      performanceInsightsKmsKeyId: kmsKey.arn,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      tags: {
        Name: `hipaa-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new RdsClusterInstance(this, 'aurora-instance-2', {
      identifier: `hipaa-aurora-instance-2-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      publiclyAccessible: false,
      performanceInsightsEnabled: true,
      performanceInsightsKmsKeyId: kmsKey.arn,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      tags: {
        Name: `hipaa-aurora-instance-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // === LOGGING ===
    // Create CloudWatch Log Groups
    new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/hipaa/application-${environmentSuffix}`,
      retentionInDays: 365,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `hipaa-app-logs-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new CloudwatchLogGroup(this, 'db-log-group', {
      name: `/aws/rds/cluster/hipaa-aurora-${environmentSuffix}/postgresql`,
      retentionInDays: 365,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `hipaa-db-logs-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create CloudTrail S3 bucket for logging
    const cloudtrailLogBucket = new S3Bucket(this, 'cloudtrail-log-bucket', {
      bucket: `hipaa-cloudtrail-logs-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `hipaa-cloudtrail-logs-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    const cloudtrailBucket = new S3Bucket(this, 'cloudtrail-bucket', {
      bucket: `hipaa-cloudtrail-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `hipaa-cloudtrail-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new S3BucketVersioningA(this, 'cloudtrail-bucket-versioning', {
      bucket: cloudtrailBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: primaryProvider,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'cloudtrail-bucket-encryption',
      {
        bucket: cloudtrailBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
        provider: primaryProvider,
      }
    );

    new S3BucketPublicAccessBlock(
      this,
      'cloudtrail-bucket-public-access-block',
      {
        bucket: cloudtrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        provider: primaryProvider,
      }
    );

    new S3BucketLoggingA(this, 'cloudtrail-bucket-logging', {
      bucket: cloudtrailBucket.id,
      targetBucket: cloudtrailLogBucket.id,
      targetPrefix: 'cloudtrail-bucket-logs/',
      provider: primaryProvider,
    });

    // Create CloudTrail bucket policy
    const cloudtrailBucketPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'cloudtrail-bucket-policy-doc',
      {
        statement: [
          {
            sid: 'AWSCloudTrailAclCheck',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudtrail.amazonaws.com'],
              },
            ],
            actions: ['s3:GetBucketAcl'],
            resources: [cloudtrailBucket.arn],
          },
          {
            sid: 'AWSCloudTrailWrite',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudtrail.amazonaws.com'],
              },
            ],
            actions: ['s3:PutObject'],
            resources: [`${cloudtrailBucket.arn}/*`],
            condition: [
              {
                test: 'StringEquals',
                variable: 's3:x-amz-acl',
                values: ['bucket-owner-full-control'],
              },
            ],
          },
        ],
        provider: primaryProvider,
      }
    );

    new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: cloudtrailBucket.id,
      policy: cloudtrailBucketPolicyDoc.json,
      provider: primaryProvider,
    });

    // Create CloudTrail
    new Cloudtrail(this, 'cloudtrail', {
      name: `hipaa-trail-${environmentSuffix}`,
      s3BucketName: cloudtrailBucket.id,
      enableLogFileValidation: true,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      kmsKeyId: kmsKey.arn,
      enableLogging: true,
      isOrganizationTrail: false,
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: [`${dataBucket.arn}/*`],
            },
          ],
        },
      ],
      tags: {
        Name: `hipaa-trail-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // === BACKUP ===
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
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new IamRolePolicyAttachment(this, 'backup-policy-attachment', {
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      provider: primaryProvider,
    });

    new IamRolePolicyAttachment(this, 'backup-restore-policy-attachment', {
      role: backupRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
      provider: primaryProvider,
    });

    // Create backup vault
    const backupVault = new BackupVault(this, 'backup-vault', {
      name: `hipaa-backup-vault-${environmentSuffix}`,
      kmsKeyArn: kmsKey.arn,
      tags: {
        Name: `hipaa-backup-vault-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    // Create backup plan with multiple retention rules
    const backupPlan = new BackupPlan(this, 'backup-plan', {
      name: `hipaa-backup-plan-${environmentSuffix}`,
      rule: [
        {
          ruleName: 'hourly-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 * * * ? *)',
          startWindow: 60,
          completionWindow: 120,
          lifecycle: {
            deleteAfter: 7,
          },
          recoveryPointTags: {
            Type: 'Hourly',
            Compliance: 'HIPAA',
          },
        },
        {
          ruleName: 'daily-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 2 * * ? *)',
          startWindow: 60,
          completionWindow: 180,
          lifecycle: {
            deleteAfter: 30,
          },
          recoveryPointTags: {
            Type: 'Daily',
            Compliance: 'HIPAA',
          },
        },
        {
          ruleName: 'weekly-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 3 ? * SUN *)',
          startWindow: 60,
          completionWindow: 300,
          lifecycle: {
            deleteAfter: 90,
          },
          recoveryPointTags: {
            Type: 'Weekly',
            Compliance: 'HIPAA',
          },
        },
        {
          ruleName: 'monthly-backup',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 4 1 * ? *)',
          startWindow: 60,
          completionWindow: 300,
          lifecycle: {
            coldStorageAfter: 30,
            deleteAfter: 2555, // 7 years for compliance
          },
          recoveryPointTags: {
            Type: 'Monthly',
            Compliance: 'HIPAA',
          },
        },
      ],
      advancedBackupSetting: [
        {
          resourceType: 'EC2',
          backupOptions: {
            WindowsVSS: 'enabled',
          },
        },
      ],
      tags: {
        Name: `hipaa-backup-plan-${environmentSuffix}`,
        Compliance: 'HIPAA',
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new BackupSelection(this, 'backup-selection', {
      name: `hipaa-backup-selection-${environmentSuffix}`,
      planId: backupPlan.id,
      iamRoleArn: backupRole.arn,
      resources: [auroraCluster.arn],
      selectionTag: [
        {
          type: 'STRINGEQUALS',
          key: 'Compliance',
          value: 'HIPAA',
        },
      ],
      provider: primaryProvider,
    });

    // === MONITORING ===
    // Create CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'backup-job-failed-alarm', {
      alarmName: `hipaa-backup-job-failed-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'NumberOfBackupJobsFailed',
      namespace: 'AWS/Backup',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      alarmDescription: 'Alert when backup job fails',
      alarmActions: [alertTopic.arn],
      treatMissingData: 'notBreaching',
      tags: {
        Name: `hipaa-backup-failed-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new CloudwatchMetricAlarm(this, 'db-cpu-alarm', {
      alarmName: `hipaa-db-cpu-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database CPU is high',
      alarmActions: [alertTopic.arn],
      dimensions: {
        DBClusterIdentifier: auroraCluster.id,
      },
      treatMissingData: 'notBreaching',
      tags: {
        Name: `hipaa-db-cpu-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new CloudwatchMetricAlarm(this, 'db-connection-alarm', {
      alarmName: `hipaa-db-connections-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database connections are high',
      alarmActions: [alertTopic.arn],
      dimensions: {
        DBClusterIdentifier: auroraCluster.id,
      },
      treatMissingData: 'notBreaching',
      tags: {
        Name: `hipaa-db-connections-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });

    new CloudwatchMetricAlarm(this, 's3-replication-latency-alarm', {
      alarmName: `hipaa-s3-replication-latency-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'ReplicationLatency',
      namespace: 'AWS/S3',
      period: 900,
      statistic: 'Maximum',
      threshold: 900, // 15 minutes
      alarmDescription: 'Alert when S3 replication latency exceeds 15 minutes',
      alarmActions: [alertTopic.arn],
      dimensions: {
        SourceBucket: dataBucket.id,
        DestinationBucket: dataBucketDr.id,
        RuleId: 'replicate-all',
      },
      treatMissingData: 'notBreaching',
      tags: {
        Name: `hipaa-s3-replication-latency-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      provider: primaryProvider,
    });
  }
}
