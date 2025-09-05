## modules.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticsearchDomain } from '@cdktf/provider-aws/lib/elasticsearch-domain';
import { cloudtrail } from '@cdktf/provider-aws';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

export interface ModuleConfig {
  environment: string;
  region: string;
  companyName: string;
  allowedCidrBlocks: string[];
  keyPairName: string;
  amiId: string;
}

// Networking Module - Creates secure VPC with public/private subnets
export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly s3VpcEndpoint: VpcEndpoint;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    // Create VPC with DNS support enabled for proper service resolution
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.companyName}-${config.environment}-vpc`,
        Environment: config.environment,
        ManagedBy: 'terraform',
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-igw`,
        Environment: config.environment,
      },
    });

    // Create public subnets in multiple AZs for high availability
    this.publicSubnets = [
      new Subnet(this, 'public-subnet-1a', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${config.region}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.companyName}-${config.environment}-public-1a`,
          Environment: config.environment,
          Type: 'public',
        },
      }),
      new Subnet(this, 'public-subnet-1b', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${config.region}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.companyName}-${config.environment}-public-1b`,
          Environment: config.environment,
          Type: 'public',
        },
      }),
    ];

    // Create private subnets for secure resource placement
    this.privateSubnets = [
      new Subnet(this, 'private-subnet-1a', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: `${config.region}a`,
        tags: {
          Name: `${config.companyName}-${config.environment}-private-1a`,
          Environment: config.environment,
          Type: 'private',
        },
      }),
      new Subnet(this, 'private-subnet-1b', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: `${config.region}b`,
        tags: {
          Name: `${config.companyName}-${config.environment}-private-1b`,
          Environment: config.environment,
          Type: 'private',
        },
      }),
    ];

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.companyName}-${config.environment}-nat-eip`,
        Environment: config.environment,
      },
    });

    // NAT Gateway for private subnet internet access (outbound only)
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${config.companyName}-${config.environment}-nat-gw`,
        Environment: config.environment,
      },
    });

    // Route tables and routes
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-public-rt`,
        Environment: config.environment,
      },
    });

    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-private-rt`,
        Environment: config.environment,
      },
    });

    // Routes for internet access
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate subnets with route tables
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // VPC Endpoint for S3 to keep traffic within AWS network
    this.s3VpcEndpoint = new VpcEndpoint(this, 's3-vpc-endpoint', {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.${config.region}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [privateRouteTable.id],
      tags: {
        Name: `${config.companyName}-${config.environment}-s3-endpoint`,
        Environment: config.environment,
      },
    });
  }
}

// Security Groups Module - Creates restrictive security groups following least privilege
export class SecurityGroupsModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly lambdaSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, vpc: Vpc, config: ModuleConfig) {
    super(scope, id);

    // EC2 Security Group - Only allows necessary inbound traffic
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${config.companyName}-${config.environment}-ec2-sg`,
      description: 'Security group for EC2 instances - least privilege access',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-ec2-sg`,
        Environment: config.environment,
      },
    });

    // Allow HTTP/HTTPS from specific company IP ranges only
    config.allowedCidrBlocks.forEach((cidr, index) => {
      new SecurityGroupRule(this, `ec2-ingress-http-${index}`, {
        type: 'ingress',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.ec2SecurityGroup.id,
        description: `HTTP access from company network ${index + 1}`,
      });

      new SecurityGroupRule(this, `ec2-ingress-https-${index}`, {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.ec2SecurityGroup.id,
        description: `HTTPS access from company network ${index + 1}`,
      });
    });

    // Egress rule for EC2 (outbound internet access)
    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Outbound internet access',
    });

    // Lambda Security Group - Minimal access required
    this.lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `${config.companyName}-${config.environment}-lambda-sg`,
      description: 'Security group for Lambda functions',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda-sg`,
        Environment: config.environment,
      },
    });

    // Lambda egress for DynamoDB and S3 access
    new SecurityGroupRule(this, 'lambda-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.lambdaSecurityGroup.id,
      description: 'HTTPS outbound for AWS services',
    });

    // RDS Security Group - Only accessible from EC2 and Lambda
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.companyName}-${config.environment}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-rds-sg`,
        Environment: config.environment,
      },
    });

    // Allow database access only from EC2 and Lambda security groups
    new SecurityGroupRule(this, 'rds-ingress-ec2', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from EC2 instances',
    });

    new SecurityGroupRule(this, 'rds-ingress-lambda', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.lambdaSecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from Lambda functions',
    });
  }
}

// Compute Module - EC2 instances with detailed monitoring in private subnets
export class ComputeModule extends Construct {
  public readonly instances: Instance[];

  constructor(
    scope: Construct,
    id: string,
    privateSubnets: Subnet[],
    securityGroup: SecurityGroup,
    instanceProfile: IamInstanceProfile,
    config: ModuleConfig
  ) {
    super(scope, id);

    // Deploy EC2 instances in private subnets for security
    this.instances = privateSubnets.map((subnet, index) => {
      return new Instance(this, `ec2-instance-${index}`, {
        ami: config.amiId,
        instanceType: 't3.medium',
        subnetId: subnet.id,
        keyName: config.keyPairName,
        vpcSecurityGroupIds: [securityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        // Enable detailed monitoring for better observability
        monitoring: true,
        // Ensure instance is replaced if user data changes
        userDataBase64: Buffer.from(
          `#!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent for detailed monitoring
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
            -a fetch-config -m ec2 -s -c default
        `
        ).toString('base64'),
        tags: {
          Name: `${config.companyName}-${config.environment}-ec2-${index}`,
          Environment: config.environment,
          Role: 'web-server',
        },
      });
    });
  }
}

// IAM Module - Least privilege roles and policies
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;
  public readonly lambdaRole: IamRole;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    // EC2 Role with minimal required permissions
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.companyName}-${config.environment}-ec2-role`,
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
        Name: `${config.companyName}-${config.environment}-ec2-role`,
        Environment: config.environment,
      },
    });

    // EC2 policy - CloudWatch agent and S3 read access only
    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `${config.companyName}-${config.environment}-ec2-policy`,
      description: 'Minimal permissions for EC2 instances',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject'],
            Resource: `arn:aws:s3:::${config.companyName}-${config.environment}-app-*/*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      policyArn: ec2Policy.arn,
      role: this.ec2Role.name,
    });

    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.companyName}-${config.environment}-ec2-profile`,
        role: this.ec2Role.name,
      }
    );

    // Lambda Role with VPC and DynamoDB permissions
    this.lambdaRole = new IamRole(this, 'lambda-role', {
      name: `${config.companyName}-${config.environment}-lambda-role`,
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
        Name: `${config.companyName}-${config.environment}-lambda-role`,
        Environment: config.environment,
      },
    });

    // Lambda policy - VPC access and DynamoDB operations
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `${config.companyName}-${config.environment}-lambda-policy`,
      description: 'Minimal permissions for Lambda function',
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
            Resource: 'arn:aws:logs:*:*:*',
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
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: `arn:aws:dynamodb:${config.region}:*:table/${config.companyName}-${config.environment}-*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      policyArn: lambdaPolicy.arn,
      role: this.lambdaRole.name,
    });
  }
}

// Storage Module - Secure S3 buckets with encryption and access controls
export class StorageModule extends Construct {
  public readonly appBucket: S3Bucket;
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    // Get AWS account ID for bucket policy
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Application S3 bucket with security best practices
    this.appBucket = new S3Bucket(this, 'app-bucket', {
      bucket: `${config.companyName}-${config.environment}-app`,
      tags: {
        Name: `${config.companyName}-${config.environment}-app-bucket`,
        Environment: config.environment,
        Purpose: 'application-data',
      },
    });

    // Enable versioning for data protection
    new S3BucketVersioningA(this, 'app-bucket-versioning', {
      bucket: this.appBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'app-bucket-encryption',
      {
        bucket: this.appBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'app-bucket-pab', {
      bucket: this.appBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Explicit deny public access policy
    new S3BucketPolicy(this, 'app-bucket-policy', {
      bucket: this.appBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyPublicAccess',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [this.appBucket.arn, `${this.appBucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      }),
    });

    // Logs bucket for CloudTrail
    this.logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${config.companyName}-${config.environment}-logs`,
      tags: {
        Name: `${config.companyName}-${config.environment}-logs-bucket`,
        Environment: config.environment,
        Purpose: 'audit-logs',
      },
    });

    // Configure logs bucket security
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // **FIXED: CloudTrail-specific bucket policy**
    new S3BucketPolicy(this, 'logs-bucket-policy', {
      bucket: this.logsBucket.id,
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
            Resource: this.logsBucket.arn,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:aws:cloudtrail:${config.region}:${callerIdentity.accountId}:trail/${config.companyName}-${config.environment}-trail`,
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
            Resource: `${this.logsBucket.arn}/cloudtrail-logs/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
                'AWS:SourceArn': `arn:aws:cloudtrail:${config.region}:${callerIdentity.accountId}:trail/${config.companyName}-${config.environment}-trail`,
              },
            },
          },
          {
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [this.logsBucket.arn, `${this.logsBucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      }),
    });
  }
}

// Lambda Module - Function deployed in VPC for security
export class LambdaModule extends Construct {
  public readonly lambdaFunction: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    privateSubnets: Subnet[],
    securityGroup: SecurityGroup,
    lambdaRole: IamRole,
    config: ModuleConfig
  ) {
    super(scope, id);

    // Lambda function in VPC private subnets
    this.lambdaFunction = new LambdaFunction(this, 'lambda', {
      functionName: `${config.companyName}-${config.environment}-processor`,
      s3Bucket: 'lambda-ts-12345',
      s3Key: 'lambda.zip',
      handler: 'lambda_function.handler',
      runtime: 'python3.9',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 512,
      // Deploy in VPC for secure access to RDS and DynamoDB
      vpcConfig: {
        subnetIds: privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [securityGroup.id],
      },
      // Environment variables for configuration
      environment: {
        variables: {
          ENVIRONMENT: config.environment,
          REGION: config.region,
        },
      },
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda`,
        Environment: config.environment,
        Purpose: 'data-processing',
      },
    });
  }
}

// Database Module - DynamoDB and RDS with security best practices
export class DatabaseModule extends Construct {
  public readonly dynamoTable: DynamodbTable;
  public readonly rdsInstance: DbInstance;

  constructor(
    scope: Construct,
    id: string,
    privateSubnets: Subnet[],
    rdsSecurityGroup: SecurityGroup,
    config: ModuleConfig
  ) {
    super(scope, id);

    // DynamoDB table with point-in-time recovery
    this.dynamoTable = new DynamodbTable(this, 'dynamo-table', {
      name: `${config.companyName}-${config.environment}-app-data`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],
      // Enable point-in-time recovery for data protection
      pointInTimeRecovery: {
        enabled: true,
      },
      // Server-side encryption enabled by default in DynamoDB
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `${config.companyName}-${config.environment}-dynamo`,
        Environment: config.environment,
        Purpose: 'application-data',
      },
    });

    // RDS subnet group for private deployment
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.companyName}-${config.environment}-db-subnet-group`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${config.companyName}-${config.environment}-db-subnet-group`,
        Environment: config.environment,
      },
    });

    // RDS instance with encryption and security best practices
    this.rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `${config.companyName}-${config.environment}-db`,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      dbName: 'appdb',
      username: process.env.DB_USERNAME || 'admin',
      // Use AWS Secrets Manager or parameter store for production
      password: process.env.DB_PASSWORD || 'changeme123!',
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      // Security configurations
      storageEncrypted: true,
      publiclyAccessible: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.companyName}-${config.environment}-db-final-snapshot`,
      tags: {
        Name: `${config.companyName}-${config.environment}-rds`,
        Environment: config.environment,
        Purpose: 'application-database',
      },
    });
  }
}

// Analytics Module - Elasticsearch with encryption
export class AnalyticsModule extends Construct {
  public readonly elasticsearchDomain: ElasticsearchDomain;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    // Elasticsearch domain with security best practices
    this.elasticsearchDomain = new ElasticsearchDomain(
      this,
      'elasticsearch-domain',
      {
        domainName: `${config.companyName}-${config.environment}-search`,
        elasticsearchVersion: '7.10',
        clusterConfig: {
          instanceType: 't3.small.elasticsearch',
          instanceCount: 1,
        },
        ebsOptions: {
          ebsEnabled: true,
          volumeSize: 20,
          volumeType: 'gp2',
        },
        // Enable encryption at rest and in transit
        encryptAtRest: {
          enabled: true,
        },
        nodeToNodeEncryption: {
          enabled: true,
        },
        domainEndpointOptions: {
          enforceHttps: true,
          tlsSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07',
        },
        tags: {
          Name: `${config.companyName}-${config.environment}-elasticsearch`,
          Environment: config.environment,
          Purpose: 'search-analytics',
        },
      }
    );
  }
}

// Monitoring Module - CloudTrail, CloudWatch, and SNS for comprehensive monitoring
export class MonitoringModule extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly logGroup: CloudwatchLogGroup;
  public readonly snsTopic: SnsTopic;
  public readonly cpuAlarm: CloudwatchMetricAlarm;

  constructor(
    scope: Construct,
    id: string,
    logsBucket: S3Bucket,
    instances: Instance[],
    config: ModuleConfig
  ) {
    super(scope, id);

    // Get current AWS account ID dynamically
    const region = config.region;
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const accountId = callerIdentity.accountId;

    // KMS key for CloudTrail encryption with corrected policy
    this.kmsKey = new KmsKey(this, 'cloudtrail-kms-key', {
      description: 'KMS key for CloudTrail log encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'EnableIAMUserPermissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'AllowCloudTrailToDescribeKey',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:DescribeKey'],
            Resource: '*',
          },
          {
            Sid: 'AllowCloudTrailToGenerateDataKey',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:EncryptionContext:aws:cloudtrail:arn': [
                  `arn:aws:cloudtrail:${region}:${accountId}:trail/${config.companyName}-${config.environment}-trail`,
                ],
              },
            },
          },
          {
            Sid: 'AllowCloudTrailToDecrypt',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:ReEncrypt*'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:EncryptionContext:aws:cloudtrail:arn': [
                  `arn:aws:cloudtrail:${region}:${accountId}:trail/${config.companyName}-${config.environment}-trail`,
                ],
              },
            },
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-cloudtrail-kms`,
        Environment: config.environment,
      },
    });

    new KmsAlias(this, 'cloudtrail-kms-alias', {
      name: `alias/${config.companyName}-${config.environment}-cloudtrail`,
      targetKeyId: this.kmsKey.keyId,
    });

    // CloudTrail for audit logging with KMS encryption
    this.cloudTrail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: `${config.companyName}-${config.environment}-trail`,
      s3BucketName: logsBucket.bucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: `${config.companyName}-${config.environment}-cloudtrail`,
        Environment: config.environment,
      },
    });

    // CloudWatch Log Group with 90-day retention
    this.logGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/ec2/${config.companyName}-${config.environment}`,
      retentionInDays: 90,
      tags: {
        Name: `${config.companyName}-${config.environment}-logs`,
        Environment: config.environment,
      },
    });

    // SNS Topic for alarm notifications
    this.snsTopic = new SnsTopic(this, 'alert-topic', {
      name: `${config.companyName}-${config.environment}-alerts`,
      displayName: 'Application Alerts',
      tags: {
        Name: `${config.companyName}-${config.environment}-sns`,
        Environment: config.environment,
      },
    });

    // CloudWatch Alarm for EC2 CPU utilization
    if (instances.length > 0) {
      this.cpuAlarm = new CloudwatchMetricAlarm(this, 'cpu-alarm', {
        alarmName: `${config.companyName}-${config.environment}-high-cpu`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          InstanceId: instances[0].id,
        },
        tags: {
          Name: `${config.companyName}-${config.environment}-cpu-alarm`,
          Environment: config.environment,
        },
      });
    }
  }
}
```

## tapstack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  NetworkingModule,
  SecurityGroupsModule,
  ComputeModule,
  IamModule,
  StorageModule,
  LambdaModule,
  DatabaseModule,
  AnalyticsModule,
  MonitoringModule,
  ModuleConfig,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'secure-web-application',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
            Owner: 'infrastructure-team',
            CostCenter: 'engineering',
          },
        },
      ],
    });

    // Configuration for the entire stack
    const config: ModuleConfig = {
      environment: environmentSuffix,
      region: awsRegion,
      companyName: 'acme-corp',
      // Company IP ranges for restricted access - replace with actual IPs
      allowedCidrBlocks: ['203.0.113.0/24', '198.51.100.0/24'],
      keyPairName: 'production-key-poetic-primate', // Must exist in AWS
      amiId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI ID for us-east-1
    };

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Create networking infrastructure with VPC, subnets, and gateways
    const networking = new NetworkingModule(this, 'networking', config);

    // Create security groups with restrictive rules
    const securityGroups = new SecurityGroupsModule(
      this,
      'security-groups',
      networking.vpc,
      config
    );

    // Create IAM roles and policies with least privilege access
    const iam = new IamModule(this, 'iam', config);

    // Deploy EC2 instances in private subnets with detailed monitoring
    const compute = new ComputeModule(
      this,
      'compute',
      networking.privateSubnets,
      securityGroups.ec2SecurityGroup,
      iam.ec2InstanceProfile,
      config
    );

    // Create encrypted S3 buckets with public access blocked
    const storage = new StorageModule(this, 'storage', config);

    // Deploy Lambda function in VPC for secure database access
    const lambda = new LambdaModule(
      this,
      'lambda',
      networking.privateSubnets,
      securityGroups.lambdaSecurityGroup,
      iam.lambdaRole,
      config
    );

    // Create DynamoDB table and RDS instance with encryption
    const database = new DatabaseModule(
      this,
      'database',
      networking.privateSubnets,
      securityGroups.rdsSecurityGroup,
      config
    );

    // Deploy Elasticsearch domain with encryption at rest
    const analytics = new AnalyticsModule(this, 'analytics', config);

    // Set up comprehensive monitoring with CloudTrail, CloudWatch, and SNS
    const monitoring = new MonitoringModule(
      this,
      'monitoring',
      storage.logsBucket,
      compute.instances,
      config
    );

    // Output important resource identifiers for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID for the secure environment',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: compute.instances.map(instance => instance.id),
      description: 'EC2 instance IDs deployed in private subnets',
    });

    new TerraformOutput(this, 'app-bucket-name', {
      value: storage.appBucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: storage.logsBucket.bucket,
      description: 'S3 bucket name for audit logs',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: database.dynamoTable.name,
      description: 'DynamoDB table name with PITR enabled',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: database.rdsInstance.endpoint,
      description: 'RDS instance endpoint (private access only)',
      sensitive: true,
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambda.lambdaFunction.functionName,
      description: 'Lambda function name deployed in VPC',
    });

    new TerraformOutput(this, 'elasticsearch-endpoint', {
      value: analytics.elasticsearchDomain.endpoint,
      description: 'Elasticsearch domain endpoint with encryption',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoring.snsTopic.arn,
      description: 'SNS topic ARN for alarm notifications',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: monitoring.cloudTrail.arn,
      description: 'CloudTrail ARN with KMS encryption enabled',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networking.natGateway.id,
      description: 'NAT Gateway ID for private subnet internet access',
    });

    new TerraformOutput(this, 's3-vpc-endpoint-id', {
      value: networking.s3VpcEndpoint.id,
      description: 'S3 VPC Endpoint ID for private S3 access',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```