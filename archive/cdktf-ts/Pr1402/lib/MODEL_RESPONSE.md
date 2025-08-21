I'll create a secure AWS environment using CDK for Terraform (TypeScript) split into the two files you requested. Here are the complete files:

## `modules.ts`

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  DataAwsAvailabilityZones,
  DataAwsCallerIdentity,
  DataAwsRegion,
} from "@cdktf/provider-aws";
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
  SecurityGroupRule,
  NetworkAcl,
  NetworkAclRule,
  NetworkAclAssociation,
} from "@cdktf/provider-aws/lib/vpc";
import {
  IamRole,
  IamRolePolicy,
  IamRolePolicyAttachment,
  DataAwsIamPolicyDocument,
} from "@cdktf/provider-aws/lib/iam";
import {
  S3Bucket,
  S3BucketEncryption,
  S3BucketPublicAccessBlock,
  S3BucketVersioning,
  S3BucketLogging,
  S3BucketNotification,
} from "@cdktf/provider-aws/lib/s3";
import {
  KmsKey,
  KmsAlias,
} from "@cdktf/provider-aws/lib/kms";
import {
  CloudwatchLogGroup,
  CloudwatchLogStream,
} from "@cdktf/provider-aws/lib/cloudwatch";

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
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: config.enableDnsHostnames,
      enableDnsSupport: config.enableDnsSupport,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-vpc`,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "igw", {
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
          Type: "Public",
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
          Type: "Private",
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      dependsOn: [this.internetGateway],
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-nat-eip`,
      },
    });

    // Create NAT Gateway in first public subnet for private subnet internet access
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-nat-gateway`,
      },
    });

    // Create route table for public subnets with internet gateway route
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-public-rt`,
      },
    });

    // Add route to internet gateway for public subnet internet access
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
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
    this.privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name}-private-rt`,
      },
    });

    // Add route to NAT gateway for private subnet internet access
    new Route(this, "private-route", {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
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
    this.securityGroup = new SecurityGroup(this, "sg", {
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
        type: "ingress",
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
        type: "egress",
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
    this.networkAcl = new NetworkAcl(this, "nacl", {
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: `${tags.Name}-nacl`,
      },
    });

    // Allow inbound HTTP traffic (port 80)
    new NetworkAclRule(this, "allow-http-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
    });

    // Allow inbound HTTPS traffic (port 443)
    new NetworkAclRule(this, "allow-https-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
    });

    // Allow inbound SSH traffic (port 22) - restrict CIDR as needed
    new NetworkAclRule(this, "allow-ssh-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0", // Consider restricting to specific IP ranges
      fromPort: 22,
      toPort: 22,
    });

    // Allow inbound ephemeral ports for return traffic
    new NetworkAclRule(this, "allow-ephemeral-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 130,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
    });

    // Allow all outbound traffic
    new NetworkAclRule(this, "allow-all-outbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: "-1", // All protocols
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
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
    const currentAccount = new DataAwsCallerIdentity(this, "current");
    const currentRegion = new DataAwsRegion(this, "current");

    // Create KMS key with policy allowing root account access and service usage
    this.key = new KmsKey(this, "key", {
      description: keyDescription,
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${currentAccount.accountId}:root`,
            },
            Action: "kms:*",
            Resource: "*",
          },
          {
            Sid: "Allow use of the key for AWS services",
            Effect: "Allow",
            Principal: {
              Service: ["s3.amazonaws.com", "logs.amazonaws.com"],
            },
            Action: [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:ReEncrypt*",
              "kms:GenerateDataKey*",
              "kms:DescribeKey",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: {
        ...tags,
        Name: keyDescription,
      },
    });

    // Create KMS alias for easier key reference
    this.alias = new KmsAlias(this, "alias", {
      name: `alias/${aliasName}`,
      targetKeyId: this.key.keyId,
    });
  }
}

// S3 Module - Creates S3 buckets with KMS encryption and security configurations
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketEncryption: S3BucketEncryption;
  public readonly bucketVersioning: S3BucketVersioning;
  public readonly bucketPublicAccessBlock: S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket with proper naming and tags
    this.bucket = new S3Bucket(this, "bucket", {
      bucket: config.bucketName,
      tags: {
        ...config.tags,
        Name: config.bucketName,
      },
    });

    // Configure KMS encryption for bucket - all objects encrypted by default
    this.bucketEncryption = new S3BucketEncryption(this, "encryption", {
      bucket: this.bucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.kmsKeyId,
          },
          bucketKeyEnabled: true, // Reduces KMS costs
        },
      },
    });

    // Enable versioning for data protection and compliance
    if (config.enableVersioning) {
      this.bucketVersioning = new S3BucketVersioning(this, "versioning", {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      });
    }

    // Block all public access for security
    this.bucketPublicAccessBlock = new S3BucketPublicAccessBlock(
      this,
      "public-access-block",
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
      new S3BucketLogging(this, "logging", {
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
    this.role = new IamRole(this, "role", {
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
    this.logGroup = new CloudwatchLogGroup(this, "log-group", {
      name: logGroupName,
      retentionInDays: retentionInDays,
      kmsKeyId: kmsKeyId,
      tags: {
        ...tags,
        Name: logGroupName,
      },
    });

    // Create initial log stream
    this.logStream = new CloudwatchLogStream(this, "log-stream", {
      name: "default-stream",
      logGroupName: this.logGroup.name,
    });
  }
}
```

## `tap-stack.ts`

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, TerraformVariable } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
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
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Define Terraform variables for configuration flexibility
    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      description: "Environment name (e.g., dev, staging, prod)",
      default: "dev",
    });

    const projectName = new TerraformVariable(this, "project_name", {
      type: "string",
      description: "Project name for resource naming",
      default: "tap-project",
    });

    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      description: "CIDR block for VPC",
      default: "10.0.0.0/16",
    });

    const publicSubnetCidrs = new TerraformVariable(this, "public_subnet_cidrs", {
      type: "list(string)",
      description: "CIDR blocks for public subnets",
      default: ["10.0.1.0/24", "10.0.2.0/24"],
    });

    const privateSubnetCidrs = new TerraformVariable(this, "private_subnet_cidrs", {
      type: "list(string)",
      description: "CIDR blocks for private subnets",
      default: ["10.0.10.0/24", "10.0.20.0/24"],
    });

    const allowedSshCidr = new TerraformVariable(this, "allowed_ssh_cidr", {
      type: "string",
      description: "CIDR block allowed for SSH access",
      default: "0.0.0.0/0", // Restrict this in production
    });

    const s3BucketPrefix = new TerraformVariable(this, "s3_bucket_prefix", {
      type: "string",
      description: "Prefix for S3 bucket names",
      default: "tap-secure-bucket",
    });

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: {
        tags: {
          Environment: environment.stringValue,
          Project: projectName.stringValue,
          ManagedBy: "Terraform-CDK",
          Region: "us-east-1",
        },
      },
    });

    // Common tags for all resources
    const commonTags = {
      Environment: environment.stringValue,
      Project: projectName.stringValue,
      ManagedBy: "Terraform-CDK",
    };

    // Create KMS keys for encryption
    const s3KmsKey = new KmsModule(
      this,
      "s3-kms-key",
      "KMS key for S3 bucket encryption",
      `${projectName.stringValue}-s3-key`,
      commonTags
    );

    const logsKmsKey = new KmsModule(
      this,
      "logs-kms-key",
      "KMS key for CloudWatch Logs encryption",
      `${projectName.stringValue}-logs-key`,
      commonTags
    );

    // Create VPC with public and private subnets
    const vpcConfig: VpcModuleConfig = {
      vpcCidr: vpcCidr.stringValue,
      publicSubnetCidrs: publicSubnetCidrs.listValue,
      privateSubnetCidrs: privateSubnetCidrs.listValue,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}`,
      },
    };

    const vpc = new VpcModule(this, "vpc", vpcConfig);

    // Create Security Group for web servers (HTTP/HTTPS access)
    const webSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName.stringValue}-web-sg`,
      description: "Security group for web servers",
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: commonTags,
    };

    const webSecurityGroup = new SecurityGroupModule(
      this,
      "web-security-group",
      webSecurityGroupConfig
    );

    // Create Security Group for SSH access (restricted)
    const sshSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName.stringValue}-ssh-sg`,
      description: "Security group for SSH access",
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [allowedSshCidr.stringValue],
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: commonTags,
    };

    const sshSecurityGroup = new SecurityGroupModule(
      this,
      "ssh-security-group",
      sshSecurityGroupConfig
    );

    // Create Security Group for database access (internal only)
    const dbSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName.stringValue}-db-sg`,
      description: "Security group for database access",
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id,
        },
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id,
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: commonTags,
    };

    const dbSecurityGroup = new SecurityGroupModule(
      this,
      "db-security-group",
      dbSecurityGroupConfig
    );

    // Create Network ACLs for additional security
    const publicNacl = new NetworkAclModule(
      this,
      "public-nacl",
      vpc.vpc.id,
      vpc.publicSubnets.map((subnet) => subnet.id),
      {
        ...commonTags,
        Name: `${projectName.stringValue}-public`,
      }
    );

    const privateNacl = new NetworkAclModule(
      this,
      "private-nacl",
      vpc.vpc.id,
      vpc.privateSubnets.map((subnet) => subnet.id),
      {
        ...commonTags,
        Name: `${projectName.stringValue}-private`,
      }
    );

    // Create S3 bucket for application data with KMS encryption
    const appBucketConfig: S3ModuleConfig = {
      bucketName: `${s3BucketPrefix.stringValue}-app-data-${environment.stringValue}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false, // Set to true if you have a separate logging bucket
      tags: {
        ...commonTags,
        Purpose: "Application Data",
      },
    };

    const appBucket = new S3Module(this, "app-bucket", appBucketConfig);

    // Create S3 bucket for logs
    const logsBucketConfig: S3ModuleConfig = {
      bucketName: `${s3BucketPrefix.stringValue}-logs-${environment.stringValue}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false,
      tags: {
        ...commonTags,
        Purpose: "Logs Storage",
      },
    };

    const logsBucket = new S3Module(this, "logs-bucket", logsBucketConfig);

    // Create IAM role for EC2 instances with S3 access
    const ec2AssumeRolePolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ec2.amazonaws.com",
          },
        },
      ],
    });

    const s3AccessPolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
          ],
          Resource: [
            `${appBucket.bucket.arn}/*`,
          ],
        },
        {
          Effect: "Allow",
          Action: [
            "s3:ListBucket",
          ],
          Resource: [
            appBucket.bucket.arn,
          ],
        },
        {
          Effect: "Allow",
          Action: [
            "kms:Decrypt",
            "kms:GenerateDataKey",
          ],
          Resource: [
            s3KmsKey.key.arn,
          ],
        },
      ],
    });

    const ec2RoleConfig: IAMModuleConfig = {
      roleName: `${projectName.stringValue}-ec2-role`,
      assumeRolePolicy: ec2AssumeRolePolicy,
      policies: [
        {
          name: "S3AccessPolicy",
          policy: s3AccessPolicy,
        },
      ],
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      ],
      tags: commonTags,
    };

    const ec2Role = new IamModule(this, "ec2-role", ec2RoleConfig);

    // Create IAM role for Lambda functions
    const lambdaAssumeRolePolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        },
      ],
    });

    const lambdaRole