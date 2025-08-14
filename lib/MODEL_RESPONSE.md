I'll create a comprehensive CDKTF TypeScript solution that meets all your security and architecture requirements. Here's the complete implementation:

## Main Stack Implementation

```typescript
// main.ts
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { NetworkAcl } from "@cdktf/provider-aws/lib/network-acl";
import { NetworkAclRule } from "@cdktf/provider-aws/lib/network-acl-rule";
import { NetworkAclAssociation } from "@cdktf/provider-aws/lib/network-acl-association";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketLogging } from "@cdktf/provider-aws/lib/s3-bucket-logging";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { FlowLog } from "@cdktf/provider-aws/lib/flow-log";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";

// Configuration Interfaces
interface RegionConfig {
  name: string;
  cidrBlock: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  databaseSubnetCidr: string;
}

interface TagConfig {
  Environment: string;
  Owner: string;
  Project: string;
  ManagedBy: string;
}

interface SecurityConfig {
  logRetentionDays: number;
  enableVpcFlowLogs: boolean;
  enableAccessLogging: boolean;
  kmsKeyRotationEnabled: boolean;
}

// Main Stack Class
class SecureMultiRegionStack extends TerraformStack {
  private readonly regions: RegionConfig[] = [
    {
      name: "us-east-1",
      cidrBlock: "10.0.0.0/16",
      publicSubnetCidr: "10.0.1.0/24",
      privateSubnetCidr: "10.0.2.0/24",
      databaseSubnetCidr: "10.0.3.0/24",
    },
    {
      name: "us-west-2",
      cidrBlock: "10.1.0.0/16",
      publicSubnetCidr: "10.1.1.0/24",
      privateSubnetCidr: "10.1.2.0/24",
      databaseSubnetCidr: "10.1.3.0/24",
    },
    {
      name: "eu-central-1",
      cidrBlock: "10.2.0.0/16",
      publicSubnetCidr: "10.2.1.0/24",
      privateSubnetCidr: "10.2.2.0/24",
      databaseSubnetCidr: "10.2.3.0/24",
    },
  ];

  private readonly commonTags: TagConfig = {
    Environment: "production",
    Owner: "devops-team",
    Project: "secure-multi-region",
    ManagedBy: "cdktf",
  };

  private readonly securityConfig: SecurityConfig = {
    logRetentionDays: 90,
    enableVpcFlowLogs: true,
    enableAccessLogging: true,
    kmsKeyRotationEnabled: true,
  };

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create centralized logging bucket first
    const loggingConstruct = new LoggingConstruct(this, "logging", {
      tags: this.commonTags,
      retentionDays: this.securityConfig.logRetentionDays,
    });

    // Deploy infrastructure in each region
    this.regions.forEach((region, index) => {
      // AWS Provider for each region
      const provider = new AwsProvider(this, `aws-${region.name}`, {
        region: region.name,
        alias: region.name,
        defaultTags: [{ tags: this.commonTags }],
      });

      // Security Construct
      const securityConstruct = new SecurityConstruct(this, `security-${region.name}`, {
        region: region.name,
        provider,
        tags: { ...this.commonTags, Region: region.name },
      });

      // Networking Construct
      const networkingConstruct = new NetworkingConstruct(this, `networking-${region.name}`, {
        region: region.name,
        regionConfig: region,
        provider,
        tags: { ...this.commonTags, Region: region.name },
        kmsKeyId: securityConstruct.kmsKey.id,
      });

      // Storage Construct
      const storageConstruct = new StorageConstruct(this, `storage-${region.name}`, {
        region: region.name,
        provider,
        tags: { ...this.commonTags, Region: region.name },
        kmsKeyId: securityConstruct.kmsKey.id,
        loggingBucket: loggingConstruct.centralLoggingBucket.id,
      });

      // Enable VPC Flow Logs
      if (this.securityConfig.enableVpcFlowLogs) {
        new FlowLog(this, `vpc-flow-logs-${region.name}`, {
          provider,
          resourceId: networkingConstruct.vpc.id,
          resourceType: "VPC",
          trafficType: "ALL",
          logDestinationType: "s3",
          logDestination: `arn:aws:s3:::${loggingConstruct.centralLoggingBucket.id}/vpc-flow-logs/${region.name}/`,
          tags: { ...this.commonTags, Region: region.name },
        });
      }

      // Outputs for each region
      new TerraformOutput(this, `vpc-id-${region.name}`, {
        value: networkingConstruct.vpc.id,
        description: `VPC ID for ${region.name}`,
      });

      new TerraformOutput(this, `kms-key-id-${region.name}`, {
        value: securityConstruct.kmsKey.id,
        description: `KMS Key ID for ${region.name}`,
      });
    });

    // Global outputs
    new TerraformOutput(this, "central-logging-bucket", {
      value: loggingConstruct.centralLoggingBucket.id,
      description: "Central logging bucket for all regions",
    });
  }
}

// Networking Construct
class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly databaseSubnet: Subnet;

  constructor(scope: Construct, id: string, config: {
    region: string;
    regionConfig: RegionConfig;
    provider: AwsProvider;
    tags: Record<string, string>;
    kmsKeyId: string;
  }) {
    super(scope, id);

    const { region, regionConfig, provider, tags, kmsKeyId } = config;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      provider,
      state: "available",
    });

    // VPC
    this.vpc = new Vpc(this, "vpc", {
      provider,
      cidrBlock: regionConfig.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `vpc-${region}` },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `igw-${region}` },
    });

    // Public Subnet
    this.publicSubnet = new Subnet(this, "public-subnet", {
      provider,
      vpcId: this.vpc.id,
      cidrBlock: regionConfig.publicSubnetCidr,
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: false, // Security: No auto-assign public IPs
      tags: { ...tags, Name: `public-subnet-${region}`, Type: "Public" },
    });

    // Private Subnet
    this.privateSubnet = new Subnet(this, "private-subnet", {
      provider,
      vpcId: this.vpc.id,
      cidrBlock: regionConfig.privateSubnetCidr,
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: { ...tags, Name: `private-subnet-${region}`, Type: "Private" },
    });

    // Database Subnet
    this.databaseSubnet = new Subnet(this, "database-subnet", {
      provider,
      vpcId: this.vpc.id,
      cidrBlock: regionConfig.databaseSubnetCidr,
      availabilityZone: `\${${azs.fqn}.names[2]}`,
      tags: { ...tags, Name: `database-subnet-${region}`, Type: "Database" },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      provider,
      domain: "vpc",
      tags: { ...tags, Name: `nat-eip-${region}` },
      dependsOn: [igw],
    });

    // NAT Gateway
    const natGw = new NatGateway(this, "nat-gateway", {
      provider,
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: { ...tags, Name: `nat-gw-${region}` },
      dependsOn: [igw],
    });

    // Route Tables
    const publicRt = new RouteTable(this, "public-rt", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `public-rt-${region}` },
    });

    const privateRt = new RouteTable(this, "private-rt", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `private-rt-${region}` },
    });

    const databaseRt = new RouteTable(this, "database-rt", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `database-rt-${region}` },
    });

    // Routes
    new Route(this, "public-route", {
      provider,
      routeTableId: publicRt.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    new Route(this, "private-route", {
      provider,
      routeTableId: privateRt.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, "public-rta", {
      provider,
      subnetId: this.publicSubnet.id,
      routeTableId: publicRt.id,
    });

    new RouteTableAssociation(this, "private-rta", {
      provider,
      subnetId: this.privateSubnet.id,
      routeTableId: privateRt.id,
    });

    new RouteTableAssociation(this, "database-rta", {
      provider,
      subnetId: this.databaseSubnet.id,
      routeTableId: databaseRt.id,
    });

    // Security Groups
    this.createSecurityGroups(provider, tags, region);

    // Network ACLs
    this.createNetworkAcls(provider, tags, region);
  }

  private createSecurityGroups(provider: AwsProvider, tags: Record<string, string>, region: string) {
    // ALB Security Group (Public)
    const albSg = new SecurityGroup(this, "alb-sg", {
      provider,
      name: `alb-sg-${region}`,
      description: "Security group for Application Load Balancer",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS from internet",
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP from internet (redirect to HTTPS)",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: "tcp",
          cidrBlocks: [this.vpc.cidrBlock],
          description: "All traffic to VPC",
        },
      ],
      tags: { ...tags, Name: `alb-sg-${region}` },
    });

    // Application Security Group (Private)
    const appSg = new SecurityGroup(this, "app-sg", {
      provider,
      name: `app-sg-${region}`,
      description: "Security group for application servers",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 8080,
          toPort: 8080,
          protocol: "tcp",
          securityGroups: [albSg.id],
          description: "HTTP from ALB",
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [this.vpc.cidrBlock],
          description: "SSH from VPC",
        },
      ],
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS to internet",
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP to internet",
        },
      ],
      tags: { ...tags, Name: `app-sg-${region}` },
    });

    // Database Security Group (Database Subnet)
    new SecurityGroup(this, "db-sg", {
      provider,
      name: `db-sg-${region}`,
      description: "Security group for database servers",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [appSg.id],
          description: "MySQL from application servers",
        },
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          securityGroups: [appSg.id],
          description: "PostgreSQL from application servers",
        },
      ],
      tags: { ...tags, Name: `db-sg-${region}` },
    });
  }

  private createNetworkAcls(provider: AwsProvider, tags: Record<string, string>, region: string) {
    // Public Subnet NACL
    const publicNacl = new NetworkAcl(this, "public-nacl", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `public-nacl-${region}` },
    });

    // Public NACL Rules
    new NetworkAclRule(this, "public-nacl-ingress-https", {
      provider,
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 443,
      toPort: 443,
      cidrBlock: "0.0.0.0/0",
    });

    new NetworkAclRule(this, "public-nacl-ingress-http", {
      provider,
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 80,
      toPort: 80,
      cidrBlock: "0.0.0.0/0",
    });

    new NetworkAclRule(this, "public-nacl-ingress-ephemeral", {
      provider,
      networkAclId: publicNacl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: "0.0.0.0/0",
    });

    new NetworkAclRule(this, "public-nacl-egress-all", {
      provider,
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true,
    });

    // Private Subnet NACL
    const privateNacl = new NetworkAcl(this, "private-nacl", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `private-nacl-${region}` },
    });

    // Private NACL Rules
    new NetworkAclRule(this, "private-nacl-ingress-vpc", {
      provider,
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: this.vpc.cidrBlock,
    });

    new NetworkAclRule(this, "private-nacl-egress-all", {
      provider,
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true,
    });

    // Database Subnet NACL
    const databaseNacl = new NetworkAcl(this, "database-nacl", {
      provider,
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `database-nacl-${region}` },
    });

    // Database NACL Rules (only VPC traffic)
    new NetworkAclRule(this, "database-nacl-ingress-vpc", {
      provider,
      networkAclId: databaseNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: this.vpc.cidrBlock,
    });

    new NetworkAclRule(this, "database-nacl-egress-vpc", {
      provider,
      networkAclId: databaseNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: this.vpc.cidrBlock,
      egress: true,
    });

    // Associate NACLs with subnets
    new NetworkAclAssociation(this, "public-nacl-association", {
      provider,
      networkAclId: publicNacl.id,
      subnetId: this.publicSubnet.id,
    });

    new NetworkAclAssociation(this, "private-nacl-association", {
      provider,
      networkAclId: privateNacl.id,
      subnetId: this.privateSubnet.id,
    });

    new NetworkAclAssociation(this, "database-nacl-association", {
      provider,
      networkAclId: databaseNacl.id,
      subnetId: this.databaseSubnet.id,
    });
  }
}

// Security Construct
class SecurityConstruct extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly flowLogRole: IamRole;

  constructor(scope: Construct, id: string, config: {
    region: string;
    provider: AwsProvider;
    tags: Record<string, string>;
  }) {
    super(scope, id);

    const { region, provider, tags } = config;

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, "current", { provider });

    // KMS Key for encryption
    this.kmsKey = new KmsKey(this, "kms-key", {
      provider,
      description: `KMS key for ${region} region encryption`,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
            },
            Action: "kms:*",
            Resource: "*",
          },
          {
            Sid: "Allow VPC Flow Logs",
            Effect: "Allow",
            Principal: {
              Service: "delivery.logs.amazonaws.com",
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
      tags,
    });

    // KMS Key Alias
    new KmsAlias(this, "kms-key-alias", {
      provider,
      name: `alias/secure-multi-region-${region}`,
      targetKeyId: this.kmsKey.id,
    });

    // VPC Flow Logs IAM Role
    this.flowLogRole = new IamRole(this, "flow-log-role", {
      provider,
      name: `vpc-flow-log-role-${region}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "vpc-flow-logs.amazonaws.com",
            },
          },
        ],
      }),
      tags,
    });

    // Flow Logs Policy
    const flowLogPolicy = new IamPolicy(this, "flow-log-policy", {
      provider,
      name: `vpc-flow-log-policy-${region}`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogGroups",
              "logs:DescribeLogStreams",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetBucketAcl",
              "s3:PutObject",
              "s3:GetObject",
              "s3:ListBucket",
            ],
            Resource: "*",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "flow-log-policy-attachment", {
      provider,
      role: this.flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    // Secrets Manager for sensitive data
    const dbSecret = new SecretsmanagerSecret(this, "db-credentials", {
      provider,
      name: `db-credentials-${region}`,
      description: `Database credentials for ${region}`,
      kmsKeyId: this.kmsKey.id,
      tags,
    });

    // Example secret version (in production, use rotation)
    new SecretsmanagerSecretVersion(this, "db-credentials-version", {
      provider,
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: "admin",
        password: "ChangeMe123!", // In production, use proper secret rotation
      }),
    });
  }
}

// Storage Construct
class StorageConstruct extends Construct {
  public readonly encryptedBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: {
    region: string;
    provider: AwsProvider;
    tags: Record<string, string>;
    kmsKeyId: string;
    loggingBucket: string;
  }) {
    super(scope, id);

    const { region, provider, tags, kmsKeyId, loggingBucket } = config;

    // Encrypted S3 Bucket
    this.encryptedBucket = new S3Bucket(this, "encrypted-bucket", {
      provider,
      bucket: `secure-storage-${region}-${Date.now()}`,
      tags,
    });

    // S3 Bucket Versioning
    new S3BucketVersioning(this, "bucket-versioning", {
      provider,
      bucket: this.encryptedBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // S3 Bucket Encryption
    new S3BucketEncryption(this, "bucket-encryption", {
      provider,
      bucket: this.encryptedBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKeyId,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, "bucket-pab", {
      provider,
      bucket: this.encryptedBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Access Logging
    new S3BucketLogging(this, "bucket-logging", {
      provider,
      bucket: this.encryptedBucket.id,
      targetBucket: loggingBucket,
      targetPrefix: `access-logs/${region}/`,
    });

    // S3 Bucket Lifecycle Configuration
    new S3BucketLifecycleConfiguration(this, "bucket-lifecycle", {
      provider,
      bucket: this.encryptedBucket.id,
      rule: [
        {
          id: "transition-to-ia",
          status: "Enabled",
          transition: [
            {
              days: 30,
              storageClass: "STANDARD_IA",
            },
            {
              days: 90,
              storageClass: "GLACIER",
            },
            {
              days: 365,
              storageClass: "DEEP_ARCHIVE",
            },
          ],
        },
        {
          id: "delete-old-versions",
          status: "Enabled",
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
        },
      ],
    });
  }
}

// Logging Construct
class LoggingConstruct extends Construct {
  public readonly centralLoggingBucket: S3Bucket;
  public readonly accessLogsBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: {
    tags: Record<string, string>;
    retentionDays: number;
  }) {
    super(scope, id);

    const { tags, retentionDays } = config;

    // Use us-east-1 provider for centralized logging
    const loggingProvider = new AwsProvider(this, "logging-provider", {
      region: "us-east-1",
      alias: "logging",
    });

    // Access Logs Bucket (for logging the central bucket access)
    this.accessLogsBucket = new S3Bucket(this, "access-logs-bucket", {
      provider: loggingProvider,
      bucket: `access-logs-${Date.now()}`,
      tags,
    });

    // Central Logging Bucket
    this.centralLoggingBucket = new S3Bucket(this, "central-logging-bucket", {
      provider: loggingProvider,
      bucket: `central-logging-${Date.now()}`,
      tags,
    });

    // Configure access logs bucket
    this.configureBucket(this.accessLogsBucket, loggingProvider, tags, retentionDays, null);

    // Configure central logging bucket with access logging
    this.configureBucket(this.centralLoggingBucket, loggingProvider, tags, retentionDays, this.accessLogsBucket.id);
  }

  private configureBucket(
    bucket: S3Bucket,
    provider: AwsProvider,
    tags: Record<string, string>,
    retentionDays: number,
    loggingBucket: string | null
  ) {
    // Versioning
    new S3BucketVersioning(this, `${bucket.friendlyUniqueId}-versioning`, {
      provider,
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Encryption
    new S3BucketEncryption(this, `${bucket.friendlyUniqueId}-encryption`, {
      provider,
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // Public Access Block
    new S3Buc
```
