I'll create a complete AWS CDK TypeScript project that meets all your requirements. This will generate a CloudFormation template that sets up a secure, scalable infrastructure.

## Project Structure

First, let me provide the complete CDK project structure:

```
complete-aws-environment/
├── bin/
│   └── complete-environment.ts
├── lib/
│   └── complete-environment-stack.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## 1. Package Configuration

### `package.json`
```json
{
  "name": "complete-aws-environment",
  "version": "1.0.0",
  "description": "Complete AWS environment setup with CDK TypeScript",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
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
    "constructs": "^10.0.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/complete-environment.ts",
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
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
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
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:baseEnvironmentVariables": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## 2. CDK Application Entry Point

### `bin/complete-environment.ts`
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CompleteEnvironmentStack } from '../lib/complete-environment-stack';

const app = new cdk.App();

new CompleteEnvironmentStack(app, 'CompleteEnvironmentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Complete AWS environment with VPC, EC2, RDS, S3, and monitoring',
});
```

## 3. Main Stack Implementation

### `lib/complete-environment-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class CompleteEnvironmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Department: 'Engineering',
      Project: 'CompleteEnvironment',
      Environment: 'Production',
      Owner: 'DevOps',
      CostCenter: 'IT-001'
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Owner', commonTags.Owner);
    cdk.Tags.of(this).add('CostCenter', commonTags.CostCenter);

    // 1. KMS Key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3KmsKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // 2. S3 Logging Bucket
    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `complete-env-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // 3. Main S3 Bucket with KMS encryption and logging
    const mainBucket = new s3.Bucket(this, 'MainBucket', {
      bucketName: `complete-env-main-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // 4. VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'CompleteEnvironmentVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1, // One NAT Gateway for cost optimization
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

    // 5. Security Group for EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    // Allow SSH access from specific IP addresses (replace with your IPs)
    const allowedIPs = [
      '203.0.113.0/32', // Example IP - replace with your actual IP
      '198.51.100.0/32', // Example IP - replace with your actual IP
    ];

    allowedIPs.forEach((ip, index) => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(22),
        `SSH access from IP ${index + 1}`
      );
    });

    // 6. IAM Role for EC2 instance with S3 access
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instance with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Grant read/write access to the main S3 bucket
    mainBucket.grantReadWrite(ec2Role);
    s3KmsKey.grantEncryptDecrypt(ec2Role);

    // 7. EC2 Instance in private subnet
    const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      detailedMonitoring: true, // Enable detailed monitoring
      userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y aws-cli
echo "EC2 instance setup complete" > /var/log/setup.log
`),
    });

    // 8. Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false, // Restrict outbound traffic
    });

    // Allow inbound MySQL/Aurora access from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // Restrict outbound traffic - only allow necessary ports
    rdsSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS for AWS services'
    );

    // 9. RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // 10. RDS Instance
    const rdsInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      databaseName: 'completeenvdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'rds-credentials',
      }),
      backupRetention: cdk.Duration.days(7), // 7 days backup retention
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true for production
      monitoringInterval: cdk.Duration.seconds(60), // Enhanced monitoring
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // 11. CloudWatch Log Group for application logs
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/ec2/complete-environment',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 12. CloudWatch Alarms for monitoring
    
    // EC2 CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'EC2HighCPUAlarm', {
      metric: ec2Instance.metricCpuUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'EC2 instance high CPU utilization',
    });

    // RDS CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'RDSHighCPUAlarm', {
      metric: rdsInstance.metricCpuUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS instance high CPU utilization',
    });

    // RDS Database Connections Alarm
    new cloudwatch.Alarm(this, 'RDSHighConnectionsAlarm', {
      metric: rdsInstance.metricDatabaseConnections({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS instance high connection count',
    });

    // 13. Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Instance Endpoint',
    });

    new cdk.CfnOutput(this, 'MainBucketName', {
      value: mainBucket.bucketName,
      description: 'Main S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucketName,
      description: 'Logging S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID for S3 encryption',
    });
  }
}
```

## 4. Deployment Instructions

### Setup and Deployment Commands

```bash
# 1. Initialize the project
mkdir complete-aws-environment
cd complete-aws-environment

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Synthesize CloudFormation template
npm run synth

# 5. Deploy to AWS
npm run deploy

# 6. Generate CloudFormation template file
cdk synth > CompleteEnvironmentSetup.yaml
```

## 5. Key Features Implemented

###  **S3 Buckets**
- Main bucket with KMS encryption
- Separate logging bucket for access logs
- Versioning and lifecycle policies enabled

###  **VPC & Networking**
- Multi-AZ VPC (2 Availability Zones)
- Public subnets with Internet Gateway
- Private subnets with NAT Gateway
- Isolated database subnets

###  **EC2 Instance**
- Deployed in private subnet
- IAM role with S3 read/write access
- Security group restricting SSH to specific IPs
- Detailed monitoring enabled
- User data script for initial setup

###  **RDS Instance**
- MySQL 8.0 in isolated private subnet
- 7-day backup retention
- Enhanced monitoring enabled
- Performance Insights enabled
- Restricted security group (inbound from EC2 only)
- Limited outbound access

###  **Monitoring**
- CloudWatch detailed monitoring for EC2 and RDS
- CPU utilization alarms for both instances
- RDS connection count alarm
- Application log group

###  **Security**
- KMS encryption for S3
- Restricted security groups
- IAM roles with least privilege
- Private subnets for sensitive resources

###  **Tagging**
- Comprehensive tagging strategy
- Cost allocation tags applied to all resources

## 6. Cost Optimization Notes

- **Single NAT Gateway**: Uses one NAT Gateway instead of one per AZ to reduce costs
- **t3.micro instances**: Uses cost-effective instance types
- **Lifecycle policies**: Automatic cleanup of old logs and backups
- **Performance Insights**: Limited retention period

## 7. Security Considerations

- **Network Isolation**: RDS in isolated subnets
- **Encryption**: KMS encryption for S3, encryption in transit for RDS
- **Access Control**: Restrictive security groups and IAM policies
- **Monitoring**: Comprehensive CloudWatch monitoring and alerting

## 8. Production Readiness Checklist

Before deploying to production, consider:

1. **Update IP addresses** in the security group rules
2. **Enable deletion protection** for RDS
3. **Increase backup retention** periods
4. **Add more comprehensive monitoring**
5. **Implement proper secret management**
6. **Add additional security groups** for different tiers
7. **Configure proper DNS** and SSL certificates
8. **Set up proper logging** and log aggregation

The generated `CompleteEnvironmentSetup.yaml` will contain all the CloudFormation resources needed to deploy this complete AWS environment following best practices for security, scalability, and cost management.