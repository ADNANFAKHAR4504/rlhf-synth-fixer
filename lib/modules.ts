import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import * as random from '@cdktf/provider-random';

// Common interface for module configuration
export interface BaseModuleConfig {
  environment: string;
  project: string;
  region: string;
}

// VPC Module Configuration
export interface VpcModuleConfig extends BaseModuleConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  allowedSshCidr: string;
}

export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly securityGroupWeb: aws.securityGroup.SecurityGroup;
  public readonly securityGroupSsh: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
      Security: 'Restricted',
    };

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${config.environment}-network-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-igw`,
        },
      }
    );

    // Create Public Subnets
    this.publicSubnets = [];
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-public-subnet-${index + 1}`,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets
    this.privateSubnets = [];
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-private-subnet-${index + 1}`,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create Elastic IPs for NAT Gateways
    this.natGateways = [];
    this.publicSubnets.forEach((subnet, index) => {
      const eip = new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-nat-eip-${index + 1}`,
        },
      });

      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${index}`,
        {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            ...commonTags,
            Name: `${config.environment}-network-nat-gateway-${index + 1}`,
          },
        }
      );
      this.natGateways.push(natGateway);
    });

    // Create Route Tables
    const publicRouteTable = new aws.routeTable.RouteTable(
      this,
      'public-route-table',
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-public-rt`,
        },
      }
    );

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...commonTags,
            Name: `${config.environment}-network-private-rt-${index + 1}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index % this.natGateways.length].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Security Group for Web Traffic
    this.securityGroupWeb = new aws.securityGroup.SecurityGroup(
      this,
      'sg-web',
      {
        vpcId: this.vpc.id,
        description: 'Security group for web traffic',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-sg-web`,
        },
      }
    );

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-web-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroupWeb.id,
    });

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-web-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroupWeb.id,
    });

    // Security Group for SSH
    this.securityGroupSsh = new aws.securityGroup.SecurityGroup(
      this,
      'sg-ssh',
      {
        vpcId: this.vpc.id,
        description: 'Security group for SSH access',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-sg-ssh`,
        },
      }
    );

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-ssh-rule', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.allowedSshCidr],
      securityGroupId: this.securityGroupSsh.id,
    });

    // Egress rules for all security groups
    [this.securityGroupWeb, this.securityGroupSsh].forEach((sg, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `sg-egress-${index}`, {
        type: 'egress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
      });
    });
  }
}

// IAM Module Configuration
export interface IamModuleConfig extends BaseModuleConfig {
  s3BucketArn: string;
}

export class IamModule extends Construct {
  public readonly ec2Role: aws.iamRole.IamRole;
  public readonly lambdaRole: aws.iamRole.IamRole;
  public readonly adminRole: aws.iamRole.IamRole;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    const current = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current'
    );

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Permission Boundary Policy
    const permissionBoundary = new aws.iamPolicy.IamPolicy(
      this,
      'permission-boundary',
      {
        name: `${config.environment}-security-permission-boundary`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Deny',
              Action: [
                'iam:DeleteRolePermissionsBoundary',
                'iam:DeleteUserPermissionsBoundary',
                'iam:PutRolePermissionsBoundary',
                'iam:PutUserPermissionsBoundary',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: commonTags,
      }
    );

    // EC2 Role
    this.ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: `${config.environment}-compute-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      permissionsBoundary: permissionBoundary.arn,
      tags: commonTags,
    });

    // EC2 Policy
    const ec2Policy = new aws.iamPolicy.IamPolicy(this, 'ec2-policy', {
      name: `${config.environment}-compute-ec2-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [config.s3BucketArn, `${config.s3BucketArn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: `arn:aws:secretsmanager:${config.region}:*:secret:${config.environment}-*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: `arn:aws:logs:${config.region}:*:*`,
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: ec2Policy.arn,
      }
    );

    // Lambda Role
    this.lambdaRole = new aws.iamRole.IamRole(this, 'lambda-role', {
      name: `${config.environment}-compute-lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      permissionsBoundary: permissionBoundary.arn,
      tags: commonTags,
    });

    // Lambda Policy
    const lambdaPolicy = new aws.iamPolicy.IamPolicy(this, 'lambda-policy', {
      name: `${config.environment}-compute-lambda-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: `arn:aws:secretsmanager:${config.region}:*:secret:${config.environment}-*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${config.region}:*:*`,
          },
        ],
      }),
      tags: commonTags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'lambda-policy-attachment',
      {
        role: this.lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      }
    );

    // Admin Role (with MFA requirement)
    this.adminRole = new aws.iamRole.IamRole(this, 'admin-role', {
      name: `${config.environment}-security-admin-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${current.accountId}:root` },
            Action: 'sts:AssumeRole',
            Condition: {
              Bool: { 'aws:MultiFactorAuthPresent': 'true' },
            },
          },
        ],
      }),
      maxSessionDuration: 3600,
      tags: commonTags,
    });
  }
}

// Secrets Module Configuration
export interface SecretsModuleConfig extends BaseModuleConfig {
  kmsKeyId: string;
}

export class SecretsModule extends Construct {
  public readonly databaseSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly configSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;

  constructor(scope: Construct, id: string, config: SecretsModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Database Credentials Secret
    this.databaseSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: `${config.environment}-database-credentials`,
        description: 'RDS database credentials',
        kmsKeyId: config.kmsKeyId,
        tags: commonTags,
      }
    );

    // Generate random password for database
    const dbPassword = new random.password.Password(this, 'db-password', {
      length: 32,
      special: true,
      minSpecial: 2,
      minNumeric: 2,
      minLower: 4,
    });

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: this.databaseSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: dbPassword.result,
          engine: 'mysql',
          port: 3306,
        }),
      }
    );

    // Configuration Parameters Secret
    this.configSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'config-secret',
      {
        name: `${config.environment}-config-parameters`,
        description: 'Application configuration parameters',
        kmsKeyId: config.kmsKeyId,
        tags: commonTags,
      }
    );

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      'config-secret-version',
      {
        secretId: this.configSecret.id,
        secretString: JSON.stringify({
          environment: config.environment,
          region: config.region,
          logLevel: 'INFO',
        }),
      }
    );
  }
}

// S3 Module Configuration
export interface S3ModuleConfig extends BaseModuleConfig {
  kmsKeyId: string;
}

export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketAcl: aws.s3BucketAcl.S3BucketAcl;
  public readonly bucketVersioning: aws.s3BucketVersioning.S3BucketVersioningA;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Create S3 Bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: `${config.environment}-storage-assets`,
      tags: commonTags,
    });

    // Add bucket ownership controls (replaces ACL)
    new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'bucket-ownership',
      {
        bucket: this.bucket.id,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      }
    );

    // Block all public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'bucket-pab',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Enable versioning
    this.bucketVersioning = new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'bucket-versioning',
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable encryption with KMS
    this.bucketEncryption =
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
        this,
        'bucket-encryption',
        {
          bucket: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: config.kmsKeyId,
              },
            },
          ],
        }
      );

    // Add lifecycle policy
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'bucket-lifecycle',
      {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'delete-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 30,
              },
            ],
          },
        ],
      }
    );
  }
}

// CloudFront Module Configuration
export interface CloudFrontModuleConfig extends BaseModuleConfig {
  s3BucketDomainName: string;
  s3BucketArn: string;
  s3BucketName: string;
}

export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly originAccessIdentity: aws.cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity;

  constructor(scope: Construct, id: string, config: CloudFrontModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Create Origin Access Identity
    this.originAccessIdentity =
      new aws.cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity(
        this,
        'oai',
        {
          comment: `OAI for ${config.environment}-cdn-distribution`,
        }
      );

    // Create CloudFront Distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      'distribution',
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `${config.environment}-cdn-distribution`,
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',

        origin: [
          {
            domainName: config.s3BucketDomainName,
            originId: 's3-origin',
            s3OriginConfig: {
              originAccessIdentity:
                this.originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
        ],

        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: 's3-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,
          compress: true,
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        tags: commonTags,
      }
    );

    // Update S3 bucket policy to allow CloudFront access
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'bucket-policy', {
      bucket: config.s3BucketName,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${this.originAccessIdentity.id}`,
            },
            Action: 's3:GetObject',
            Resource: `${config.s3BucketArn}/*`,
          },
        ],
      }),
    });
  }
}

// EC2 Module Configuration
export interface Ec2ModuleConfig extends BaseModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceType: string;
  iamInstanceProfile: string;
  keyName?: string;
}

export class Ec2Module extends Construct {
  public readonly instances: aws.instance.Instance[];

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create IAM Instance Profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        name: `${config.environment}-compute-ec2-profile`,
        role: config.iamInstanceProfile,
        tags: commonTags,
      }
    );

    // Create EC2 Instances
    this.instances = [];
    config.subnetIds.forEach((subnetId, index) => {
      const instance = new aws.instance.Instance(this, `instance-${index}`, {
        ami: ami.id,
        instanceType: config.instanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: config.securityGroupIds,
        iamInstanceProfile: instanceProfile.name,
        keyName: config.keyName,

        monitoring: true, // Enable detailed monitoring
        disableApiTermination: true, // Enable termination protection

        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Require IMDSv2
          httpPutResponseHopLimit: 1,
        },

        userData: btoa(`#!/bin/bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install SSM agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Update system
yum update -y
`),

        tags: {
          ...commonTags,
          Name: `${config.environment}-compute-ec2-${index + 1}`,
        },
      });
      this.instances.push(instance);
    });
  }
}

// RDS Module Configuration
export interface RdsModuleConfig extends BaseModuleConfig {
  vpcId: string;
  subnetIds: string[];
  kmsKeyArn: string;
  secretArn: string;
  allowedSecurityGroupId: string;
}

export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
      Database: 'RDS-MySQL',
    };

    // Create DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${config.environment}-database-subnet-group`,
        subnetIds: config.subnetIds,
        description: `Database subnet group for ${config.environment}`,
        tags: commonTags,
      }
    );

    // Create Security Group for RDS
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'db-security-group',
      {
        vpcId: config.vpcId,
        name: `${config.environment}-database-sg`,
        description: 'Security group for RDS MySQL',
        tags: {
          ...commonTags,
          Name: `${config.environment}-database-sg`,
        },
      }
    );

    // Allow access from EC2 security group
    new aws.securityGroupRule.SecurityGroupRule(this, 'db-sg-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: config.allowedSecurityGroupId,
      securityGroupId: this.dbSecurityGroup.id,
    });

    // Create RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db-instance', {
      identifier: `${config.environment}-database-mysql`,
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyArn,

      dbName: 'application',
      username: 'tap_admin',
      manageMasterUserPassword: true,

      multiAz: true,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.environment}-database-final-snapshot-${Date.now()}`,

      enabledCloudwatchLogsExports: ['error'],

      tags: commonTags,
    });
  }
}

// CloudWatch Module Configuration
export interface CloudWatchModuleConfig extends BaseModuleConfig {
  ec2InstanceIds: string[];
  rdsInstanceId: string;
  snsTopicArn: string;
}

export class CloudWatchModule extends Construct {
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly ec2CpuAlarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];
  public readonly rdsCpuAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;
  public readonly rdsFreeStorageAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;
  public readonly snsTopic: aws.snsTopic.SnsTopic;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Create SNS Topic for Alarms
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'sns-topic', {
      name: `${config.environment}-monitoring-alerts`,
      kmsMasterKeyId: 'alias/aws/sns',
      tags: commonTags,
    });

    // Create Log Group
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: `/aws/${config.environment}/application`,
        retentionInDays: 30,
        tags: commonTags,
      }
    );

    // Create EC2 CPU Alarms
    this.ec2CpuAlarms = [];
    config.ec2InstanceIds.forEach((instanceId, index) => {
      const alarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        `ec2-cpu-alarm-${index}`,
        {
          alarmName: `${config.environment}-compute-ec2-${index + 1}-cpu-high`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          alarmDescription: `EC2 instance ${instanceId} CPU above 80%`,
          dimensions: {
            InstanceId: instanceId,
          },
          alarmActions: [this.snsTopic.arn],
          tags: commonTags,
        }
      );
      this.ec2CpuAlarms.push(alarm);
    });

    // Create RDS CPU Alarm
    this.rdsCpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-cpu-alarm',
      {
        alarmName: `${config.environment}-database-cpu-high`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 75,
        alarmDescription: 'RDS CPU above 75%',
        dimensions: {
          DBInstanceIdentifier: config.rdsInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: commonTags,
      }
    );

    // Create RDS Free Storage Alarm
    this.rdsFreeStorageAlarm =
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-storage-alarm',
        {
          alarmName: `${config.environment}-database-storage-low`,
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 1,
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 2147483648, // 2GB in bytes
          alarmDescription: 'RDS free storage below 2GB',
          dimensions: {
            DBInstanceIdentifier: config.rdsInstanceId,
          },
          alarmActions: [this.snsTopic.arn],
          tags: commonTags,
        }
      );

    // Create RDS Connection Errors Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-connection-alarm',
      {
        alarmName: `${config.environment}-database-connection-errors`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS connection count high',
        dimensions: {
          DBInstanceIdentifier: config.rdsInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: commonTags,
      }
    );
  }
}

// OpenSearch Module Configuration
export interface OpenSearchModuleConfig extends BaseModuleConfig {
  kmsKeyId: string;
}

export class OpenSearchModule extends Construct {
  public readonly domain: aws.opensearchDomain.OpensearchDomain;

  constructor(scope: Construct, id: string, config: OpenSearchModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
    };

    // Create OpenSearch Domain
    this.domain = new aws.opensearchDomain.OpensearchDomain(
      this,
      'opensearch',
      {
        domainName: `${config.environment}-search-domain`,
        engineVersion: 'OpenSearch_2.5',

        clusterConfig: {
          instanceType: 't3.small.search',
          instanceCount: 1,
          zoneAwarenessEnabled: false,
        },

        ebsOptions: {
          ebsEnabled: true,
          volumeType: 'gp3',
          volumeSize: 20,
        },

        nodeToNodeEncryption: {
          enabled: true,
        },

        domainEndpointOptions: {
          enforceHttps: true,
          tlsSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07',
        },

        tags: commonTags,
      }
    );

    // Create access policy
    new aws.opensearchDomainPolicy.OpensearchDomainPolicy(
      this,
      'opensearch-policy',
      {
        domainName: this.domain.domainName,
        accessPolicies: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: '*',
              },
              Action: 'es:*',
              Resource: `${this.domain.arn}/*`,
              Condition: {
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8'],
                },
              },
            },
          ],
        }),
      }
    );
  }
}
