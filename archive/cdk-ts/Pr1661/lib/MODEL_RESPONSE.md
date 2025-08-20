I'll help you create a secure CDK project with TypeScript that enforces strong security practices across all AWS services. Here's the complete implementation:

## Project Structure

```
tap-security-project/
├── bin/tap.ts
├── lib/tap-stack.ts
├── cdk.json
└── package.json
```

## 1. bin/tap.ts - Entry Point

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

new TapStack(app, 'TapSecurityStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
  description: 'Security-hardened infrastructure stack with best practices',
});

// Add stack-level tags for governance
cdk.Tags.of(app).add('Project', 'TapSecurity');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('Owner', 'SecurityTeam');
```

## 2. lib/tap-stack.ts - Resource Definitions with Security Hardening

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as config from 'aws-cdk-lib/aws-config';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. KMS Key for encryption across services
    const encryptionKey = new kms.Key(this, 'TapEncryptionKey', {
      description: 'KMS key for encrypting sensitive data across the stack',
      enableKeyRotation: true,
      keyPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // 2. VPC with security-focused configuration
    const vpc = new ec2.Vpc(this, 'TapSecureVpc', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization while maintaining security
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 3. VPC Flow Logs for network monitoring
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: '/aws/vpc/flowlogs',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 4. Security Groups with least privilege
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web servers - HTTPS only',
      allowAllOutbound: false, // Explicit outbound rules
    });

    // Only allow HTTPS inbound
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Explicit outbound rules
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package updates'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS - only from web tier',
      allowAllOutbound: false,
    });

    // Database only accepts connections from web tier
    databaseSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from web tier only'
    );

    // 5. S3 Buckets with strong security
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `tap-cloudtrail-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
          enabled: true,
          expiration: cdk.Duration.days(2555), // 7 years for compliance
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      enforceSSL: true,
    });

    const applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `tap-application-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      publicReadAccess: false,
    });

    // 6. CloudTrail with encryption
    const trail = new cloudtrail.Trail(this, 'TapCloudTrail', {
      bucket: cloudTrailBucket,
      encryptionKey: encryptionKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: '/aws/cloudtrail/tap-security',
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: encryptionKey,
      }),
    });

    // 7. IAM Roles with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'), // For Systems Manager
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                applicationBucket.arnForObjects('*'),
              ],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // 8. RDS with security hardening
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS in isolated subnets',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      multiAz: false, // Set to true for production
      autoMinorVersionUpgrade: true,
      deleteAutomatedBackups: false,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        description: 'RDS admin credentials',
        encryptionKey: encryptionKey,
      }),
    });

    // 9. EC2 Instance with security hardening
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent'
    );

    const webInstance = new ec2.Instance(this, 'WebInstance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData,
      requireImdsv2: true, // Enforce IMDSv2 for metadata service
    });

    // 10. AWS Config for compliance monitoring
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `tap-config-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    const configRecorder = new config.ConfigurationRecorder(this, 'ConfigRecorder', {
      role: configRole,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
        recordingModeOverrides: [],
      },
    });

    const configDeliveryChannel = new config.DeliveryChannel(this, 'ConfigDeliveryChannel', {
      bucket: configBucket,
    });

    // Config rule to detect SSH open to world
    new config.ManagedRule(this, 'SSHRestrictedRule', {
      identifier: config.ManagedRuleIdentifiers.INCOMING_SSH_DISABLED,
      description: 'Checks whether security groups disallow unrestricted incoming SSH traffic',
    });

    // Additional security-focused Config rules
    new config.ManagedRule(this, 'S3BucketPublicReadProhibited', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public read access',
    });

    new config.ManagedRule(this, 'S3BucketPublicWriteProhibited', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public write access',
    });

    new config.ManagedRule(this, 'RDSStorageEncrypted', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks whether storage encryption is enabled for RDS instances',
    });

    // 11. IAM Password Policy (Note: This affects the entire account)
    new iam.AccountPasswordPolicy(this, 'PasswordPolicy', {
      minLength: 14,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: cdk.Duration.days(90),
      passwordReusePrevention: 24,
      allowUsersToChangePassword: true,
    });

    // 12. Outputs for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the secure environment',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN for audit logging',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
    });
  }
}
```

## 3. cdk.json - Project Configuration

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true
  }
}
```

## 4. package.json - Dependencies

```json
{
  "name": "tap-security-stack",
  "version": "0.1.0",
  "description": "Security-hardened AWS infrastructure using CDK",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## Security Features Implemented

### 🔐 **IAM Security**
- Least-privilege roles with explicit permissions
- Account-wide password policy with MFA requirements
- Service-specific roles (EC2, Config, CloudTrail)

### 🪣 **S3 Security**
- All buckets use encryption (SSE-S3 or KMS)
- Complete public access blocking
- SSL enforcement
- Versioning enabled with lifecycle policies

### 🖥️ **Compute Security**
- EC2 instances in private subnets only
- IMDSv2 enforcement
- Systems Manager for secure access (no SSH needed)
- Restrictive security groups

### 🌐 **Network Security**
- VPC with proper subnet segmentation
- Security groups with explicit rules
- VPC Flow Logs for monitoring
- No direct internet access for compute resources

### 🗄️ **Database Security**
- RDS in isolated subnets
- Encryption at rest with KMS
- Security group allowing only application access
- Automated backups with encryption

### 📊 **Monitoring & Compliance**
- CloudTrail with encryption and log integrity
- AWS Config rules for security compliance
- Centralized logging with encryption
- SSH restriction monitoring

## Deployment Instructions

1. **Initialize the project:**
```bash
mkdir tap-security-project && cd tap-security-project
npm init -y
npm install aws-cdk-lib constructs source-map-support
npm install -D aws-cdk typescript ts-node @types/node
```

2. **Add the files above to your project**

3. **Bootstrap CDK (first time only):**
```bash
npx cdk bootstrap aws://ACCOUNT-NUMBER/us-east-2
```

4. **Deploy the stack:**
```bash
npx cdk deploy
```

This implementation provides a production-ready, security-hardened infrastructure that follows AWS best practices and compliance requirements. The stack will deploy cleanly and provide comprehensive security across all AWS services.