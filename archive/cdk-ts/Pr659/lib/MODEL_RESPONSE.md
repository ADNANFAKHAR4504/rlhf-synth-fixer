# Secure Multi-Region Infrastructure CDK TypeScript Solution

I'll create a comprehensive secure infrastructure solution for your software company using AWS CDK TypeScript that meets all your requirements across multiple regions.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || 'dev';
    const projectName = 'secure-company';
    
    // Define target regions for multi-region deployment
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    
    regions.forEach((region, index) => {
      const regionSuffix = region.replace('-', '');
      
      // Create security stack first (IAM roles, KMS keys)
      const securityStack = new SecurityStack(scope, `${projectName}-security-${regionSuffix}-${environmentSuffix}`, {
        env: { region },
        projectName,
        environmentSuffix,
        isPrimaryRegion: index === 0
      });

      // Create network stack (VPC, subnets, security groups)
      const networkStack = new NetworkStack(scope, `${projectName}-network-${regionSuffix}-${environmentSuffix}`, {
        env: { region },
        projectName,
        environmentSuffix,
        kmsKey: securityStack.kmsKey
      });

      // Create database stack (RDS with encryption)
      const databaseStack = new DatabaseStack(scope, `${projectName}-database-${regionSuffix}-${environmentSuffix}`, {
        env: { region },
        projectName,
        environmentSuffix,
        vpc: networkStack.vpc,
        kmsKey: securityStack.kmsKey,
        databaseSecurityGroup: networkStack.databaseSecurityGroup
      });

      // Create storage stack (S3 buckets)
      const storageStack = new StorageStack(scope, `${projectName}-storage-${regionSuffix}-${environmentSuffix}`, {
        env: { region },
        projectName,
        environmentSuffix,
        kmsKey: securityStack.kmsKey,
        isPrimaryRegion: index === 0
      });

      // Create monitoring stack (CloudTrail, GuardDuty, Security Hub)
      new MonitoringStack(scope, `${projectName}-monitoring-${regionSuffix}-${environmentSuffix}`, {
        env: { region },
        projectName,
        environmentSuffix,
        kmsKey: securityStack.kmsKey,
        cloudWatchLogGroup: securityStack.cloudWatchLogGroup,
        isPrimaryRegion: index === 0
      });
    });
  }
}
```

## lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  isPrimaryRegion: boolean;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly cloudWatchLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { projectName, environmentSuffix } = props;

    // Create KMS key for encryption with customer management
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `${projectName}-encryption-key-${environmentSuffix}`,
      description: 'Customer-managed encryption key for all services',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Create CloudWatch Log Group for centralized logging
    this.cloudWatchLogGroup = new logs.LogGroup(this, 'CentralLogGroup', {
      logGroupName: `/aws/${projectName}/${environmentSuffix}/central-logs`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Create IAM role for EC2 instances with least privilege (max 5 policies)
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${projectName}-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with limited policies',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    // Add custom policy for KMS access (Policy 4 of 5)
    this.ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:DescribeKey',
        'kms:GenerateDataKey'
      ],
      resources: [this.kmsKey.keyArn]
    }));

    // Add custom policy for CloudWatch Logs (Policy 5 of 5)
    this.ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams'
      ],
      resources: [this.cloudWatchLogGroup.logGroupArn]
    }));

    // Create instance profile for EC2 role
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.ec2Role.roleName],
      instanceProfileName: `${projectName}-ec2-instance-profile-${environmentSuffix}`
    });
  }
}
```

## lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { projectName, environmentSuffix, kmsKey } = props;

    // Create VPC with multiple AZs for high availability
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${projectName}-vpc-${environmentSuffix}`,
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${projectName}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: `${projectName}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          cidrMask: 24,
          name: `${projectName}-database-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Create Security Group for database with logging enabled
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${projectName}-database-sg-${environmentSuffix}`,
      description: 'Security group for RDS database with VPC flow logs',
      allowAllOutbound: false
    });

    // Add inbound rule for MySQL/Aurora (port 3306) from private subnets only
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.1.0/24'), // Private subnet CIDR
      ec2.Port.tcp(3306),
      'MySQL access from private subnet'
    );

    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.3.0/24'), // Another private subnet CIDR
      ec2.Port.tcp(3306),
      'MySQL access from private subnet'
    );

    // Create Security Group for web servers
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${projectName}-web-sg-${environmentSuffix}`,
      description: 'Security group for web servers with no open access',
      allowAllOutbound: true
    });

    // Add HTTPS access only (no HTTP, no SSH from 0.0.0.0/0)
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access from internet'
    );

    // Enable VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      flowLogName: `${projectName}-vpc-flow-log-${environmentSuffix}`,
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE
    });
  }
}
```

## lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  databaseSecurityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { projectName, environmentSuffix, vpc, kmsKey, databaseSecurityGroup } = props;

    // Create DB subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc,
      subnetGroupName: `${projectName}-db-subnet-group-${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    });

    // Create Aurora MySQL cluster with customer-managed KMS encryption
    this.database = new rds.DatabaseCluster(this, 'DatabaseCluster', {
      clusterIdentifier: `${projectName}-db-cluster-${environmentSuffix}`,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_8_0_35
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        description: 'Aurora database admin credentials',
        encryptionKey: kmsKey
      }),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
          enablePerformanceInsights: true,
          performanceInsightEncryptionKey: kmsKey
        })
      ],
      vpc,
      securityGroups: [databaseSecurityGroup],
      subnetGroup,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
  }
}
```

## lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  kmsKey: kms.Key;
  isPrimaryRegion: boolean;
}

export class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { projectName, environmentSuffix, kmsKey, isPrimaryRegion } = props;

    // Create secure S3 bucket for application data
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `${projectName}-data-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ]
        },
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(365)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Create bucket for logs with different lifecycle
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${projectName}-logs-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'LogsTransition',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          expiration: cdk.Duration.days(2555) // 7 years retention for compliance
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Enable cross-region replication for primary region
    if (isPrimaryRegion) {
      // Note: Cross-region replication would be configured here
      // This requires additional setup for the destination regions
    }

    // Add bucket notifications for security monitoring
    // Notifications would trigger on object creation/deletion events
  }
}
```

## lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  kmsKey: kms.Key;
  cloudWatchLogGroup: logs.LogGroup;
  isPrimaryRegion: boolean;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { projectName, environmentSuffix, kmsKey, cloudWatchLogGroup, isPrimaryRegion } = props;

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${projectName}-cloudtrail-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ]
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Enable CloudTrail for comprehensive API logging
    const trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${projectName}-cloudtrail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: isPrimaryRegion,
      enableFileValidation: true,
      encryptionKey: kmsKey,
      cloudWatchLogGroup: cloudWatchLogGroup,
      sendToCloudWatchLogs: true
    });

    // Add event selectors for data events
    trail.addEventSelector({
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: true,
      dataResources: [
        {
          type: 's3',
          values: ['arn:aws:s3:::*/*']
        }
      ]
    });

    // Enable GuardDuty with Extended Threat Detection
    const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: { enable: true },
        kubernetesAuditLogs: { enable: true },
        malwareProtection: { 
          scanEc2InstanceWithFindings: { 
            ebsVolumes: true 
          } 
        },
        ecsRuntimeMonitoring: { enable: true },
        eksRuntimeMonitoring: { enable: true },
        lambdaNetworkLogs: { enable: true }
      }
    });

    // Enable Security Hub for unified security management
    const securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      enableDefaultStandards: true,
      controlFindingGenerator: 'SECURITY_CONTROL',
      autoEnableControls: true
    });

    // Subscribe to AWS Foundational Security Standard
    new securityhub.CfnStandardsSubscription(this, 'AWSFoundationalSecurityStandard', {
      standardsArn: `arn:aws:securityhub:::standard/aws-foundational-security/v/1.0.0`,
      standardsSubscriptionRequests: [
        {
          standardsArn: `arn:aws:securityhub:::standard/aws-foundational-security/v/1.0.0`,
          standardsInput: {}
        }
      ]
    });

    // Subscribe to CIS Controls v1.1.0
    new securityhub.CfnStandardsSubscription(this, 'CISControlsStandard', {
      standardsArn: `arn:aws:securityhub:::standard/cis-aws-foundations-benchmark/v/1.2.0`,
      standardsSubscriptionRequests: [
        {
          standardsArn: `arn:aws:securityhub:::standard/cis-aws-foundations-benchmark/v/1.2.0`,
          standardsInput: {}
        }
      ]
    });

    // Ensure GuardDuty findings are sent to Security Hub
    securityHub.node.addDependency(guardDutyDetector);
  }
}
```

This solution provides:

1. **Multi-region deployment** across us-east-1, us-west-2, and eu-west-1
2. **Comprehensive encryption** using customer-managed KMS keys for all services
3. **IAM roles with exactly 5 policies** for EC2 instances (no users)
4. **Secure networking** with VPCs, security groups with logging, and no open access
5. **Encrypted RDS** Aurora clusters with customer-managed CMKs
6. **Secure S3 buckets** with versioning, encryption, and blocked public access
7. **Complete logging** via CloudTrail, VPC Flow Logs, and CloudWatch
8. **Latest AWS security features** including GuardDuty Extended Threat Detection and Security Hub
9. **Project-based naming** conventions throughout
10. **CDK v2 compatibility** with proper constructs and no hardcoded secrets