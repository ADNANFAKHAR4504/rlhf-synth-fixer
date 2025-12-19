import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
// Security Hub and GuardDuty are account-level services, typically enabled organization-wide
import { Construct } from 'constructs';

// LocalStack Community edition does not support EC2, Security Hub, or GuardDuty
// Use environment variable to enable/disable EC2 resources
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');
const enableEC2 = !isLocalStack && process.env.ENABLE_EC2 === 'true';

interface SecurityStackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends Construct {
  public readonly kmsKey: kms.Key;
  public readonly secureRole: iam.Role;
  public readonly secureS3Bucket: s3.Bucket;
  public readonly vpc?: ec2.Vpc;

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

    // Create VPC only when EC2 is enabled
    if (enableEC2) {
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
    }

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
      // autoDeleteObjects disabled for LocalStack compatibility
      autoDeleteObjects: false,
    });

    // Tag S3 bucket
    cdk.Tags.of(this.secureS3Bucket).add('Environment', 'production');
    cdk.Tags.of(this.secureS3Bucket).add('DataClassification', 'Confidential');

    // Create EC2 resources only when enabled
    if (enableEC2 && this.vpc) {
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

      // Outputs for EC2 resources
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
    }

    // Note: Security Hub and GuardDuty are account-level services
    // They are typically enabled at the organization level
    // We output notes about their expected configuration

    // Output important resource ARNs (always available)
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

    new cdk.CfnOutput(stack, 'S3BucketName', {
      description: 'Name of the encrypted S3 bucket',
      value: this.secureS3Bucket.bucketName,
      exportName: `TapStack${environmentSuffix}-S3BucketName`,
    });

    new cdk.CfnOutput(stack, 'SecurityNote', {
      description: 'Security services configuration',
      value: enableEC2
        ? 'GuardDuty and Security Hub should be enabled at the organization level for comprehensive security monitoring'
        : 'LocalStack Community: EC2, GuardDuty, and Security Hub are disabled. Only KMS, S3, and IAM resources deployed.',
      exportName: `TapStack${environmentSuffix}-SecurityNote`,
    });
  }
}
