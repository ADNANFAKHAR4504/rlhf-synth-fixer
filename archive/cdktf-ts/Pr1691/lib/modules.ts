import { Construct } from 'constructs';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

import { cloudtrail } from '@cdktf/provider-aws';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';

import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface SecurityModulesConfig {
  allowedCidr: string;
  region: string;
  instanceType: string;
  dbInstanceClass: string;
}

export class SecurityModules extends Construct {
  public readonly iamRole: IamRole;
  public readonly instanceProfile: IamInstanceProfile;
  public readonly securityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly s3Bucket: S3Bucket;
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly kmsKey: KmsKey;
  public readonly rdsInstance: DbInstance;
  public readonly cloudWatchAlarm: CloudwatchMetricAlarm;
  public readonly vpc: Vpc;
  public readonly ec2Instance: Instance;

  constructor(scope: Construct, id: string, config: SecurityModulesConfig) {
    super(scope, id);

    // Get current AWS account ID
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create VPC for network isolation
    this.vpc = new Vpc(this, 'MyApp-VPC-Main', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'MyApp-VPC-Main',
        Environment: 'Production',
        Security: 'Isolated',
      },
    });

    // Create public subnet for NAT Gateway
    const publicSubnet = new Subnet(this, 'MyApp-Subnet-Public', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${config.region}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'MyApp-Subnet-Public',
        Type: 'Public',
      },
    });

    // Create private subnet for RDS and EC2 instances
    const privateSubnet1 = new Subnet(this, 'MyApp-Subnet-Private-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${config.region}a`,
      tags: {
        Name: 'MyApp-Subnet-Private-1',
        Type: 'Private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'MyApp-Subnet-Private-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `${config.region}b`,
      tags: {
        Name: 'MyApp-Subnet-Private-2',
        Type: 'Private',
      },
    });

    // Internet Gateway for public subnet
    const igw = new InternetGateway(this, 'MyApp-IGW-Main', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-IGW-Main',
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'MyApp-EIP-NAT', {
      domain: 'vpc',
      tags: {
        Name: 'MyApp-EIP-NAT',
      },
      dependsOn: [igw],
    });

    // NAT Gateway for private subnet internet access
    const natGateway = new NatGateway(this, 'MyApp-NAT-Main', {
      allocationId: natEip.id,
      subnetId: publicSubnet.id,
      tags: {
        Name: 'MyApp-NAT-Main',
      },
      dependsOn: [igw],
    });

    // Route table for public subnet
    const publicRouteTable = new RouteTable(this, 'MyApp-RT-Public', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-RT-Public',
      },
    });

    new Route(this, 'MyApp-Route-Public', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'MyApp-RTA-Public', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Route table for private subnets
    const privateRouteTable = new RouteTable(this, 'MyApp-RT-Private', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'MyApp-RT-Private',
      },
    });

    new Route(this, 'MyApp-Route-Private', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    new RouteTableAssociation(this, 'MyApp-RTA-Private-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    });

    new RouteTableAssociation(this, 'MyApp-RTA-Private-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    });

    // KMS Key for encryption - Created early as other resources depend on it
    this.kmsKey = new KmsKey(this, 'MyApp-KMS-Main', {
      description:
        'KMS key for MyApp encryption - encrypts EBS volumes, S3 buckets, and RDS instances',
      keyUsage: 'ENCRYPT_DECRYPT',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: 'MyApp-KMS-Main',
        Purpose: 'Encryption',
        Security: 'High',
      },
    });

    // KMS Alias for easier reference
    new KmsAlias(this, 'MyApp-KMS-Alias', {
      name: 'alias/myapp-main-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // Generate unique bucket name to avoid conflicts
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    // IAM Role with least privilege principle
    this.iamRole = new IamRole(this, 'MyApp-IAM-Role-EC2', {
      name: 'MyApp-IAM-Role-EC2',
      description:
        'Least privilege role for EC2 instances - only allows CloudWatch metrics and S3 access to specific bucket',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: 'MyApp-IAM-Role-EC2',
        Principle: 'LeastPrivilege',
      },
    });

    // IAM Policy with minimal required permissions
    const iamPolicy = new IamPolicy(this, 'MyApp-IAM-Policy-EC2', {
      name: 'MyApp-IAM-Policy-EC2',
      description:
        'Minimal permissions for EC2 instances - CloudWatch metrics and specific S3 bucket access only',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:::myapp-secure-data-${uniqueSuffix}/*`,
          },
        ],
      }),
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'MyApp-IAM-Attachment', {
      role: this.iamRole.name,
      policyArn: iamPolicy.arn,
    });

    // CREATE IAM INSTANCE PROFILE
    this.instanceProfile = new IamInstanceProfile(
      this,
      'MyApp-InstanceProfile',
      {
        name: 'MyApp-InstanceProfile-EC2',
        role: this.iamRole.name,
        tags: {
          Name: 'MyApp-InstanceProfile-EC2',
        },
      }
    );

    // Security Group for EC2 instances
    this.securityGroup = new SecurityGroup(this, 'MyApp-SG-EC2', {
      name: 'MyApp-SG-EC2',
      description:
        'Security group for EC2 instances - allowing inbound traffic only from trusted IP range',
      vpcId: this.vpc.id,

      ingress: [
        {
          description: 'HTTPS from trusted network only',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: [config.allowedCidr],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [],
        },
        {
          description: 'HTTP from trusted network only',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [config.allowedCidr],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [],
        },
        {
          description: 'SSH from trusted network only',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [config.allowedCidr],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [],
        },
      ],

      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [],
        },
      ],

      tags: {
        Name: 'MyApp-SG-EC2',
        Security: 'Restricted',
        AllowedCIDR: config.allowedCidr,
      },
    });

    // RDS Security Group
    this.dbSecurityGroup = new SecurityGroup(this, 'MyApp-SG-RDS', {
      name: 'MyApp-SG-RDS',
      description:
        'Security group for RDS instances - only allows MySQL access from EC2 security group',
      vpcId: this.vpc.id,

      ingress: [
        {
          description: 'MySQL from EC2 instances only',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: [],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [this.securityGroup.id],
        },
      ],

      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          ipv6CidrBlocks: [],
          prefixListIds: [],
          securityGroups: [],
        },
      ],

      tags: {
        Name: 'MyApp-SG-RDS',
        Security: 'DatabaseOnly',
        Purpose: 'RDS',
      },

      dependsOn: [this.securityGroup],
    });

    // S3 Bucket for sensitive data
    this.s3Bucket = new S3Bucket(this, 'MyApp-S3-SecureData', {
      bucket: `myapp-secure-data-${uniqueSuffix}`,
      forceDestroy: true,
      tags: {
        Name: 'MyApp-S3-SecureData',
        DataClassification: 'Sensitive',
        Encryption: 'Enabled',
      },
    });

    // S3 BUCKET POLICY FOR CLOUDTRAIL
    const s3BucketPolicy = new S3BucketPolicy(
      this,
      'MyApp-S3-CloudTrailPolicy',
      {
        bucket: this.s3Bucket.id,
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
              Resource: this.s3Bucket.arn,
              Condition: {
                StringEquals: {
                  'AWS:SourceArn': `arn:aws:cloudtrail:${config.region}:${callerIdentity.accountId}:trail/MyApp-CloudTrail-Main`,
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
              Resource: `${this.s3Bucket.arn}/cloudtrail-logs/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                  'AWS:SourceArn': `arn:aws:cloudtrail:${config.region}:${callerIdentity.accountId}:trail/MyApp-CloudTrail-Main`,
                },
              },
            },
            {
              Sid: 'AWSCloudTrailGetBucketLocation',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketLocation',
              Resource: this.s3Bucket.arn,
              Condition: {
                StringEquals: {
                  'AWS:SourceArn': `arn:aws:cloudtrail:${config.region}:${callerIdentity.accountId}:trail/MyApp-CloudTrail-Main`,
                },
              },
            },
          ],
        }),
      }
    );

    // S3 Bucket encryption configuration
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'MyApp-S3-Encryption',
      {
        bucket: this.s3Bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'MyApp-S3-PublicBlock', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DB Subnet Group for RDS
    const dbSubnetGroup = new DbSubnetGroup(this, 'MyApp-DB-SubnetGroup', {
      name: 'myapp-db-subnet-group',
      description:
        'Subnet group for RDS instances - private subnets only for security',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: 'MyApp-DB-SubnetGroup',
        Type: 'Private',
      },
    });

    // EC2 Instance with proper dependencies
    this.ec2Instance = new Instance(this, 'MyApp-EC2-Main', {
      ami: amazonLinuxAmi.id, // Use dynamic AMI lookup
      instanceType: config.instanceType,
      subnetId: privateSubnet1.id,
      vpcSecurityGroupIds: [this.securityGroup.id],

      iamInstanceProfile: this.instanceProfile.name,

      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        kmsKeyId: this.kmsKey.arn,
        deleteOnTermination: true,
      },

      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
# Configure CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
    -a fetch-config -m ec2 -s -c default
`,

      tags: {
        Name: 'MyApp-EC2-Main',
        Environment: 'Production',
        Monitoring: 'Enabled',
      },

      // Explicit dependencies to ensure proper creation order
      dependsOn: [
        this.instanceProfile,
        this.securityGroup,
        natGateway, // Ensure NAT Gateway is ready for outbound connectivity
        privateRouteTable, // Ensure routing is configured
      ],
    });

    // RDS Instance
    this.rdsInstance = new DbInstance(this, 'MyApp-RDS-Main', {
      identifier: 'myapp-rds-main',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: config.dbInstanceClass,
      allocatedStorage: 20,
      storageType: 'gp2',

      dbName: 'myappdb',
      username: 'admin',
      password: 'ChangeMe123!',

      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      publiclyAccessible: false,

      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      deletionProtection: false,
      skipFinalSnapshot: true,

      tags: {
        Name: 'MyApp-RDS-Main',
        Access: 'Private',
        Encryption: 'Enabled',
        Environment: 'Production',
      },

      dependsOn: [dbSubnetGroup, this.dbSecurityGroup],
    });

    // CloudTrail for comprehensive API activity monitoring
    this.cloudTrail = new cloudtrail.Cloudtrail(this, 'MyApp-CloudTrail-Main', {
      name: 'MyApp-CloudTrail-Main',
      s3BucketName: this.s3Bucket.bucket,
      s3KeyPrefix: 'cloudtrail-logs/',

      kmsKeyId: this.kmsKey.arn,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      enableLogFileValidation: true,

      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: [`${this.s3Bucket.arn}/*`],
            },
          ],
        },
      ],

      tags: {
        Name: 'MyApp-CloudTrail-Main',
        Purpose: 'SecurityMonitoring',
        Scope: 'AllAPIActivity',
      },

      dependsOn: [s3BucketPolicy],
    });

    // CloudWatch Alarm for EC2 CPU monitoring
    this.cloudWatchAlarm = new CloudwatchMetricAlarm(
      this,
      'MyApp-CW-CPUAlarm',
      {
        alarmName: 'MyApp-EC2-HighCPU',
        alarmDescription: 'Alarm when EC2 instance CPU exceeds 80%',

        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 80,
        comparisonOperator: 'GreaterThanThreshold',

        dimensions: {
          InstanceId: this.ec2Instance.id,
        },

        alarmActions: [],

        tags: {
          Name: 'MyApp-CW-CPUAlarm',
          Type: 'PerformanceMonitoring',
          Threshold: '80_percent',
        },

        dependsOn: [this.ec2Instance],
      }
    );
  }
}
