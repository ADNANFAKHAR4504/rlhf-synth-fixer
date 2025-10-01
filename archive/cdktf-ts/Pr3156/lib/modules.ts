import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamGroup } from '@cdktf/provider-aws/lib/iam-group';
import { IamGroupPolicyAttachment } from '@cdktf/provider-aws/lib/iam-group-policy-attachment';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSubnet } from '@cdktf/provider-aws/lib/data-aws-subnet';

import { cloudtrail } from '@cdktf/provider-aws';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { EbsVolume } from '@cdktf/provider-aws/lib/ebs-volume';
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { Wafv2IpSet } from '@cdktf/provider-aws/lib/wafv2-ip-set';

export interface VpcModuleProps {
  cidrBlock: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  availabilityZone: string;
  kmsKeyId: string;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly flowLog: FlowLog;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // VPC - Core network isolation boundary
    // SECURITY RATIONALE: Custom VPC provides network isolation and control over traffic flow
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'secure-vpc',
        Environment: 'production',
        Compliance: 'required',
      },
    });

    // Internet Gateway - Enables internet access for public subnet
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'secure-igw',
      },
    });

    // Public Subnet - Hosts NAT Gateway for private subnet internet access
    // SECURITY RATIONALE: Isolated from private resources, only for NAT and load balancers
    this.publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: false, // Explicit control over public IPs
      tags: {
        Name: 'secure-public-subnet',
        Type: 'Public',
      },
    });

    // Private Subnet - Hosts application resources with no direct internet access
    // SECURITY RATIONALE: Critical resources isolated from direct internet access
    this.privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: props.availabilityZone,
      tags: {
        Name: 'secure-private-subnet',
        Type: 'Private',
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: 'nat-gateway-eip',
      },
    });

    // NAT Gateway - Provides outbound internet access for private subnet
    // SECURITY RATIONALE: Allows private subnet outbound access without inbound exposure
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: 'secure-nat-gateway',
      },
    });

    // Route Tables and Routes
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'public-route-table',
      },
    });

    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'private-route-table',
      },
    });

    // Public route to internet
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Private route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, 'public-rta', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new CloudwatchLogGroup(this, 'vpc-flow-log-group', {
      name: '/aws/vpc/flowlogs-29300', // Unique name for the log group
      retentionInDays: 365, // 1-year retention for compliance
      kmsKeyId: props.kmsKeyId,
      lifecycle: {
        preventDestroy: true,
        ignoreChanges: ['name'], // Ignore if it already exists
      },
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: 'VPCFlowLogRoleTs',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'flow-log-policy', {
      name: 'VPCFlowLogPolicy',
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // VPC Flow Logs - Critical for security monitoring and compliance
    // SECURITY RATIONALE: Captures all network traffic for security analysis and incident response
    this.flowLog = new FlowLog(this, 'vpc-flow-log', {
      vpcId: this.vpc.id,
      trafficType: 'ALL', // Capture accepted, rejected, and all traffic
      logDestination: flowLogGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      iamRoleArn: flowLogRole.arn,
      tags: {
        Name: 'vpc-flow-logs',
        Purpose: 'Security-Monitoring',
      },
    });
  }
}

export interface Ec2ModuleProps {
  subnetId: string;
  vpcId: string;
  amiId: string;
  instanceType: string;
  allowedSshCidr: string[];
  allowedHttpsCidr: string[];
  kmsKeyId: string;
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;
  public readonly securityGroup: SecurityGroup;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // Get subnet information to extract availability zone
    const subnetData = new DataAwsSubnet(this, 'subnet-data', {
      id: props.subnetId,
    });

    // Security Group - Implements principle of least privilege for network access
    // SECURITY RATIONALE: Restricts inbound traffic to only necessary ports from approved sources
    this.securityGroup = new SecurityGroup(this, 'ec2-security-group', {
      name: 'secure-ec2-sg',
      description:
        'Security group for EC2 instance with least privilege access',
      vpcId: props.vpcId,

      // Ingress rules - strictly controlled inbound access
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: props.allowedSshCidr,
          description: 'SSH access from approved IP ranges only',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: props.allowedHttpsCidr,
          description: 'HTTPS access from approved IP ranges only',
        },
      ],

      // Egress rules - allow outbound traffic (can be further restricted based on requirements)
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],

      tags: {
        Name: 'secure-ec2-sg',
        Purpose: 'Application-Security',
      },
    });

    // IAM Role for EC2 Instance - Implements least privilege principle
    // SECURITY RATIONALE: No excessive permissions, specifically excludes network interface manipulation
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'SecureEC2RoleTs',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Purpose: 'EC2-Application-Access',
      },
    });

    // IAM Policy with least privilege - explicitly denies dangerous actions
    // SECURITY RATIONALE: Prevents privilege escalation and network manipulation
    new IamRolePolicy(this, 'ec2-policy', {
      name: 'SecureEC2Policy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
            ],
            Resource: '*',
          },
          {
            Effect: 'Deny',
            Action: [
              'ec2:AttachNetworkInterface',
              'ec2:DetachNetworkInterface',
              'ec2:CreateNetworkInterface',
              'ec2:DeleteNetworkInterface',
              'iam:*',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Instance Profile for EC2 Role
    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'secure-ec2-profile-ts',
        role: ec2Role.name,
      }
    );

    // Encrypted EBS Volume
    // SECURITY RATIONALE: Encryption at rest for all data storage
    new EbsVolume(this, 'encrypted-volume', {
      availabilityZone: subnetData.availabilityZone, // Use actual AZ, not subnet ID
      size: 20,
      type: 'gp3',
      encrypted: true,
      kmsKeyId: props.kmsKeyId,
      tags: {
        Name: 'encrypted-app-volume',
        Encrypted: 'true',
      },
    });

    // EC2 Instance in Private Subnet
    // SECURITY RATIONALE: Deployed in private subnet with no direct internet access
    this.instance = new Instance(this, 'ec2-instance', {
      ami: props.amiId,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: this.instanceProfile.name,

      // Root volume encryption
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        kmsKeyId: props.kmsKeyId,
        deleteOnTermination: true,
      },

      // Instance metadata service v2 only (security hardening)
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // Requires IMDSv2
        httpPutResponseHopLimit: 1,
      },

      tags: {
        Name: 'secure-app-instance',
        Environment: 'production',
        BackupRequired: 'true',
      },
    });
  }
}

export interface S3ModuleProps {
  bucketName: string;
  kmsKeyId: string;
  cloudtrailBucketName: string;
  trailName?: string;
}

export class S3Module extends Construct {
  public readonly appBucket: S3Bucket;
  public readonly cloudtrailBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Get current AWS account and region
    const currentAccount = new DataAwsCallerIdentity(this, 'current-account');
    // const currentRegion = new DataAwsRegion(this, 'current-region');

    // Application S3 Bucket with comprehensive security controls
    // SECURITY RATIONALE: Multiple layers of security including encryption, versioning, and access controls
    this.appBucket = new S3Bucket(this, 'app-bucket', {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        Purpose: 'Application-Data',
        Compliance: 'Required',
      },
    });

    // Versioning for data protection and compliance
    new S3BucketVersioningA(this, 'app-bucket-versioning', {
      bucket: this.appBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption with KMS
    // SECURITY RATIONALE: All data encrypted at rest using customer-managed KMS keys
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'app-bucket-encryption',
      {
        bucket: this.appBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: props.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    // SECURITY RATIONALE: Prevents accidental public exposure of sensitive data
    new S3BucketPublicAccessBlock(this, 'app-bucket-pab', {
      bucket: this.appBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // CloudTrail S3 Bucket for audit logs
    // SECURITY RATIONALE: Separate bucket for audit logs with appropriate access controls
    this.cloudtrailBucket = new S3Bucket(this, 'cloudtrail-bucket', {
      bucket: props.cloudtrailBucketName,
      forceDestroy: false, // Prevent accidental deletion of audit logs
      tags: {
        Name: props.cloudtrailBucketName,
        Purpose: 'Audit-Logs',
        Retention: 'Long-Term',
      },
    });

    // CloudTrail bucket versioning
    new S3BucketVersioningA(this, 'cloudtrail-bucket-versioning', {
      bucket: this.cloudtrailBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // CloudTrail bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'cloudtrail-bucket-encryption',
      {
        bucket: this.cloudtrailBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: props.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access for CloudTrail bucket
    new S3BucketPublicAccessBlock(this, 'cloudtrail-bucket-pab', {
      bucket: this.cloudtrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Add CloudTrail bucket policy
    new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: this.cloudtrailBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: `arn:aws:s3:::${props.cloudtrailBucketName}`,
            Condition: {
              StringEquals: {
                'aws:SourceArn': `arn:aws:cloudtrail:${process.env.AWS_REGION || 'us-east-1'}:${currentAccount.accountId}:trail/${props.trailName || 'secure-app-cloudtrail-trail'}`,
              },
            },
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${props.cloudtrailBucketName}/cloudtrail-logs/AWSLogs/${currentAccount.accountId}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
                's3:x-amz-server-side-encryption-aws-kms-key-id':
                  props.kmsKeyId,
                'aws:SourceArn': `arn:aws:cloudtrail:${process.env.AWS_REGION || 'us-east-1'}:${currentAccount.accountId}:trail/${props.trailName || 'secure-app-cloudtrail-trail'}`,
              },
            },
          },
          {
            Sid: 'AWSCloudTrailBucketExistenceCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:ListBucket',
            Resource: `arn:aws:s3:::${props.cloudtrailBucketName}`,
            Condition: {
              StringEquals: {
                'aws:SourceArn': `arn:aws:cloudtrail:${process.env.AWS_REGION || 'us-east-1'}:${currentAccount.accountId}:trail/${props.trailName || 'secure-app-cloudtrail-trail'}`,
              },
            },
          },
        ],
      }),
    });
  }
}

export interface IamModuleProps {
  mfaRequired: boolean;
  accessKeyRotationDays: number;
}

export class IamModule extends Construct {
  public readonly securityGroup: IamGroup;
  public readonly mfaPolicy: IamPolicy;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // MFA Enforcement Policy
    // SECURITY RATIONALE: Enforces multi-factor authentication for all console access
    this.mfaPolicy = new IamPolicy(this, 'mfa-policy', {
      name: 'EnforceMFAPolicyTs',
      description: 'Enforces MFA for all console users',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowViewAccountInfo',
            Effect: 'Allow',
            Action: [
              'iam:GetAccountPasswordPolicy',
              'iam:GetAccountSummary',
              'iam:ListVirtualMFADevices',
            ],
            Resource: '*',
          },
          {
            Sid: 'AllowManageOwnPasswords',
            Effect: 'Allow',
            Action: ['iam:ChangePassword', 'iam:GetUser'],
            Resource: 'arn:aws:iam::*:user/$${aws:username}', // Escaped here
          },
          {
            Sid: 'AllowManageOwnMFA',
            Effect: 'Allow',
            Action: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:ListMFADevices',
              'iam:EnableMFADevice',
              'iam:ResyncMFADevice',
            ],
            Resource: [
              'arn:aws:iam::*:mfa/$${aws:username}', // Escaped here
              'arn:aws:iam::*:user/$${aws:username}', // Escaped here
            ],
          },
          {
            Sid: 'DenyAllExceptUnlessSignedInWithMFA',
            Effect: 'Deny',
            NotAction: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            Resource: '*',
            Condition: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          },
        ],
      }),
      tags: {
        Purpose: 'Security-MFA-Enforcement',
      },
    });

    // Security Group for users
    // SECURITY RATIONALE: Group-based permission management instead of individual user policies
    this.securityGroup = new IamGroup(this, 'security-group', {
      name: 'SecurityUsersGroupTS',
      path: '/',
    });

    // Attach MFA policy to group
    new IamGroupPolicyAttachment(this, 'security-group-mfa-attachment', {
      group: this.securityGroup.name,
      policyArn: this.mfaPolicy.arn,
    });

    // Access Key Rotation Policy (Note: This is typically handled by external automation)
    // COMPLIANCE REQUIREMENT: Access keys must be rotated every 90 days
    new IamPolicy(this, 'access-key-rotation-policy', {
      name: 'AccessKeyRotationPolicyTS',
      description: 'Policy for automated access key rotation',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iam:CreateAccessKey',
              'iam:UpdateAccessKey',
              'iam:DeleteAccessKey',
              'iam:ListAccessKeys',
            ],
            Resource: 'arn:aws:iam::*:user/$${aws:username}', // Escaped here
          },
        ],
      }),
      tags: {
        Purpose: 'Access-Key-Rotation',
        RotationPeriod: `${props.accessKeyRotationDays}-days`,
      },
    });
  }
}

export interface CloudTrailModuleProps {
  trailName: string;
  s3BucketName: string;
  kmsKeyId: string;
}

export class CloudTrailModule extends Construct {
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: CloudTrailModuleProps) {
    super(scope, id);

    // CloudWatch Log Group for CloudTrail
    this.logGroup = new CloudwatchLogGroup(this, 'cloudtrail-log-group', {
      name: '/aws/cloudtrail/management-events-ts',
      retentionInDays: 365, // 1-year retention for compliance
      kmsKeyId: props.kmsKeyId,
    });

    // IAM Role for CloudTrail to CloudWatch Logs
    const cloudTrailRole = new IamRole(this, 'cloudtrail-role', {
      name: 'CloudTrailLogsRoleTs',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'cloudtrail-logs-policy', {
      name: 'CloudTrailLogsPolicy',
      role: cloudTrailRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
            ],
            Resource: `${this.logGroup.arn}:*`,
          },
        ],
      }),
    });

    // CloudTrail for comprehensive API logging
    // SECURITY RATIONALE: Captures all management events for security monitoring and compliance
    this.cloudTrail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: props.trailName,
      s3BucketName: props.s3BucketName,
      s3KeyPrefix: 'cloudtrail-logs',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true, // Ensures log integrity
      kmsKeyId: props.kmsKeyId,
      cloudWatchLogsGroupArn: `${this.logGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudTrailRole.arn,

      tags: {
        Name: props.trailName,
        Purpose: 'Security-Audit-Compliance',
      },
    });
  }
}

export interface CloudWatchModuleProps {
  cloudTrailLogGroupName: string;
  snsTopicArn?: string;
}

export class CloudWatchModule extends Construct {
  public readonly unauthorizedApiCallsAlarm: CloudwatchMetricAlarm;
  public readonly rootAccountUsageAlarm: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, props: CloudWatchModuleProps) {
    super(scope, id);

    // Metric Filter for Unauthorized API Calls
    // SECURITY RATIONALE: Monitors for suspicious API activity and potential security breaches
    // const unauthorizedApiCallsFilter =
    //   '[version, account, time, event, source, user=root || user=ANONYMOUS_PRINCIPAL, ...]';

    // CloudWatch Alarm for Unauthorized IAM Actions
    // SECURITY RATIONALE: Immediate alerting on suspicious IAM activities
    this.unauthorizedApiCallsAlarm = new CloudwatchMetricAlarm(
      this,
      'unauthorized-api-calls-alarm',
      {
        alarmName: 'UnauthorizedAPICalls',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnauthorizedAPICalls',
        namespace: 'LogMetrics',
        period: 300, // 5 minutes
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Monitors for unauthorized API calls',
        treatMissingData: 'notBreaching',
        alarmActions: props.snsTopicArn ? [props.snsTopicArn] : [],
        tags: {
          Purpose: 'Security-Monitoring',
          Severity: 'High',
        },
      }
    );

    // Root Account Usage Alarm
    // SECURITY RATIONALE: Root account usage should be extremely rare and monitored
    this.rootAccountUsageAlarm = new CloudwatchMetricAlarm(
      this,
      'root-account-usage-alarm',
      {
        alarmName: 'RootAccountUsage',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'RootAccountUsage',
        namespace: 'LogMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Monitors for root account usage',
        treatMissingData: 'notBreaching',
        alarmActions: props.snsTopicArn ? [props.snsTopicArn] : [],
        tags: {
          Purpose: 'Security-Monitoring',
          Severity: 'Critical',
        },
      }
    );
  }
}

export interface WafModuleProps {
  webAclName: string;
  allowedIpRanges: string[];
}

export class WafModule extends Construct {
  public readonly webAcl: Wafv2WebAcl;
  private readonly allowedIpSet?: Wafv2IpSet;

  constructor(scope: Construct, id: string, props: WafModuleProps) {
    super(scope, id);

    // Validate and filter IP ranges
    const validIpRanges = props.allowedIpRanges.filter(ip => {
      if (!ip || ip.trim() === '' || ip === '0.0.0.0/0') {
        return false;
      }
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/([1-9]|[12]\d|3[0-2])$/;
      return cidrRegex.test(ip);
    });

    // Create IP set if there are valid IP ranges
    if (validIpRanges.length > 0) {
      this.allowedIpSet = new Wafv2IpSet(this, 'allowed-ip-set', {
        name: 'AllowedIPSet',
        description: 'Allowed IP addresses',
        scope: 'REGIONAL',
        ipAddressVersion: 'IPV4',
        addresses: validIpRanges,
        tags: {
          Purpose: 'Web-Security',
        },
      });
    }

    // WAFv2 Web ACL with basic configuration
    this.webAcl = new Wafv2WebAcl(this, 'web-acl', {
      name: props.webAclName,
      description: 'Web ACL for application security',
      scope: 'REGIONAL',

      defaultAction: {
        allow: {},
      },

      // Start with basic rules
      // rule: [
      //   {
      //     name: 'RateLimitRule',
      //     priority: 1,
      //     action: {
      //       block: {},
      //     },
      //     statement: {
      //       rateBasedStatement: {
      //         limit: 2000,
      //         aggregateKeyType: 'IP',
      //       },
      //     },
      //     visibilityConfig: {
      //       sampledRequestsEnabled: true,
      //       cloudwatchMetricsEnabled: true,
      //       metricName: 'RateLimitRule',
      //     },
      //   },
      // ],

      tags: {
        Purpose: 'Web-Application-Security',
        Version: 'WAFv2',
      },

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: props.webAclName,
      },
    });
  }
}

export interface KmsModuleProps {
  keyDescription: string;
  keyUsage: string;
  accountId?: string; // Optional account ID prop}
}

export class KmsModule extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    // Get the current account ID dynamically
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const accountId = callerIdentity.accountId;
    const region = process.env.AWS_REGION || 'us-east-1';

    // KMS Key with properly structured policy including CloudWatch Logs permissions
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: props.keyDescription,
      keyUsage: props.keyUsage,
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,

      policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'key-policy-1',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs to use the key',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${region}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${accountId}:*`,
              },
            },
          },
          {
            Sid: 'Allow CloudTrail to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),

      tags: {
        Purpose: 'Data-Encryption',
        Usage: props.keyUsage,
      },
    });

    // KMS Alias
    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: 'alias/secure-app-key-ts',
      targetKeyId: this.kmsKey.keyId,
    });
  }
}
