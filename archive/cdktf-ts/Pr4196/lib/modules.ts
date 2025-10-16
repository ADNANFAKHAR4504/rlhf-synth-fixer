// lib/modules.ts
import { Construct } from 'constructs';
import { Fn } from 'cdktf';
// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// KMS
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// EC2
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';

// EC2 Data Sources
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

// CloudWatch
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// SNS
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

// Budgets
import { BudgetsBudget } from '@cdktf/provider-aws/lib/budgets-budget';

// SSM
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// Secrets Manager
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

// Interfaces
export interface CommonTags {
  [key: string]: string;
  Project: string; // Capitalized
  Environment: string; // Capitalized
  Owner: string; // Capitalized
  CostCenter: string; // No hyphen, capitalized
}

export interface IamRoleConfig {
  name: string;
  assumeRolePolicy: any;
  inlinePolicies?: { [key: string]: any };
  tags: CommonTags;
}

export interface KmsKeyConfig {
  name: string;
  description?: string;
  enableKeyRotation?: boolean;
  tags: CommonTags;
  customKeyArn?: string;
}

export interface EncryptedS3BucketConfig {
  name: string;
  versioning?: boolean;
  lifecycleRules?: any[];
  kmsKeyArn?: string;
  logRetentionDays?: number;
  tags: CommonTags;
}

export interface RdsInstanceConfig {
  name: string;
  engine: string;
  instanceClass: string;
  allocatedStorage: number;
  username: string;
  dbSubnetGroupName: string;
  vpcSecurityGroupIds: string[];
  kmsKeyId?: string;
  backupRetentionPeriod?: number;
  deletionProtection?: boolean;
  enabledCloudwatchLogsExports?: string[];
  monitoringInterval?: number; // Add this
  tags: CommonTags;
}

export interface VpcConfig {
  name: string;
  cidr: string;
  azCount: number;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  enableNat?: boolean;
  tags: CommonTags;
}

export interface CloudWatchAlarmConfig {
  name: string;
  metricName: string;
  namespace: string;
  statistic: string;
  period: number;
  evaluationPeriods: number;
  threshold: number;
  comparisonOperator: string;
  dimensions?: { [key: string]: string };
  snsTopicArn: string;
  treatMissingData?: string;
}

export interface BudgetConfig {
  name: string;
  limitAmount: string;
  limitUnit: string;
  timeUnit: string;
  snsTopicArn: string;
  thresholds: number[];
  tags: CommonTags;
}

/**
 * IAM Role creation with least-privilege inline policies
 */
export class IamRoleConstruct extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile?: IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    config: IamRoleConfig & { createInstanceProfile?: boolean }
  ) {
    super(scope, id);

    // Filter out duplicate tags (case-insensitive)
    const uniqueTags: { [key: string]: string } = {};
    Object.entries(config.tags).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (!Object.keys(uniqueTags).some(k => k.toLowerCase() === lowerKey)) {
        uniqueTags[key] = value;
      }
    });

    this.role = new IamRole(this, 'role', {
      name: config.name,
      assumeRolePolicy: JSON.stringify(config.assumeRolePolicy),
      tags: uniqueTags, // Use filtered tags
    });

    // Create instance profile if needed (for EC2)
    if (config.createInstanceProfile) {
      this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
        name: config.name,
        role: this.role.name,
      });
    }

    // Attach inline policies if provided
    if (config.inlinePolicies) {
      Object.entries(config.inlinePolicies).forEach(
        ([policyName, policyDocument], index) => {
          new IamRolePolicy(this, `inline-policy-${index}`, {
            role: this.role.name,
            name: policyName,
            policy: JSON.stringify(policyDocument),
          });
        }
      );
    }
  }
}

/**
 * MFA-enforced IAM policy for sensitive operations
 * NOTE: This policy should be attached to IAM users/groups requiring MFA
 * Manual step: Users must configure MFA devices in their IAM settings
 */
export class MfaEnforcementPolicy extends Construct {
  public readonly policy: IamPolicy;

  constructor(scope: Construct, id: string, tags: CommonTags) {
    super(scope, id);

    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyAllExceptListedIfNoMFA',
          Effect: 'Deny',
          NotAction: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
          ],
          Resource: '*',
          Condition: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        },
      ],
    };

    this.policy = new IamPolicy(this, 'mfa-policy', {
      name: `${tags.project}-${tags.environment}-mfa-enforcement`,
      policy: JSON.stringify(policyDocument),
      description: 'Enforces MFA for all actions except MFA setup',
      tags,
    });
  }
}

/**
 * KMS Key wrapper - uses AWS-managed or customer-managed key
 */
export class KmsKeyConstruct extends Construct {
  public readonly keyArn: string;
  public readonly keyId?: string;
  private key?: KmsKey;

  constructor(
    scope: Construct,
    id: string,
    config: KmsKeyConfig & { accountId?: string }
  ) {
    super(scope, id);

    if (config.customKeyArn) {
      this.keyArn = config.customKeyArn;
    } else {
      // Create customer-managed KMS key with proper policy for CloudTrail
      const keyPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: config.accountId
                ? `arn:aws:iam::${config.accountId}:root`
                : '*',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:DecryptDataKey*'],
            Resource: '*',
            Condition: {
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': '*',
              },
            },
          },
          {
            Sid: 'Allow CloudTrail to describe key',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 'kms:DescribeKey',
            Resource: '*',
          },
        ],
      };

      this.key = new KmsKey(this, 'key', {
        description: config.description || `KMS key for ${config.name}`,
        enableKeyRotation: config.enableKeyRotation ?? true,
        policy: JSON.stringify(keyPolicy),
        tags: config.tags,
      });

      new KmsAlias(this, 'key-alias', {
        name: `alias/${config.name}`,
        targetKeyId: this.key.keyId,
      });

      this.keyArn = this.key.arn;
      this.keyId = this.key.keyId;
    }
  }
}

/**
 * Encrypted S3 bucket with versioning, lifecycle, and audit logging
 */
export class EncryptedS3Bucket extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketPolicy: S3BucketPolicy;

  constructor(scope: Construct, id: string, config: EncryptedS3BucketConfig) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: config.name,
      tags: config.tags,
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: config.versioning !== false ? 'Enabled' : 'Suspended',
      },
    });
    // Configure server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: config.kmsKeyArn ? 'aws:kms' : 'AES256',
            kmsMasterKeyId: config.kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Configure lifecycle rules
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      const rulesWithFilter = config.lifecycleRules.map(rule => ({
        ...rule,
        // Add filter if not present
        filter: rule.filter || {},
      }));

      new S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: rulesWithFilter,
      });
    }

    // Bucket policy to enforce SSL and deny unencrypted uploads
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyInsecureConnections',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:*',
          Resource: [this.bucket.arn, `${this.bucket.arn}/*`],
          Condition: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        },
        {
          Sid: 'DenyUnencryptedObjectUploads',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:PutObject',
          Resource: `${this.bucket.arn}/*`,
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': config.kmsKeyArn
                ? 'aws:kms'
                : 'AES256',
            },
          },
        },
      ],
    };

    this.bucketPolicy = new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify(policyDocument),
    });
  }
}

/**
 * RDS instance with encryption, automated backups, and monitoring
 */
export class SecureRdsInstance extends Construct {
  public readonly instance: DbInstance;
  public readonly secretArn: string;
  private monitoringRole?: IamRole;

  constructor(scope: Construct, id: string, config: RdsInstanceConfig) {
    super(scope, id);

    // Create monitoring role if monitoring is enabled
    let monitoringRoleArn: string | undefined;
    if (config.monitoringInterval && config.monitoringInterval > 0) {
      this.monitoringRole = new IamRole(this, 'monitoring-role', {
        name: `${config.name}-rds-monitoring-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: config.tags,
      });
      monitoringRoleArn = this.monitoringRole.arn;
    }

    this.instance = new DbInstance(this, 'instance', {
      identifier: config.name,
      engine: config.engine,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyId,
      username: config.username,
      manageMasterUserPassword: true,
      dbSubnetGroupName: config.dbSubnetGroupName,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      backupRetentionPeriod: config.backupRetentionPeriod ?? 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: config.deletionProtection ?? true,
      enabledCloudwatchLogsExports: config.enabledCloudwatchLogsExports || [],
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.name}-final-snapshot-${Date.now()}`,
      copyTagsToSnapshot: true,
      autoMinorVersionUpgrade: true,
      monitoringInterval: config.monitoringInterval || 0, // Default to 0 if not specified
      monitoringRoleArn: monitoringRoleArn, // Add the monitoring role ARN
      tags: config.tags,
    });

    this.secretArn = this.instance.masterUserSecret.get(0).secretArn;
  }

  /**
   * Helper method to get the database secret for use in applications
   * Returns the secret data source that can be used to retrieve the connection details
   */
  public getSecretDataSource(
    scope: Construct,
    id: string
  ): DataAwsSecretsmanagerSecretVersion {
    const secret = new DataAwsSecretsmanagerSecret(scope, `${id}-secret`, {
      arn: this.secretArn,
    });

    return new DataAwsSecretsmanagerSecretVersion(
      scope,
      `${id}-secret-version`,
      {
        secretId: secret.id,
      }
    );
  }
}

/**
 * VPC with public/private subnets, NAT gateways, and NACLs
 */
export class SecureVpc extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[] = [];
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...config.tags, Name: config.name },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: { ...config.tags, Name: `${config.name}-igw` },
    });

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: { ...config.tags, Name: `${config.name}-public-rt` },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create public subnets
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(azs.names, index % config.azCount), // Use Fn.element instead of array access
        mapPublicIpOnLaunch: true,
        tags: { ...config.tags, Name: `${config.name}-public-${index + 1}` },
      });
      this.publicSubnets.push(subnet);

      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });

      // Create NAT Gateway if enabled
      if (config.enableNat) {
        const eip = new Eip(this, `nat-eip-${index}`, {
          domain: 'vpc',
          tags: { ...config.tags, Name: `${config.name}-nat-eip-${index + 1}` },
        });

        const natGateway = new NatGateway(this, `nat-${index}`, {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: { ...config.tags, Name: `${config.name}-nat-${index + 1}` },
        });
        this.natGateways.push(natGateway);
      }
    });

    // Create private subnets
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(azs.names, index % config.azCount), // Use Fn.element instead of array access
        tags: { ...config.tags, Name: `${config.name}-private-${index + 1}` },
      });
      this.privateSubnets.push(subnet);

      // Private route table
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.name}-private-rt-${index + 1}`,
        },
      });

      // Route to NAT Gateway if available
      if (config.enableNat && this.natGateways.length > 0) {
        new Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index % this.natGateways.length].id,
        });
      }

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Network ACLs with restrictive rules
    const privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId: this.vpc.id,
      tags: { ...config.tags, Name: `${config.name}-private-nacl` },
    });

    // Inbound rules for private NACL
    // Allow traffic from VPC CIDR
    new NetworkAclRule(this, 'private-nacl-in-vpc', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: config.cidr,
      fromPort: 0,
      toPort: 65535,
    });

    // Allow return traffic from internet (ephemeral ports)
    new NetworkAclRule(this, 'private-nacl-in-return', {
      networkAclId: privateNacl.id,
      ruleNumber: 200,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // Outbound rules for private NACL
    new NetworkAclRule(this, 'private-nacl-out-vpc', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: config.cidr,
      fromPort: 0,
      toPort: 65535,
      egress: true,
    });

    // Allow HTTPS outbound
    new NetworkAclRule(this, 'private-nacl-out-https', {
      networkAclId: privateNacl.id,
      ruleNumber: 200,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    // Associate private NACL with private subnets
    this.privateSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `private-nacl-assoc-${index}`, {
        networkAclId: privateNacl.id,
        subnetId: subnet.id,
      });
    });

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name:
        config.name.toLowerCase().replace(/[^a-z0-9\-_.]/g, '-') +
        '-db-subnet-group',
      subnetIds: this.privateSubnets.map(s => s.id),
      tags: { ...config.tags, Name: `${config.name}-db-subnet-group` },
    });
  }
}

/**
 * CloudWatch Log Group with retention
 */
export class CloudWatchLogGroup extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    retentionDays: number,
    tags: CommonTags
  ) {
    super(scope, id);

    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name,
      retentionInDays: retentionDays,
      tags,
    });
  }
}

/**
 * CloudWatch Alarm
 */
export class CloudWatchAlarm extends Construct {
  public readonly alarm: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, config: CloudWatchAlarmConfig) {
    super(scope, id);

    this.alarm = new CloudwatchMetricAlarm(this, 'alarm', {
      alarmName: config.name,
      comparisonOperator: config.comparisonOperator,
      evaluationPeriods: config.evaluationPeriods,
      metricName: config.metricName,
      namespace: config.namespace,
      period: config.period,
      statistic: config.statistic,
      threshold: config.threshold,
      dimensions: config.dimensions,
      alarmActions: [config.snsTopicArn],
      treatMissingData: config.treatMissingData ?? 'missing',
    });
  }
}

/**
 * SNS Topic for notifications
 */
export class NotificationTopic extends Construct {
  public readonly topic: SnsTopic;

  constructor(scope: Construct, id: string, name: string, tags: CommonTags) {
    super(scope, id);

    this.topic = new SnsTopic(this, 'topic', {
      name,
      kmsMasterKeyId: 'alias/aws/sns', // Use AWS-managed key for SNS
      tags,
    });
  }
}

/**
 * AWS Budget with alerts
 */
export class CostBudget extends Construct {
  public readonly budget: BudgetsBudget;

  constructor(scope: Construct, id: string, config: BudgetConfig) {
    super(scope, id);

    const notifications = config.thresholds.map(threshold => ({
      comparisonOperator: 'GREATER_THAN',
      notificationType: 'ACTUAL',
      threshold,
      thresholdType: 'PERCENTAGE',
      subscriberSnsTopicArns: [config.snsTopicArn],
    }));

    this.budget = new BudgetsBudget(this, 'budget', {
      name: config.name,
      budgetType: 'COST',
      limitAmount: config.limitAmount,
      limitUnit: config.limitUnit,
      timeUnit: config.timeUnit,
      notification: notifications,
      tags: config.tags,
    });
  }
}

/**
 * SSM Parameter Store helper
 */
export class SsmParameterConstruct extends Construct {
  public readonly parameter: SsmParameter;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    value: string,
    secure: boolean,
    tags: CommonTags
  ) {
    super(scope, id);

    this.parameter = new SsmParameter(this, 'parameter', {
      name,
      type: secure ? 'SecureString' : 'String',
      value,
      tags,
    });
  }
}
