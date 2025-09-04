I'll help you create secure AWS infrastructure using CDK TypeScript. Here's a comprehensive solution that includes all the security requirements you mentioned:

## lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as inspector from 'aws-cdk-lib/aws-inspector2';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bucket: s3.Bucket;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props?: SecurityStackProps) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with private subnets only for EC2 instances
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 1,
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

    // S3 Bucket with AES-256 encryption and security best practices
    this.bucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-data-bucket-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // CloudTrail for comprehensive audit logging
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/${envSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
    });

    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `security-audit-trail-${envSuffix}`,
      cloudWatchLogGroup: cloudTrailLogGroup,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      s3BucketName: `cloudtrail-logs-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
    });

    // IAM role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: `ec2-secure-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [this.bucket.arnForObjects('*')],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.CfnInstanceProfile(this, 'Ec2InstanceProfile', {
      roles: [this.ec2Role.roleName],
      instanceProfileName: `ec2-instance-profile-${envSuffix}`,
    });

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instances in private subnets',
      allowAllOutbound: true,
    });

    // Only allow inbound from VPC CIDR
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // EC2 instance in private subnet
    const ec2Instance = new ec2.Instance(this, 'SecureInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: ec2SecurityGroup,
      role: this.ec2Role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // GuardDuty Detector
    const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      features: [
        {
          name: 'S3_DATA_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED',
        },
        {
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED',
        },
        {
          name: 'RDS_LOGIN_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'LAMBDA_NETWORK_LOGS',
          status: 'ENABLED',
        },
      ],
    });

    // GuardDuty S3 Protection configuration
    new guardduty.CfnMalwareProtectionPlan(this, 'S3MalwareProtection', {
      role: new iam.Role(this, 'GuardDutyMalwareRole', {
        assumedBy: new iam.ServicePrincipal('guardduty.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonGuardDutyMalwareProtectionServiceRolePolicy'),
        ],
      }).roleArn,
      protectedResource: {
        s3Bucket: {
          bucketName: this.bucket.bucketName,
          objectPrefixes: ['sensitive-data/'],
        },
      },
      actions: {
        tagging: {
          disableTagging: false,
        },
      },
    });

    // Amazon Inspector enablement
    new inspector.CfnAssessmentTarget(this, 'InspectorAssessmentTarget', {
      assessmentTargetName: `security-assessment-${envSuffix}`,
      resourceGroupArn: new iam.Role(this, 'InspectorRole', {
        assumedBy: new iam.ServicePrincipal('inspector.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonInspectorServiceRolePolicy'),
        ],
      }).roleArn,
    });

    // VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VpcFlowLogGroup', {
          logGroupName: `/aws/vpc/flowlogs/${envSuffix}`,
          retention: logs.RetentionDays.ONE_MONTH,
        })
      ),
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', envSuffix);
    cdk.Tags.of(this).add('Purpose', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');
  }
}
```

## lib/tap-stack.ts (Updated)

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

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Deploy the security infrastructure
    new SecurityStack(this, 'SecurityStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}
```

This solution provides:

1. **S3 Security**: Bucket with AES-256 encryption, versioning, blocked public access, and lifecycle policies
2. **VPC & EC2**: Private subnets for EC2 instances with encrypted EBS volumes and restrictive security groups
3. **IAM**: Least privilege roles with specific S3 and CloudWatch permissions
4. **Comprehensive Logging**: CloudTrail for API calls, VPC Flow Logs for network traffic
5. **Advanced Security**: GuardDuty with S3 malware protection and Amazon Inspector for vulnerability scanning
6. **Compliance**: All resources properly tagged and configured for audit requirements

The infrastructure follows AWS security best practices and includes the latest security features you requested.