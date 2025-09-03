I'll create a secure AWS environment using CDK for Terraform (TypeScript) split into two files as requested. Here are the complete files:

## modules.ts

```typescript
// modules.ts
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
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  SecurityGroupModule,
  NetworkAclModule,
  KmsModule,
  S3Module,
  IamModule,
  CloudWatchModule,
  VpcModuleConfig,
  SecurityGroupConfig,
  S3ModuleConfig,
  IAMModuleConfig,
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

    // Environment variables and configuration
    const environment = environmentSuffix || 'dev';
    const projectName = process.env.PROJECT_NAME || 'tap-project';

    // Common tags applied to all resources
    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'terraform',
      Owner: process.env.OWNER || 'infrastructure-team',
    };

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

    // ? Add your stack instantiations here
    // Network configuration - customize CIDR blocks as needed
    const vpcConfig: VpcModuleConfig = {
      vpcCidr: process.env.VPC_CIDR || '10.0.0.0/16',
      publicSubnetCidrs: [
        process.env.PUBLIC_SUBNET_1_CIDR || '10.0.1.0/24',
        process.env.PUBLIC_SUBNET_2_CIDR || '10.0.2.0/24',
      ],
      privateSubnetCidrs: [
        process.env.PRIVATE_SUBNET_1_CIDR || '10.0.10.0/24',
        process.env.PRIVATE_SUBNET_2_CIDR || '10.0.20.0/24',
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: commonTags,
    };

    // Create VPC with public/private subnets and NAT gateway
    const vpc = new VpcModule(this, 'vpc', vpcConfig);

    // Create KMS keys for encryption
    const s3KmsKey = new KmsModule(
      this,
      's3-kms',
      'KMS key for S3 bucket encryption',
      `${projectName}-s3-key`,
      commonTags
    );

    const logsKmsKey = new KmsModule(
      this,
      'logs-kms',
      'KMS key for CloudWatch Logs encryption',
      `${projectName}-logs-key`,
      commonTags
    );

    // Security Group for web servers - allows HTTP, HTTPS, and SSH
    const webSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName}-web-sg`,
      description: 'Security group for web servers',
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Allow HTTP from anywhere
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Allow HTTPS from anywhere
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [process.env.SSH_ALLOWED_CIDR || '0.0.0.0/0'], // SSH access - restrict as needed
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'], // Allow all outbound traffic
        },
      ],
      tags: commonTags,
    };

    const webSecurityGroup = new SecurityGroupModule(
      this,
      'web-sg',
      webSecurityGroupConfig
    );

    // Security Group for database servers - allows MySQL/PostgreSQL from web servers only
    const dbSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName}-db-sg`,
      description: 'Security group for database servers',
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id, // MySQL from web servers
        },
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id, // PostgreSQL from web servers
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'], // Allow all outbound traffic
        },
      ],
      tags: commonTags,
    };

    const dbSecurityGroup = new SecurityGroupModule(
      this,
      'db-sg',
      dbSecurityGroupConfig
    );

    // Create Network ACLs for additional subnet protection
    new NetworkAclModule(
      this,
      'public-nacl',
      vpc.vpc.id,
      vpc.publicSubnets.map(subnet => subnet.id),
      { ...commonTags, Name: `${projectName}-public` }
    );

    new NetworkAclModule(
      this,
      'private-nacl',
      vpc.vpc.id,
      vpc.privateSubnets.map(subnet => subnet.id),
      { ...commonTags, Name: `${projectName}-private` }
    );

    // S3 bucket for application data with KMS encryption
    const dataBucketConfig: S3ModuleConfig = {
      bucketName:
        process.env.DATA_BUCKET_NAME ||
        `${projectName}-data-${environment}-${Date.now()}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false, // Set to true if you have a separate logging bucket
      tags: { ...commonTags, Purpose: 'application-data' },
    };

    const dataBucket = new S3Module(this, 'data-bucket', dataBucketConfig);

    // S3 bucket for logs with KMS encryption
    const logsBucketConfig: S3ModuleConfig = {
      bucketName:
        process.env.LOGS_BUCKET_NAME ||
        `${projectName}-logs-${environment}-${Date.now()}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false,
      tags: { ...commonTags, Purpose: 'logs-storage' },
    };

    const logsBucket = new S3Module(this, 'logs-bucket', logsBucketConfig);

    // IAM role for EC2 instances with S3 and CloudWatch permissions
    const ec2RoleConfig: IAMModuleConfig = {
      roleName: `${projectName}-ec2-role`,
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
          name: 'S3DataBucketAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                ],
                Resource: [dataBucket.bucket.arn, `${dataBucket.bucket.arn}/*`],
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: s3KmsKey.key.arn,
              },
            ],
          }),
        },
        {
          name: 'CloudWatchLogsAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                  'logs:DescribeLogGroups',
                ],
                Resource: 'arn:aws:logs:us-east-1:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: logsKmsKey.key.arn,
              },
            ],
          }),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy', // For CloudWatch monitoring
      ],
      tags: commonTags,
    };

    const ec2Role = new IamModule(this, 'ec2-role', ec2RoleConfig);

    // IAM role for Lambda functions with minimal permissions
    const lambdaRoleConfig: IAMModuleConfig = {
      roleName: `${projectName}-lambda-role`,
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
          name: 'S3ReadOnlyAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: [dataBucket.bucket.arn, `${dataBucket.bucket.arn}/*`],
              },
            ],
          }),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
      tags: commonTags,
    };

    const lambdaRole = new IamModule(this, 'lambda-role', lambdaRoleConfig);

    // CloudWatch Log Groups for application and system logs
    const appLogGroup = new CloudWatchModule(
      this,
      'app-logs',
      `/aws/application/${projectName}`,
      30, // 30 days retention
      logsKmsKey.key.arn,
      { ...commonTags, LogType: 'application' }
    );

    const systemLogGroup = new CloudWatchModule(
      this,
      'system-logs',
      `/aws/system/${projectName}`,
      7, // 7 days retention for system logs
      logsKmsKey.key.arn,
      { ...commonTags, LogType: 'system' }
    );

    // Export important resource information as outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'web-security-group-id', {
      value: webSecurityGroup.securityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: dbSecurityGroup.securityGroup.id,
      description: 'ID of the database security group',
    });

    new TerraformOutput(this, 'data-bucket-name', {
      value: dataBucket.bucket.id,
      description: 'Name of the data S3 bucket',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket.id,
      description: 'Name of the logs S3 bucket',
    });

    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3KmsKey.key.keyId,
      description: 'ID of the S3 KMS encryption key',
    });

    new TerraformOutput(this, 's3-kms-key-arn', {
      value: s3KmsKey.key.arn,
      description: 'ARN of the S3 KMS encryption key',
    });

    new TerraformOutput(this, 'logs-kms-key-id', {
      value: logsKmsKey.key.keyId,
      description: 'ID of the CloudWatch Logs KMS encryption key',
    });

    new TerraformOutput(this, 'ec2-role-arn', {
      value: ec2Role.role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: lambdaRole.role.arn,
      description: 'ARN of the Lambda IAM role',
    });

    new TerraformOutput(this, 'app-log-group-name', {
      value: appLogGroup.logGroup.name,
      description: 'Name of the application CloudWatch log group',
    });

    new TerraformOutput(this, 'system-log-group-name', {
      value: systemLogGroup.logGroup.name,
      description: 'Name of the system CloudWatch log group',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpc.natGateway.id,
      description: 'ID of the NAT gateway',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpc.internetGateway.id,
      description: 'ID of the internet gateway',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```