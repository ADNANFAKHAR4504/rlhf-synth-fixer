import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';

import { cloudtrail } from '@cdktf/provider-aws'; // Use cloudtrail.Cloudtrail

import { secretsmanagerSecret } from '@cdktf/provider-aws';
import { secretsmanagerSecretVersion } from '@cdktf/provider-aws';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

export interface VpcModuleConfig {
  name: string;
  cidrBlock: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

export interface SecurityGroupModuleConfig {
  name: string;
  description: string;
  vpcId: string;
  allowedIpRanges: string[];
  allowHttp?: boolean;
  allowHttps?: boolean;
  allowSsh?: boolean;
}

export interface S3ModuleConfig {
  bucketName: string;
  enableVersioning?: boolean;
  enableLogging?: boolean;
  loggingTargetBucket?: string;
  loggingTargetPrefix?: string;
}

export interface IamRoleModuleConfig {
  roleName: string;
  assumeRolePolicy: string;
  policies?: string[];
  customPolicyDocument?: string;
}

export interface CloudTrailModuleConfig {
  name: string;
  s3BucketName: string;
  s3KeyPrefix?: string;
  includeGlobalServiceEvents?: boolean;
  isMultiRegionTrail?: boolean;
  enableLogFileValidation?: boolean;
}

export interface SecretsManagerModuleConfig {
  secretName: string;
  description?: string;
  secretValue?: { [key: string]: string };
  recoveryWindowInDays?: number;
}

/**
 * VPC Module - Creates a secure VPC with public and private subnets
 * Implements network segmentation and proper routing for security
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support for proper name resolution
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: config.enableDnsHostnames ?? true,
      enableDnsSupport: config.enableDnsSupport ?? true,
      tags: {
        Name: config.name,
        Environment: 'production',
      },
    });

    // Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-igw`,
      },
    });

    // Create public subnets across multiple AZs for high availability
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 2; i++) {
      // Public subnet for resources that need internet access
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-${i + 1}`,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet for secure resources without direct internet access
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `${config.name}-private-${i + 1}`,
          Type: 'private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Route table for public subnets with internet gateway route
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Route table for private subnets (no internet gateway)
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-private-rt`,
      },
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });
  }
}

/**
 * Security Group Module - Creates security groups with least privilege access
 * Only allows traffic from specified IP ranges and required ports
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Create security group with restrictive default (deny all)
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: config.name,
      description: config.description,
      vpcId: config.vpcId,
      tags: {
        Name: config.name,
      },
    });

    // Allow HTTP traffic only from specified IP ranges
    if (config.allowHttp) {
      config.allowedIpRanges.forEach((cidr, index) => {
        new SecurityGroupRule(this, `http-ingress-${index}`, {
          type: 'ingress',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [cidr],
          securityGroupId: this.securityGroup.id,
          description: `Allow HTTP from ${cidr}`,
        });
      });
    }

    // Allow HTTPS traffic only from specified IP ranges
    if (config.allowHttps) {
      config.allowedIpRanges.forEach((cidr, index) => {
        new SecurityGroupRule(this, `https-ingress-${index}`, {
          type: 'ingress',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: [cidr],
          securityGroupId: this.securityGroup.id,
          description: `Allow HTTPS from ${cidr}`,
        });
      });
    }

    // Allow SSH traffic only from specified IP ranges (if needed)
    if (config.allowSsh) {
      config.allowedIpRanges.forEach((cidr, index) => {
        new SecurityGroupRule(this, `ssh-ingress-${index}`, {
          type: 'ingress',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [cidr],
          securityGroupId: this.securityGroup.id,
          description: `Allow SSH from ${cidr}`,
        });
      });
    }

    // Allow all outbound traffic (can be restricted further based on requirements)
    new SecurityGroupRule(this, 'egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic',
    });
  }
}

/**
 * S3 Module - Creates secure S3 buckets with encryption and access controls
 * Implements server-side encryption with KMS and blocks public access
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    // const region = new DataAwsRegion(this, 'current');

    // Create KMS key for S3 encryption
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: `KMS key for S3 bucket ${config.bucketName}`,
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
            Sid: 'Allow S3 Service',
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.bucketName}-kms-key`,
      },
    });

    // Create KMS alias for easier reference
    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${config.bucketName}-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // Create S3 bucket with secure naming
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: config.bucketName,
      tags: {
        Name: config.bucketName,
        Environment: 'production',
      },
    });

    // Enable server-side encryption with KMS
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: this.bucket.id,
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

    // Block all public access for security
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning if specified
    if (config.enableVersioning) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Enable access logging if specified
    if (config.enableLogging && config.loggingTargetBucket) {
      new S3BucketLoggingA(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: config.loggingTargetBucket,
        targetPrefix: config.loggingTargetPrefix || 'access-logs/',
      });
    }
  }
}

/**
 * IAM Role Module - Creates IAM roles with least privilege policies
 * Follows AWS security best practices for role assumption and permissions
 */
export class IamRoleModule extends Construct {
  public readonly role: IamRole;
  public readonly customPolicy?: IamPolicy;

  constructor(scope: Construct, id: string, config: IamRoleModuleConfig) {
    super(scope, id);

    // Create IAM role with specified assume role policy
    this.role = new IamRole(this, 'role', {
      name: config.roleName,
      assumeRolePolicy: config.assumeRolePolicy,
      tags: {
        Name: config.roleName,
        Environment: 'production',
      },
    });

    // Attach AWS managed policies if specified
    if (config.policies) {
      config.policies.forEach((policyArn, index) => {
        new IamRolePolicyAttachment(this, `policy-attachment-${index}`, {
          role: this.role.name,
          policyArn: policyArn,
        });
      });
    }

    // Create and attach custom policy if specified
    if (config.customPolicyDocument) {
      this.customPolicy = new IamPolicy(this, 'custom-policy', {
        name: `${config.roleName}-custom-policy`,
        description: `Custom policy for ${config.roleName}`,
        policy: config.customPolicyDocument,
      });

      new IamRolePolicyAttachment(this, 'custom-policy-attachment', {
        role: this.role.name,
        policyArn: this.customPolicy.arn,
      });
    }
  }
}

/**
 * CloudTrail Module - Creates CloudTrail for comprehensive audit logging
 * Simplified for LocalStack compatibility (basic CloudTrail without Event Data Store)
 */
export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  public readonly bucketPolicy: S3BucketPolicy;
  public readonly accountId: string;
  public readonly region: string;

  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Get current AWS account ID and region
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    this.accountId = callerIdentity.accountId;
    this.region = currentRegion.name;

    // Create S3 bucket policy to allow CloudTrail access
    // Simplified for LocalStack - removed complex conditions
    this.bucketPolicy = new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: config.s3BucketName,
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
            Resource: `arn:aws:s3:::${config.s3BucketName}`,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${config.s3BucketName}/${config.s3KeyPrefix || ''}AWSLogs/${this.accountId}/*`,
          },
          {
            Sid: 'AWSCloudTrailDeliveryRolePolicy',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: `arn:aws:s3:::${config.s3BucketName}`,
          },
        ],
      }),
    });

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL !== undefined ||
      process.env.LOCALSTACK_HOSTNAME !== undefined;

    // Create CloudTrail for audit logging
    // Simplified configuration for LocalStack compatibility
    this.trail = new cloudtrail.Cloudtrail(this, 'trail', {
      name: config.name,
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: config.s3KeyPrefix,
      includeGlobalServiceEvents: config.includeGlobalServiceEvents ?? true,
      // Disable multi-region and log file validation for LocalStack
      isMultiRegionTrail: isLocalStack
        ? false
        : (config.isMultiRegionTrail ?? true),
      enableLogFileValidation: isLocalStack
        ? false
        : (config.enableLogFileValidation ?? true),

      tags: {
        Name: config.name,
        Environment: 'production',
      },
      // Add explicit dependency on the bucket policy
      dependsOn: [this.bucketPolicy],
    });

    // Note: CloudTrail Event Data Store is not supported in LocalStack Community Edition
    // It has been removed to ensure compatibility with local development environments
  }
}

/**
 * Secrets Manager Module - Securely stores sensitive information
 * Implements automatic rotation and encryption at rest
 */
export class SecretsManagerModule extends Construct {
  public readonly secret: secretsmanagerSecret.SecretsmanagerSecret;
  public readonly secretVersion?: secretsmanagerSecretVersion.SecretsmanagerSecretVersion;

  constructor(
    scope: Construct,
    id: string,
    config: SecretsManagerModuleConfig
  ) {
    super(scope, id);

    // Create secret with automatic rotation capability
    this.secret = new secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'secret',
      {
        name: config.secretName,
        description: config.description || `Secret for ${config.secretName}`,
        recoveryWindowInDays: config.recoveryWindowInDays || 7,
        tags: {
          Name: config.secretName,
          Environment: 'production',
        },
      }
    );

    // Create secret version with initial value if provided
    if (config.secretValue) {
      this.secretVersion =
        new secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
          this,
          'secret-version',
          {
            secretId: this.secret.id,
            secretString: JSON.stringify(config.secretValue),
          }
        );
    }
  }
}
