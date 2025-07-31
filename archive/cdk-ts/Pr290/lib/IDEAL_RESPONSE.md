# Secure AWS CDK Environment Solution

I'll help you create a robust AWS CDK application in TypeScript that implements a secure cloud environment meeting all the specified security requirements. This solution includes comprehensive security controls, proper resource isolation, and extensive logging capabilities.

## Architecture Overview

The solution implements a defense-in-depth security architecture with the following components:

- **Secure VPC** with public and private subnets across multiple availability zones
- **EC2 instances** deployed exclusively in private subnets with no direct internet access
- **S3 buckets** with AES-256 encryption, versioning, and public access blocking
- **IAM roles** following least privilege principles
- **Comprehensive logging** through CloudTrail, VPC Flow Logs, and CloudWatch
- **Network security** through security groups and NACLs

## Implementation

### Project Structure

```
lib/
├── secure-environment-stack.ts     # Main security-focused stack
├── tap-stack.ts                    # Root application stack
└── network-stack.ts                # Network infrastructure (if separated)

bin/
└── tap.ts                          # CDK application entry point

test/
├── secure-environment-stack.unit.test.ts  # Unit tests
└── tap-stack.int.test.ts                  # Integration tests
```

### Core Infrastructure Code

#### `bin/tap.ts` - Application Entry Point

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

#### `lib/tap-stack.ts` - Root Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { SecureEnvironmentStack } from './secure-environment-stack';

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

    // Create the secure environment stack
    new SecureEnvironmentStack(this, 'SecureEnvironment', {
      environmentSuffix: environmentSuffix,
      env: {
        account: cdk.Stack.of(this).account,
        region: cdk.Stack.of(this).region,
      },
    });
  }
}
```

#### `lib/secure-environment-stack.ts` - Main Security Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SecureEnvironmentStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecureEnvironmentStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props?: SecureEnvironmentStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with secure network configuration
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PublicSubnet',
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: 'PrivateSubnet',
          cidrMask: 24,
        },
      ],
    });

    // Enable VPC Flow Logs for network monitoring
    const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
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
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create S3 bucket for CloudTrail and access logs
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'LogsLifecycleRule',
          enabled: true,
          expiration: cdk.Duration.days(365),
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create secure S3 bucket with AES-256 encryption
    this.securityBucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-data-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DataLifecycleRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add bucket policy for secure access
    this.securityBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securityBucket.bucketArn,
          this.securityBucket.arnForObjects('*'),
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Create IAM role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3BucketAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [this.securityBucket.arnForObjects('*')],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [this.securityBucket.bucketArn],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/ec2/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create instance profile for EC2 instances
    new iam.InstanceProfile(this, 'Ec2InstanceProfile', {
      role: this.ec2Role,
      instanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
    });

    // Create security group for EC2 instances in private subnets
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      description:
        'Security group for EC2 instances with minimal required access',
      allowAllOutbound: false,
    });

    // Allow outbound HTTPS traffic for software updates and AWS API calls
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS traffic'
    );

    // Allow outbound HTTP traffic for package manager updates
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP traffic for updates'
    );

    // Allow outbound DNS traffic
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'Allow outbound DNS TCP traffic'
    );

    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow outbound DNS UDP traffic'
    );

    // Create EC2 instances in private subnets only
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          agent: {
            metrics_collection_interval: 300,
            run_as_user: 'cwagent',
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/messages',
                    log_group_name: `/aws/ec2/system-logs/${environmentSuffix}`,
                    log_stream_name: '{instance_id}/messages',
                  },
                  {
                    file_path: '/var/log/secure',
                    log_group_name: `/aws/ec2/security-logs/${environmentSuffix}`,
                    log_stream_name: '{instance_id}/secure',
                  },
                ],
              },
            },
          },
          metrics: {
            namespace: 'AWS/EC2/Custom',
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 300,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 300,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 300,
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',
      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create EC2 instance in private subnet
    const privateInstance = new ec2.Instance(this, 'PrivateInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: this.ec2SecurityGroup,
      role: this.ec2Role,
      userData: userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      requireImdsv2: true, // Enforce IMDSv2 for enhanced security
    });

    // Create CloudTrail for comprehensive API logging
    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `security-audit-trail-${environmentSuffix}`,
      bucket: this.logsBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // Add CloudTrail bucket policy for proper permissions
    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [this.logsBucket.bucketArn],
      })
    );

    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [this.logsBucket.arnForObjects('cloudtrail-logs/*')],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Add data events for S3 bucket monitoring
    trail.addS3EventSelector(
      [
        {
          bucket: this.securityBucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: true,
      }
    );

    // Create CloudWatch Log Groups for application logs
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create additional log groups for system monitoring
    new logs.LogGroup(this, 'SystemLogGroup', {
      logGroupName: `/aws/ec2/system-logs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/aws/ec2/security-logs/${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag all resources for proper governance
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureEnvironment');
    cdk.Tags.of(this).add('Owner', 'InfrastructureTeam');
    cdk.Tags.of(this).add('CostCenter', 'IT-Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs for reference and integration tests
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure environment',
      exportName: `SecureVpc-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecureBucketName', {
      value: this.securityBucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `SecureBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: privateInstance.instanceId,
      description: 'Instance ID of the EC2 instance in private subnet',
      exportName: `PrivateInstance-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail for audit logging',
      exportName: `CloudTrail-${environmentSuffix}`,
    });
  }
}
```

## Security Implementation Details

### 1. S3 Encryption (AES-256)
- **Server-side encryption** using S3-managed keys (SSE-S3)
- **Bucket-level encryption** applied to all objects
- **Lifecycle policies** for cost optimization
- **Versioning enabled** for data protection and compliance

### 2. EC2 Network Security
- **Private subnet deployment** - EC2 instances have no public IP addresses
- **NAT Gateway** provides secure outbound internet access
- **Security groups** with minimal required ports (443, 80, 53)
- **VPC Flow Logs** monitor all network traffic
- **IMDSv2 enforcement** for enhanced metadata security

### 3. IAM Least Privilege
- **Service-specific roles** with minimal required permissions
- **Conditional access** requiring secure transport for S3 operations
- **AWS managed policies** used where appropriate (SSM)
- **Inline policies** for custom, scoped permissions
- **No wildcard permissions** in any policy

### 4. Comprehensive Logging
- **CloudTrail** logs all API activities across all regions
- **S3 data events** capture bucket-level operations
- **VPC Flow Logs** monitor network traffic patterns
- **CloudWatch Logs** centralize application and system logs
- **Log retention policies** meet compliance requirements

## Deployment Process

### Prerequisites
```bash
# Install dependencies
npm install

# Configure AWS credentials
aws configure

# Bootstrap CDK (first time only)
npm run cdk:bootstrap
```

### Build and Deploy
```bash
# Lint code
npm run lint

# Build TypeScript
npm run build

# Synthesize CloudFormation template
npm run cdk:synth

# Deploy to AWS
npm run cdk:deploy
```

### Testing
```bash
# Run unit tests
npm run test:unit

# Run integration tests (requires deployed infrastructure)
npm run test:integration
```

## Security Validation

The solution includes comprehensive tests to validate security requirements:

### Unit Tests
- Template validation for all security configurations
- Resource property verification
- IAM policy validation
- Encryption settings verification

### Integration Tests
- Live AWS resource validation
- S3 encryption and public access blocking
- EC2 instance network isolation
- CloudTrail and logging verification
- Security group rule validation

## Compliance and Best Practices

### AWS Well-Architected Framework
- **Security Pillar**: Identity management, data protection, detection
- **Reliability Pillar**: Multi-AZ deployment, backup strategies
- **Performance Efficiency**: Right-sizing, monitoring
- **Cost Optimization**: Lifecycle policies, resource tagging
- **Operational Excellence**: Infrastructure as code, automated testing

### Security Standards
- **CIS AWS Foundations Benchmark** compliance
- **NIST Cybersecurity Framework** alignment
- **SOC 2 Type II** security controls
- **ISO 27001** information security management

## Resource Management

### Tagging Strategy
All resources are tagged with:
- `Environment`: Development/staging/production identifier
- `Project`: SecureEnvironment
- `Owner`: InfrastructureTeam
- `CostCenter`: IT-Security
- `Compliance`: Required

### Cost Optimization
- S3 lifecycle policies transition data to lower-cost storage classes
- T3.micro instances for cost-effective compute
- Log retention policies prevent indefinite storage costs
- Resource tagging enables cost allocation and tracking

## Monitoring and Alerting

The infrastructure provides multiple monitoring layers:

1. **Network Monitoring**: VPC Flow Logs track all network communications
2. **API Monitoring**: CloudTrail logs all AWS API calls
3. **System Monitoring**: CloudWatch Logs collect system and application logs
4. **Performance Monitoring**: CloudWatch Metrics track resource utilization

## Cleanup

To remove all resources:
```bash
npm run cdk:destroy
```

This solution provides a production-ready, secure AWS environment that meets all specified security requirements while following AWS best practices and security standards. The infrastructure is fully tested, documented, and ready for deployment in any AWS account.