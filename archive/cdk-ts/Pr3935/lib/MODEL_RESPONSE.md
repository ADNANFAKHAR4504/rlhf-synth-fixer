### Reasoning Trace
---

The user wants me to help them build a secure AWS infrastructure using TypeScript and AWS CDK. They have specific requirements around:

1. Networking (VPCs, subnets, security groups)
2. Compute (EC2, Auto Scaling, ALB)
3. Database (RDS with Multi-AZ, Secrets Manager)
4. Security & Encryption (KMS, S3 encryption, IAM roles, MFA)
5. Compliance & Monitoring (CloudTrail, Config, Inspector, WAF)

They have constraints:
- Must work across multiple AWS accounts without hardcoded values
- Use parameters/environment variables
- Tag all resources with 'iac-rlhf-amazon'
- Lambda functions should solve real problems

They want me to UPDATE the existing tap-stack.ts file, not create a completely new structure. The file shows they want separate stacks for different resource types, not everything in the main stack.

Let me plan the implementation:

1. Create separate stack files for:
   - NetworkingStack (VPC, subnets, security groups, NACLs)
   - ComputeStack (EC2, Auto Scaling, ALB)
   - DatabaseStack (RDS, Secrets Manager)
   - SecurityStack (KMS keys, IAM roles, MFA policy)
   - MonitoringStack (CloudTrail, Config, Inspector)
   - StorageStack (S3 buckets with encryption)
   - WAFStack (WAF configuration)

2. Update the tap-stack.ts to instantiate these stacks with proper dependencies

3. Use CDK best practices:
   - No hardcoded values
   - Use environment variables or context
   - Apply tags to all resources
   - Use IAM roles instead of keys
   - Enable encryption everywhere

4. Add useful Lambda functions:
   - CloudTrail log processor
   - Cost monitoring alert
   - Unused access key cleanup

Let me implement this step by step.
### Answer 
---

I'll help you build a secure, production-grade AWS infrastructure using AWS CDK. Let me update your `tap-stack.ts` file and create the necessary stack components.

## Updated `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';
import { StorageStack } from './stacks/storage-stack';
import { DatabaseStack } from './stacks/database-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { WAFStack } from './stacks/waf-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      'iac-rlhf-amazon': 'true',
      Environment: environmentSuffix,
      ManagedBy: 'AWS-CDK',
    };

    // Apply tags to this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // 1. Security Stack - KMS keys and IAM roles
    const securityStack = new SecurityStack(this, `SecurityStack-${environmentSuffix}`, {
      environmentSuffix,
      tags: commonTags,
    });

    // 2. Networking Stack - VPC, Subnets, Security Groups
    const networkingStack = new NetworkingStack(this, `NetworkingStack-${environmentSuffix}`, {
      environmentSuffix,
      tags: commonTags,
    });

    // 3. Storage Stack - S3 buckets with encryption
    const storageStack = new StorageStack(this, `StorageStack-${environmentSuffix}`, {
      environmentSuffix,
      kmsKey: securityStack.kmsKey,
      tags: commonTags,
    });

    // 4. Database Stack - RDS with Multi-AZ
    const databaseStack = new DatabaseStack(this, `DatabaseStack-${environmentSuffix}`, {
      environmentSuffix,
      vpc: networkingStack.vpc,
      kmsKey: securityStack.kmsKey,
      databaseSecurityGroup: networkingStack.databaseSecurityGroup,
      tags: commonTags,
    });

    // 5. WAF Stack - Web Application Firewall
    const wafStack = new WAFStack(this, `WAFStack-${environmentSuffix}`, {
      environmentSuffix,
      tags: commonTags,
    });

    // 6. Compute Stack - EC2, Auto Scaling, ALB
    const computeStack = new ComputeStack(this, `ComputeStack-${environmentSuffix}`, {
      environmentSuffix,
      vpc: networkingStack.vpc,
      applicationSecurityGroup: networkingStack.applicationSecurityGroup,
      albSecurityGroup: networkingStack.albSecurityGroup,
      kmsKey: securityStack.kmsKey,
      instanceRole: securityStack.ec2InstanceRole,
      logBucket: storageStack.logBucket,
      databaseSecret: databaseStack.databaseSecret,
      webAcl: wafStack.webAcl,
      tags: commonTags,
    });

    // 7. Monitoring Stack - CloudTrail, Config, Inspector
    const monitoringStack = new MonitoringStack(this, `MonitoringStack-${environmentSuffix}`, {
      environmentSuffix,
      cloudTrailBucket: storageStack.cloudTrailBucket,
      kmsKey: securityStack.kmsKey,
      vpc: networkingStack.vpc,
      ec2InstanceRole: securityStack.ec2InstanceRole,
      tags: commonTags,
    });

    // Add stack dependencies
    databaseStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    computeStack.addDependency(networkingStack);
    computeStack.addDependency(securityStack);
    computeStack.addDependency(storageStack);
    computeStack.addDependency(databaseStack);
    computeStack.addDependency(wafStack);
    monitoringStack.addDependency(storageStack);
    monitoringStack.addDependency(securityStack);
    monitoringStack.addDependency(networkingStack);
  }
}
```

Now, let me create each of the stack files:

## 1. Security Stack - `lib/stacks/security-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2InstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'MasterKMSKey', {
      description: `Master KMS key for ${props.environmentSuffix} environment`,
      enableKeyRotation: true,
      alias: `alias/${props.environmentSuffix}-master-key`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant CloudTrail permission to use the KMS key
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudTrail to encrypt logs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );

    // Create IAM role for EC2 instances
    this.ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Create IAM policy for MFA requirement
    const mfaPolicy = new iam.ManagedPolicy(this, 'RequireMFAPolicy', {
      managedPolicyName: `${props.environmentSuffix}-require-mfa`,
      description: 'Requires MFA for console access',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'AllowViewAccountInfo',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:GetAccountPasswordPolicy',
              'iam:ListVirtualMFADevices',
              'iam:ListUsers',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnPasswords',
            effect: iam.Effect.ALLOW,
            actions: ['iam:ChangePassword', 'iam:GetUser'],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnAccessKeys',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateAccessKey',
              'iam:DeleteAccessKey',
              'iam:ListAccessKeys',
              'iam:UpdateAccessKey',
            ],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnMFA',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ListMFADevices',
              'iam:ResyncMFADevice',
              'iam:DeactivateMFADevice',
            ],
            resources: [
              'arn:aws:iam::*:mfa/${aws:username}',
              'arn:aws:iam::*:user/${aws:username}',
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyAllExceptListedIfNoMFA',
            effect: iam.Effect.DENY,
            notActions: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      }),
    });
  }
}
```

## 2. Networking Stack - `lib/stacks/networking-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'MainVPC', {
      maxAzs: 3,
      natGateways: 2,
      vpcName: `${props.environmentSuffix}-vpc`,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Configure NACLs for public subnets
    const publicNacl = new ec2.NetworkAcl(this, 'PublicNACL', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    publicNacl.addEntry('AllowInboundHTTP', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowInboundHTTPS', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowInboundEphemeral', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    publicNacl.addEntry('AllowOutboundAll', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Configure NACLs for private subnets
    const privateNacl = new ec2.NetworkAcl(this, 'PrivateNACL', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    privateNacl.addEntry('AllowInboundFromVPC', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
    });

    privateNacl.addEntry('AllowOutboundAll', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Create security groups
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    this.applicationSecurityGroup = new ec2.SecurityGroup(this, 'ApplicationSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    this.applicationSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from application servers'
    );

    // Add VPC Flow Logs
    this.vpc.addFlowLog('VPCFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });
  }
}
```

## 3. Storage Stack - `lib/stacks/storage-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class StorageStack extends cdk.NestedStack {
  public readonly logBucket: s3.Bucket;
  public readonly cloudTrailBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create S3 bucket for ALB logs
    this.logBucket = new s3.Bucket(this, 'ALBLogBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-alb-logs`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for ALB access
    this.logBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('elasticloadbalancing.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${this.logBucket.bucketArn}/*`],
      })
    );

    // Create S3 bucket for CloudTrail logs
    this.cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-cloudtrail`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-trails',
          enabled: true,
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Add bucket policy for CloudTrail access
    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [this.cloudTrailBucket.bucketArn],
      })
    );

    this.cloudTrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${this.cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id': props.kmsKey.keyArn,
          },
        },
      })
    );
  }
}
```

## 4. Database Stack - `lib/stacks/database-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  databaseSecurityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create database credentials in Secrets Manager
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.environmentSuffix}/rds/credentials`,
      description: `RDS database credentials for ${props.environmentSuffix} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey: props.kmsKey,
    });

    // Create subnet group for database
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Database subnet group for ${props.environmentSuffix}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS instance with Multi-AZ
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [props.databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });
  }
}
```

## 5. WAF Stack - `lib/stacks/waf-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface WAFStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class WAFStack extends cdk.NestedStack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WAFStackProps) {
    super(scope, id, props);

    // Create IP Set for rate limiting
    const ipRateLimitSet = new wafv2.CfnIPSet(this, 'IPRateLimitSet', {
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [],
    });

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        // AWS Managed Core Rule Set
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
        // AWS Managed Known Bad Inputs Rule Set
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
        },
        // SQL Injection Rule Set
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
        },
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${props.environmentSuffix}-WebACL`,
      },
    });
  }
}
```

## 6. Compute Stack - `lib/stacks/compute-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  applicationSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  instanceRole: iam.Role;
  logBucket: s3.Bucket;
  databaseSecret: secretsmanager.Secret;
  webAcl: wafv2.CfnWebACL;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create launch template for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y amazon-ssm-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Application Server</h1>" > /var/www/html/index.html',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          run_as_user: 'cwagent',
        },
        metrics: {
          namespace: `${props.environmentSuffix}/EC2`,
          metrics_collected: {
            cpu: {
              measurement: [
                {
                  name: 'cpu_usage_idle',
                  rename: 'CPU_USAGE_IDLE',
                  unit: 'Percent',
                },
                {
                  name: 'cpu_usage_iowait',
                  rename: 'CPU_USAGE_IOWAIT',
                  unit: 'Percent',
                },
                'cpu_time_guest',
              ],
              totalcpu: false,
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: [
                {
                  name: 'used_percent',
                  rename: 'DISK_USED_PERCENT',
                  unit: 'Percent',
                },
                'disk_free',
              ],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: [
                {
                  name: 'mem_used_percent',
                  rename: 'MEM_USED_PERCENT',
                  unit: 'Percent',
                },
                'mem_available',
              ],
              metrics_collection_interval: 60,
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60,
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\',
      '  -a fetch-config \\',
      '  -m ec2 \\',
      '  -s \\',
      '  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
    );

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `${props.environmentSuffix}-alb`,
    });

    // Enable ALB access logs
    this.alb.logAccessLogs(props.logBucket);

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'ALBWebACLAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn: props.webAcl.attrArn,
    });

    // Create Auto Scaling Group
    this.asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.applicationSecurityGroup,
      role: props.instanceRole,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 2,
      }),
      instanceMonitoring: autoscaling.Monitoring.DETAILED,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(30, {
            volumeType: autoscaling.EbsDeviceVolumeType.GP3,
            encrypted: true,
            kmsKey: props.kmsKey,
          }),
        },
      ],
    });

    // Add scaling policies
    this.asg.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    this.asg.scaleOnMetric('MemoryScaling', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: `${props.environmentSuffix}/EC2`,
        metricName: 'MEM_USED_PERCENT',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 60, change: -1 },
        { lower: 80, change: +1 },
        { lower: 90, change: +2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.minutes(5),
    });

    // Grant access to database secret
    props.databaseSecret.grantRead(this.asg);

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Add listener
    this.alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });
  }
}
```

## 7. Monitoring Stack - `lib/stacks/monitoring-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as config from 'aws-cdk-lib/aws-config';
import * as inspector from 'aws-cdk-lib/aws-inspectorv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  cloudTrailBucket: s3.Bucket;
  kmsKey: kms.Key;
  vpc: ec2.Vpc;
  ec2InstanceRole: iam.Role;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly trail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudTrail
    this.trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${props.environmentSuffix}-trail`,
      bucket: props.cloudTrailBucket,
      encryptionKey: props.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_YEAR,
    });

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `${props.environmentSuffix} Security Alerts`,
      masterKey: props.kmsKey,
    });

    // Create Config Service
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-config`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-config',
          enabled: true,
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    configBucket.grantWrite(configRole);

    const recorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `${props.environmentSuffix}-recorder`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    const deliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: `${props.environmentSuffix}-delivery-channel`,
      s3BucketName: configBucket.bucketName,
      s3KmsKeyArn: props.kmsKey.keyArn,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    });

    deliveryChannel.addDependency(recorder);

    // Config Rules
    const requiredTagsRule = new config.ManagedRule(this, 'RequiredTagsRule', {
      identifier: config.ManagedRuleIdentifiers.REQUIRED_TAGS,
      inputParameters: {
        tag1Key: 'iac-rlhf-amazon',
      },
    });

    const encryptedVolumesRule = new config.ManagedRule(this, 'EncryptedVolumesRule', {
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
    });

    const s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    });

    // Inspector V2 - Enable scanning
    new inspector.CfnFilter(this, 'InspectorFilter', {
      name: `${props.environmentSuffix}-ec2-filter`,
      filterAction: 'NONE',
      filterCriteria: {
        resourceType: [
          {
            comparison: 'EQUALS',
            value: 'AWS_EC2_INSTANCE',
          },
        ],
      },
    });

    // Lambda function for CloudTrail log processing
    const logProcessorFunction = new NodejsFunction(this, 'CloudTrailLogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambdas/cloudtrail-processor.ts'),
      environment: {
        SNS_TOPIC_ARN: alertTopic.topicArn,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
    });

    alertTopic.grantPublish(logProcessorFunction);
    props.cloudTrailBucket.grantRead(logProcessorFunction);

    // Event rule for processing CloudTrail logs
    new events.Rule(this, 'CloudTrailProcessRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [props.cloudTrailBucket.bucketName],
          },
        },
      },
      targets: [new targets.LambdaFunction(logProcessorFunction)],
    });

    // Lambda function for unused access key cleanup
    const accessKeyCleanupFunction = new NodejsFunction(this, 'AccessKeyCleanup', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambdas/access-key-cleanup.ts'),
      environment: {
        MAX_KEY_AGE_DAYS: '90',
        SNS_TOPIC_ARN: alertTopic.topicArn,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
    });

    accessKeyCleanupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:ListUsers',
          'iam:ListAccessKeys',
          'iam:GetAccessKeyLastUsed',
          'iam:DeleteAccessKey',
        ],
        resources: ['*'],
      })
    );

    alertTopic.grantPublish(accessKeyCleanupFunction);

    // Schedule access key cleanup weekly
    new events.Rule(this, 'AccessKeyCleanupSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(7)),
      targets: [new targets.LambdaFunction(accessKeyCleanupFunction)],
    });

    // Lambda function for cost monitoring
    const costMonitorFunction = new NodejsFunction(this, 'CostMonitor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambdas/cost-monitor.ts'),
      environment: {
        SNS_TOPIC_ARN: alertTopic.topicArn,
        THRESHOLD_PERCENTAGE: '20',
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
    });

    costMonitorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ce:GetCostAndUsage', 'ce:GetCostForecast'],
        resources: ['*'],
      })
    );

    alertTopic.grantPublish(costMonitorFunction);

    // Schedule cost monitoring daily
    new events.Rule(this, 'CostMonitorSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new targets.LambdaFunction(costMonitorFunction)],
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `${props.environmentSuffix}-security-dashboard`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# ${props.environmentSuffix} Security Dashboard`,
            width: 24,
            height: 2,
          }),
        ],
        [
          new cloudwatch.LogQueryWidget({
            title: 'Failed Login Attempts',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, userIdentity.userName, errorCode, errorMessage',
              '| filter errorCode = "UnauthorizedOperation" or errorCode = "AccessDenied"',
              '| stats count() by userIdentity.userName',
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.LogQueryWidget({
            title: 'Root Account Usage',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, eventName, userAgent',
              '| filter userIdentity.type = "Root"',
              '| sort @timestamp desc',
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });
  }
}
```

Now, let me create the Lambda function implementations:

## Lambda Function 1 - CloudTrail Log Processor
`lib/lambdas/cloudtrail-processor.ts`

```typescript
import { S3Event } from 'aws-lambda';
import { S3, SNS } from 'aws-sdk';
import * as zlib from 'zlib';

const s3 = new S3();
const sns = new SNS();

interface CloudTrailRecord {
  eventTime: string;
  eventName: string;
  awsRegion: string;
  userIdentity: {
    type: string;
    principalId?: string;
    arn?: string;
    accountId?: string;
    userName?: string;
  };
  errorCode?: string;
  errorMessage?: string;
}

const SUSPICIOUS_EVENTS = [
  'DeleteTrail',
  'StopLogging',
  'DeleteFlowLogs',
  'DeleteDetector',
  'DisableEbsEncryptionByDefault',
  'DeleteDBInstance',
  'ModifyDBInstance',
  'CreateAccessKey',
  'CreateUser',
  'AttachUserPolicy',
  'PutBucketPolicy',
  'PutBucketAcl',
  'CreateNetworkAclEntry',
  'AuthorizeSecurityGroupIngress',
];

export const handler = async (event: S3Event): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      // Get the CloudTrail log file from S3
      const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
      
      // Decompress the log file
      const unzipped = await new Promise<Buffer>((resolve, reject) => {
        zlib.gunzip(obj.Body as Buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const logData = JSON.parse(unzipped.toString());
      const records: CloudTrailRecord[] = logData.Records;

      for (const logRecord of records) {
        // Check for root account usage
        if (logRecord.userIdentity.type === 'Root') {
          await sns.publish({
            TopicArn: snsTopicArn,
            Subject: 'CRITICAL: Root Account Usage Detected',
            Message: JSON.stringify({
              severity: 'CRITICAL',
              eventTime: logRecord.eventTime,
              eventName: logRecord.eventName,
              region: logRecord.awsRegion,
              userIdentity: logRecord.userIdentity,
            }, null, 2),
          }).promise();
        }

        // Check for suspicious events
        if (SUSPICIOUS_EVENTS.includes(logRecord.eventName)) {
          await sns.publish({
            TopicArn: snsTopicArn,
            Subject: `Security Alert: Suspicious Activity - ${logRecord.eventName}`,
            Message: JSON.stringify({
              severity: 'HIGH',
              eventTime: logRecord.eventTime,
              eventName: logRecord.eventName,
              region: logRecord.awsRegion,
              userIdentity: logRecord.userIdentity,
              errorCode: logRecord.errorCode,
            }, null, 2),
          }).promise();
        }

        // Check for repeated failed authentication attempts
        if (logRecord.errorCode === 'UnauthorizedOperation' || 
            logRecord.errorCode === 'AccessDenied') {
          // In production, you'd want to aggregate these and only alert on patterns
          console.log(`Failed authentication attempt: ${JSON.stringify(logRecord)}`);
        }
      }
    } catch (error) {
      console.error(`Error processing CloudTrail log ${key}:`, error);
      
      await sns.publish({
        TopicArn: snsTopicArn,
        Subject: 'Error: CloudTrail Log Processing Failed',
        Message: JSON.stringify({
          severity: 'ERROR',
          bucket,
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, null, 2),
      }).promise();
    }
  }
};
```

## Lambda Function 2 - Access Key Cleanup
`lib/lambdas/access-key-cleanup.ts`

```typescript
import { IAM, SNS } from 'aws-sdk';

const iam = new IAM();
const sns = new SNS();

interface AccessKeyInfo {
  userName: string;
  accessKeyId: string;
  createdDate: Date;
  lastUsedDate?: Date;
  ageInDays: number;
  lastUsedDays?: number;
}

export const handler = async (): Promise<void> => {
  const maxKeyAgeDays = parseInt(process.env.MAX_KEY_AGE_DAYS || '90');
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  
  const now = new Date();
  const keysToDelete: AccessKeyInfo[] = [];
  const keysToWarn: AccessKeyInfo[] = [];

  try {
    // List all IAM users
    const usersResponse = await iam.listUsers().promise();
    
    for (const user of usersResponse.Users) {
      // List access keys for each user
      const keysResponse = await iam.listAccessKeys({
        UserName: user.UserName!,
      }).promise();
      
      for (const keyMetadata of keysResponse.AccessKeyMetadata) {
        const createdDate = keyMetadata.CreateDate!;
        const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get last used information
        const lastUsedResponse = await iam.getAccessKeyLastUsed({
          AccessKeyId: keyMetadata.AccessKeyId!,
        }).promise();
        
        const lastUsedDate = lastUsedResponse.AccessKeyLastUsed?.LastUsedDate;
        const lastUsedDays = lastUsedDate 
          ? Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24))
          : undefined;
        
        const keyInfo: AccessKeyInfo = {
          userName: user.UserName!,
          accessKeyId: keyMetadata.AccessKeyId!,
          createdDate,
          lastUsedDate,
          ageInDays,
          lastUsedDays,
        };
        
        // If key is old and hasn't been used recently
        if (ageInDays > maxKeyAgeDays) {
          if (!lastUsedDate || lastUsedDays! > maxKeyAgeDays) {
            keysToDelete.push(keyInfo);
          } else {
            keysToWarn.push(keyInfo);
          }
        }
      }
    }
    
    // Send warnings for old but recently used keys
    if (keysToWarn.length > 0) {
      await sns.publish({
        TopicArn: snsTopicArn,
        Subject: 'Warning: Old Access Keys Still In Use',
        Message: JSON.stringify({
          severity: 'WARNING',
          message: `Found ${keysToWarn.length} access keys older than ${maxKeyAgeDays} days that are still being used`,
          keys: keysToWarn.map(k => ({
            userName: k.userName,
            accessKeyId: k.accessKeyId,
            ageInDays: k.ageInDays,
            lastUsedDays: k.lastUsedDays,
          })),
        }, null, 2),
      }).promise();
    }
    
    // Delete old unused keys
    for (const keyInfo of keysToDelete) {
      await iam.deleteAccessKey({
        UserName: keyInfo.userName,
        AccessKeyId: keyInfo.accessKeyId,
      }).promise();
    }
    
    if (keysToDelete.length > 0) {
      await sns.publish({
        TopicArn: snsTopicArn,
        Subject: 'Info: Old Access Keys Deleted',
        Message: JSON.stringify({
          severity: 'INFO',
          message: `Deleted ${keysToDelete.length} unused access keys older than ${maxKeyAgeDays} days`,
          keys: keysToDelete.map(k => ({
            userName: k.userName,
            accessKeyId: k.accessKeyId,
            ageInDays: k.ageInDays,
            lastUsedDays: k.lastUsedDays,
          })),
        }, null, 2),
      }).promise();
    }
    
  } catch (error) {
    console.error('Error in access key cleanup:', error);
    
    await sns.publish({
      TopicArn: snsTopicArn,
      Subject: 'Error: Access Key Cleanup Failed',
      Message: JSON.stringify({
        severity: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2),
    }).promise();
    
    throw error;
  }
};
```

## Lambda Function 3 - Cost Monitor
`lib/lambdas/cost-monitor.ts`

```typescript
import { CostExplorer, SNS } from 'aws-sdk';

const ce = new CostExplorer();
const sns = new SNS();

interface CostData {
  date: string;
  amount: number;
  unit: string;
}

export const handler = async (): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const thresholdPercentage = parseInt(process.env.THRESHOLD_PERCENTAGE || '20');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  try {
    // Get current week costs
    const currentWeekResponse = await ce.getCostAndUsage({
      TimePeriod: {
        Start: lastWeek.toISOString().split('T')[0],
        End: today.toISOString().split('T')[0],
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{
        Type: 'DIMENSION',
        Key: 'SERVICE',
      }],
    }).promise();
    
    // Get previous week costs for comparison
    const previousWeekResponse = await ce.getCostAndUsage({
      TimePeriod: {
        Start: twoWeeksAgo.toISOString().split('T')[0],
        End: lastWeek.toISOString().split('T')[0],
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{
        Type: 'DIMENSION',
        Key: 'SERVICE',
      }],
    }).promise();
    
    // Calculate totals
    let currentWeekTotal = 0;
    let previousWeekTotal = 0;
    const serviceBreakdown: Record<string, { current: number; previous: number }> = {};
    
    // Process current week
    currentWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        currentWeekTotal += amount;
        
        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].current += amount;
      });
    });
    
    // Process previous week
    previousWeekResponse.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const service = group.Keys![0];
        const amount = parseFloat(group.Metrics!.UnblendedCost.Amount!);
        previousWeekTotal += amount;
        
        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { current: 0, previous: 0 };
        }
        serviceBreakdown[service].previous += amount;
      });
    });
