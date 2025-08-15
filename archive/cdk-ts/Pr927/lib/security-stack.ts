import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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
      vpcName: `secure-vpc-${envSuffix}`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 0, // Setting to 0 to avoid EIP quota issues
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Changed to isolated to avoid NAT Gateway
        },
      ],
    });

    // S3 Bucket with AES-256 encryption and security best practices
    this.bucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-data-bucket-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudTrail bucket for storing audit logs
    const trailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `security-audit-trail-${envSuffix}`,
      bucket: trailBucket,
      cloudWatchLogGroup: cloudTrailLogGroup,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // Add S3 data event logging for the secure bucket
    trail.addS3EventSelector([
      {
        bucket: this.bucket,
        objectPrefix: '',
      },
    ]);

    // IAM role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: `ec2-secure-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
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

    new iam.CfnInstanceProfile(this, 'Ec2InstanceProfile', {
      roles: [this.ec2Role.roleName],
      instanceProfileName: `ec2-instance-profile-${envSuffix}`,
    });

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ec2-security-group-${envSuffix}`,
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
      instanceName: `secure-instance-${envSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Changed to match VPC configuration
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

    // GuardDuty Detector - commented out as it's an account-level resource
    // In production, GuardDuty should be enabled at the organization level
    // const guardDutyDetector = new guardduty.CfnDetector(
    //   this,
    //   'GuardDutyDetector',
    //   {
    //     enable: true,
    //     features: [
    //       {
    //         name: 'S3_DATA_EVENTS',
    //         status: 'ENABLED',
    //       },
    //       {
    //         name: 'EKS_AUDIT_LOGS',
    //         status: 'ENABLED',
    //       },
    //       {
    //         name: 'EBS_MALWARE_PROTECTION',
    //         status: 'ENABLED',
    //       },
    //       {
    //         name: 'RDS_LOGIN_EVENTS',
    //         status: 'ENABLED',
    //       },
    //       {
    //         name: 'LAMBDA_NETWORK_LOGS',
    //         status: 'ENABLED',
    //       },
    //     ],
    //   }
    // );

    // GuardDuty S3 Protection configuration - commented out as it requires GuardDuty Detector
    // new guardduty.CfnMalwareProtectionPlan(this, 'S3MalwareProtection', {
    //   role: new iam.Role(this, 'GuardDutyMalwareRole', {
    //     assumedBy: new iam.ServicePrincipal('guardduty.amazonaws.com'),
    //     managedPolicies: [
    //       iam.ManagedPolicy.fromAwsManagedPolicyName(
    //         'AmazonGuardDutyMalwareProtectionServiceRolePolicy'
    //       ),
    //     ],
    //   }).roleArn,
    //   protectedResource: {
    //     s3Bucket: {
    //       bucketName: this.bucket.bucketName,
    //       objectPrefixes: ['sensitive-data/'],
    //     },
    //   },
    //   actions: {
    //     tagging: {
    //       status: 'ENABLED',
    //     },
    //   },
    // });

    // Amazon Inspector v2 is account-level and doesn't require resource groups
    // Tag the EC2 instance for Inspector scanning if enabled at account level
    cdk.Tags.of(ec2Instance).add('InspectorTarget', 'true');
    cdk.Tags.of(ec2Instance).add('InspectorScan', envSuffix);

    // VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VpcFlowLogGroup', {
          logGroupName: `/aws/vpc/flowlogs/${envSuffix}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      ),
      flowLogName: `vpc-flow-log-${envSuffix}`,
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', envSuffix);
    cdk.Tags.of(this).add('Purpose', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Stack Outputs for integration testing
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for security infrastructure',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name for secure data storage',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 instance ID in private subnet',
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'IAM role ARN for EC2 instances',
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: `security-audit-trail-${envSuffix}`,
      description: 'CloudTrail name for audit logging',
    });

    // GuardDuty output removed as detector is account-level
    // new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
    //   value: guardDutyDetector.ref,
    //   description: 'GuardDuty detector ID',
    // });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'Security group ID for EC2 instances',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: trailBucket.bucketName,
      description: 'CloudTrail S3 bucket name',
    });
  }
}
