## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import {
  AwsProvider,
  iam,
  kms,
  s3,
  rds,
  ec2,
  cloudwatch,
  sns,
  budgets,
  ssm,
  cloudtrail,
} from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

export interface BaseConstructProps {
  projectName: string;
  environment: string;
  tags: { [key: string]: string };
}

/**
 * Helper to create IAM role with least-privilege inline policy
 */
export class IamRoleConstruct extends Construct {
  public readonly role: iam.IamRole;
  
  constructor(scope: Construct, id: string, props: {
    roleName: string;
    assumeRolePolicy: string;
    inlinePolicies?: Array<{
      name: string;
      policy: string;
    }>;
    tags: { [key: string]: string };
  }) {
    super(scope, id);
    
    this.role = new iam.IamRole(this, 'role', {
      name: props.roleName,
      assumeRolePolicy: props.assumeRolePolicy,
      tags: props.tags,
    });
    
    // Attach inline policies with least privilege
    props.inlinePolicies?.forEach((inlinePolicy, index) => {
      new iam.IamRolePolicy(this, `policy-${index}`, {
        role: this.role.name,
        name: inlinePolicy.name,
        policy: inlinePolicy.policy,
      });
    });
  }
}

/**
 * MFA-enforced IAM policy for sensitive operations
 * This should be attached to IAM groups/users requiring MFA
 */
export class MfaEnforcementPolicy extends Construct {
  public readonly policy: iam.IamPolicy;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps) {
    super(scope, id);
    
    const policyDocument = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyAllExceptListedIfNoMFA',
          Effect: 'Deny',
          NotAction: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
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
    });
    
    this.policy = new iam.IamPolicy(this, 'mfa-policy', {
      name: `${props.projectName}-${props.environment}-require-mfa`,
      policy: policyDocument,
      description: 'Requires MFA for all actions except MFA setup',
      tags: props.tags,
    });
  }
}

/**
 * KMS key helper - creates or references existing key
 */
export class KmsKeyConstruct extends Construct {
  public readonly keyArn: string;
  public readonly keyId: string;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    existingKeyArn?: string;
    description?: string;
  }) {
    super(scope, id);
    
    if (props.existingKeyArn) {
      // Reference existing key
      const dataKey = new kms.DataAwsKmsKey(this, 'existing-key', {
        keyId: props.existingKeyArn,
      });
      this.keyArn = dataKey.arn;
      this.keyId = dataKey.keyId;
    } else {
      // Create new customer-managed key
      const key = new kms.KmsKey(this, 'key', {
        description: props.description || `${props.projectName}-${props.environment} encryption key`,
        deletionWindowInDays: 30,
        enableKeyRotation: true,
        tags: props.tags,
      });
      
      new kms.KmsAlias(this, 'alias', {
        name: `alias/${props.projectName}-${props.environment}`,
        targetKeyId: key.keyId,
      });
      
      this.keyArn = key.arn;
      this.keyId = key.keyId;
    }
  }
}

/**
 * Encrypted S3 bucket with versioning and public access blocked
 */
export class SecureS3Bucket extends Construct {
  public readonly bucket: s3.S3Bucket;
  public readonly bucketArn: string;
  public readonly bucketName: string;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    bucketName: string;
    kmsKeyArn?: string;
    lifecycleDays?: number;
    enableAccessLogging?: boolean;
    accessLogsBucket?: s3.S3Bucket;
  }) {
    super(scope, id);
    
    this.bucket = new s3.S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags: props.tags,
      lifecycle: {
        preventDestroy: props.environment === 'production',
      },
    });
    
    this.bucketArn = this.bucket.arn;
    this.bucketName = this.bucket.id;
    
    // Enable versioning
    new s3.S3BucketVersioningV2(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });
    
    // Configure server-side encryption
    const encryptionConfig = props.kmsKeyArn
      ? {
          rule: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: props.kmsKeyArn,
            },
            bucketKeyEnabled: true,
          }],
        }
      : {
          rule: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          }],
        };
    
    new s3.S3BucketServerSideEncryptionConfigurationV2(this, 'encryption', {
      bucket: this.bucket.id,
      rule: encryptionConfig.rule,
    });
    
    // Block all public access
    new s3.S3BucketPublicAccessBlock(this, 'pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    
    // Configure lifecycle rules if specified
    if (props.lifecycleDays) {
      new s3.S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: [{
          id: 'expire-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: props.lifecycleDays,
          },
        }],
      });
    }
    
    // Enable access logging if requested
    if (props.enableAccessLogging && props.accessLogsBucket) {
      new s3.S3BucketLoggingV2(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: props.accessLogsBucket.id,
        targetPrefix: `s3-access-logs/${props.bucketName}/`,
      });
    }
  }
}

/**
 * RDS instance with encryption and automated backups
 */
export class SecureRdsInstance extends Construct {
  public readonly instance: rds.DbInstance;
  public readonly endpoint: string;
  public readonly port: number;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    instanceIdentifier: string;
    engine: string;
    engineVersion: string;
    instanceClass: string;
    allocatedStorage: number;
    dbSubnetGroupName: string;
    vpcSecurityGroupIds: string[];
    kmsKeyId?: string;
    backupRetentionPeriod: number;
    deletionProtection: boolean;
    enableCloudwatchLogsExports?: string[];
    performanceInsightsEnabled?: boolean;
    performanceInsightsRetentionPeriod?: number;
    masterUsername?: string;
    manageMasterUserPassword?: boolean;
  }) {
    super(scope, id);
    
    // For production, prefer AWS-managed master password if supported
    const dbConfig: any = {
      identifier: props.instanceIdentifier,
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: props.kmsKeyId,
      dbSubnetGroupName: props.dbSubnetGroupName,
      vpcSecurityGroupIds: props.vpcSecurityGroupIds,
      backupRetentionPeriod: props.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: props.deletionProtection,
      skipFinalSnapshot: !props.deletionProtection,
      finalSnapshotIdentifier: props.deletionProtection 
        ? `${props.instanceIdentifier}-final-${Date.now()}`
        : undefined,
      applyImmediately: false,
      autoMinorVersionUpgrade: true,
      enabledCloudwatchLogsExports: props.enableCloudwatchLogsExports,
      performanceInsightsEnabled: props.performanceInsightsEnabled,
      performanceInsightsRetentionPeriod: props.performanceInsightsRetentionPeriod,
      tags: props.tags,
    };
    
    // Handle credentials
    if (props.manageMasterUserPassword && props.masterUsername) {
      // Use AWS-managed password (preferred for RDS)
      dbConfig.username = props.masterUsername;
      dbConfig.manageMasterUserPassword = true;
      // Note: AWS will create and manage the password in Secrets Manager automatically
    } else if (props.masterUsername) {
      // Fall back to SSM parameter for password
      const passwordParam = new ssm.DataAwsSsmParameter(this, 'db-password', {
        name: `/${props.projectName}/${props.environment}/rds/${props.instanceIdentifier}/master-password`,
      });
      dbConfig.username = props.masterUsername;
      dbConfig.password = passwordParam.value;
    }
    
    this.instance = new rds.DbInstance(this, 'instance', dbConfig);
    this.endpoint = this.instance.endpoint;
    this.port = this.instance.port;
  }
}

/**
 * VPC with public/private subnets and strict network controls
 */
export class SecureVpc extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.Subnet[];
  public readonly privateSubnets: ec2.Subnet[];
  public readonly natGateways: ec2.NatGateway[];
  public readonly dbSubnetGroup: rds.DbSubnetGroup;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    cidrBlock: string;
    publicSubnetCidrs: string[];
    privateSubnetCidrs: string[];
    azs: string[];
    enableNatGateways?: boolean;
  }) {
    super(scope, id);
    
    // Create VPC
    this.vpc = new ec2.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-vpc`,
      },
    });
    
    // Create Internet Gateway
    const igw = new ec2.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-igw`,
      },
    });
    
    // Create public subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      const az = props.azs[index % props.azs.length];
      return new ec2.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-public-${az}`,
          Type: 'public',
        },
      });
    });
    
    // Create public route table
    const publicRouteTable = new ec2.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-public-rt`,
      },
    });
    
    new ec2.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });
    
    this.publicSubnets.forEach((subnet, index) => {
      new ec2.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });
    
    // Create NAT Gateways if enabled
    this.natGateways = [];
    if (props.enableNatGateways) {
      this.publicSubnets.forEach((subnet, index) => {
        const eip = new ec2.Eip(this, `nat-eip-${index}`, {
          vpc: true,
          tags: {
            ...props.tags,
            Name: `${props.projectName}-${props.environment}-nat-eip-${index}`,
          },
        });
        
        const natGw = new ec2.NatGateway(this, `nat-${index}`, {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            ...props.tags,
            Name: `${props.projectName}-${props.environment}-nat-${index}`,
          },
        });
        
        this.natGateways.push(natGw);
      });
    }
    
    // Create private subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      const az = props.azs[index % props.azs.length];
      return new ec2.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: az,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-private-${az}`,
          Type: 'private',
        },
      });
    });
    
    // Create private route tables
    this.privateSubnets.forEach((subnet, index) => {
      const routeTable = new ec2.RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-private-rt-${index}`,
        },
      });
      
      new ec2.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });
      
      // Add NAT Gateway route if available
      if (this.natGateways[index % this.natGateways.length]) {
        new ec2.Route(this, `private-route-${index}`, {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index % this.natGateways.length].id,
        });
      }
    });
    
    // Create DB subnet group
    this.dbSubnetGroup = new rds.DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.projectName}-${props.environment}-db`,
      description: `Database subnet group for ${props.projectName}-${props.environment}`,
      subnetIds: this.privateSubnets.map(s => s.id),
      tags: props.tags,
    });
    
    // Configure Network ACLs with explicit rules
    const privateNacl = new ec2.NetworkAcl(this, 'private-nacl', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-private-nacl`,
      },
    });
    
    // Associate private NACL with private subnets
    this.privateSubnets.forEach((subnet, index) => {
      new ec2.NetworkAclAssociation(this, `private-nacl-assoc-${index}`, {
        networkAclId: privateNacl.id,
        subnetId: subnet.id,
      });
    });
    
    // Private NACL rules
    // Allow inbound from VPC
    new ec2.NetworkAclRule(this, 'private-nacl-in-vpc', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: props.cidrBlock,
      egress: false,
    });
    
    // Allow outbound to anywhere (for updates, etc.)
    new ec2.NetworkAclRule(this, 'private-nacl-out-all', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });
    
    // Allow ephemeral ports inbound
    new ec2.NetworkAclRule(this, 'private-nacl-in-ephemeral', {
      networkAclId: privateNacl.id,
      ruleNumber: 200,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });
  }
}

/**
 * CloudWatch logging and monitoring resources
 */
export class CloudWatchResources extends Construct {
  public readonly logGroups: Map<string, cloudwatch.CloudwatchLogGroup> = new Map();
  public readonly alarmTopic: sns.SnsTopic;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    logRetentionDays: number;
    alarmEmail?: string;
  }) {
    super(scope, id);
    
    // Create SNS topic for alarms
    this.alarmTopic = new sns.SnsTopic(this, 'alarm-topic', {
      name: `${props.projectName}-${props.environment}-alarms`,
      displayName: `${props.projectName} ${props.environment} CloudWatch Alarms`,
      tags: props.tags,
    });
    
    // Subscribe email if provided
    if (props.alarmEmail) {
      new sns.SnsTopicSubscription(this, 'alarm-email', {
        topicArn: this.alarmTopic.arn,
        protocol: 'email',
        endpoint: props.alarmEmail,
      });
    }
  }
  
  createLogGroup(name: string, retentionDays: number): cloudwatch.CloudwatchLogGroup {
    const logGroup = new cloudwatch.CloudwatchLogGroup(this, `log-${name}`, {
      name: `/aws/${name}`,
      retentionInDays: retentionDays,
      tags: this.tags,
    });
    
    this.logGroups.set(name, logGroup);
    return logGroup;
  }
  
  createMetricAlarm(props: {
    alarmName: string;
    alarmDescription: string;
    metricName: string;
    namespace: string;
    statistic: string;
    period: number;
    evaluationPeriods: number;
    threshold: number;
    comparisonOperator: string;
    dimensions?: { [key: string]: string };
    treatMissingData?: string;
  }): cloudwatch.CloudwatchMetricAlarm {
    return new cloudwatch.CloudwatchMetricAlarm(this, `alarm-${props.alarmName}`, {
      alarmName: props.alarmName,
      alarmDescription: props.alarmDescription,
      metricName: props.metricName,
      namespace: props.namespace,
      statistic: props.statistic,
      period: props.period,
      evaluationPeriods: props.evaluationPeriods,
      threshold: props.threshold,
      comparisonOperator: props.comparisonOperator,
      dimensions: props.dimensions,
      treatMissingData: props.treatMissingData || 'notBreaching',
      alarmActions: [this.alarmTopic.arn],
      okActions: [this.alarmTopic.arn],
      tags: this.tags,
    });
  }
  
  private get tags() {
    return (this.node.scope as any).tags || {};
  }
}

/**
 * AWS Budget with cost alerts
 */
export class CostBudget extends Construct {
  public readonly budget: budgets.BudgetsBudget;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    limitAmount: string;
    limitUnit?: string;
    timeUnit?: string;
    notificationEmail: string;
    thresholds?: number[];
  }) {
    super(scope, id);
    
    const notifications = (props.thresholds || [80, 100]).map(threshold => ({
      notificationType: 'ACTUAL',
      comparisonOperator: 'GREATER_THAN',
      threshold,
      thresholdType: 'PERCENTAGE',
      subscriberEmailAddresses: [props.notificationEmail],
    }));
    
    this.budget = new budgets.BudgetsBudget(this, 'budget', {
      name: `${props.projectName}-${props.environment}-monthly`,
      budgetType: 'COST',
      limitAmount: props.limitAmount,
      limitUnit: props.limitUnit || 'USD',
      timeUnit: props.timeUnit || 'MONTHLY',
      notification: notifications,
      costFilters: {
        TagKeyValue: [
          `user:project$${props.projectName}`,
          `user:environment$${props.environment}`,
        ],
      },
    });
  }
}

/**
 * SSM Parameter Store helper
 */
export class SsmParameter extends Construct {
  public readonly parameter: ssm.SsmParameter;
  
  constructor(scope: Construct, id: string, props: {
    name: string;
    value: string;
    type: 'String' | 'SecureString';
    description?: string;
    kmsKeyId?: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);
    
    this.parameter = new ssm.SsmParameter(this, 'param', {
      name: props.name,
      value: props.value,
      type: props.type,
      description: props.description,
      keyId: props.type === 'SecureString' ? props.kmsKeyId : undefined,
      tags: props.tags,
    });
  }
}

/**
 * CloudTrail for audit logging
 */
export class AuditTrail extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  public readonly bucket: SecureS3Bucket;
  
  constructor(scope: Construct, id: string, props: BaseConstructProps & {
    kmsKeyId?: string;
  }) {
    super(scope, id);
    
    // Create dedicated S3 bucket for CloudTrail logs
    this.bucket = new SecureS3Bucket(this, 'bucket', {
      projectName: props.projectName,
      environment: props.environment,
      bucketName: `${props.projectName}-${props.environment}-cloudtrail-${Date.now()}`,
      kmsKeyArn: props.kmsKeyId,
      lifecycleDays: 90,
      tags: props.tags,
    });
    
    // Configure bucket policy for CloudTrail
    const bucketPolicy = new s3.S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: this.bucket.bucket.arn,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.bucket.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-server-side-encryption': props.kmsKeyId ? 'aws:kms' : 'AES256',
              },
            },
          },
        ],
      }),
    });
    
    // Create CloudTrail
    this.trail = new cloudtrail.Cloudtrail(this, 'trail', {
      name: `${props.projectName}-${props.environment}-trail`,
      s3BucketName: this.bucket.bucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      enableLogFileValidation: true,
      kmsKeyId: props.kmsKeyId,
      eventSelector: [{
        readWriteType: 'All',
        includeManagementEvents: true,
        dataResource: [
          {
            type: 'AWS::S3::Object',
            values: ['arn:aws:s3:::*/*'],
          },
        ],
      }],
      tags: props.tags,
      dependsOn: [bucketPolicy],
    });
  }
}

/**
 * Helper to validate required environment variables
 */
export function validateEnvVars(required: string[]): void {
  const missing = required.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these environment variables before deploying.'
    );
  }
}

/**
 * Helper to get environment variable with default
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider, ec2, iam } from '@cdktf/provider-aws';
import {
  IamRoleConstruct,
  MfaEnforcementPolicy,
  KmsKeyConstruct,
  SecureS3Bucket,
  SecureRdsInstance,
  SecureVpc,
  CloudWatchResources,
  CostBudget,
  SsmParameter,
  AuditTrail,
  validateEnvVars,
  getEnvVar,
} from './modules';

export interface TapStackConfig {
  projectName: string;
  environment?: string;
  region?: string;
  vpcCidr?: string;
  publicSubnetCidrs?: string[];
  privateSubnetCidrs?: string[];
  kmsKeyArn?: string;
  rdsInstanceClass?: string;
  rdsStorageGb?: number;
  rdsBackupRetentionDays?: number;
  enableRdsDeletionProtection?: boolean;
  logRetentionDays?: number;
  budgetAmountUsd?: string;
  adminSshAllowedCidr?: string;
  enableNatGateways?: boolean;
  alarmEmail?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);
    
    // Validate required configuration
    if (!config.projectName) {
      throw new Error('projectName is required');
    }
    
    // Set defaults
    const environment = config.environment || 'production';
    const region = config.region || 'us-east-1';
    const vpcCidr = config.vpcCidr || '10.0.0.0/16';
    const publicSubnetCidrs = config.publicSubnetCidrs || ['10.0.1.0/24', '10.0.2.0/24'];
    const privateSubnetCidrs = config.privateSubnetCidrs || ['10.0.11.0/24', '10.0.12.0/24'];
    const rdsInstanceClass = config.rdsInstanceClass || 'db.t3.micro';
    const rdsStorageGb = config.rdsStorageGb || 20;
    const rdsBackupRetentionDays = config.rdsBackupRetentionDays || 7;
    const enableRdsDeletionProtection = config.enableRdsDeletionProtection !== false;
    const logRetentionDays = config.logRetentionDays || 30;
    const budgetAmountUsd = config.budgetAmountUsd || '100';
    const enableNatGateways = config.enableNatGateways !== false;
    const alarmEmail = config.alarmEmail || getEnvVar('ALARM_EMAIL', '');
    
    // Validate environment variables for sensitive data
    validateEnvVars(['AWS_ACCOUNT_ID']);
    
    // Common tags for all resources
    const commonTags = {
      project: config.projectName,
      environment,
      owner: getEnvVar('OWNER', 'devops'),
      'cost-center': getEnvVar('COST_CENTER', config.projectName),
      managed_by: 'terraform',
      created_date: new Date().toISOString().split('T')[0],
    };
    
    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region,
      defaultTags: {
        tags: commonTags,
      },
    });
    
    // Get availability zones
    const azs = new ec2.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });
    
    // Create or reference KMS key
    const kmsKey = new KmsKeyConstruct(this, 'kms', {
      projectName: config.projectName,
      environment,
      existingKeyArn: config.kmsKeyArn,
      description: `Master encryption key for ${config.projectName}-${environment}`,
      tags: commonTags,
    });
    
    // Create VPC with subnets
    const vpc = new SecureVpc(this, 'vpc', {
      projectName: config.projectName,
      environment,
      cidrBlock: vpcCidr,
      publicSubnetCidrs,
      privateSubnetCidrs,
      azs: [azs.names.get(0), azs.names.get(1)],
      enableNatGateways,
      tags: commonTags,
    });
    
    // Create CloudWatch resources
    const monitoring = new CloudWatchResources(this, 'monitoring', {
      projectName: config.projectName,
      environment,
      logRetentionDays,
      alarmEmail,
      tags: commonTags,
    });
    
    // Create log groups for various services
    const ec2LogGroup = monitoring.createLogGroup(`${config.projectName}/${environment}/ec2`, logRetentionDays);
    const rdsLogGroup = monitoring.createLogGroup(`${config.projectName}/${environment}/rds`, logRetentionDays);
    const applicationLogGroup = monitoring.createLogGroup(`${config.projectName}/${environment}/application`, logRetentionDays);
    
    // Create audit trail with CloudTrail
    const auditTrail = new AuditTrail(this, 'audit', {
      projectName: config.projectName,
      environment,
      kmsKeyId: kmsKey.keyArn,
      tags: commonTags,
    });
    
    // Create S3 buckets for application data
    const dataBucket = new SecureS3Bucket(this, 'data-bucket', {
      projectName: config.projectName,
      environment,
      bucketName: `${config.projectName}-${environment}-data-${getEnvVar('AWS_ACCOUNT_ID')}`,
      kmsKeyArn: kmsKey.keyArn,
      lifecycleDays: 365,
      enableAccessLogging: true,
      accessLogsBucket: auditTrail.bucket.bucket,
      tags: commonTags,
    });
    
    // Create IAM role for EC2 instances with least privilege
    const ec2Role = new IamRoleConstruct(this, 'ec2-role', {
      roleName: `${config.projectName}-${environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      inlinePolicies: [
        {
          name: 'CloudWatchLogs',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                ],
                Resource: `${ec2LogGroup.arn}:*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'cloudwatch:PutMetricData',
                ],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'cloudwatch:namespace': `${config.projectName}/${environment}`,
                  },
                },
              },
            ],
          }),
        },
        {
          name: 'S3Access',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                ],
                Resource: `${dataBucket.bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:ListBucket',
                ],
                Resource: dataBucket.bucketArn,
              },
            ],
          }),
        },
        {
          name: 'SSMAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ssm:GetParameter',
                  'ssm:GetParameters',
                  'ssm:GetParametersByPath',
                ],
                Resource: `arn:aws:ssm:${region}:${getEnvVar('AWS_ACCOUNT_ID')}:parameter/${config.projectName}/${environment}/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Decrypt',
                ],
                Resource: kmsKey.keyArn,
                Condition: {
                  StringEquals: {
                    'kms:ViaService': `ssm.${region}.amazonaws.com`,
                  },
                },
              },
            ],
          }),
        },
        {
          name: 'SessionManager',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ssmmessages:CreateControlChannel',
                  'ssmmessages:CreateDataChannel',
                  'ssmmessages:OpenControlChannel',
                  'ssmmessages:OpenDataChannel',
                  's3:GetEncryptionConfiguration',
                ],
                Resource: '*',
              },
            ],
          }),
        },
      ],
      tags: commonTags,
    });
    
    // Create instance profile for EC2
    const ec2InstanceProfile = new iam.IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `${config.projectName}-${environment}-ec2-profile`,
      role: ec2Role.role.name,
      tags: commonTags,
    });
    
    // Create security groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'alb-sg', {
      name: `${config.projectName}-${environment}-alb`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.vpc.id,
      tags: commonTags,
    });
    
    new ec2.SecurityGroupRule(this, 'alb-sg-http', {
      securityGroupId: albSecurityGroup.id,
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTP from anywhere',
    });
    
    new ec2.SecurityGroupRule(this, 'alb-sg-https', {
      securityGroupId: albSecurityGroup.id,
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTPS from anywhere',
    });
    
    new ec2.SecurityGroupRule(this, 'alb-sg-egress', {
      securityGroupId: albSecurityGroup.id,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
    });
    
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2-sg', {
      name: `${config.projectName}-${environment}-ec2`,
      description: 'Security group for EC2 instances',
      vpcId: vpc.vpc.id,
      tags: commonTags,
    });
    
    new ec2.SecurityGroupRule(this, 'ec2-sg-alb', {
      securityGroupId: ec2SecurityGroup.id,
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      description: 'HTTP from ALB',
    });
    
    // Only add SSH rule if CIDR is provided (prefer SSM Session Manager)
    if (config.adminSshAllowedCidr) {
      new ec2.SecurityGroupRule(this, 'ec2-sg-ssh', {
        securityGroupId: ec2SecurityGroup.id,
        type: 'ingress',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [config.adminSshAllowedCidr],
        description: 'SSH from admin network',
      });
    }
    
    new ec2.SecurityGroupRule(this, 'ec2-sg-egress', {
      securityGroupId: ec2SecurityGroup.id,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
    });
    
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-${environment}-rds`,
      description: 'Security group for RDS instances',
      vpcId: vpc.vpc.id,
      tags: commonTags,
    });
    
    new ec2.SecurityGroupRule(this, 'rds-sg-ec2', {
      securityGroupId: rdsSecurityGroup.id,
      type: 'ingress',
      fromPort: 5432, // PostgreSQL, adjust for your engine
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2SecurityGroup.id,
      description: 'Database access from EC2 instances',
    });
    
    new ec2.SecurityGroupRule(this, 'rds-sg-egress', {
      securityGroupId: rdsSecurityGroup.id,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
    });
    
    // Store example application configuration in SSM Parameter Store
    new SsmParameter(this, 'app-config', {
      name: `/${config.projectName}/${environment}/app/database-url`,
      value: 'placeholder-will-be-updated-after-rds-creation',
      type: 'String',
      description: 'Database connection URL for application',
      tags: commonTags,
    });
    
    // Create RDS instance
    const rdsInstance = new SecureRdsInstance(this, 'rds', {
      projectName: config.projectName,
      environment,
      instanceIdentifier: `${config.projectName}-${environment}-db`,
      engine: 'postgres',
      engineVersion: '14.9',
      instanceClass: rdsInstanceClass,
      allocatedStorage: rdsStorageGb,
      dbSubnetGroupName: vpc.dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      kmsKeyId: kmsKey.keyArn,
      backupRetentionPeriod: rdsBackupRetentionDays,
      deletionProtection: enableRdsDeletionProtection,
      enableCloudwatchLogsExports: ['postgresql'],
      performanceInsightsEnabled: environment === 'production',
      performanceInsightsRetentionPeriod: 7,
      masterUsername: 'dbadmin',
      manageMasterUserPassword: true, // Use AWS-managed password
      tags: commonTags,
    });
    
    // Create CloudWatch alarms
    monitoring.createMetricAlarm({
      alarmName: `${config.projectName}-${environment}-rds-cpu-high`,
      alarmDescription: 'RDS instance CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        DBInstanceIdentifier: rdsInstance.instance.identifier,
      },
    });
    
    monitoring.createMetricAlarm({
      alarmName: `${config.projectName}-${environment}-rds-storage-low`,
      alarmDescription: 'RDS instance free storage is low',
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 1,
      threshold: 2147483648, // 2GB in bytes
      comparisonOperator: 'LessThanThreshold',
      dimensions: {
        DBInstanceIdentifier: rdsInstance.instance.identifier,
      },
    });
    
    monitoring.createMetricAlarm({
      alarmName: `${config.projectName}-${environment}-s3-bucket-size`,
      alarmDescription: 'S3 bucket size exceeds threshold',
      metricName: 'BucketSizeBytes',
      namespace: 'AWS/S3',
      statistic: 'Average',
      period: 86400, // Daily
      evaluationPeriods: 1,
      threshold: 1073741824000, // 1TB in bytes
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        BucketName: dataBucket.bucket.id,
        StorageType: 'StandardStorage',
      },
    });
    
    // Create cost budget with alerts
    const costBudget = new CostBudget(this, 'budget', {
      projectName: config.projectName,
      environment,
      limitAmount: budgetAmountUsd,
      notificationEmail: alarmEmail || getEnvVar('BUDGET_NOTIFICATION_EMAIL'),
      thresholds: [50, 80, 100, 120], // Alert at 50%, 80%, 100%, and 120% of budget
      tags: commonTags,
    });
    
    // Create MFA enforcement policy for IAM users
    const mfaPolicy = new MfaEnforcementPolicy(this, 'mfa-policy', {
      projectName: config.projectName,
      environment,
      tags: commonTags,
    });
    
    // NOTE: Manual steps required for MFA enforcement:
    // 1. Attach the MFA enforcement policy to IAM groups/users who need console access
    // 2. Enable MFA devices for all IAM users with console access
    // 3. Consider implementing AWS SSO/Identity Center for centralized access management
    // 4. For programmatic access, use temporary credentials via AssumeRole with MFA
    
    // Create outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
      description: 'VPC ID',
    });
    
    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets.map(s => s.id),
      description: 'Public subnet IDs',
    });
    
    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnets.map(s => s.id),
      description: 'Private subnet IDs',
    });
    
    new TerraformOutput(this, 'kms_key_arn', {
      value: kmsKey.keyArn,
      description: 'KMS key ARN for encryption',
    });
    
    new TerraformOutput(this, 'kms_key_id', {
      value: kmsKey.keyId,
      description: 'KMS key ID',
    });
    
    new TerraformOutput(this, 'data_bucket_name', {
      value: dataBucket.bucket.id,
      description: 'Data S3 bucket name',
    });
    
    new TerraformOutput(this, 'data_bucket_arn', {
      value: dataBucket.bucket.arn,
      description: 'Data S3 bucket ARN',
    });
    
    new TerraformOutput(this, 'cloudtrail_bucket_name', {
      value: auditTrail.bucket.bucket.id,
      description: 'CloudTrail audit logs S3 bucket name',
    });
    
    new TerraformOutput(this, 'rds_endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });
    
    new TerraformOutput(this, 'rds_port', {
      value: rdsInstance.port.toString(),
      description: 'RDS instance port',
    });
    
    new TerraformOutput(this, 'ec2_instance_profile_name', {
      value: ec2InstanceProfile.name,
      description: 'EC2 instance profile name',
    });
    
    new TerraformOutput(this, 'ec2_security_group_id', {
      value: ec2SecurityGroup.id,
      description: 'EC2 security group ID',
    });
    
    new TerraformOutput(this, 'alb_security_group_id', {
      value: albSecurityGroup.id,
      description: 'ALB security group ID',
    });
    
    new TerraformOutput(this, 'cloudwatch_log_groups', {
      value: {
        ec2: ec2LogGroup.name,
        rds: rdsLogGroup.name,
        application: applicationLogGroup.name,
      },
      description: 'CloudWatch log group names',
    });
    
    new TerraformOutput(this, 'alarm_topic_arn', {
      value: monitoring.alarmTopic.arn,
      description: 'SNS topic ARN for CloudWatch alarms',
    });
    
    new TerraformOutput(this, 'budget_name', {
      value: costBudget.budget.name,
      description: 'AWS Budget name',
    });
    
    new TerraformOutput(this, 'mfa_policy_arn', {
      value: mfaPolicy.policy.arn,
      description: 'MFA enforcement IAM policy ARN',
    });
    
    // Pre-deployment checklist (as comments)
    console.log(`
Pre-deployment checklist for ${config.projectName}-${environment}:
1. Set required environment variables:
   - AWS_ACCOUNT_ID
   - OWNER (optional, defaults to 'devops')
   - COST_CENTER (optional, defaults to project name)
   - ALARM_EMAIL or pass via config
   - BUDGET_NOTIFICATION_EMAIL (if not using ALARM_EMAIL)

2. Run validation commands:
   - cdktf synth
   - cdktf diff
   - cdktf deploy

3. Post-deployment steps:
   - Attach MFA enforcement policy to IAM groups/users
   - Enable MFA devices for all IAM users
   - Update SSM parameters with actual values
   - Configure EC2 CloudWatch agent on instances
   - Test CloudWatch alarms and budget alerts
   - Review and adjust security group rules as needed
    `);
  }
}

```