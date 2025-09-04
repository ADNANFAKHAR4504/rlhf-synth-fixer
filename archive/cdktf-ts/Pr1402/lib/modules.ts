import { Construct } from 'constructs';
/* AWS Core Provider */
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

/* VPC and Networking */
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';

/* IAM */
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

/* S3 */
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';

import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';

/* KMS */
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

/* CloudWatch */
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchLogStream } from '@cdktf/provider-aws/lib/cloudwatch-log-stream';

// Interface definitions for module configurations
export interface VpcModuleConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  tags: { [key: string]: string };
}

export interface SecurityGroupConfig {
  name: string;
  description: string;
  vpcId: string;
  ingressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    sourceSecurityGroupId?: string;
  }>;
  egressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    destinationSecurityGroupId?: string;
  }>;
  tags: { [key: string]: string };
}

export interface S3ModuleConfig {
  bucketName: string;
  kmsKeyId: string;
  enableVersioning: boolean;
  enableLogging: boolean;
  logBucketName?: string;
  tags: { [key: string]: string };
}

export interface IAMModuleConfig {
  roleName: string;
  assumeRolePolicy: string;
  policies: Array<{
    name: string;
    policy: string;
  }>;
  managedPolicyArns?: string[];
  tags: { [key: string]: string };
}

// VPC Module - Creates VPC with public/private subnets, NAT gateway, and routing
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: config.enableDnsHostnames,
      enableDnsSupport: config.enableDnsSupport,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-vpc`,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-igw`,
      },
    });

    // Create public subnets across multiple AZs for high availability
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs for instances
        tags: {
          ...config.tags,
          Name: `${config.tags.Name}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create private subnets for secure internal resources
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: false, // No public IPs for private subnets
        tags: {
          ...config.tags,
          Name: `${config.tags.Name}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      dependsOn: [this.internetGateway],
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-nat-eip`,
      },
    });

    // Create NAT Gateway in first public subnet for private subnet internet access
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-nat-gateway`,
      },
    });

    // Create route table for public subnets with internet gateway route
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-public-rt`,
      },
    });

    // Add route to internet gateway for public subnet internet access
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

    // Create route table for private subnets with NAT gateway route
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-private-rt`,
      },
    });

    // Add route to NAT gateway for private subnet internet access
    new Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
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

// Security Group Module - Creates security groups with configurable ingress/egress rules
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    // Create security group with description for identification
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: config.name,
      description: config.description,
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: config.name,
      },
    });

    // Create ingress rules for inbound traffic control
    config.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-rule-${index}`, {
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
        securityGroupId: this.securityGroup.id,
      });
    });

    // Create egress rules for outbound traffic control
    config.egressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        type: 'egress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.destinationSecurityGroupId,
        securityGroupId: this.securityGroup.id,
      });
    });
  }
}

// Network ACL Module - Creates NACLs for additional subnet-level security
export class NetworkAclModule extends Construct {
  public readonly networkAcl: NetworkAcl;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    subnetIds: string[],
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Create Network ACL for subnet-level traffic filtering
    this.networkAcl = new NetworkAcl(this, 'nacl', {
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: `${tags.Name}-nacl`,
      },
    });

    // Allow inbound HTTP traffic (port 80)
    new NetworkAclRule(this, 'allow-http-inbound', {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    // Allow inbound HTTPS traffic (port 443)
    new NetworkAclRule(this, 'allow-https-inbound', {
      networkAclId: this.networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Allow inbound SSH traffic (port 22) - restrict CIDR as needed
    new NetworkAclRule(this, 'allow-ssh-inbound', {
      networkAclId: this.networkAcl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0', // Consider restricting to specific IP ranges
      fromPort: 22,
      toPort: 22,
    });

    // Allow inbound ephemeral ports for return traffic
    new NetworkAclRule(this, 'allow-ephemeral-inbound', {
      networkAclId: this.networkAcl.id,
      ruleNumber: 130,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // Allow all outbound traffic
    new NetworkAclRule(this, 'allow-all-outbound', {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: '-1', // All protocols
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate NACL with provided subnets
    subnetIds.forEach((subnetId, index) => {
      new NetworkAclAssociation(this, `nacl-association-${index}`, {
        networkAclId: this.networkAcl.id,
        subnetId: subnetId,
      });
    });
  }
}

// KMS Module - Creates KMS keys for encryption with proper key policies
export class KmsModule extends Construct {
  public readonly key: KmsKey;
  public readonly alias: KmsAlias;

  constructor(
    scope: Construct,
    id: string,
    keyDescription: string,
    aliasName: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Get current AWS account and region for key policy
    const currentAccount = new DataAwsCallerIdentity(this, 'current');

    // Create KMS key with policy allowing root account access and service usage
    this.key = new KmsKey(this, 'key', {
      description: keyDescription,
      keyUsage: 'ENCRYPT_DECRYPT',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${currentAccount.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow use of the key for AWS services',
            Effect: 'Allow',
            Principal: {
              Service: ['s3.amazonaws.com', 'logs.amazonaws.com'],
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
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: {
        ...tags,
        Name: keyDescription,
      },
    });

    // Create KMS alias for easier key reference
    this.alias = new KmsAlias(this, 'alias', {
      name: `alias/${aliasName}`,
      targetKeyId: this.key.keyId,
    });
  }
}

// S3 Module - Creates S3 buckets with KMS encryption and security configurations
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketEncryption: S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketVersioning: S3BucketVersioningA;
  public readonly bucketPublicAccessBlock: S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket with proper naming and tags
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: config.bucketName,
      tags: {
        ...config.tags,
        Name: config.bucketName,
      },
    });

    // Configure KMS encryption for bucket - all objects encrypted by default
    this.bucketEncryption = new S3BucketServerSideEncryptionConfigurationA(
      this,
      'encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: config.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Enable versioning for data protection and compliance
    if (config.enableVersioning) {
      this.bucketVersioning = new S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Block all public access for security
    this.bucketPublicAccessBlock = new S3BucketPublicAccessBlock(
      this,
      'public-access-block',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Configure access logging if enabled
    if (config.enableLogging && config.logBucketName) {
      new S3BucketLoggingA(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: config.logBucketName,
        targetPrefix: `${config.bucketName}/`,
      });
    }
  }
}

// IAM Module - Creates IAM roles with least privilege policies
export class IamModule extends Construct {
  public readonly role: IamRole;
  public readonly policies: IamRolePolicy[];

  constructor(scope: Construct, id: string, config: IAMModuleConfig) {
    super(scope, id);

    // Create IAM role with assume role policy
    this.role = new IamRole(this, 'role', {
      name: config.roleName,
      assumeRolePolicy: config.assumeRolePolicy,
      tags: {
        ...config.tags,
        Name: config.roleName,
      },
    });

    // Create inline policies for the role
    this.policies = config.policies.map((policyConfig, index) => {
      return new IamRolePolicy(this, `policy-${index}`, {
        name: policyConfig.name,
        role: this.role.id,
        policy: policyConfig.policy,
      });
    });

    // Attach managed policies if provided
    if (config.managedPolicyArns) {
      config.managedPolicyArns.forEach((arn, index) => {
        new IamRolePolicyAttachment(this, `managed-policy-${index}`, {
          role: this.role.name,
          policyArn: arn,
        });
      });
    }
  }
}

// CloudWatch Module - Creates log groups for centralized logging
export class CloudWatchModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;
  public readonly logStream: CloudwatchLogStream;

  constructor(
    scope: Construct,
    id: string,
    logGroupName: string,
    retentionInDays: number,
    kmsKeyId: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Create CloudWatch Log Group with KMS encryption and retention policy
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: logGroupName,
      retentionInDays: retentionInDays,
      kmsKeyId: kmsKeyId,
      tags: {
        ...tags,
        Name: logGroupName,
      },
    });

    // Create initial log stream
    this.logStream = new CloudwatchLogStream(this, 'log-stream', {
      name: 'default-stream',
      logGroupName: this.logGroup.name,
    });
  }
}
