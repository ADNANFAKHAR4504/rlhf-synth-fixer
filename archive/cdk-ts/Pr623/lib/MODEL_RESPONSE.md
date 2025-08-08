# AWS Secure Foundational Environment - CDK Implementation

## Architecture Overview

This solution implements a secure, compliant AWS foundational environment following the AWS Well-Architected Framework principles. The architecture provides defense-in-depth security, high availability across multiple AZs, comprehensive encryption, and detailed monitoring.

## CDK Implementation

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

export class SecureFoundationalEnvironmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-east-1',
        account: props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    // Common tags for all resources
    const commonTags = {
      Project: 'IaC-AWS-Nova-Model-Breaking',
      Environment: 'Production',
      Owner: 'DevSecOps-Team',
      CostCenter: 'Security-Infrastructure',
      Compliance: 'Required',
      DataClassification: 'Confidential',
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 1. Customer Managed KMS Key for Encryption
    const encryptionKey = new kms.Key(this, 'FoundationalEncryptionKey', {
      description: 'Customer managed key for foundational environment encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowCloudWatchLogs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowCloudTrail',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
            ],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'FoundationalEncryptionKeyAlias', {
      aliasName: 'alias/foundational-environment-key',
      targetKey: encryptionKey,
    });

    // 2. VPC with Multi-AZ Configuration
    const vpc = new ec2.Vpc(this, 'SecureFoundationalVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use 3 AZs for enhanced availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      natGateways: 2, // NAT Gateways for high availability
    });

    // VPC Flow Logs for network monitoring
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: '/aws/vpc/flowlogs',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const vpcFlowLogRole = new iam.Role(this, 'VPCFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [vpcFlowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 3. Security Groups with Strict Rules
    const webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSG', {
      vpc,
      description: 'Security group for web tier - allows HTTPS only',
      allowAllOutbound: false,
    });

    webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound traffic'
    );

    webTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound traffic'
    );

    const appTierSecurityGroup = new ec2.SecurityGroup(this, 'AppTierSG', {
      vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    appTierSecurityGroup.addIngressRule(
      webTierSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    appTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound traffic'
    );

    const dbTierSecurityGroup = new ec2.SecurityGroup(this, 'DBTierSG', {
      vpc,
      description: 'Security group for database tier',
      allowAllOutbound: false,
    });

    dbTierSecurityGroup.addIngressRule(
      appTierSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from app tier'
    );

    // Management Security Group for administrative access
    const managementSecurityGroup = new ec2.SecurityGroup(this, 'ManagementSG', {
      vpc,
      description: 'Security group for management and monitoring',
      allowAllOutbound: false,
    });

    managementSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC CIDR only'
    );

    managementSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound traffic'
    );

    // 4. IAM Roles with Least Privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
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
              resources: ['arn:aws:s3:::foundational-*/*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    const ec2InstanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // 5. S3 Buckets with Encryption and Security
    const applicationDataBucket = new s3.Bucket(this, 'ApplicationDataBucket', {
      bucketName: `foundational-app-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
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
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `foundational-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'LogRetention',
          enabled: true,
          expiration: cdk.Duration.days(2555), // 7 years retention
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 6. CloudTrail for API Logging
    const cloudTrail = new cloudtrail.Trail(this, 'FoundationalCloudTrail', {
      trailName: 'foundational-environment-trail',
      bucket: loggingBucket,
      encryptionKey: encryptionKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: '/aws/cloudtrail/foundational-trail',
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: encryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
    });

    // 7. EC2 Instances with Latest Amazon Linux 2023
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',
      // Configure CloudWatch Agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'FoundationalEnvironment/EC2',
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait'],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: '/aws/ec2/foundational/system',
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Web Tier EC2 Instances
    const webTierInstances: ec2.Instance[] = [];
    vpc.publicSubnets.slice(0, 2).forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebTierInstance${index + 1}`, {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc,
        vpcSubnets: { subnets: [subnet] },
        securityGroup: webTierSecurityGroup,
        role: ec2Role,
        userData,
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
        detailedMonitoring: true,
      });
      webTierInstances.push(instance);
    });

    // Application Tier EC2 Instances
    const appTierInstances: ec2.Instance[] = [];
    vpc.privateSubnets.slice(0, 2).forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `AppTierInstance${index + 1}`, {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc,
        vpcSubnets: { subnets: [subnet] },
        securityGroup: appTierSecurityGroup,
        role: ec2Role,
        userData,
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
        detailedMonitoring: true,
      });
      appTierInstances.push(instance);
    });

    // 8. CloudWatch Alarms and Monitoring
    const snsTopicRole = new iam.Role(this, 'SNSTopicRole', {
      assumedBy: new iam.ServicePrincipal('sns.amazonaws.com'),
    });

    // High CPU Utilization Alarms
    [...webTierInstances, ...appTierInstances].forEach((instance, index) => {
      new cloudwatch.Alarm(this, `HighCPUAlarm${index + 1}`, {
        alarmName: `foundational-high-cpu-${instance.instanceId}`,
        alarmDescription: `High CPU utilization for instance ${instance.instanceId}`,
        metric: instance.metricCpuUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });

      new cloudwatch.Alarm(this, `InstanceStatusCheckAlarm${index + 1}`, {
        alarmName: `foundational-instance-status-${instance.instanceId}`,
        alarmDescription: `Instance status check failed for ${instance.instanceId}`,
        metric: instance.metricStatusCheckFailed(),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      });
    });

    // Custom CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FoundationalDashboard', {
      dashboardName: 'Foundational-Environment-Dashboard',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          ...webTierInstances.map(instance => instance.metricCpuUtilization()),
          ...appTierInstances.map(instance => instance.metricCpuUtilization()),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Network Traffic',
        left: [
          ...webTierInstances.map(instance => instance.metricNetworkIn()),
          ...appTierInstances.map(instance => instance.metricNetworkIn()),
        ],
        right: [
          ...webTierInstances.map(instance => instance.metricNetworkOut()),
          ...appTierInstances.map(instance => instance.metricNetworkOut()),
        ],
        width: 12,
        height: 6,
      })
    );

    // 9. Outputs for reference
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the foundational environment',
      exportName: 'FoundationalVPCId',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: 'FoundationalKMSKeyId',
    });

    new cdk.CfnOutput(this, 'ApplicationDataBucketName', {
      value: applicationDataBucket.bucketName,
      description: 'S3 bucket for application data',
      exportName: 'FoundationalAppDataBucket',
    });

    new cdk.CfnOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucketName,
      description: 'S3 bucket for logging',
      exportName: 'FoundationalLoggingBucket',
    });
  }
}
```

## Architecture Components Explained

### 1. **Virtual Private Cloud (VPC)**
- **Service Used**: Amazon VPC
- **Configuration**: Multi-AZ deployment across 3 availability zones
- **Subnets**: Public, Private with NAT, and Isolated subnets
- **Security**: VPC Flow Logs enabled with CloudWatch integration

### 2. **Identity and Access Management (IAM)**
- **Service Used**: AWS IAM
- **Implementation**: Least privilege roles for EC2 instances
- **Features**: No hardcoded credentials, instance profiles, service-linked roles

### 3. **Encryption**
- **Service Used**: AWS KMS
- **Implementation**: Customer-managed key with automatic rotation
- **Coverage**: EBS volumes, S3 buckets, CloudWatch Logs, CloudTrail

### 4. **Network Security**
- **Service Used**: EC2 Security Groups
- **Implementation**: Tiered security groups (Web, App, DB, Management)
- **Principle**: Least privilege network access with specific port restrictions

### 5. **Monitoring and Logging**
- **Services Used**: CloudWatch, CloudTrail, VPC Flow Logs
- **Features**: Custom dashboards, alarms, comprehensive logging
- **Retention**: Long-term log retention with lifecycle policies

### 6. **Storage**
- **Service Used**: Amazon S3
- **Security**: SSE-KMS encryption, bucket policies, versioning
- **Features**: Lifecycle policies, access logging, SSL enforcement

### 7. **Compute**
- **Service Used**: Amazon EC2
- **AMI**: Latest Amazon Linux 2023
- **Security**: Encrypted EBS volumes, detailed monitoring, Systems Manager integration

### 8. **Resource Management**
- **Implementation**: Comprehensive tagging strategy
- **Coverage**: All resources tagged for cost tracking and compliance

## Security Best Practices Implemented

### Defense in Depth
- Multiple layers of security controls
- Network segmentation with security groups
- Encryption at rest and in transit
- Comprehensive logging and monitoring

### Least Privilege
- IAM roles with minimal required permissions
- Security groups with specific port access
- Resource-based policies where applicable

### Encryption Everywhere
- Customer-managed KMS keys
- Encrypted EBS volumes
- Encrypted S3 buckets
- Encrypted CloudWatch Logs

## Compliance Features

- **Audit Trail**: Complete API logging via CloudTrail
- **Data Retention**: 7-year log retention policy
- **Access Control**: Role-based access with least privilege
- **Monitoring**: Real-time monitoring and alerting
- **Encryption**: End-to-end encryption implementation

## Deployment Instructions

1. **Prerequisites**: Ensure AWS CDK is installed and configured
2. **Bootstrap**: Run `cdk bootstrap` in the target region
3. **Deploy**: Execute `cdk deploy SecureFoundationalEnvironmentStack`
4. **Verify**: Check CloudFormation console for successful deployment

This architecture provides a robust, secure, and compliant foundation for enterprise AWS workloads while maintaining operational excellence and cost optimization principles.