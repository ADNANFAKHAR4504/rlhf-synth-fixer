import { Construct } from 'constructs';
import { TerraformIterator } from 'cdktf';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

import { EbsVolume } from '@cdktf/provider-aws/lib/ebs-volume';

export interface ModulesConfig {
  region: string;
  appName: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
}

export class SecureModules extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly lambdaRole: IamRole;
  public readonly s3Bucket: S3Bucket;
  public readonly lambdaFunction: LambdaFunction;
  public readonly lambdaLogGroup: CloudwatchLogGroup;
  public readonly rdsInstance: DbInstance;
  public readonly ebsVolume: EbsVolume;

  constructor(scope: Construct, id: string, config: ModulesConfig) {
    super(scope, id);

    // KMS Key for encryption at rest - centralized key management
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: `${config.appName} encryption key for all services`,
      keyUsage: 'ENCRYPT_DECRYPT',
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': [
                  `s3.${config.region}.amazonaws.com`,
                  `rds.${config.region}.amazonaws.com`,
                  `lambda.${config.region}.amazonaws.com`,
                  `ec2.${config.region}.amazonaws.com`,
                ],
              },
            },
          },
        ],
      }),
      tags: {
        Name: `${config.appName}-KMS-Key`,
        Environment: 'production',
      },
    });

    // KMS Alias for easier reference and management
    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${config.appName.toLowerCase()}-encryption-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // VPC - isolated network environment
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.appName}-VPC`,
      },
    });

    // Internet Gateway for public subnet internet access
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.appName}-IGW`,
      },
    });

    // Public Subnets - for resources that need internet access
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.appName}-Public-Subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Private Subnets - for application resources
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          Name: `${config.appName}-Private-Subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.appName}-Public-RT`,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Lambda execution role with least privilege principle
    this.lambdaRole = new IamRole(this, 'lambda-role', {
      name: `${config.appName}-Lambda-ExecutionRole`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.appName}-Lambda-Role`,
      },
    });

    // Lambda policy - minimal permissions for logging and VPC access
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `${config.appName}-Lambda-Policy`,
      description: 'Minimal permissions for Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `arn:aws:logs:${config.region}:*:log-group:/aws/lambda/${config.appName}-*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: this.kmsKey.arn,
          },
        ],
      }),
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      policyArn: lambdaPolicy.arn,
      role: this.lambdaRole.name,
    });

    // CloudWatch Log Group for Lambda
    this.lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/${config.appName}-Function`,
      retentionInDays: 14,
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: `${config.appName}-Lambda-LogGroup`,
      },
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `${config.appName}-Lambda-SG`,
      description: 'Security group for Lambda function',
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.appName}-Lambda-SG`,
      },
    });

    // Allow HTTPS outbound for AWS API calls
    new SecurityGroupRule(this, 'lambda-sg-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: lambdaSecurityGroup.id,
      description: 'HTTPS outbound for AWS API calls',
    });

    // S3 Bucket with comprehensive security settings
    this.s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `${config.appName.toLowerCase()}-secure-bucket-${Date.now()}`,
      tags: {
        Name: `${config.appName}-S3-Bucket`,
      },
    });

    // S3 Bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
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
    });

    // S3 Bucket versioning
    new S3BucketVersioningA(this, 's3-versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Public Access Block
    new S3BucketPublicAccessBlock(this, 's3-public-access-block', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Access Logging
    const loggingBucket = new S3Bucket(this, 's3-logging-bucket', {
      bucket: `${config.appName.toLowerCase()}-access-logs-${Date.now()}`,
      tags: {
        Name: `${config.appName}-S3-AccessLogs`,
      },
    });

    new S3BucketLoggingA(this, 's3-logging', {
      bucket: this.s3Bucket.id,
      targetBucket: loggingBucket.id,
      targetPrefix: 'access-logs/',
    });

    // FIXED: Create TerraformIterator for private subnet IDs
    const privateSubnetIterator = TerraformIterator.fromList(
      this.privateSubnets.map(subnet => subnet.id)
    );

    // Lambda Function - FIXED: Use direct array of subnet IDs
    this.lambdaFunction = new LambdaFunction(this, 'lambda-function', {
      functionName: `${config.appName}-Function`,
      role: this.lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: 'lambda.zip',
      sourceCodeHash: 'placeholder',
      timeout: 30,
      memorySize: 128,
      kmsKeyArn: this.kmsKey.arn,
      vpcConfig: {
        // FIXED: Use the iterator's value directly as an array
        subnetIds: privateSubnetIterator.value,
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      dependsOn: [this.lambdaLogGroup],
      environment: {
        variables: {
          S3_BUCKET: this.s3Bucket.id,
          KMS_KEY_ID: this.kmsKey.keyId,
        },
      },
      tags: {
        Name: `${config.appName}-Lambda-Function`,
      },
    });

    // DB Subnet Group for RDS - FIXED: Use the iterator's value directly
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.appName.toLowerCase()}-db-subnet-group`,
      // FIXED: Use the iterator's value directly as an array
      subnetIds: privateSubnetIterator.value,
      description: 'Subnet group for RDS instance',
      tags: {
        Name: `${config.appName}-DB-SubnetGroup`,
      },
    });

    // Security Group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.appName}-RDS-SG`,
      description: 'Security group for RDS instance',
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.appName}-RDS-SG`,
      },
    });

    // Allow MySQL/Aurora access from Lambda security group only
    new SecurityGroupRule(this, 'rds-sg-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: lambdaSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'MySQL access from Lambda',
    });

    // RDS Instance - encrypted with KMS
    this.rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `${config.appName.toLowerCase()}-database`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,
      dbName: 'myappdb',
      username: 'admin',
      password: 'ChangeMe123!',
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.appName.toLowerCase()}-final-snapshot`,
      deletionProtection: true,
      tags: {
        Name: `${config.appName}-RDS-Instance`,
      },
    });

    // EBS Volume - encrypted with KMS
    this.ebsVolume = new EbsVolume(this, 'ebs-volume', {
      availabilityZone: config.availabilityZones[0],
      size: 10,
      type: 'gp3',
      encrypted: true,
      kmsKeyId: this.kmsKey.keyId,
      tags: {
        Name: `${config.appName}-EBS-Volume`,
      },
    });
  }
}
