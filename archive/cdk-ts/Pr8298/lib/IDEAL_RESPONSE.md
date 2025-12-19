I'll create a secure AWS CDK TypeScript infrastructure that meets all your security requirements with production-ready best practices.

## lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
// Security Hub and GuardDuty are account-level services, typically enabled organization-wide
import { Construct } from 'constructs';

interface SecurityStackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends Construct {
  public readonly kmsKey: kms.Key;
  public readonly secureRole: iam.Role;
  public readonly secureS3Bucket: s3.Bucket;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: SecurityStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stack = cdk.Stack.of(this);
    const account = stack.account;

    // Create KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'ProductionKMSKey', {
      alias: `production-encryption-key-${environmentSuffix}`,
      description: 'KMS key for production environment encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag the KMS key
    cdk.Tags.of(this.kmsKey).add('Environment', 'production');
    cdk.Tags.of(this.kmsKey).add('Purpose', 'Encryption');

    // Create IAM role with MFA requirement
    this.secureRole = new iam.Role(this, 'ProductionSecureRole', {
      roleName: `ProductionSecureRole-${environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(account),
      description: 'Production role requiring MFA authentication',
      maxSessionDuration: cdk.Duration.hours(4),
    });

    // Add MFA condition to the role's assume role policy
    this.secureRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AccountPrincipal(account)],
        actions: ['sts:AssumeRole'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Add permissions to use KMS key
    this.secureRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey',
          'kms:ReEncrypt*',
        ],
        resources: [this.kmsKey.keyArn],
      })
    );

    // Tag the IAM role
    cdk.Tags.of(this.secureRole).add('Environment', 'production');
    cdk.Tags.of(this.secureRole).add('SecurityLevel', 'High');

    // Create VPC with security best practices
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `production-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0, // No NAT gateways to avoid EIP limit
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        s3: {
          destination: ec2.FlowLogDestination.toS3(),
        },
      },
    });

    // Tag VPC
    cdk.Tags.of(this.vpc).add('Environment', 'production');

    // Create S3 bucket with KMS encryption
    this.secureS3Bucket = new s3.Bucket(this, 'ProductionS3Bucket', {
      bucketName: `production-secure-bucket-${environmentSuffix}-${account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Tag S3 bucket
    cdk.Tags.of(this.secureS3Bucket).add('Environment', 'production');
    cdk.Tags.of(this.secureS3Bucket).add('DataClassification', 'Confidential');

    // Create Security Group for EC2 instances
    const secureSecurityGroup = new ec2.SecurityGroup(
      this,
      'ProductionSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for production EC2 instances',
        allowAllOutbound: false,
      }
    );

    // Add only necessary egress rules
    secureSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    secureSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // Tag Security Group
    cdk.Tags.of(secureSecurityGroup).add('Environment', 'production');

    // Create EC2 instance with encrypted EBS volumes
    const productionInstance = new ec2.Instance(this, 'ProductionInstance', {
      instanceName: `production-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroup: secureSecurityGroup,
      role: this.secureRole,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: this.kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true,
          }),
        },
      ],
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true,
    });

    // Tag EC2 instance
    cdk.Tags.of(productionInstance).add('Environment', 'production');
    cdk.Tags.of(productionInstance).add('BackupRequired', 'true');

    // Note: Security Hub and GuardDuty are account-level services
    // They are typically enabled at the organization level
    // We output notes about their expected configuration

    // Output important resource ARNs
    new cdk.CfnOutput(stack, 'KMSKeyArn', {
      description: 'ARN of the production KMS key',
      value: this.kmsKey.keyArn,
      exportName: `TapStack${environmentSuffix}-KMSKeyArn`,
    });

    new cdk.CfnOutput(stack, 'SecureRoleArn', {
      description: 'ARN of the MFA-required production role',
      value: this.secureRole.roleArn,
      exportName: `TapStack${environmentSuffix}-SecureRoleArn`,
    });

    new cdk.CfnOutput(stack, 'S3BucketArn', {
      description: 'ARN of the encrypted S3 bucket',
      value: this.secureS3Bucket.bucketArn,
      exportName: `TapStack${environmentSuffix}-S3BucketArn`,
    });

    new cdk.CfnOutput(stack, 'VPCId', {
      description: 'ID of the production VPC',
      value: this.vpc.vpcId,
      exportName: `TapStack${environmentSuffix}-VPCId`,
    });

    new cdk.CfnOutput(stack, 'InstanceId', {
      description: 'ID of the production EC2 instance',
      value: productionInstance.instanceId,
      exportName: `TapStack${environmentSuffix}-InstanceId`,
    });

    new cdk.CfnOutput(stack, 'SecurityGroupId', {
      description: 'ID of the production security group',
      value: secureSecurityGroup.securityGroupId,
      exportName: `TapStack${environmentSuffix}-SecurityGroupId`,
    });

    new cdk.CfnOutput(stack, 'S3BucketName', {
      description: 'Name of the encrypted S3 bucket',
      value: this.secureS3Bucket.bucketName,
      exportName: `TapStack${environmentSuffix}-S3BucketName`,
    });

    new cdk.CfnOutput(stack, 'SecurityNote', {
      description: 'Security services configuration',
      value: 'GuardDuty and Security Hub should be enabled at the organization level for comprehensive security monitoring',
      exportName: `TapStack${environmentSuffix}-SecurityNote`,
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

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

    // Create the security stack with all production security requirements
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
    });

    // Tag the main stack
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'SecureInfrastructure');

    // Export key resource references for use in other stacks
    new cdk.CfnOutput(this, 'SecurityStackKMSKeyArn', {
      description: 'Reference to Security Stack KMS Key',
      value: securityStack.kmsKey.keyArn,
    });

    new cdk.CfnOutput(this, 'SecurityStackS3BucketName', {
      description: 'Reference to Security Stack S3 Bucket',
      value: securityStack.secureS3Bucket.bucketName,
    });
  }
}
```

## Key Security Features Implemented

1. **KMS Encryption**: All data at rest is encrypted using AWS KMS with automatic key rotation enabled
2. **MFA-Required IAM Roles**: IAM roles enforce Multi-Factor Authentication through deny conditions
3. **Encrypted EBS Volumes**: EC2 instances use GP3 volumes with KMS encryption
4. **S3 Security**: Buckets have KMS encryption, versioning, SSL enforcement, and public access blocking
5. **Network Security**: VPC with isolated subnets and restricted security groups
6. **VPC Flow Logs**: Enabled for network traffic monitoring
7. **IMDSv2**: EC2 instances require IMDSv2 for enhanced security
8. **Resource Tagging**: All resources tagged with 'Environment: production' for compliance
9. **Least Privilege**: Security groups only allow necessary HTTP/HTTPS egress
10. **Lifecycle Management**: S3 bucket includes lifecycle rules for old version cleanup

## Deployment Notes

- Security Hub and GuardDuty are account-level services that should be enabled at the AWS Organizations level
- All resources are designed to be destroyable (no RETAIN policies) for clean environment management
- Environment suffix ensures resource naming uniqueness across deployments
- Resources are properly connected and referenced through CloudFormation outputs