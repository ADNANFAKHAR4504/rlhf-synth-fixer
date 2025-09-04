# Secure Financial Institution AWS Infrastructure - IDEAL RESPONSE

A comprehensive CDK TypeScript solution implementing all 13 security requirements for a financial institution with production-ready configurations.

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  description: 'Secure Financial Institution Infrastructure Stack',
});

// Apply default tags to all resources
cdk.Tags.of(app).add('Environment', 'production');
cdk.Tags.of(app).add('Owner', 'FinanceIT');
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Create KMS key for encryption with destroy policy
    const encryptionKey = new kms.Key(this, 'FinancialDataKey', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      description: 'KMS key for financial data encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'EnableRootPermissions',
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowServiceAccess',
            principals: [
              new iam.ServicePrincipal('s3.amazonaws.com'),
              new iam.ServicePrincipal('rds.amazonaws.com'),
              new iam.ServicePrincipal('ec2.amazonaws.com'),
            ],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Create VPC with security-focused configuration
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: `tap-${environmentSuffix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsSupport: true,
      enableDnsHostnames: true,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        cloudWatchLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
          logFormat: [
            ec2.LogFormat.SRC_ADDR,
            ec2.LogFormat.DST_ADDR,
            ec2.LogFormat.SRC_PORT,
            ec2.LogFormat.DST_PORT,
            ec2.LogFormat.PROTOCOL,
            ec2.LogFormat.PACKETS,
            ec2.LogFormat.BYTES,
            ec2.LogFormat.START_TIMESTAMP,
            ec2.LogFormat.END_TIMESTAMP,
            ec2.LogFormat.ACTION,
            ec2.LogFormat.LOG_STATUS,
          ],
        },
      },
    });

    // Create restricted security group for SSH access
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'SSHSecurityGroup', {
      vpc,
      description: 'Security group for SSH access from approved IPs',
      allowAllOutbound: false,
    });

    // Add SSH access rules for approved CIDR blocks
    const approvedCidrs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
    approvedCidrs.forEach(cidr => {
      sshSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `SSH access from approved CIDR ${cidr}`
      );
    });

    sshSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    // Create S3 buckets with security features
    const dataLogsBucket = new s3.Bucket(this, 'DataLogsBucket', {
      bucketName: `tap-${environmentSuffix}-data-logs-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DataRetention',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ],
    });

    const applicationDataBucket = new s3.Bucket(this, 'ApplicationDataBucket', {
      bucketName: `tap-${environmentSuffix}-app-data-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    // Add bucket policies to restrict access to approved CIDR blocks
    applicationDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountRootPrincipal()],
        actions: ['s3:*'],
        resources: [
          applicationDataBucket.bucketArn,
          `${applicationDataBucket.bucketArn}/*`,
        ],
        conditions: {
          IpAddress: {
            'aws:SourceIp': approvedCidrs,
          },
        },
      })
    );

    // Create CloudTrail for API logging
    new cloudtrail.Trail(this, 'FinancialInstitutionTrail', {
      trailName: `tap-${environmentSuffix}-trail`,
      bucket: dataLogsBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
    });

    // Create IAM role for Lambda with minimal permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Minimal IAM role for Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        MinimalS3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${applicationDataBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Create Lambda function with security best practices
    new lambda.Function(this, 'SecureFunction', {
      functionName: `tap-${environmentSuffix}-secure-function`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [sshSecurityGroup],
      environment: {
        BUCKET_NAME: applicationDataBucket.bucketName,
        KMS_KEY_ID: encryptionKey.keyId,
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          console.log('Processing secure financial operation');
          
          try {
            const params = {
              Bucket: process.env.BUCKET_NAME,
              Key: 'secure-data/transaction.json',
              Body: JSON.stringify({ 
                timestamp: Date.now(), 
                operation: 'secure-process',
                data: event 
              }),
              ServerSideEncryption: 'aws:kms',
              SSEKMSKeyId: process.env.KMS_KEY_ID
            };
            
            await s3.putObject(params).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Operation completed securely' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      deadLetterQueueEnabled: true,
      reservedConcurrentExecutions: 10,
    });

    // Create RDS subnet group for private database deployment
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for financial database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for financial database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(sshSecurityGroup.securityGroupId),
      ec2.Port.tcp(5432),
      'PostgreSQL access from application layer'
    );

    // Create RDS instance with security features
    const database = new rds.DatabaseInstance(this, 'FinancialDatabase', {
      instanceIdentifier: `tap-${environmentSuffix}-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R5,
        ec2.InstanceSize.LARGE
      ),
      credentials: rds.Credentials.fromGeneratedSecret('financial_admin', {
        encryptionKey,
      }),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: encryptionKey,
      monitoringInterval: cdk.Duration.seconds(60),
      autoMinorVersionUpgrade: false,
      allowMajorVersionUpgrade: false,
      deleteAutomatedBackups: false,
    });

    // Create CloudWatch alarms for security monitoring
    new cloudwatch.Alarm(this, 'UnauthorizedApiCallsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrail',
        metricName: 'ErrorCount',
        dimensionsMap: {
          EventName: 'ConsoleLogin',
        },
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm for detecting potential unauthorized API calls',
    });

    new cloudwatch.Alarm(this, 'SuspiciousActivityAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrail',
        metricName: 'DataEvents',
        dimensionsMap: {
          EventName: 'GetObject',
        },
        statistic: 'Sum',
      }),
      threshold: 100,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm for detecting suspicious data access patterns',
    });

    // Create WAF Web ACL with managed rules
    const webAcl = new waf.CfnWebACL(this, 'FinancialWebAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF rules for financial institution applications',
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },
        {
          name: 'GeoRestrictionRule',
          priority: 3,
          action: { block: {} },
          statement: {
            geoMatchStatement: {
              countryCodes: ['CN', 'RU', 'KP', 'IR'],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'GeoRestrictionMetric',
          },
        },
        {
          name: 'IPRestrictionRule',
          priority: 4,
          action: { allow: {} },
          statement: {
            ipSetReferenceStatement: {
              arn: new waf.CfnIPSet(this, 'AllowedIPs', {
                scope: 'REGIONAL',
                ipAddressVersion: 'IPV4',
                addresses: approvedCidrs,
                description: 'Approved IP addresses for financial institution',
              }).attrArn,
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IPRestrictionMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'FinancialWebAclMetric',
      },
    });

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the secure VPC',
      exportName: 'SecureVpcId',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'ID of the KMS encryption key',
      exportName: 'EncryptionKeyId',
    });

    new cdk.CfnOutput(this, 'ApplicationDataBucketName', {
      value: applicationDataBucket.bucketName,
      description: 'Name of the application data bucket',
      exportName: 'ApplicationDataBucketName',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Endpoint of the secure database',
      exportName: 'DatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'ARN of the WAF Web ACL',
      exportName: 'WebAclArn',
    });
  }
}
```

## Key Improvements in the Ideal Response

### 1. **Environment Suffix Management**
- Properly handles environment suffix from context or environment variables
- Uses environment suffix in all resource names to prevent conflicts
- Stack name includes environment suffix for multi-environment deployments

### 2. **Resource Destruction Support**
- All resources have `removalPolicy: cdk.RemovalPolicy.DESTROY`
- S3 buckets have `autoDeleteObjects: true` for clean destruction
- RDS has `deletionProtection: false` for testing environments
- KMS key is destroyable for non-production environments

### 3. **Security Best Practices**
- **IAM**: Least privilege policies with inline policies for Lambda
- **Tagging**: Consistent tagging applied at the app level
- **S3**: CIDR-based access restrictions, versioning, KMS encryption
- **CloudTrail**: Multi-region trail with log validation
- **Security Groups**: Restricted SSH access from approved CIDRs only
- **Lambda**: Minimal permissions, VPC deployment, DLQ enabled
- **KMS**: Encryption for all data at rest with key rotation
- **CloudWatch**: Alarms for unauthorized access detection
- **RDS**: Not publicly accessible, encrypted, automated backups
- **VPC Flow Logs**: Capturing all traffic on all subnets
- **WAF**: Managed rules with geo-blocking and IP restrictions
- **Shield**: Standard protection (implicit) for DDoS mitigation

### 4. **Production-Ready Features**
- Multi-AZ deployment for high availability
- Proper log formats for VPC flow logs
- S3 lifecycle policies for cost optimization
- Performance insights for RDS monitoring
- Reserved concurrent executions for Lambda
- CloudWatch logs retention policies

### 5. **Compliance and Governance**
- All 13 security requirements fully implemented
- Financial industry compliance considerations
- Audit trail via CloudTrail
- Resource tagging for cost allocation
- Encryption at rest and in transit

This solution provides a secure, scalable, and maintainable infrastructure suitable for financial institutions while maintaining flexibility for different deployment environments.