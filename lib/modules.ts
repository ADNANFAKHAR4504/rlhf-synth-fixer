import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

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
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { EbsVolume } from '@cdktf/provider-aws/lib/ebs-volume';

interface SecureModulesProps {
  region: string;
}

export class SecureModules extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;
  public readonly s3Bucket: S3Bucket;
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly lambdaRole: IamRole;
  public readonly lambdaFunction: LambdaFunction;
  public readonly lambdaLogGroup: CloudwatchLogGroup;
  public readonly rdsInstance: DbInstance;
  public readonly ebsVolume: EbsVolume;

  constructor(scope: Construct, id: string, props: SecureModulesProps) {
    super(scope, id);

    // Get current AWS account
    const currentAccount = new DataAwsCallerIdentity(this, 'current-account');

    // Configuration
    const region = props.region;
    const appName = 'MyApp';
    const vpcCidr = '10.0.0.0/16';
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const privateSubnetCidrs = ['10.0.10.0/24', '10.0.20.0/24'];
    const availabilityZones = [`${region}a`, `${region}b`];

    // KMS Key for encryption at rest
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: `${appName} encryption key for all services`,
      keyUsage: 'ENCRYPT_DECRYPT',
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM Root Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${currentAccount.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow AWS Services',
            Effect: 'Allow',
            Principal: {
              Service: [
                's3.amazonaws.com',
                'rds.amazonaws.com',
                'lambda.amazonaws.com',
                'ec2.amazonaws.com',
                'logs.amazonaws.com',
              ],
            },
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${appName}-KMS-Key`,
        Environment: 'production',
      },
    });

    // KMS Alias
    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${appName.toLowerCase()}-encryption-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 Bucket
    this.s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `${appName.toLowerCase()}-secure-bucket-${Math.floor(Date.now() / 1000)}`,
      tags: {
        Name: `${appName}-S3-Bucket`,
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

    // S3 Access Logging Bucket
    const loggingBucket = new S3Bucket(this, 's3-logging-bucket', {
      bucket: `${appName.toLowerCase()}-access-logs-${Math.floor(Date.now() / 1000)}`,
      tags: {
        Name: `${appName}-S3-AccessLogs`,
      },
    });

    new S3BucketLoggingA(this, 's3-logging', {
      bucket: this.s3Bucket.id,
      targetBucket: loggingBucket.id,
      targetPrefix: 'access-logs/',
    });

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${appName}-VPC`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${appName}-IGW`,
      },
    });

    // Public Subnets
    this.publicSubnets = [];
    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${appName}-Public-Subnet-${index + 1}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Private Subnets
    this.privateSubnets = [];
    privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        tags: {
          Name: `${appName}-Private-Subnet-${index + 1}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map(
      (_, index) =>
        new Eip(this, `nat-eip-${index}`, {
          domain: 'vpc',
          tags: {
            Name: `${appName}-NAT-EIP-${index + 1}`,
          },
          dependsOn: [igw],
        })
    );

    // NAT Gateways
    const natGateways = this.publicSubnets.map(
      (subnet, index) =>
        new NatGateway(this, `nat-gateway-${index}`, {
          allocationId: eips[index].id,
          subnetId: subnet.id,
          tags: {
            Name: `${appName}-NAT-Gateway-${index + 1}`,
          },
          dependsOn: [igw],
        })
    );

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${appName}-Public-RT`,
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

    // Route tables for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${appName}-Private-RT-${index + 1}`,
        },
      });

      // Route to NAT gateway for private subnets
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Lambda execution role
    this.lambdaRole = new IamRole(this, 'lambda-role', {
      name: `${appName}-Lambda-ExecutionRole`,
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
        Name: `${appName}-Lambda-Role`,
      },
    });

    // Lambda policy
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `${appName}-Lambda-Policy`,
      description: 'Permissions for Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${region}:${currentAccount.accountId}:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
              'ec2:AttachNetworkInterface',
              'ec2:DetachNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
            Resource: this.kmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${this.s3Bucket.arn}/*`,
          },
        ],
      }),
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      policyArn: lambdaPolicy.arn,
      role: this.lambdaRole.name,
    });

    // CloudWatch Log Group
    this.lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/${appName}-Function`,
      retentionInDays: 14,
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: `${appName}-Lambda-LogGroup`,
      },
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `${appName}-Lambda-SG`,
      description: 'Security group for Lambda function',
      vpcId: this.vpc.id,
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS outbound for AWS API calls',
        },
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: [vpcCidr],
          description: 'MySQL outbound to RDS',
        },
      ],
      tags: {
        Name: `${appName}-Lambda-SG`,
      },
    });

    // Security Group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${appName}-RDS-SG`,
      description: 'Security group for RDS instance',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [lambdaSecurityGroup.id],
          description: 'MySQL access from Lambda',
        },
      ],
      tags: {
        Name: `${appName}-RDS-SG`,
      },
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${appName.toLowerCase()}-db-subnet-group`,
      subnetIds: [this.privateSubnets[0].id, this.privateSubnets[1].id],
      description: 'Subnet group for RDS instance',
      tags: {
        Name: `${appName}-DB-SubnetGroup`,
      },
    });

    // Lambda Function - Using S3 for deployment package
    this.lambdaFunction = new LambdaFunction(this, 'lambda-function', {
      functionName: `${appName}-Function`,
      role: this.lambdaRole.arn,
      runtime: 'python3.9',
      s3Bucket: 'corp-image-uploads',
      s3Key: 'lambda-deployment.zip',
      timeout: 30,
      memorySize: 128,
      kmsKeyArn: this.kmsKey.arn,
      vpcConfig: {
        subnetIds: [this.privateSubnets[0].id, this.privateSubnets[1].id],
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
        Name: `${appName}-Lambda-Function`,
      },
    });

    // RDS Instance
    this.rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `${appName.toLowerCase()}-database`,
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
      skipFinalSnapshot: true, // Changed to true for easier cleanup during development
      deletionProtection: false, // Changed to false for easier cleanup during development
      tags: {
        Name: `${appName}-RDS-Instance`,
      },
    });

    // EBS Volume
    this.ebsVolume = new EbsVolume(this, 'ebs-volume', {
      availabilityZone: availabilityZones[0],
      size: 10,
      type: 'gp3',
      encrypted: true,
      kmsKeyId: this.kmsKey.keyId,
      tags: {
        Name: `${appName}-EBS-Volume`,
      },
    });
  }
}
