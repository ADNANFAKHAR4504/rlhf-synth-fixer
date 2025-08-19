I'll create a production-ready Terraform CDK infrastructure with TypeScript that meets all your security requirements and follows the specified modular structure.

## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { TerraformModule } from "cdktf";
import {
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  S3Bucket,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketVersioning,
  S3BucketPublicAccessBlock,
  DbInstance,
  DbSubnetGroup,
  KmsKey,
  KmsAlias,
  CloudtrailTrail,
  S3BucketPolicy,
  ApplicationLoadBalancer,
  LbTargetGroup,
  LbListener,
  LbTargetGroupAttachment,
  DataAwsAmi,
  DataAwsSubnet,
  DataAwsVpc
} from "@cdktf/provider-aws";

// Interface definitions for module configurations
export interface SecurityGroupModuleConfig {
  name: string;
  description: string;
  vpcId: string;
  ingressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    sourceSecurityGroupId?: string;
    description: string;
  }>;
  egressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    description: string;
  }>;
}

export interface KmsModuleConfig {
  name: string;
  description: string;
  enableKeyRotation: boolean;
}

export interface S3ModuleConfig {
  bucketName: string;
  enableVersioning: boolean;
  kmsKeyId: string;
}

export interface RdsModuleConfig {
  identifier: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  vpcSecurityGroupIds: string[];
  dbSubnetGroupName: string;
  kmsKeyId: string;
  backupRetentionPeriod: number;
  storageEncrypted: boolean;
}

export interface Ec2ModuleConfig {
  name: string;
  instanceType: string;
  subnetId: string;
  securityGroupIds: string[];
  userData?: string;
  keyName?: string;
}

export interface AlbModuleConfig {
  name: string;
  subnets: string[];
  securityGroups: string[];
  targetGroupName: string;
  targetGroupPort: number;
  vpcId: string;
}

export interface CloudTrailModuleConfig {
  name: string;
  s3BucketName: string;
  includeGlobalServiceEvents: boolean;
  isMultiRegionTrail: boolean;
}

/**
 * KMS Module - Creates customer-managed KMS key with automatic rotation
 */
export class KmsModule extends TerraformModule {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, config: KmsModuleConfig) {
    super(scope, id);

    // Create KMS key with automatic rotation
    this.kmsKey = new KmsKey(this, "kms-key", {
      description: config.description,
      enableKeyRotation: config.enableKeyRotation,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
            },
            Action: "kms:*",
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: config.name,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Create KMS alias for easier reference
    this.kmsAlias = new KmsAlias(this, "kms-alias", {
      name: `alias/${config.name}`,
      targetKeyId: this.kmsKey.keyId
    });
  }
}

/**
 * Security Group Module - Creates security groups with strict ingress/egress rules
 */
export class SecurityGroupModule extends TerraformModule {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Create security group
    this.securityGroup = new SecurityGroup(this, "security-group", {
      name: config.name,
      description: config.description,
      vpcId: config.vpcId,
      tags: {
        Name: config.name,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Create ingress rules
    config.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-rule-${index}`, {
        type: "ingress",
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
        securityGroupId: this.securityGroup.id,
        description: rule.description
      });
    });

    // Create egress rules
    config.egressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        type: "egress",
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        securityGroupId: this.securityGroup.id,
        description: rule.description
      });
    });
  }
}

/**
 * S3 Module - Creates encrypted S3 bucket with versioning and public access blocked
 */
export class S3Module extends TerraformModule {
  public readonly bucket: S3Bucket;
  public readonly bucketEncryption: S3BucketServerSideEncryptionConfiguration;
  public readonly bucketVersioning: S3BucketVersioning;
  public readonly bucketPublicAccessBlock: S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, "s3-bucket", {
      bucket: config.bucketName,
      tags: {
        Name: config.bucketName,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Configure server-side encryption with KMS
    this.bucketEncryption = new S3BucketServerSideEncryptionConfiguration(this, "bucket-encryption", {
      bucket: this.bucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
          kmsMasterKeyId: config.kmsKeyId
        },
        bucketKeyEnabled: true
      }]
    });

    // Enable versioning if specified
    if (config.enableVersioning) {
      this.bucketVersioning = new S3BucketVersioning(this, "bucket-versioning", {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: "Enabled"
        }
      });
    }

    // Block public access
    this.bucketPublicAccessBlock = new S3BucketPublicAccessBlock(this, "bucket-public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });
  }
}

/**
 * RDS Module - Creates encrypted RDS instance in private subnet
 */
export class RdsModule extends TerraformModule {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig, subnetIds: string[]) {
    super(scope, id);

    // Create DB subnet group
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: config.dbSubnetGroupName,
      subnetIds: subnetIds,
      tags: {
        Name: config.dbSubnetGroupName,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Create RDS instance with encryption
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: config.identifier,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: config.kmsKeyId,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.identifier}-final-snapshot-${Date.now()}`,
      deletionProtection: true,
      tags: {
        Name: config.identifier,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });
  }
}

/**
 * EC2 Module - Creates EC2 instances in private subnets without public IPs
 */
export class Ec2Module extends TerraformModule {
  public readonly instance: Instance;
  private readonly ami: DataAwsAmi;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    this.ami = new DataAwsAmi(this, "amazon-linux-ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          name: "virtualization-type",
          values: ["hvm"]
        }
      ]
    });

    // Create EC2 instance in private subnet (no public IP)
    this.instance = new Instance(this, "ec2-instance", {
      ami: this.ami.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      associatePublicIpAddress: false, // Ensure no public IP
      userData: config.userData,
      keyName: config.keyName,
      tags: {
        Name: config.name,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });
  }
}

/**
 * Application Load Balancer Module
 */
export class AlbModule extends TerraformModule {
  public readonly alb: ApplicationLoadBalancer;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, config: AlbModuleConfig) {
    super(scope, id);

    // Create Application Load Balancer
    this.alb = new ApplicationLoadBalancer(this, "alb", {
      name: config.name,
      loadBalancerType: "application",
      subnets: config.subnets,
      securityGroups: config.securityGroups,
      enableDeletionProtection: true,
      tags: {
        Name: config.name,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Create target group
    this.targetGroup = new LbTargetGroup(this, "target-group", {
      name: config.targetGroupName,
      port: config.targetGroupPort,
      protocol: "HTTP",
      vpcId: config.vpcId,
      healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: "200"
      },
      tags: {
        Name: config.targetGroupName,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });

    // Create listener
    this.listener = new LbListener(this, "listener", {
      loadBalancerArn: this.alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [{
        type: "forward",
        targetGroupArn: this.targetGroup.arn
      }]
    });
  }

  public attachTarget(targetId: string, port: number): LbTargetGroupAttachment {
    return new LbTargetGroupAttachment(this, `target-attachment-${targetId}`, {
      targetGroupArn: this.targetGroup.arn,
      targetId: targetId,
      port: port
    });
  }
}

/**
 * CloudTrail Module - Creates CloudTrail for audit logging
 */
export class CloudTrailModule extends TerraformModule {
  public readonly cloudTrail: CloudtrailTrail;
  public readonly s3BucketPolicy: S3BucketPolicy;

  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create S3 bucket policy for CloudTrail
    this.s3BucketPolicy = new S3BucketPolicy(this, "cloudtrail-bucket-policy", {
      bucket: config.s3BucketName,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AWSCloudTrailAclCheck",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: "s3:GetBucketAcl",
            Resource: `arn:aws:s3:::${config.s3BucketName}`
          },
          {
            Sid: "AWSCloudTrailWrite",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: "s3:PutObject",
            Resource: `arn:aws:s3:::${config.s3BucketName}/*`,
            Condition: {
              StringEquals: {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      })
    });

    // Create CloudTrail
    this.cloudTrail = new CloudtrailTrail(this, "cloudtrail", {
      name: config.name,
      s3BucketName: config.s3BucketName,
      includeGlobalServiceEvents: config.includeGlobalServiceEvents,
      isMultiRegionTrail: config.isMultiRegionTrail,
      enableLogging: true,
      eventSelector: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResource: [{
          type: "AWS::S3::Object",
          values: ["arn:aws:s3:::*/*"]
        }]
      }],
      tags: {
        Name: config.name,
        Environment: "production",
        ManagedBy: "terraform-cdk"
      }
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider, DataAwsVpc, DataAwsSubnets, DataAwsCallerIdentity } from "@cdktf/provider-aws";
import {
  KmsModule,
  SecurityGroupModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  CloudTrailModule
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1
    new AwsProvider(this, "aws", {
      region: "us-east-1"
    });

    // Get current AWS account ID
    const currentAccount = new DataAwsCallerIdentity(this, "current");

    // Lookup existing VPC (replace with your actual VPC ID)
    const vpc = new DataAwsVpc(this, "secure-app-vpc", {
      id: "vpc-xxxxxxxxx" // Replace with your actual VPC ID
    });

    // Lookup subnets in the VPC
    const privateSubnets = new DataAwsSubnets(this, "private-subnets", {
      filter: [
        {
          name: "vpc-id",
          values: [vpc.id]
        },
        {
          name: "tag:Type",
          values: ["Private"]
        }
      ]
    });

    const publicSubnets = new DataAwsSubnets(this, "public-subnets", {
      filter: [
        {
          name: "vpc-id",
          values: [vpc.id]
        },
        {
          name: "tag:Type",
          values: ["Public"]
        }
      ]
    });

    // 1. Create KMS Key for encryption with automatic rotation
    const kmsModule = new KmsModule(this, "app-kms-module", {
      name: "app-kms-key",
      description: "KMS key for application encryption with automatic rotation",
      enableKeyRotation: true
    });

    // 2. Create S3 bucket for CloudTrail logs
    const cloudTrailS3Module = new S3Module(this, "cloudtrail-s3-module", {
      bucketName: "secure-app-cloudtrail-logs-${random_id.bucket_suffix.hex}",
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn
    });

    // 3. Create S3 bucket for application data
    const appS3Module = new S3Module(this, "app-s3-module", {
      bucketName: "secure-app-data-${random_id.bucket_suffix.hex}",
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn
    });

    // 4. Create Security Group for ALB (allows HTTP/HTTPS from internet)
    const albSecurityGroupModule = new SecurityGroupModule(this, "alb-sg-module", {
      name: "public-frontend-sg",
      description: "Security group for Application Load Balancer",
      vpcId: vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTP from internet"
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS from internet"
        }
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic"
        }
      ]
    });

    // 5. Create Security Group for EC2 instances (allows traffic only from ALB)
    const ec2SecurityGroupModule = new SecurityGroupModule(this, "ec2-sg-module", {
      name: "private-app-sg",
      description: "Security group for EC2 application instances",
      vpcId: vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          sourceSecurityGroupId: albSecurityGroupModule.securityGroup.id,
          description: "Allow HTTP from ALB only"
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/8"], // Restrict SSH to private network only
          description: "Allow SSH from private network only"
        }
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic"
        }
      ]
    });

    // 6. Create Security Group for RDS (allows traffic only from EC2)
    const rdsSecurityGroupModule = new SecurityGroupModule(this, "rds-sg-module", {
      name: "private-db-sg",
      description: "Security group for RDS database",
      vpcId: vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          sourceSecurityGroupId: ec2SecurityGroupModule.securityGroup.id,
          description: "Allow MySQL from application instances only"
        }
      ],
      egressRules: []
    });

    // 7. Create RDS instance in private subnet
    const rdsModule = new RdsModule(this, "rds-module", {
      identifier: "secure-app-db",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      dbName: "secureappdb",
      username: "admin",
      password: "SecurePassword123!", // In production, use AWS Secrets Manager
      vpcSecurityGroupIds: [rdsSecurityGroupModule.securityGroup.id],
      dbSubnetGroupName: "secure-app-db-subnet-group",
      kmsKeyId: kmsModule.kmsKey.arn,
      backupRetentionPeriod: 7,
      storageEncrypted: true
    }, privateSubnets.ids);

    // 8. Create EC2 instances in private subnets (no public IP)
    const ec2Modules = privateSubnets.ids.slice(0, 2).map((subnetId, index) => {
      return new Ec2Module(this, `ec2-module-${index}`, {
        name: `secure-app-instance-${index + 1}`,
        instanceType: "t3.micro",
        subnetId: subnetId,
        securityGroupIds: [ec2SecurityGroupModule.securityGroup.id],
        userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure App Instance ${index + 1}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health`,
        keyName: "my-key-pair" // Replace with your actual key pair name
      });
    });

    // 9. Create Application Load Balancer
    const albModule = new AlbModule(this, "alb-module", {
      name: "secure-app-alb",
      subnets: publicSubnets.ids,
      securityGroups: [albSecurityGroupModule.securityGroup.id],
      targetGroupName: "secure-app-tg",
      targetGroupPort: 80,
      vpcId: vpc.id
    });

    // 10. Attach EC2 instances to ALB target group
    ec2Modules.forEach((ec2Module, index) => {
      albModule.attachTarget(ec2Module.instance.id, 80);
    });

    // 11. Create CloudTrail for audit logging
    const cloudTrailModule = new CloudTrailModule(this, "cloudtrail-module", {
      name: "secure-app-cloudtrail",
      s3BucketName: cloudTrailS3Module.bucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true
    });

    // Terraform Outputs
    new TerraformOutput(this, "vpc-id", {
      description: "ID of the VPC",
      value: vpc.id
    });

    new TerraformOutput(this, "kms-key-id", {
      description: "ID of the KMS key",
      value: kmsModule.kmsKey.keyId
    });

    new TerraformOutput(this, "kms-key-arn", {
      description: "ARN of the KMS key",
      value: kmsModule.kmsKey.arn
    });

    new TerraformOutput(this, "app-s3-bucket-name", {
      description: "Name of the application S3 bucket",
      value: appS3Module.bucket.bucket
    });

    new TerraformOutput(this, "cloudtrail-s3-bucket-name", {
      description: "Name of the CloudTrail S3 bucket",
      value: cloudTrailS3Module.bucket.bucket
    });

    new TerraformOutput(this, "rds-endpoint", {
      description: "RDS instance endpoint",
      value: rdsModule.dbInstance.endpoint,
      sensitive: true
    });

    new TerraformOutput(this, "alb-dns-name", {
      description: "DNS name of the Application Load Balancer",
      value: albModule.alb.dnsName
    });

    new TerraformOutput(this, "alb-zone-id", {
      description: "Zone ID of the Application Load Balancer",
      value: albModule.alb.zoneId
    });

    new TerraformOutput(this, "ec2-instance-ids", {
      description: "IDs of the EC2 instances",
      value: ec2Modules.map(module => module.instance.id)
    });

    new TerraformOutput(this, "private-subnet-ids", {
      description: "IDs of the private subnets",
      value: privateSubnets.ids
    });

    new TerraformOutput(this, "public-subnet-ids", {
      description: "IDs of the public subnets",
      value: publicSubnets.ids
    });

    new TerraformOutput(this, "security-group-ids", {
      description: "Security group IDs",
      value: {
        alb: albSecurityGroupModule.securityGroup.id,
        ec2: ec2SecurityGroupModule.securityGroup.id,
        rds: rdsSecurityGroupModule.securityGroup.id
      }
    });

    new TerraformOutput(this, "cloudtrail-arn", {
      description: "ARN of the CloudTrail",
      value: cloudTrailModule.cloudTrail.arn
    });
  }
}
```

## Key Security Features Implemented

### 🔐 **Encryption & Key Management**
- **KMS Key with Automatic Rotation**: Customer-managed KMS key with `enableKeyRotation: true`
- **S3 Server-Side Encryption**: All S3 buckets use KMS encryption by default
- **RDS Encryption**: Database and snapshots are encrypted using the KMS key

### 🛡️ **Network Security**
- **No Public IPs**: EC2 instances are deployed in private subnets without public IP addresses
- **Restricted Security Groups**: 
  - SSH access limited to private network (10.0.0.0/8) only
  - No unrestricted access (0.0.0.0/0) to SSH/RDP ports
  - Database access restricted to application tier only

### 🏗️ **Infrastructure Security**
- **VPC Isolation**: All resources deployed in specified VPC
- **Private Subnet Placement**: RDS and EC2 instances in private subnets
- **CloudTrail Logging**: Comprehensive audit logging enabled
- **S3 Security**: Public access blocked, versioning enabled

### 📊 **Monitoring & Compliance**
- **CloudTrail**: Multi-region trail with management events logging
- **Encrypted Snapshots**: RDS configured for encrypted automated backups
- **Deletion Protection**: RDS has deletion protection enabled

### 🔧 **Modular Architecture**
- **Reusable Modules**: Each infrastructure component is a separate, configurable module
- **Clean Separation**: Stack composition in `tap-stack.ts`, modules in `modules.ts`
- **Type Safety**: Full TypeScript interfaces for configuration

This infrastructure follows AWS Well-Architected Framework principles and implements defense-in-depth security strategies. All resources are properly tagged and configured for production use. 