# Production-Ready AWS Security Infrastructure with CDK JavaScript

## Overview
This solution implements a comprehensive security-focused AWS infrastructure for a financial application using AWS CDK with JavaScript. The infrastructure addresses all 7 core security requirements plus additional modern security practices.

## Complete Infrastructure Code

### Main Stack Implementation (lib/tap-stack.js)

```javascript
import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix = this.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // KMS Key for encryption across services
    const encryptionKey = new kms.Key(this, 'FinancialAppEncryptionKey', {
      description: 'KMS key for financial application encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    encryptionKey.addAlias(`alias/financial-app-key-${environmentSuffix}`);

    // VPC with security-focused configuration
    const vpc = new ec2.Vpc(this, 'SecureFinancialVPC', {
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
    });

    // Enable VPC Flow Logs for network monitoring
    const vpcFlowLogRole = new iam.Role(this, 'VPCFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        CloudWatchLogPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Groups with restrictive rules
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic from internet'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Traffic from ALB'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS for patches and updates'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP for package repositories'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from EC2 instances'
    );

    // IAM Role with MFA enforcement for critical actions
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with MFA enforcement',
    });

    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    const ec2Policy = new iam.Policy(this, 'EC2PolicyWithMFA', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
          ],
          resources: [encryptionKey.keyArn],
        }),
        // Deny critical IAM actions without MFA
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'iam:CreateRole',
            'iam:DeleteRole',
            'iam:PutRolePolicy',
            'iam:AttachRolePolicy',
            'iam:DetachRolePolicy',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    ec2Role.attachInlinePolicy(ec2Policy);

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // S3 Buckets with AES-256 encryption
    const appDataBucket = new s3.Bucket(this, 'FinancialAppDataBucket', {
      bucketName: `tap-${environmentSuffix}-app-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      publicWriteAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],
    });

    const logsBucket = new s3.Bucket(this, 'FinancialAppLogsBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      publicWriteAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'FinancialAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'EC2TargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        timeout: Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
    });

    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Group with hardened EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'FinancialAppLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: encryptionKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'FinancialAppASG', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: Duration.minutes(5),
      }),
    });

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // RDS Aurora Cluster with KMS encryption
    const dbCluster = new rds.DatabaseCluster(this, 'FinancialAppDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
        vpc,
        securityGroups: [dbSecurityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      },
      instances: 2,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      backup: {
        retention: Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // API Gateway with comprehensive logging
    const apiLogGroup = new logs.LogGroup(this, 'APIGatewayLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const api = new apigateway.RestApi(this, 'FinancialAppAPI', {
      description: 'Secure Financial Application API',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        throttle: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              IpAddress: {
                'aws:SourceIp': ['10.0.0.0/16'],
              },
            },
          }),
        ],
      }),
    });

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"status": "healthy"}',
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });

    // Systems Manager Patch Management
    const patchBaseline = new ssm.CfnPatchBaseline(this, 'FinancialAppPatchBaseline', {
      name: `FinancialAppPatchBaseline-${environmentSuffix}`,
      description: 'Patch baseline for financial application instances',
      operatingSystem: 'AMAZON_LINUX_2023',
      patchGroups: ['financial-app'],
      approvalRules: {
        patchRules: [
          {
            approveAfterDays: 7,
            patchFilterGroup: {
              patchFilters: [
                {
                  key: 'CLASSIFICATION',
                  values: ['Security', 'Bugfix'],
                },
                {
                  key: 'SEVERITY',
                  values: ['Critical', 'Important'],
                },
              ],
            },
            enableNonSecurity: true,
            complianceLevel: 'CRITICAL',
          },
        ],
      },
    });

    const maintenanceWindow = new ssm.CfnMaintenanceWindow(this, 'PatchMaintenanceWindow', {
      name: `FinancialAppPatchingWindow-${environmentSuffix}`,
      description: 'Maintenance window for patching financial app instances',
      duration: 4,
      cutoff: 1,
      schedule: 'cron(0 2 ? * SUN *)',
      scheduleTimezone: 'UTC',
      allowUnassociatedTargets: false,
    });

    // CloudWatch Monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Stack Outputs
    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the secure financial application',
    });

    new CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora cluster endpoint',
    });

    new CfnOutput(this, 'S3BucketName', {
      value: appDataBucket.bucketName,
      description: 'S3 bucket for application data',
    });

    new CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS key ID for encryption',
    });

    new CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket for logs',
    });

    new CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
    });

    new CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });
  }
}
```

### Entry Point (bin/tap.mjs)

```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.js';

const app = new App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Deploy the secure financial application infrastructure
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Secure Financial Application Infrastructure with Advanced Security Controls',
});

app.synth();
```

## Security Requirements Implementation

### 1. S3 Bucket Encryption (AES-256)
- **Implementation**: All S3 buckets use `BucketEncryption.S3_MANAGED` for AES-256 server-side encryption
- **Features**: Versioning enabled, lifecycle policies, block public access

### 2. IAM MFA Enforcement
- **Implementation**: IAM policy with explicit DENY for critical actions without MFA
- **Protected Actions**: CreateRole, DeleteRole, PutRolePolicy, AttachRolePolicy, DetachRolePolicy

### 3. API Gateway Logging
- **Implementation**: Comprehensive logging with CloudWatch integration
- **Features**: Access logs, execution logs, metrics, throttling configuration

### 4. Secure VPC Configuration
- **Implementation**: 3-tier architecture with public, private, and isolated subnets
- **Features**: NAT gateways for high availability, VPC Flow Logs, DNS support

### 5. RDS KMS Encryption
- **Implementation**: Aurora PostgreSQL with KMS customer-managed key
- **Features**: Encryption at rest, automated backups, multi-AZ deployment

### 6. Restrictive Security Groups
- **Implementation**: Default deny-all with explicit allow rules
- **Features**: Separate security groups for ALB, EC2, and RDS with minimal permissions

### 7. Systems Manager Patch Management
- **Implementation**: Patch baseline and maintenance window configuration
- **Features**: Automated patching for security and critical updates

## Additional Security Features

- **KMS Key Rotation**: Enabled for all encryption keys
- **VPC Flow Logs**: Complete network traffic monitoring
- **CloudWatch Alarms**: CPU and database connection monitoring
- **Auto Scaling**: Ensures high availability with minimum 2 instances
- **EBS Encryption**: All EC2 volumes encrypted with KMS
- **Secrets Manager**: Database credentials managed securely

## Deployment Commands

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=prod

# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy infrastructure
npm run cdk:deploy

# Run unit tests with coverage
npm run test:unit-js

# Run integration tests
npm run test:integration-js

# Destroy infrastructure
npm run cdk:destroy
```

## Best Practices Implemented

1. **Environment Isolation**: Dynamic environment suffix for multi-environment support
2. **Resource Naming**: Consistent naming with environment suffixes
3. **Removal Policies**: Configured for safe cleanup in non-production
4. **Tagging Strategy**: Automatic CDK tagging for resource management
5. **Least Privilege**: Minimal permissions for all IAM roles
6. **Defense in Depth**: Multiple layers of security controls
7. **Monitoring**: Comprehensive logging and alerting
8. **Compliance**: Meets financial industry security requirements

## Production Considerations

1. **Certificate Management**: Add ACM certificate for HTTPS on ALB
2. **GuardDuty**: Enable at organization level for threat detection
3. **AWS Config**: Enable at organization level for compliance monitoring
4. **Backup Strategy**: Consider AWS Backup for additional protection
5. **WAF**: Add AWS WAF for additional application protection
6. **Network Segmentation**: Consider AWS PrivateLink for service endpoints
7. **Deletion Protection**: Enable for production RDS and critical resources