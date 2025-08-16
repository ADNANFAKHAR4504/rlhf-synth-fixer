I'll create a secure AWS environment using CDK for Terraform (TypeScript) split into two files as requested. Here are the complete files:

## modules.ts

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
  NetworkAcl,
  NetworkAclRule,
} from "@cdktf/provider-aws/lib/vpc";
import {
  S3Bucket,
  S3BucketEncryption,
  S3BucketPublicAccessBlock,
  S3BucketVersioning,
  S3BucketLogging,
  S3BucketServerSideEncryptionConfiguration,
} from "@cdktf/provider-aws/lib/s3";
import {
  KmsKey,
  KmsAlias,
} from "@cdktf/provider-aws/lib/kms";
import {
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  DataAwsIamPolicyDocument,
} from "@cdktf/provider-aws/lib/iam";
import {
  CloudwatchLogGroup,
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

export interface S3ModuleConfig {
  bucketNames: string[];
  kmsKeyDescription: string;
  enableVersioning: boolean;
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
    securityGroups?: string[];
  }>;
  egressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
  }>;
  tags: { [key: string]: string };
}

export interface IAMModuleConfig {
  roleName: string;
  policyStatements: Array<{
    effect: string;
    actions: string[];
    resources: string[];
  }>;
  tags: { [key: string]: string };
}

export interface CloudWatchModuleConfig {
  logGroupNames: string[];
  retentionInDays: number;
  tags: { [key: string]: string };
}

/**
 * VPC Module - Creates a complete VPC infrastructure with public/private subnets,
 * NAT Gateway, Internet Gateway, and proper routing
 */
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
        Name: `${config.tags.Name || "main"}-vpc`,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name || "main"}-igw`,
      },
    });

    // Create public subnets across multiple AZs for high availability
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs
        tags: {
          ...config.tags,
          Name: `${config.tags.Name || "main"}-public-subnet-${index + 1}`,
          Type: "Public",
        },
      });
    });

    // Create private subnets for internal resources
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: false, // No public IPs for private subnets
        tags: {
          ...config.tags,
          Name: `${config.tags.Name || "main"}-private-subnet-${index + 1}`,
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
        Name: `${config.tags.Name || "main"}-nat-eip`,
      },
    });

    // Create NAT Gateway in first public subnet for private subnet internet access
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name || "main"}-nat-gateway`,
      },
    });

    // Create route table for public subnets
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name || "main"}-public-rt`,
      },
    });

    // Route all traffic to Internet Gateway for public subnets
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

    // Create route table for private subnets
    this.privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Name || "main"}-private-rt`,
      },
    });

    // Route all traffic to NAT Gateway for private subnets
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

/**
 * Security Group Module - Creates security groups with configurable ingress/egress rules
 * following the principle of least privilege
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    // Create security group with restrictive default behavior
    this.securityGroup = new SecurityGroup(this, "sg", {
      name: config.name,
      description: config.description,
      vpcId: config.vpcId,
      
      // Configure ingress rules (inbound traffic)
      ingress: config.ingressRules.map(rule => ({
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        securityGroups: rule.securityGroups,
      })),
      
      // Configure egress rules (outbound traffic)
      egress: config.egressRules.map(rule => ({
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
      })),
      
      tags: {
        ...config.tags,
        Name: config.name,
      },
    });
  }
}

/**
 * Network ACL Module - Provides subnet-level security as an additional layer
 * beyond security groups for defense in depth
 */
export class NetworkAclModule extends Construct {
  public readonly networkAcl: NetworkAcl;

  constructor(scope: Construct, id: string, vpcId: string, subnetIds: string[], tags: { [key: string]: string }) {
    super(scope, id);

    // Create Network ACL for additional subnet-level security
    this.networkAcl = new NetworkAcl(this, "nacl", {
      vpcId: vpcId,
      subnetIds: subnetIds,
      tags: {
        ...tags,
        Name: `${tags.Name || "main"}-nacl`,
      },
    });

    // Allow HTTP inbound traffic
    new NetworkAclRule(this, "nacl-http-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 80,
      toPort: 80,
      cidrBlock: "0.0.0.0/0",
    });

    // Allow HTTPS inbound traffic
    new NetworkAclRule(this, "nacl-https-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 443,
      toPort: 443,
      cidrBlock: "0.0.0.0/0",
    });

    // Allow SSH inbound traffic (restrict CIDR as needed)
    new NetworkAclRule(this, "nacl-ssh-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 22,
      toPort: 22,
      cidrBlock: "10.0.0.0/8", // Restrict to private networks
    });

    // Allow ephemeral ports for return traffic
    new NetworkAclRule(this, "nacl-ephemeral-inbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 130,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: "0.0.0.0/0",
    });

    // Allow all outbound traffic (can be restricted based on requirements)
    new NetworkAclRule(this, "nacl-all-outbound", {
      networkAclId: this.networkAcl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true,
    });
  }
}

/**
 * KMS Module - Creates KMS keys for encryption with proper key policies
 * and aliases for easy reference
 */
export class KmsModule extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, description: string, tags: { [key: string]: string }) {
    super(scope, id);

    // Get current AWS account ID and region for key policy
    const currentAccount = new DataAwsCallerIdentity(this, "current");
    const currentRegion = new DataAwsRegion(this, "current-region");

    // Create KMS key with restrictive policy following least privilege
    this.kmsKey = new KmsKey(this, "kms-key", {
      description: description,
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      
      // Key policy allowing root account access and specific service permissions
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::\${${currentAccount.fqn}.account_id}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow S3 Service",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            },
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey*"
            ],
            Resource: "*"
          },
          {
            Sid: "Allow CloudWatch Logs",
            Effect: "Allow",
            Principal: {
              Service: `logs.\${${currentRegion.fqn}.name}.amazonaws.com`
            },
            Action: [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:ReEncrypt*",
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*"
          }
        ]
      }),
      
      tags: {
        ...tags,
        Name: `${tags.Name || "main"}-kms-key`,
      },
    });

    // Create alias for easier key reference
    this.kmsAlias = new KmsAlias(this, "kms-alias", {
      name: `alias/${tags.Name || "main"}-encryption-key`,
      targetKeyId: this.kmsKey.keyId,
    });
  }
}

/**
 * S3 Module - Creates secure S3 buckets with KMS encryption, versioning,
 * and proper access controls
 */
export class S3Module extends Construct {
  public readonly buckets: S3Bucket[];
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create KMS key for S3 bucket encryption
    const kmsModule = new KmsModule(this, "s3-kms", config.kmsKeyDescription, config.tags);
    this.kmsKey = kmsModule.kmsKey;

    // Create S3 buckets with security best practices
    this.buckets = config.bucketNames.map((bucketName, index) => {
      const bucket = new S3Bucket(this, `bucket-${index}`, {
        bucket: bucketName,
        tags: {
          ...config.tags,
          Name: bucketName,
        },
      });

      // Enable versioning for data protection and compliance
      new S3BucketVersioning(this, `bucket-versioning-${index}`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: config.enableVersioning ? "Enabled" : "Suspended",
        },
      });

      // Configure server-side encryption with KMS
      new S3BucketServerSideEncryptionConfiguration(this, `bucket-encryption-${index}`, {
        bucket: bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "aws:kms",
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true, // Reduce KMS costs
          },
        ],
      });

      // Block all public access for security
      new S3BucketPublicAccessBlock(this, `bucket-pab-${index}`, {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });

      return bucket;
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies following least privilege principle
 */
export class IAMModule extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IAMModuleConfig) {
    super(scope, id);

    // Create assume role policy document
    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, "assume-role-policy", {
      statement: [
        {
          actions: ["sts:AssumeRole"],
          effect: "Allow",
          principals: [
            {
              type: "Service",
              identifiers: ["ec2.amazonaws.com"],
            },
          ],
        },
      ],
    });

    // Create IAM role with assume role policy
    this.role = new IamRole(this, "role", {
      name: config.roleName,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        ...config.tags,
        Name: config.roleName,
      },
    });

    // Create policy document with specified permissions
    const policyDocument = new DataAwsIamPolicyDocument(this, "policy-document", {
      statement: config.policyStatements.map((stmt, index) => ({
        sid: `Statement${index + 1}`,
        effect: stmt.effect,
        actions: stmt.actions,
        resources: stmt.resources,
      })),
    });

    // Attach inline policy to role
    new IamRolePolicy(this, "role-policy", {
      name: `${config.roleName}-policy`,
      role: this.role.id,
      policy: policyDocument.json,
    });

    // Create instance profile for EC2 instances
    this.instanceProfile = new IamInstanceProfile(this, "instance-profile", {
      name: `${config.roleName}-instance-profile`,
      role: this.role.name,
      tags: {
        ...config.tags,
        Name: `${config.roleName}-instance-profile`,
      },
    });
  }
}

/**
 * CloudWatch Module - Creates log groups for centralized logging
 * with encryption and retention policies
 */
export class CloudWatchModule extends Construct {
  public readonly logGroups: CloudwatchLogGroup[];

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig, kmsKeyId?: string) {
    super(scope, id);

    // Create CloudWatch Log Groups for application and system logs
    this.logGroups = config.logGroupNames.map((logGroupName, index) => {
      return new CloudwatchLogGroup(this, `log-group-${index}`, {
        name: logGroupName,
        retentionInDays: config.retentionInDays,
        kmsKeyId: kmsKeyId, // Encrypt logs with KMS key
        tags: {
          ...config.tags,
          Name: logGroupName,
        },
      });
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  VpcModule,
  S3Module,
  SecurityGroupModule,
  NetworkAclModule,
  IAMModule,
  CloudWatchModule,
  KmsModule,
} from "./modules";

/**
 * Main TAP Stack - Orchestrates all AWS resources using the modules
 * This stack creates a secure, well-architected AWS environment
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, "AWS", {
      region: "us-east-1",
    });

    // Define Terraform variables for configuration flexibility
    const projectName = new TerraformVariable(this, "project_name", {
      type: "string",
      default: "tap-secure-env",
      description: "Name of the project used for resource naming",
    });

    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      default: "production",
      description: "Environment name (dev, staging, production)",
    });

    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      default: "10.0.0.0/16",
      description: "CIDR block for the VPC",
    });

    const publicSubnetCidrs = new TerraformVariable(this, "public_subnet_cidrs", {
      type: "list(string)",
      default: ["10.0.1.0/24", "10.0.2.0/24"],
      description: "CIDR blocks for public subnets",
    });

    const privateSubnetCidrs = new TerraformVariable(this, "private_subnet_cidrs", {
      type: "list(string)",
      default: ["10.0.10.0/24", "10.0.20.0/24"],
      description: "CIDR blocks for private subnets",
    });

    const s3BucketNames = new TerraformVariable(this, "s3_bucket_names", {
      type: "list(string)",
      default: ["tap-secure-data-bucket", "tap-secure-logs-bucket"],
      description: "Names of S3 buckets to create",
    });

    const allowedSshCidrs = new TerraformVariable(this, "allowed_ssh_cidrs", {
      type: "list(string)",
      default: ["10.0.0.0/16"],
      description: "CIDR blocks allowed for SSH access",
    });

    const allowedHttpCidrs = new TerraformVariable(this, "allowed_http_cidrs", {
      type: "list(string)",
      default: ["0.0.0.0/0"],
      description: "CIDR blocks allowed for HTTP/HTTPS access",
    });

    // Common tags for all resources
    const commonTags = {
      Project: projectName.stringValue,
      Environment: environment.stringValue,
      ManagedBy: "Terraform",
      CreatedDate: new Date().toISOString().split('T')[0],
    };

    // Create VPC infrastructure with public and private subnets
    const vpcModule = new VpcModule(this, "vpc", {
      vpcCidr: vpcCidr.stringValue,
      publicSubnetCidrs: publicSubnetCidrs.listValue,
      privateSubnetCidrs: privateSubnetCidrs.listValue,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}`,
      },
    });

    // Create KMS key for general encryption needs
    const kmsModule = new KmsModule(this, "main-kms", 
      "Main KMS key for encryption across services", 
      {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}`,
      }
    );

    // Create secure S3 buckets with KMS encryption
    const s3Module = new S3Module(this, "s3", {
      bucketNames: s3BucketNames.listValue,
      kmsKeyDescription: "S3 bucket encryption key",
      enableVersioning: true,
      tags: {
        ...commonTags,
        Service: "S3",
      },
    });

    // Create security group for web servers (HTTP/HTTPS access)
    const webSecurityGroup = new SecurityGroupModule(this, "web-sg", {
      name: `${projectName.stringValue}-${environment.stringValue}-web-sg`,
      description: "Security group for web servers allowing HTTP/HTTPS traffic",
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: allowedHttpCidrs.listValue,
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: allowedHttpCidrs.listValue,
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
      tags: {
        ...commonTags,
        Service: "SecurityGroup",
        Type: "Web",
      },
    });

    // Create security group for SSH access (restricted to specific CIDRs)
    const sshSecurityGroup = new SecurityGroupModule(this, "ssh-sg", {
      name: `${projectName.stringValue}-${environment.stringValue}-ssh-sg`,
      description: "Security group for SSH access with restricted CIDR blocks",
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: allowedSshCidrs.listValue,
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
      tags: {
        ...commonTags,
        Service: "SecurityGroup",
        Type: "SSH",
      },
    });

    // Create security group for database access (internal only)
    const dbSecurityGroup = new SecurityGroupModule(this, "db-sg", {
      name: `${projectName.stringValue}-${environment.stringValue}-db-sg`,
      description: "Security group for database servers allowing internal access only",
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [webSecurityGroup.securityGroup.id],
        },
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          securityGroups: [webSecurityGroup.securityGroup.id],
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
      tags: {
        ...commonTags,
        Service: "SecurityGroup",
        Type: "Database",
      },
    });

    // Create Network ACLs for additional subnet-level security
    const publicNacl = new NetworkAclModule(
      this,
      "public-nacl",
      vpcModule.vpc.id,
      vpcModule.publicSubnets.map(subnet => subnet.id),
      {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-public`,
        Type: "Public",
      }
    );

    const privateNacl = new NetworkAclModule(
      this,
      "private-nacl",
      vpcModule.vpc.id,
      vpcModule.privateSubnets.map(subnet => subnet.id),
      {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-private`,
        Type: "Private",
      }
    );

    // Create IAM role for EC2 instances with minimal required permissions
    const ec2IamModule = new IAMModule(this, "ec2-iam", {
      roleName: `${projectName.stringValue}-${environment.stringValue}-ec2-role`,
      policyStatements: [
        {
          effect: "Allow",
          actions: [
            "s3:GetObject",
            "s3:PutObject",
          ],
          resources: s3Module.buckets.map(bucket => `\${${bucket.fqn}.arn}/*`),
        },
        {
          effect: "Allow",
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams",
          ],
          resources: ["arn:aws:logs:us-east-1:*:*"],
        },
        {
          effect: "Allow",
          actions: [
            "kms:Decrypt",
            "kms:GenerateDataKey",
          ],
          resources: [kmsModule.kmsKey.arn, s3Module.kmsKey.arn],
        },
      ],
      tags: {
        ...commonTags,
        Service: "IAM",
        Type: "EC2",
      },
    });

    // Create CloudWatch Log Groups for centralized logging
    const cloudWatchModule = new CloudWatchModule(
      this,
      "cloudwatch",
      {
        logGroupNames: [
          `/aws/ec2/${projectName.stringValue}-${environment.stringValue}/application`,
          `/aws/ec2/${projectName.stringValue}-${environment.stringValue}/system`,
          `/aws/vpc/${projectName.stringValue}-${environment.stringValue}/flowlogs`,
          `/aws/s3/${projectName.stringValue}-${environment.stringValue}/access`,
        ],
        retentionInDays: 30,
        tags: {
          ...commonTags,
          Service: "CloudWatch",
        },
      },
      kmsModule.kmsKey.arn
    );

    // Export important resource information as Terraform outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpcModule.vpc.id,
      description: "ID of the created VPC",
    });

    new TerraformOutput(this, "vpc_cidr_block", {
      value: vpcModule.vpc.cidrBlock,
      description: "CIDR block of the VPC",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: "IDs of the public subnets",
    })