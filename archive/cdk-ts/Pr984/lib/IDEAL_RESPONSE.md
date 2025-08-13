# Security Configuration as Code - AWS CDK TypeScript Solution

Based on the comprehensive security requirements, here's a production-ready AWS CDK TypeScript solution implementing secure infrastructure with S3 buckets, EC2 instances, comprehensive logging, and monitoring capabilities.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as accessanalyzer from 'aws-cdk-lib/aws-accessanalyzer';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'SecurityConfiguration',
      ManagedBy: 'CDK',
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // VPC for secure networking
    const vpc = new ec2.Vpc(this, 'SecurityVpc', {
      maxAzs: 2,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // CloudWatch Log Group with 7-day retention
    const logGroup = new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/aws/security/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket with security best practices
    const secureS3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `secure-production-bucket-${environmentSuffix}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Security Group allowing only HTTPS traffic
    const httpsSecurityGroup = new ec2.SecurityGroup(
      this,
      'HttpsSecurityGroup',
      {
        vpc,
        description: 'Security group allowing only HTTPS traffic',
        allowAllOutbound: true,
      }
    );

    httpsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound traffic'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2SecurityRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Secure role for EC2 instances with minimal permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal S3 permissions for specific bucket only
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${secureS3Bucket.bucketArn}/*`],
      })
    );

    // Add CloudWatch Logs permissions
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [logGroup.logGroupArn],
      })
    );

    // Instance Profile for EC2
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [ec2Role.roleName],
    });

    // EC2 Instance with security configurations
    const ec2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: httpsSecurityGroup,
      userData: ec2.UserData.custom(`#!/bin/bash
        yum update -y
        yum install -y amazon-cloudwatch-agent
        
        # Configure CloudWatch agent
        cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
        {
          "logs": {
            "logs_collected": {
              "files": {
                "collect_list": [
                  {
                    "file_path": "/var/log/messages",
                    "log_group_name": "${logGroup.logGroupName}",
                    "log_stream_name": "{instance_id}/messages"
                  }
                ]
              }
            }
          }
        }
        EOF
        
        # Start CloudWatch agent
        /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
          -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      `),
      requireImdsv2: true,
    });

    // GuardDuty Detector for threat detection
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      'GuardDutyDetector',
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        dataSources: {
          s3Logs: {
            enable: true,
          },
          kubernetes: {
            auditLogs: {
              enable: true,
            },
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: true,
            },
          },
        },
      }
    );

    // Access Analyzer for IAM analysis
    new accessanalyzer.CfnAnalyzer(this, 'AccessAnalyzer', {
      analyzerName: `security-analyzer-${environmentSuffix}`,
      type: 'ACCOUNT',
    });

    // Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Name of the secure S3 bucket',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the secure EC2 instance',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group name',
    });

    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: guardDutyDetector.ref,
      description: 'GuardDuty Detector ID',
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-west-1';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    region: awsRegion,
  },
  environmentSuffix,
});

app.synth();
```

## Key Security Features Implemented

### 1. **S3 Bucket Security**
- **Public Access Blocking**: All public access is completely blocked
- **SSL/TLS Enforcement**: Bucket policy denies all non-SSL requests
- **Server-Side Encryption**: AES256 encryption enabled by default
- **Versioning**: Full version history maintained for audit trail
- **Access Logging**: All access logged with prefix for easy analysis
- **Lifecycle Management**: Automatic cleanup of incomplete multipart uploads
- **Auto-Deletion**: Objects automatically deleted when stack is destroyed (for testing)

### 2. **EC2 Instance Security**
- **Private Subnet Deployment**: Instances have no direct internet access
- **IAM Role with Least Privilege**: Only necessary permissions granted
- **IMDSv2 Requirement**: Enhanced metadata service security
- **Security Group Restrictions**: Only HTTPS (port 443) inbound allowed
- **Automated Updates**: User data script updates system packages
- **CloudWatch Agent**: Pre-installed and configured for logging

### 3. **Network Security**
- **VPC Isolation**: Dedicated VPC with public/private subnet separation
- **NAT Gateway**: Secure outbound internet access for private instances
- **DNS Support**: Full DNS resolution within VPC
- **Security Group Rules**: Explicit allow rules only for required ports

### 4. **Logging and Monitoring**
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **GuardDuty Integration**: Continuous threat detection enabled
- **S3 Access Logs**: All bucket access tracked
- **Malware Protection**: EC2 EBS volume scanning enabled
- **Log Streaming**: Real-time log collection from EC2 instances

### 5. **Compliance and Governance**
- **IAM Access Analyzer**: Continuous analysis of resource access
- **Resource Tagging**: All resources tagged with Environment: Production
- **Least Privilege Access**: IAM policies follow principle of least privilege
- **Automated Compliance**: GuardDuty checks for security violations

### 6. **Infrastructure as Code Best Practices**
- **Environment Suffixes**: Support for multiple environments
- **Parameterized Deployment**: Region and environment configurable
- **Clean Removal**: All resources properly cleaned up on stack deletion
- **Output Values**: Key resource IDs exported for integration
- **Type Safety**: Full TypeScript type checking

## Deployment Configuration

The infrastructure is configured for deployment in the **us-west-1** region as specified, with:
- Automatic environment suffix management
- Support for CI/CD pipeline integration
- Comprehensive test coverage (unit and integration tests)
- Clean resource naming conventions
- Full AWS CDK best practices compliance

## Security Compliance

This solution meets all specified security requirements:
1. ✅ S3 bucket with SSL enforcement and public access blocking
2. ✅ EC2 instances in private subnets with IAM roles
3. ✅ Security groups allowing only HTTPS traffic (port 443)
4. ✅ CloudWatch logging with 7-day retention
5. ✅ All resources tagged with 'Environment: Production'
6. ✅ GuardDuty and IAM Access Analyzer integration
7. ✅ Least privilege IAM policies throughout

The infrastructure provides defense-in-depth security with multiple layers of protection, comprehensive monitoring, and automated threat detection.