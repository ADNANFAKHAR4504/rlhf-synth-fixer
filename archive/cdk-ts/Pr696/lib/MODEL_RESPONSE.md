I'll create a secure AWS CDK TypeScript infrastructure that meets all your security requirements. This will include KMS encryption, MFA-enabled IAM roles, proper tagging, and the latest security services.

## lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly secureRole: iam.Role;
  public readonly secureS3Bucket: s3.Bucket;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: SecurityStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'ProductionKMSKey', {
      alias: `production-encryption-key-${environmentSuffix}`,
      description: 'KMS key for production environment encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Tag the KMS key
    cdk.Tags.of(this.kmsKey).add('Environment', 'production');
    cdk.Tags.of(this.kmsKey).add('Purpose', 'Encryption');

    // Create IAM role with MFA requirement
    this.secureRole = new iam.Role(this, 'ProductionSecureRole', {
      roleName: `ProductionSecureRole-${environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Production role requiring MFA authentication',
      maxSessionDuration: cdk.Duration.hours(4),
    });

    // Add MFA condition to the role's assume role policy
    this.secureRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AccountPrincipal(this.account)],
        actions: ['sts:AssumeRole'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false'
          }
        }
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
          'kms:ReEncrypt*'
        ],
        resources: [this.kmsKey.keyArn]
      })
    );

    // Tag the IAM role
    cdk.Tags.of(this.secureRole).add('Environment', 'production');
    cdk.Tags.of(this.secureRole).add('SecurityLevel', 'High');

    // Create VPC with security best practices
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `production-vpc-${environmentSuffix}`,
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
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      flowLogs: {
        's3': {
          destination: ec2.FlowLogDestination.toS3()
        }
      }
    });

    // Tag VPC
    cdk.Tags.of(this.vpc).add('Environment', 'production');

    // Create S3 bucket with KMS encryption
    this.secureS3Bucket = new s3.Bucket(this, 'ProductionS3Bucket', {
      bucketName: `production-secure-bucket-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        }
      ],
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Tag S3 bucket
    cdk.Tags.of(this.secureS3Bucket).add('Environment', 'production');
    cdk.Tags.of(this.secureS3Bucket).add('DataClassification', 'Confidential');

    // Create Security Group for EC2 instances
    const secureSecurityGroup = new ec2.SecurityGroup(this, 'ProductionSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for production EC2 instances',
      allowAllOutbound: false,
    });

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
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
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
        }
      ],
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true,
    });

    // Tag EC2 instance
    cdk.Tags.of(productionInstance).add('Environment', 'production');
    cdk.Tags.of(productionInstance).add('BackupRequired', 'true');

    // Enable Security Hub
    const securityHub = new securityhub.CfnHub(this, 'ProductionSecurityHub', {
      tags: [
        {
          key: 'Environment',
          value: 'production'
        }
      ]
    });

    // Enable GuardDuty Extended Threat Detection
    const guardDutyDetector = new guardduty.CfnDetector(this, 'ProductionGuardDuty', {
      enable: true,
      features: [
        {
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED'
        },
        {
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED'
        },
        {
          name: 'RDS_LOGIN_EVENTS',
          status: 'ENABLED'
        },
        {
          name: 'ECS_FARGATE_AGENT_ENDPOINT',
          status: 'ENABLED'
        },
        {
          name: 'EC2_AGENT_ENDPOINT',
          status: 'ENABLED'
        }
      ],
      tags: [
        {
          key: 'Environment',
          value: 'production'
        }
      ]
    });

    // Output important resource ARNs
    new cdk.CfnOutput(this, 'KMSKeyArn', {
      description: 'ARN of the production KMS key',
      value: this.kmsKey.keyArn,
      exportName: `${this.stackName}-KMSKeyArn`
    });

    new cdk.CfnOutput(this, 'SecureRoleArn', {
      description: 'ARN of the MFA-required production role',
      value: this.secureRole.roleArn,
      exportName: `${this.stackName}-SecureRoleArn`
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      description: 'ARN of the encrypted S3 bucket',
      value: this.secureS3Bucket.bucketArn,
      exportName: `${this.stackName}-S3BucketArn`
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
      env: props?.env,
    });

    // Tag the main stack
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'SecureInfrastructure');
  }
}
```