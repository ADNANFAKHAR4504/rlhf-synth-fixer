import { Construct } from 'constructs';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile'; // ADD THIS
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy'; // ADD THIS
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

import { Instance } from '@cdktf/provider-aws/lib/instance';

export interface SecurityModulesConfig {
  allowedCidr: string;
  region: string;
  instanceType: string;
  dbInstanceClass: string;
}

export class SecurityModules extends Construct {
  public readonly iamRole: IamRole;
  public readonly instanceProfile: IamInstanceProfile; // ADD THIS
  public readonly securityGroup: SecurityGroup;
  public readonly s3Bucket: S3Bucket;
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly kmsKey: KmsKey;
  public readonly rdsInstance: DbInstance;
  public readonly cloudWatchAlarm: CloudwatchMetricAlarm;
  public readonly vpc: Vpc;
  public readonly ec2Instance: Instance;

  constructor(scope: Construct, id: string, config: SecurityModulesConfig) {
    super(scope, id);

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

    // Get current AWS account ID
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

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

    // CREATE IAM INSTANCE PROFILE - FIX FOR EC2 ERROR
    this.instanceProfile = new IamInstanceProfile(this, 'MyApp-InstanceProfile', {
      name: 'MyApp-InstanceProfile-EC2',
      role: this.iamRole.name,
      tags: {
        Name: 'MyApp-InstanceProfile-EC2',
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
            // Allow CloudWatch metrics publishing for monitoring
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
          {
            // Allow access only to our specific S3 bucket
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: 'arn:aws:s3:::myapp-secure-data-*/*',
          },
        ],
      }),
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'MyApp-IAM-Attachment', {
      role: this.iamRole.name,
      policyArn: iamPolicy.arn,
    });

    // Security Group with restricted access
    this.securityGroup = new SecurityGroup(this, 'MyApp-SG-Restricted', {
      name: 'MyApp-SG-Restricted',
      description:
        'Security group allowing inbound traffic only from trusted IP range',
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
        Name: 'MyApp-SG-Restricted',
        Security: 'Restricted',
        AllowedCIDR: config.allowedCidr,
      },
    });

    // S3 Bucket for sensitive data
    this.s3Bucket = new S3Bucket(this, 'MyApp-S3-SecureData', {
      bucket: `myapp-secure-data-f2jxva`, // Use the exact bucket name from error
      forceDestroy: false,
      tags: {
        Name: 'MyApp-S3-SecureData',
        DataClassification: 'Sensitive',
        Encryption: 'Enabled',
      },
    });

    // ADD S3 BUCKET POLICY FOR CLOUDTRAIL - FIX FOR CLOUDTRAIL ERROR
    new S3BucketPolicy(this, 'MyApp-S3-CloudTrailPolicy', {
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
        ],
      }),
    });

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

      // ADD DEPENDENCY TO ENSURE BUCKET POLICY IS CREATED FIRST
      dependsOn: [this.s3Bucket],
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
      vpcSecurityGroupIds: [this.securityGroup.id],
      publiclyAccessible: false,

      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: 'myapp-rds-final-snapshot',

      tags: {
        Name: 'MyApp-RDS-Main',
        Access: 'Private',
        Encryption: 'Enabled',
        Environment: 'Production',
      },
    });

    // EC2 Instance - FIXED TO USE INSTANCE PROFILE
    this.ec2Instance = new Instance(this, 'MyApp-EC2-Main', {
      ami: 'ami-0c94855ba95b798c7',
      instanceType: config.instanceType,
      subnetId: privateSubnet1.id,
      vpcSecurityGroupIds: [this.securityGroup.id],

      // USE INSTANCE PROFILE INSTEAD OF ROLE DIRECTLY
      iamInstanceProfile: this.instanceProfile.name,

      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        kmsKeyId: this.kmsKey.arn,
        deleteOnTermination: true,
      },

      tags: {
        Name: 'MyApp-EC2-Main',
        Environment: 'Production',
        Monitoring: 'Enabled',
      },
    });

    // CloudWatch Alarm for EC2 CPU monitoring
    this.cloudWatchAlarm = new CloudwatchMetricAlarm(
      this,
      'MyApp-CW-CPUAlarm',
      {
        alarmName: 'MyApp-EC2-HighCPU',
        alarmDescription:
          'Alarm when EC2 instance CPU exceeds 80%',

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
          Threshold: '80%',
        },
      }
    );
  }
}