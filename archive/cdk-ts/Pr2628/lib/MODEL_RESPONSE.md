I'll help you create a comprehensive, security-focused AWS infrastructure using AWS CDK with TypeScript. Here's the updated `lib/tap-stack.ts` file that includes all the required security components:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

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

    // Get allowed IP ranges from context or use default restrictive range
    const allowedIpRanges = this.node.tryGetContext('allowedIpRanges') || ['10.0.0.0/8'];
    
    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Purpose: 'security-infrastructure',
      Project: 'tap-security',
      ManagedBy: 'cdk',
      CostCenter: 'security-ops'
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Purpose', 'security-infrastructure');
    cdk.Tags.of(this).add('Project', 'tap-security');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');

    // 1. KMS Keys for Data Encryption
    const s3KmsKey = new kms.Key(this, `S3KmsKey-${environmentSuffix}`, {
      alias: `tap-s3-key-${environmentSuffix}`,
      description: `KMS key for S3 bucket encryption in ${environmentSuffix} environment`,
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
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey'
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    const ebsKmsKey = new kms.Key(this, `EbsKmsKey-${environmentSuffix}`, {
      alias: `tap-ebs-key-${environmentSuffix}`,
      description: `KMS key for EBS volume encryption in ${environmentSuffix} environment`,
      enableKeyRotation: true,
    });

    // Store KMS key ARNs in Parameter Store for reference
    new ssm.StringParameter(this, `S3KmsKeyParam-${environmentSuffix}`, {
      parameterName: `/tap/${environmentSuffix}/kms/s3-key-arn`,
      stringValue: s3KmsKey.keyArn,
      description: 'S3 KMS Key ARN for encryption',
    });

    new ssm.StringParameter(this, `EbsKmsKeyParam-${environmentSuffix}`, {
      parameterName: `/tap/${environmentSuffix}/kms/ebs-key-arn`,
      stringValue: ebsKmsKey.keyArn,
      description: 'EBS KMS Key ARN for encryption',
    });

    // 2. VPC and Network Security
    const vpc = new ec2.Vpc(this, `SecureVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        cloudWatchLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, `VpcFlowLogsGroup-${environmentSuffix}`, {
              logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_MONTH,
              encryptionKey: new kms.Key(this, `VpcLogsKmsKey-${environmentSuffix}`, {
                alias: `tap-vpc-logs-key-${environmentSuffix}`,
                description: `KMS key for VPC Flow Logs encryption in ${environmentSuffix} environment`,
                enableKeyRotation: true,
              }),
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Security Groups with restrictive rules
    const webSecurityGroup = new ec2.SecurityGroup(this, `WebSecurityGroup-${environmentSuffix}`, {
      vpc,
      description: 'Security group for web servers with restricted access',
      allowAllOutbound: false,
    });

    // Only allow HTTPS from specified IP ranges
    allowedIpRanges.forEach((cidr, index) => {
      webSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `Allow HTTPS from trusted range ${index + 1}`
      );
    });

    // Allow outbound HTTPS for updates and API calls
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    // Database security group - only accessible from web tier
    const dbSecurityGroup = new ec2.SecurityGroup(this, `DbSecurityGroup-${environmentSuffix}`, {
      vpc,
      description: 'Security group for database servers',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web tier'
    );

    // 3. IAM Roles and Policies with MFA Requirements
    const mfaCondition = {
      Bool: {
        'aws:MultiFactorAuthPresent': 'true',
      },
      NumericLessThan: {
        'aws:MultiFactorAuthAge': '3600', // 1 hour
      },
    };

    // EC2 Instance Role with minimal permissions
    const ec2Role = new iam.Role(this, `Ec2InstanceRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [`arn:aws:s3:::tap-secure-bucket-${environmentSuffix}/*`],
              conditions: {
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            }),
          ],
        }),
        KMSAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [s3KmsKey.keyArn, ebsKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Admin role requiring MFA
    const adminRole = new iam.Role(this, `AdminRole-${environmentSuffix}`, {
      assumedBy: new iam.AccountRootPrincipal(),
      description: 'Administrative role requiring MFA authentication',
      inlinePolicies: {
        AdminPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['*'],
              resources: ['*'],
              conditions: mfaCondition,
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.DENY,
              actions: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                'kms:ScheduleKeyDeletion',
                's3:DeleteBucket',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // 4. S3 Buckets with Security Best Practices
    const secureBucket = new s3.Bucket(this, `SecureBucket-${environmentSuffix}`, {
      bucketName: `tap-secure-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryptionKey: s3KmsKey,
      encryption: s3.BucketEncryption.KMS,
      bucketKeyEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-incomplete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      notificationsHandlerRole: iam.Role.fromRoleArn(
        this,
        'BucketNotificationsHandlerRole',
        `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-*-cfn-exec-role-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`
      ),
    });

    // CloudTrail S3 bucket
    const cloudTrailBucket = new s3.Bucket(this, `CloudTrailBucket-${environmentSuffix}`, {
      bucketName: `tap-cloudtrail-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryptionKey: s3KmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // 5. CloudTrail for API Logging
    const cloudTrail = new cloudtrail.Trail(this, `SecurityTrail-${environmentSuffix}`, {
      trailName: `tap-security-trail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: s3KmsKey,
      cloudWatchLogsGroup: new logs.LogGroup(this, `CloudTrailLogsGroup-${environmentSuffix}`, {
        logGroupName: `/aws/cloudtrail/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: new kms.Key(this, `CloudTrailLogsKmsKey-${environmentSuffix}`, {
          alias: `tap-cloudtrail-logs-key-${environmentSuffix}`,
          description: `KMS key for CloudTrail logs encryption in ${environmentSuffix} environment`,
          enableKeyRotation: true,
        }),
      }),
      sendToCloudWatchLogs: true,
    });

    // 6. CloudWatch Alarms for Security Monitoring
    const securityMetricFilter = new logs.MetricFilter(this, `SecurityMetricFilter-${environmentSuffix}`, {
      logGroup: cloudTrail.logGroup!,
      metricNamespace: 'Security/Events',
      metricName: 'UnauthorizedAccess',
      filterPattern: logs.FilterPattern.anyTerm(
        'ERROR',
        'Failed',
        'Unauthorized',
        'AccessDenied',
        'Forbidden'
      ),
      metricValue: '1',
    });

    // Alarm for unauthorized access attempts
    new cloudwatch.Alarm(this, `UnauthorizedAccessAlarm-${environmentSuffix}`, {
      alarmName: `tap-unauthorized-access-${environmentSuffix}`,
      alarmDescription: 'Alarm for unauthorized access attempts',
      metric: securityMetricFilter.metric({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Root account usage alarm
    const rootUsageMetricFilter = new logs.MetricFilter(this, `RootUsageMetricFilter-${environmentSuffix}`, {
      logGroup: cloudTrail.logGroup!,
      metricNamespace: 'Security/Events',
      metricName: 'RootAccountUsage',
      filterPattern: logs.FilterPattern.all(
        logs.FilterPattern.stringValue('$.userIdentity.type', '=', 'Root'),
        logs.FilterPattern.stringValue('$.userIdentity.invokedBy', 'NOT_EXISTS')
      ),
      metricValue: '1',
    });

    new cloudwatch.Alarm(this, `RootAccountUsageAlarm-${environmentSuffix}`, {
      alarmName: `tap-root-account-usage-${environmentSuffix}`,
      alarmDescription: 'Alarm for root account usage',
      metric: rootUsageMetricFilter.metric({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Configuration changes alarm
    const configChangesMetricFilter = new logs.MetricFilter(this, `ConfigChangesMetricFilter-${environmentSuffix}`, {
      logGroup: cloudTrail.logGroup!,
      metricNamespace: 'Security/Events',
      metricName: 'ConfigurationChanges',
      filterPattern: logs.FilterPattern.anyTerm(
        'CreateUser',
        'DeleteUser',
        'CreateRole',
        'DeleteRole',
        'AttachUserPolicy',
        'DetachUserPolicy',
        'CreateSecurityGroup',
        'DeleteSecurityGroup',
        'AuthorizeSecurityGroupIngress',
        'RevokeSecurityGroupIngress'
      ),
      metricValue: '1',
    });

    new cloudwatch.Alarm(this, `ConfigurationChangesAlarm-${environmentSuffix}`, {
      alarmName: `tap-configuration-changes-${environmentSuffix}`,
      alarmDescription: 'Alarm for critical configuration changes',
      metric: configChangesMetricFilter.metric({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 7. Output important resource information
    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3BucketName-${environmentSuffix}`, {
      value: secureBucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `tap-s3-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3KmsKeyId-${environmentSuffix}`, {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID for S3 encryption',
      exportName: `tap-s3-kms-key-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `Ec2RoleArn-${environmentSuffix}`, {
      value: ec2Role.roleArn,
      description: 'ARN of the EC2 instance role',
      exportName: `tap-ec2-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebSecurityGroupId-${environmentSuffix}`, {
      value: webSecurityGroup.securityGroupId,
      description: 'Security Group ID for web servers',
      exportName: `tap-web-sg-id-${environmentSuffix}`,
    });

    // Apply common tags to all constructs
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
```

## Key Security Features Implemented

### 1. **IAM Security**
- **MFA Enforcement**: Admin roles require MFA with time-based conditions
- **Least Privilege**: EC2 roles have minimal required permissions
- **Service-Specific Policies**: Separate policies for different services

### 2. **Network Security**
- **VPC Isolation**: All resources deployed in a private VPC
- **Security Groups**: Restrictive rules allowing only necessary traffic
- **Network Segmentation**: Separate subnets for different tiers
- **VPC Flow Logs**: Network traffic monitoring enabled

### 3. **Data Encryption**
- **Separate KMS Keys**: Individual keys for S3, EBS, and logs
- **Key Rotation**: Automatic key rotation enabled
- **Encryption at Rest**: All storage services encrypted
- **Encryption in Transit**: SSL/TLS enforcement

### 4. **S3 Security**
- **Block Public Access**: All public access blocked
- **Versioning**: Enabled for data protection
- **KMS Encryption**: Server-side encryption with customer-managed keys
- **SSL Enforcement**: HTTPS-only access
- **Lifecycle Policies**: Automated data management

### 5. **Monitoring & Alerting**
- **CloudTrail**: Comprehensive API logging
- **CloudWatch Alarms**: Real-time security event monitoring
- **Metric Filters**: Custom security event detection
- **Log Retention**: Appropriate retention periods for compliance

### 6. **Best Practices**
- **No Hard-coded Secrets**: Uses Parameter Store for configuration
- **Proper Tagging**: Comprehensive tagging strategy
- **Resource Naming**: Consistent naming conventions
- **Environment Separation**: Environment-specific resources

## Usage Instructions

1. **Deploy the stack**:
   ```bash
   cdk deploy --context environmentSuffix=prod --context allowedIpRanges=["203.0.113.0/24","198.51.100.0/24"]
   ```

2. **Set allowed IP ranges** via context:
   ```json
   {
     "allowedIpRanges": ["your.office.ip.range/24", "your.home.ip.range/32"]
   }
   ```

3. **Monitor security events** through CloudWatch alarms and dashboards

This implementation provides a production-ready, secure AWS infrastructure that follows security best practices and compliance requirements. All resources are properly encrypted, monitored, and configured with least-privilege access controls.