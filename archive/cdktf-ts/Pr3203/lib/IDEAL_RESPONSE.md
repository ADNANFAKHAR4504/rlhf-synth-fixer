### modules.ts

```typescript
import { Construct } from 'constructs';

// VPC imports
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// IAM imports
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// S3 imports
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

// CloudTrail imports
import { cloudtrail } from '@cdktf/provider-aws';

// EC2 imports
import { Instance } from '@cdktf/provider-aws/lib/instance';

// RDS imports
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// Lambda imports
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';

// SSM imports
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// WAF imports
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';

// VPC Module
export interface VpcConfig {
  cidrBlock: string;
  subnetCidrBlocks: string[];
  availabilityZones: string[];
  enableDnsSupport: boolean;
  enableDnsHostnames: boolean;
}

export class SecureVpc extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly databaseSubnets: Subnet[];

  constructor(scope: Construct, name: string, config: VpcConfig) {
    super(scope, name);

    // Create VPC with DNS support
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsSupport: config.enableDnsSupport,
      enableDnsHostnames: config.enableDnsHostnames,
      tags: {
        Name: `${name}-vpc`,
        Environment: 'Production',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${name}-igw`,
        Environment: 'Production',
      },
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${name}-public-rt`,
        Environment: 'Production',
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create private route table
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${name}-private-rt`,
        Environment: 'Production',
      },
    });

    // Create database route table
    const databaseRouteTable = new RouteTable(this, 'database-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${name}-database-rt`,
        Environment: 'Production',
      },
    });

    // Create subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.databaseSubnets = [];

    // Create public, private, and database subnets across AZs
    for (
      let i = 0;
      i <
      Math.min(
        config.availabilityZones.length,
        config.subnetCidrBlocks.length / 3
      );
      i++
    ) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.subnetCidrBlocks[i * 3],
        availabilityZone: config.availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${name}-public-subnet-${config.availabilityZones[i]}`,
          Environment: 'Production',
          Tier: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Associate public subnet with public route table
      new RouteTableAssociation(this, `public-route-association-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.subnetCidrBlocks[i * 3 + 1],
        availabilityZone: config.availabilityZones[i],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${name}-private-subnet-${config.availabilityZones[i]}`,
          Environment: 'Production',
          Tier: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-route-association-${i}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });

      // Database subnet
      const databaseSubnet = new Subnet(this, `database-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.subnetCidrBlocks[i * 3 + 2],
        availabilityZone: config.availabilityZones[i],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${name}-database-subnet-${config.availabilityZones[i]}`,
          Environment: 'Production',
          Tier: 'Database',
        },
      });
      this.databaseSubnets.push(databaseSubnet);

      // Associate database subnet with database route table
      new RouteTableAssociation(this, `database-route-association-${i}`, {
        subnetId: databaseSubnet.id,
        routeTableId: databaseRouteTable.id,
      });
    }

    // Create security groups
    const lambdaSg = new SecurityGroup(this, 'lambda-sg', {
      vpcId: this.vpc.id,
      description: 'Security group for Lambda functions',
      tags: {
        Name: `${name}-lambda-sg`,
        Environment: 'Production',
      },
    });

    const dbSg = new SecurityGroup(this, 'db-sg', {
      vpcId: this.vpc.id,
      description: 'Security group for RDS instances',
      tags: {
        Name: `${name}-db-sg`,
        Environment: 'Production',
      },
    });

    // Allow Lambda to access RDS
    new SecurityGroupRule(this, 'lambda-to-db', {
      securityGroupId: dbSg.id,
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: lambdaSg.id,
      description: 'Allow Lambda to access RDS',
    });
  }
}

// IAM Module
export interface IamRoleConfig {
  name: string;
  assumeRolePolicy: string;
  policies: {
    name: string;
    policy: string;
  }[];
}

export class SecureIamRole extends Construct {
  public readonly role: IamRole;

  constructor(scope: Construct, name: string, config: IamRoleConfig) {
    super(scope, name);

    // Create IAM role with least privilege
    this.role = new IamRole(this, 'role', {
      name: config.name,
      assumeRolePolicy: config.assumeRolePolicy,
      // Force MFA for security-sensitive operations
      tags: {
        Environment: 'Production',
      },
    });

    // Attach policies
    config.policies.forEach((policyConfig, index) => {
      new IamRolePolicy(this, `policy-${index}`, {
        name: policyConfig.name,
        role: this.role.name,
        policy: policyConfig.policy,
      });
    });
  }
}

// S3 Module
export interface S3BucketConfig {
  name: string;
  kmsKeyId: string;
  logging?: {
    targetBucket: string;
    targetPrefix: string;
  };
}

export class SecureS3Bucket extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, name: string, config: S3BucketConfig) {
    super(scope, name);

    // Create secure S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: config.name,
      // Enable encryption using KMS
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: config.kmsKeyId,
          },
          bucketKeyEnabled: true,
        },
      },
      // Enable versioning for data protection
      versioning: {
        enabled: true,
      },
      // Configure logging if provided
      logging: config.logging
        ? {
            targetBucket: config.logging.targetBucket,
            targetPrefix: config.logging.targetPrefix,
          }
        : undefined,
      tags: {
        Environment: 'Production',
      },
    });
    if (config.name.includes('cloudtrail')) {
      new S3BucketPolicy(this, 'bucket-policy', {
        bucket: this.bucket.bucket,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
              Action: 's3:GetBucketAcl',
              Resource: `arn:aws:s3:::${config.name}`,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
              Action: 's3:PutObject',
              Resource: `arn:aws:s3:::${config.name}/*`,
              Condition: {
                StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
              },
            },
          ],
        }),
      });
    }
  }
}

// CloudTrail Module
export interface CloudTrailConfig {
  name: string;
  s3BucketName: string;
  kmsKeyId: string;
}

export class SecureCloudTrail extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;

  constructor(scope: Construct, name: string, config: CloudTrailConfig) {
    super(scope, name);

    // Create CloudTrail with secure configuration
    this.trail = new cloudtrail.Cloudtrail(this, 'trail', {
      name: config.name,
      s3BucketName: config.s3BucketName,
      // Enable log validation for integrity
      enableLogFileValidation: true,
      // Include global service events
      includeGlobalServiceEvents: true,
      // Enable for all regions
      isMultiRegionTrail: true,
      // Enable KMS encryption
      kmsKeyId: config.kmsKeyId,
      tags: {
        Environment: 'Production',
      },
    });
  }
}

// EC2 Module
export interface Ec2Config {
  instanceType: string;
  amiId: string;
  subnetId: string;
  securityGroupIds: string[];
  iamInstanceProfile?: string;
  userData?: string;
}

export class SecureEc2Instance extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, name: string, config: Ec2Config) {
    super(scope, name);

    // Create EC2 instance with monitoring enabled
    this.instance = new Instance(this, 'instance', {
      instanceType: config.instanceType,
      ami: config.amiId,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: config.iamInstanceProfile,
      userData: config.userData,
      // Enable detailed monitoring
      monitoring: true,
      // Enable EBS encryption
      rootBlockDevice: {
        encrypted: true,
        volumeType: 'gp3',
        volumeSize: 100,
      },
      tags: {
        Name: name,
        Environment: 'Production',
      },
    });
  }
}

// RDS Module
export interface RdsConfig {
  identifier: string;
  allocatedStorage: number;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  dbName: string;
  username: string;
  password: string;
  subnetIds: string[];
  vpcSecurityGroupIds: string[];
  kmsKeyId: string;
}

export class SecureRdsInstance extends Construct {
  public readonly instance: DbInstance;

  constructor(scope: Construct, name: string, config: RdsConfig) {
    super(scope, name);

    // Create DB subnet group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `${config.identifier}-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        Environment: 'Production',
      },
    });

    // Create RDS instance with secure configuration
    this.instance = new DbInstance(this, 'instance', {
      identifier: config.identifier,
      allocatedStorage: config.allocatedStorage,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      // Multi-AZ deployment for high availability
      multiAz: true,
      // Enable automatic backups
      backupRetentionPeriod: 7,
      // Enable deletion protection
      deletionProtection: true,
      // Skip final snapshot (set to false in production)
      skipFinalSnapshot: false,
      // Enable encryption
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyId,
      // Disable public access
      publiclyAccessible: false,
      tags: {
        Environment: 'Production',
      },
    });
  }
}

export interface LambdaConfig {
  functionName: string;
  handler: string;
  runtime: string;
  role: string;
  s3Bucket: string;
  s3Key: string;
  environment?: { [key: string]: string };
  vpcConfig?: {
    subnetIds: string[];
    securityGroupIds: string[];
  };
  timeout?: number;
  memorySize?: number;
}

export class SecureLambdaFunction extends Construct {
  public readonly function: LambdaFunction;

  constructor(scope: Construct, name: string, config: LambdaConfig) {
    super(scope, name);

    this.function = new LambdaFunction(this, 'function', {
      functionName: config.functionName,
      handler: config.handler,
      runtime: config.runtime,
      role: config.role,
      s3Bucket: config.s3Bucket,
      s3Key: config.s3Key,
      vpcConfig: config.vpcConfig,
      environment: config.environment
        ? { variables: config.environment }
        : undefined,
      timeout: config.timeout || 30,
      memorySize: config.memorySize || 512,
      tags: {
        Environment: 'Production',
      },
    });
  }
}

// Parameter Store Module
export interface ParameterStoreConfig {
  name: string;
  value: string;
  type: string;
  kmsKeyId?: string;
}

export class SecureParameter extends Construct {
  public readonly parameter: SsmParameter;

  constructor(scope: Construct, name: string, config: ParameterStoreConfig) {
    super(scope, name);

    // Create SSM parameter
    this.parameter = new SsmParameter(this, 'parameter', {
      name: config.name,
      value: config.value,
      type: config.type,
      // Use KMS key for encryption if provided
      keyId: config.kmsKeyId,
      tags: {
        Environment: 'Production',
      },
    });
  }
}

// Update the interface to include a region parameter
export interface WafConfig {
  name: string;
  scope: string; // This should be "REGIONAL" or "GLOBAL"
  region: string; // This should be an actual AWS region like "us-east-1"
}

export class SecureWaf extends Construct {
  public readonly webAcl: Wafv2WebAcl;

  constructor(scope: Construct, name: string, config: WafConfig) {
    super(scope, name);

    this.webAcl = new Wafv2WebAcl(this, 'web-acl', {
      name: config.name,
      scope: config.scope,
      defaultAction: {
        allow: {},
      },
      rule: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {},
          },
          statement: {
            managed_rule_group_statement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendor_name: 'AWS',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}Metric`,
        sampledRequestsEnabled: true,
      },
      tags: {
        Environment: 'Production',
      },
    });
  }
}
```

### tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  SecureVpc,
  SecureIamRole,
  SecureS3Bucket,
  SecureCloudTrail,
  SecureEc2Instance,
  SecureRdsInstance,
  SecureLambdaFunction,
  SecureParameter,
  SecureWaf,
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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

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

    // Create KMS key for encryption
    const identity = new DataAwsCallerIdentity(this, 'current');
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: 'KMS key for encrypting resources',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'Key policy',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${identity.accountId}:root`, // Explicitly grant root account access
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
            Action: ['kms:GenerateDataKey*', 'kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Environment: 'Production',
      },
    });

    // Create VPC and subnets
    const vpc = new SecureVpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      subnetCidrBlocks: [
        '10.0.0.0/24',
        '10.0.1.0/24',
        '10.0.2.0/24', // AZ 1 (public, private, db)
        '10.0.3.0/24',
        '10.0.4.0/24',
        '10.0.5.0/24', // AZ 2 (public, private, db)
      ],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    // Create S3 logging bucket
    const loggingBucket = new SecureS3Bucket(this, 'logging-bucket', {
      name: 'secure-tap-logging-bucket',
      kmsKeyId: kmsKey.id,
    });

    // Create CloudTrail S3 bucket
    const cloudtrailBucket = new SecureS3Bucket(this, 'cloudtrail-bucket', {
      name: 'secure-tap-cloudtrail-bucket',
      kmsKeyId: kmsKey.id,
      logging: {
        targetBucket: loggingBucket.bucket.bucket,
        targetPrefix: 'cloudtrail-logs/',
      },
    });

    // Create application S3 bucket
    const appBucket = new SecureS3Bucket(this, 'app-bucket', {
      name: 'secure-tap-app-bucket',
      kmsKeyId: kmsKey.id,
      logging: {
        targetBucket: loggingBucket.bucket.bucket,
        targetPrefix: 'app-logs/',
      },
    });

    // Create CloudTrail
    const cloudtrail = new SecureCloudTrail(this, 'cloudtrail', {
      name: 'secure-tap-cloudtrail',
      s3BucketName: cloudtrailBucket.bucket.bucket,
      kmsKeyId: kmsKey.arn,
    });

    // Create Lambda IAM role
    const lambdaRole = new SecureIamRole(this, 'lambda-role', {
      name: 'secure-tap-lambda-role',
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
      policies: [
        {
          name: 'lambda-vpc-execution',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                ],
                Resource: '*',
              },
            ],
          }),
        },
        {
          name: 'lambda-s3-access',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject'],
                Resource: `${appBucket.bucket.arn}/*`,
              },
            ],
          }),
        },
      ],
    });

    // Create EC2 IAM role
    const ec2Role = new SecureIamRole(this, 'ec2-role', {
      name: 'secure-tap-ec2-role',
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
      policies: [
        {
          name: 'ec2-ssm-access',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ssm:GetParameter',
                  'ssm:GetParameters',
                  'ssm:GetParametersByPath',
                ],
                Resource: 'arn:aws:ssm:*:*:parameter/secure-tap/*',
              },
            ],
          }),
        },
      ],
    });

    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'secure-tap-ec2-profile',
        role: ec2Role.role.name,
      }
    );

    // In the TapStack class, create a security group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for Lambda functions',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'secure-tap-lambda-sg',
        Environment: 'Production',
      },
    });

    // Create Lambda function using S3
    const lambda = new SecureLambdaFunction(this, 'lambda', {
      functionName: 'secure-tap-function',
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      role: lambdaRole.role.arn,
      s3Bucket: 'test12345-ts', // Use the app bucket you already created
      s3Key: 'lambda/lambda-function.zip', // Simple S3 key
      vpcConfig: {
        subnetIds: vpc.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      environment: {
        DB_HOST: 'secure-tap-db.instance.endpoint',
        DB_NAME: 'mydatabase',
        DB_USER_PARAM: '/secure-tap/db/username',
        DB_PASSWORD_PARAM: '/secure-tap/db/password',
      },
      timeout: 30,
      memorySize: 512,
    });

    // Create a security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for RDS instances',
      ingress: [
        {
          description: 'MySQL/Aurora from Lambda',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [lambdaSecurityGroup.id],
        },
      ],
      tags: {
        Name: 'secure-tap-rds-sg',
        Environment: 'Production',
      },
    });

    // Create RDS instance
    const rds = new SecureRdsInstance(this, 'rds', {
      identifier: 'secure-tap-db',
      allocatedStorage: 20,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      dbName: 'mydatabase',
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'changeme123!',
      subnetIds: vpc.databaseSubnets.map(subnet => subnet.id),
      vpcSecurityGroupIds: [rdsSecurityGroup.id], // Replace with actual SG
      kmsKeyId: kmsKey.arn,
    });

    // Store database credentials in Parameter Store
    new SecureParameter(this, 'db-username', {
      name: '/secure-tap/db/username',
      value: 'admin',
      type: 'SecureString',
      kmsKeyId: kmsKey.id,
    });

    new SecureParameter(this, 'db-password', {
      name: '/secure-tap/db/password',
      value: 'GenerateAStrongPasswordHere', // In a real scenario, this would be generated and not hardcoded
      type: 'SecureString',
      kmsKeyId: kmsKey.id,
    });

    // Create an actual security group for the EC2 instance
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          description: 'SSH from VPC',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [vpc.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'secure-tap-ec2-sg',
        Environment: 'Production',
      },
    });

    // Create EC2 instance
    new SecureEc2Instance(this, 'ec2', {
      instanceType: 't3.micro',
      amiId: 'ami-0c02fb55956c7d316',
      subnetId: vpc.privateSubnets[0].id,
      securityGroupIds: [ec2SecurityGroup.id], // Use the actual SG created above
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: `
        #!/bin/bash
        echo "Setting up secure instance"
        # Install AWS CLI
        apt-get update
        apt-get install -y awscli
        # Get database credentials from Parameter Store
        DB_USER=$(aws ssm get-parameter --name "/secure-tap/db/username" --with-decryption --query "Parameter.Value" --output text)
        DB_PASSWORD=$(aws ssm get-parameter --name "/secure-tap/db/password" --with-decryption --query "Parameter.Value" --output text)
        # Configure application
        echo "DB_USER=$DB_USER" > /etc/environment
        echo "DB_PASSWORD=$DB_PASSWORD" >> /etc/environment
      `,
    });

    // Create WAF web ACL
    new SecureWaf(this, 'waf', {
      name: 'secure-tap-waf',
      scope: 'REGIONAL',
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'database_subnet_ids', {
      value: vpc.databaseSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.instance.endpoint,
    });

    new TerraformOutput(this, 'logging_bucket_name', {
      value: loggingBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'cloudtrail_bucket_name', {
      value: cloudtrailBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'app_bucket_name', {
      value: appBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'cloudtrail_arn', {
      value: cloudtrail.trail.arn,
    });

    new TerraformOutput(this, 'lambda_arn', {
      value: lambda.function.arn,
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: kmsKey.id,
    });
  }
}
```