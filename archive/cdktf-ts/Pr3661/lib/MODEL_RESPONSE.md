### Reasoning Trace
---

Let's break down this task. I need to create a secure AWS infrastructure using CDK for Terraform (CDKTF) in TypeScript, which consists of two files: `modules.ts` and `tap-stack.ts`. The infrastructure should follow best practices for security, encryption, and availability in the eu-north-1 region.

First, I'll plan out the structure for both files.

## modules.ts

This file will contain modular components for different AWS services:
1. VPC Module
2. IAM Module
3. S3 Module
4. EC2 Module (with Auto Scaling)
5. RDS Module
6. CloudTrail Module
7. Config Module
8. KMS Module

Each module should be reusable and self-contained.

## tap-stack.ts

This file will:
1. Import all modules from `modules.ts`
2. Initialize the AWS provider for the eu-north-1 region
3. Configure module dependencies
4. Apply global tagging
5. Output resource details

Now let's implement each file:

### modules.ts

First, I'll start by defining the necessary imports and module structures for CDKTF:

```typescript
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import {
  AwsProvider,
  vpc,
  subnet,
  internetGateway,
  natGateway,
  routeTable,
  routeTableAssociation,
  flowLog,
  securityGroup,
  securityGroupRule,
  s3Bucket,
  s3BucketPolicy,
  s3BucketServerSideEncryptionConfigurationA,
  s3BucketPublicAccessBlock,
  iamRole,
  iamPolicy,
  iamInstanceProfile,
  instance,
  autoscalingGroup,
  launchTemplate,
  dbInstance,
  dbSubnetGroup,
  cloudtrail,
  kmsKey,
  kmsAlias,
  configConfigurationRecorder,
  configDeliveryChannel,
  configConfigRule,
  cloudwatchMetricAlarm,
  eip,
} from "@cdktf/provider-aws";

// Interfaces for module inputs
export interface VpcModuleConfig {
  vpcCidrBlock: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  flowLogBucketArn: string;
  tags?: { [key: string]: string };
}

export interface IamModuleConfig {
  vpcId: string;
  tags?: { [key: string]: string };
}

export interface S3ModuleConfig {
  bucketName: string;
  logBucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface Ec2ModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceType: string;
  iamInstanceProfileName: string;
  sshCidr: string;
  minCapacity: number;
  maxCapacity: number;
  keyName?: string;
  tags?: { [key: string]: string };
}

export interface RdsModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass: string;
  engine: string;
  engineVersion: string;
  dbName: string;
  username: string;
  password: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface CloudTrailModuleConfig {
  s3BucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface ConfigModuleConfig {
  s3BucketName: string;
  iamRoleArn: string;
  tags?: { [key: string]: string };
}

export interface KmsModuleConfig {
  description: string;
  tags?: { [key: string]: string };
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];
  public readonly flowLogId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC
    const mainVpc = new vpc.Vpc(this, "main", {
      cidrBlock: config.vpcCidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "main-vpc",
        ...config.tags,
      },
    });
    this.vpcId = mainVpc.id;

    // Create Internet Gateway
    const igw = new internetGateway.InternetGateway(this, "igw", {
      vpcId: mainVpc.id,
      tags: {
        Name: "main-igw",
        ...config.tags,
      },
    });
    this.internetGatewayId = igw.id;

    // Create public and private subnets
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];
    this.natGatewayIds = [];

    // Public route table
    const publicRouteTable = new routeTable.RouteTable(this, "public-route-table", {
      vpcId: mainVpc.id,
      tags: {
        Name: "public-route-table",
        ...config.tags,
      },
    });

    // Add route to Internet Gateway
    new routeTable.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Create public and private subnets across AZs
    for (let i = 0; i < config.availabilityZones.length; i++) {
      // Create public subnet
      if (i < config.publicSubnetCidrs.length) {
        const publicSubnet = new subnet.Subnet(this, `public-subnet-${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: config.publicSubnetCidrs[i],
          availabilityZone: config.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}`,
            ...config.tags,
          },
        });
        this.publicSubnetIds.push(publicSubnet.id);

        // Associate public subnet with public route table
        new routeTableAssociation.RouteTableAssociation(this, `public-route-assoc-${i}`, {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        });

        // Create NAT Gateway with Elastic IP in public subnet
        const eip = new eip.Eip(this, `nat-eip-${i}`, {
          vpc: true,
          tags: {
            Name: `nat-eip-${i}`,
            ...config.tags,
          },
        });

        const natGateway = new natGateway.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `nat-gateway-${i}`,
            ...config.tags,
          },
        });
        this.natGatewayIds.push(natGateway.id);

        // Create private subnet
        if (i < config.privateSubnetCidrs.length) {
          const privateSubnet = new subnet.Subnet(this, `private-subnet-${i}`, {
            vpcId: mainVpc.id,
            cidrBlock: config.privateSubnetCidrs[i],
            availabilityZone: config.availabilityZones[i],
            tags: {
              Name: `private-subnet-${i}`,
              ...config.tags,
            },
          });
          this.privateSubnetIds.push(privateSubnet.id);

          // Private route table
          const privateRouteTable = new routeTable.RouteTable(this, `private-route-table-${i}`, {
            vpcId: mainVpc.id,
            tags: {
              Name: `private-route-table-${i}`,
              ...config.tags,
            },
          });

          // Add route to NAT Gateway
          new routeTable.Route(this, `private-route-${i}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: natGateway.id,
          });

          // Associate private subnet with private route table
          new routeTableAssociation.RouteTableAssociation(this, `private-route-assoc-${i}`, {
            subnetId: privateSubnet.id,
            routeTableId: privateRouteTable.id,
          });
        }
      }
    }

    // Enable VPC Flow Logs
    const flowLog = new flowLog.FlowLog(this, "flow-log", {
      logDestination: config.flowLogBucketArn,
      logDestinationType: "s3",
      trafficType: "ALL",
      vpcId: mainVpc.id,
      tags: {
        Name: "vpc-flow-logs",
        ...config.tags,
      },
    });
    this.flowLogId = flowLog.id;
  }
}

// IAM Module
export class IamModule extends Construct {
  public readonly ec2Role: iamRole.IamRole;
  public readonly ec2InstanceProfile: iamInstanceProfile.IamInstanceProfile;
  public readonly configRole: iamRole.IamRole;
  
  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 Role
    this.ec2Role = new iamRole.IamRole(this, "ec2-role", {
      name: "ec2-instance-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
      tags: config.tags,
    });

    // EC2 Policy for SSM access
    const ec2Policy = new iamPolicy.IamPolicy(this, "ec2-policy", {
      name: "ec2-ssm-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ssm:GetParameter",
              "ssm:GetParameters",
              "ssm:GetParametersByPath",
            ],
            Resource: "arn:aws:ssm:eu-north-1:*:parameter/prod/*",
          },
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "logs:PutLogEvents",
              "logs:CreateLogStream",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach policy to role
    new iamPolicy.IamPolicyAttachment(this, "ec2-policy-attachment", {
      name: "ec2-ssm-policy-attachment",
      roles: [this.ec2Role.name],
      policyArn: ec2Policy.arn,
    });

    // Create instance profile
    this.ec2InstanceProfile = new iamInstanceProfile.IamInstanceProfile(this, "ec2-instance-profile", {
      name: "ec2-instance-profile",
      role: this.ec2Role.name,
    });

    // AWS Config Role
    this.configRole = new iamRole.IamRole(this, "config-role", {
      name: "aws-config-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "config.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
      ],
      tags: config.tags,
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly mainBucket: s3Bucket.S3Bucket;
  public readonly logBucket: s3Bucket.S3Bucket;
  
  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create log bucket first
    this.logBucket = new s3Bucket.S3Bucket(this, "log-bucket", {
      bucket: config.logBucketName,
      acl: "log-delivery-write",
      tags: {
        Name: config.logBucketName,
        ...config.tags,
      },
    });

    // Block public access to log bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "log-bucket-public-access-block", {
      bucket: this.logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable encryption for log bucket
    new s3BucketServerSideEncryptionConfigurationA.S3BucketServerSideEncryptionConfiguration(
      this,
      "log-bucket-encryption",
      {
        bucket: this.logBucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.kmsKeyId,
          },
        }],
      }
    );

    // Create main bucket
    this.mainBucket = new s3Bucket.S3Bucket(this, "main-bucket", {
      bucket: config.bucketName,
      loggingTargetBucket: this.logBucket.id,
      loggingTargetPrefix: "main-bucket-logs/",
      tags: {
        Name: config.bucketName,
        ...config.tags,
      },
    });

    // Block public access to main bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "main-bucket-public-access-block", {
      bucket: this.mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable encryption for main bucket
    new s3BucketServerSideEncryptionConfigurationA.S3BucketServerSideEncryptionConfiguration(
      this,
      "main-bucket-encryption",
      {
        bucket: this.mainBucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.kmsKeyId,
          },
        }],
      }
    );

    // Create bucket policy to deny non-SSL access
    const mainBucketPolicy = new s3BucketPolicy.S3BucketPolicy(this, "main-bucket-policy", {
      bucket: this.mainBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyNonSSLRequests",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              `arn:aws:s3:::${config.bucketName}`,
              `arn:aws:s3:::${config.bucketName}/*`,
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false",
              },
            },
          },
        ],
      }),
    });
  }
}

// EC2 Module
export class Ec2Module extends Construct {
  public readonly launchTemplate: launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: autoscalingGroup.AutoscalingGroup;
  
  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Create security group for EC2 instances
    const ec2SecurityGroup = new securityGroup.SecurityGroup(this, "ec2-security-group", {
      name: "ec2-security-group",
      vpcId: config.vpcId,
      description: "Security group for EC2 instances",
      tags: {
        Name: "ec2-security-group",
        ...config.tags,
      },
    });

    // Allow SSH from specified CIDR only
    new securityGroupRule.SecurityGroupRule(this, "ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [config.sshCidr],
      securityGroupId: ec2SecurityGroup.id,
    });

    // Allow all outbound traffic
    new securityGroupRule.SecurityGroupRule(this, "all-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ec2SecurityGroup.id,
    });

    // Create launch template
    this.launchTemplate = new launchTemplate.LaunchTemplate(this, "ec2-launch-template", {
      name: "ec2-launch-template",
      imageId: "ami-0989fb15ce71ba39e", // Amazon Linux 2 AMI in eu-north-1
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: [ec2SecurityGroup.id, ...config.securityGroupIds],
      iamInstanceProfile: {
        name: config.iamInstanceProfileName,
      },
      monitoring: {
        enabled: true, // Enable detailed CloudWatch monitoring
      },
      blockDeviceMappings: [
        {
          deviceName: "/dev/xvda",
          ebs: {
            volumeSize: 20,
            volumeType: "gp3",
            encrypted: true,
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            Name: "ec2-instance",
            ...config.tags,
          },
        },
      ],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscalingGroup.AutoscalingGroup(this, "ec2-asg", {
      name: "ec2-auto-scaling-group",
      maxSize: config.maxCapacity,
      minSize: config.minCapacity,
      desiredCapacity: config.minCapacity,
      vpcZoneIdentifiers: config.subnetIds,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      tags: Object.entries(config.tags || {}).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: dbInstance.DbInstance;
  
  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create security group for RDS
    const rdsSecurityGroup = new securityGroup.SecurityGroup(this, "rds-security-group", {
      name: "rds-security-group",
      vpcId: config.vpcId,
      description: "Security group for RDS instance",
      tags: {
        Name: "rds-security-group",
        ...config.tags,
      },
    });

    // Allow incoming traffic to RDS from EC2 security groups
    config.securityGroupIds.forEach((sgId, index) => {
      new securityGroupRule.SecurityGroupRule(this, `rds-ingress-${index}`, {
        type: "ingress",
        fromPort: 3306, // MySQL/Aurora default port
        toPort: 3306,
        protocol: "tcp",
        sourceSecurityGroupId: sgId,
        securityGroupId: rdsSecurityGroup.id,
      });
    });

    // Create DB subnet group
    const dbSubnetGroup = new dbSubnetGroup.DbSubnetGroup(this, "rds-subnet-group", {
      name: "rds-subnet-group",
      subnetIds: config.subnetIds,
      description: "Subnet group for RDS instance",
      tags: {
        Name: "rds-subnet-group",
        ...config.tags,
      },
    });

    // Create RDS instance
    this.dbInstance = new dbInstance.DbInstance(this, "rds-instance", {
      identifier: "production-db",
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      storageType: "gp2",
      name: config.dbName,
      username: config.username,
      password: config.password,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: true,
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyId,
      backupRetentionPeriod: 7,
      copyTagsToSnapshot: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.dbName}-final-snapshot`,
      publiclyAccessible: false,
      tags: {
        Name: "production-db",
        ...config.tags,
      },
    });
  }
}

// CloudTrail Module
export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  
  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create CloudTrail
    this.trail = new cloudtrail.Cloudtrail(this, "cloudtrail", {
      name: "organization-trail",
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: "cloudtrail",
      enableLogging: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      kmsKeyId: config.kmsKeyId,
      tags: {
        Name: "organization-trail",
        ...config.tags,
      },
    });
  }
}

// Config Module
export class ConfigModule extends Construct {
  public readonly configRecorder: configConfigurationRecorder.ConfigConfigurationRecorder;
  public readonly deliveryChannel: configDeliveryChannel.ConfigDeliveryChannel;
  
  constructor(scope: Construct, id: string, config: ConfigModuleConfig) {
    super(scope, id);

    // Create AWS Config Configuration Recorder
    this.configRecorder = new configConfigurationRecorder.ConfigConfigurationRecorder(this, "config-recorder", {
      name: "default",
      roleArn: config.iamRoleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResources: true,
      },
    });

    // Create AWS Config Delivery Channel
    this.deliveryChannel = new configDeliveryChannel.ConfigDeliveryChannel(this, "config-delivery-channel", {
      name: "default",
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: "config",
      snapshotDeliveryProperties: {
        deliveryFrequency: "Six_Hours",
      },
    });

    // Create AWS Config Rules
    new configConfigRule.ConfigConfigRule(this, "s3-bucket-public-write-prohibited", {
      name: "s3-bucket-public-write-prohibited",
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_PUBLIC_WRITE_PROHIBITED",
      },
    });

    new configConfigRule.ConfigConfigRule(this, "encrypted-volumes", {
      name: "encrypted-volumes",
      source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES",
      },
    });

    new configConfigRule.ConfigConfigRule(this, "rds-storage-encrypted", {
      name: "rds-storage-encrypted",
      source: {
        owner: "AWS",
        sourceIdentifier: "RDS_STORAGE_ENCRYPTED",
      },
    });
  }
}

// KMS Module
export class KmsModule extends Construct {
  public readonly key: kmsKey.KmsKey;
  
  constructor(scope: Construct, id: string, config: KmsModuleConfig) {
    super(scope, id);

    // Create KMS key
    this.key = new kmsKey.KmsKey(this, "kms-key", {
      description: config.description,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "*",
            },
            Action: "kms:*",
            Resource: "*",
            Condition: {
              StringEquals: {
                "kms:CallerAccount": "${data.aws_caller_identity.current.account_id}",
              },
            },
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com",
            },
            Action: ["kms:GenerateDataKey*"],
            Resource: "*",
            Condition: {
              StringLike: {
                "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*",
              },
            },
          },
        ],
      }),
      tags: config.tags,
    });

    // Create KMS alias
    new kmsAlias.KmsAlias(this, "kms-alias", {
      name: `alias/${id}`,
      targetKeyId: this.key.id,
    });
  }
}
```

Now let's implement the `tap-stack.ts` file, which will put all of these modules together:

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
  ConfigModule,
  KmsModule,
} from "./modules";

class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Initialize AWS Provider in eu-north-1
    new AwsProvider(this, "aws", {
      region: "eu-north-1",
    });

    // Global environment tags
    const tags = {
      Environment: "Production",
      Project: "TAP",
      ManagedBy: "CDKTF",
    };

    // Create KMS keys
    const mainKms = new KmsModule(this, "main-kms", {
      description: "Main KMS key for encryption",
      tags,
    });

    const rdsKms = new KmsModule(this, "rds-kms", {
      description: "KMS key for RDS encryption",
      tags,
    });

    // Create S3 buckets
    const s3 = new S3Module(this, "s3", {
      bucketName: "tap-production-data-bucket",
      logBucketName: "tap-production-logs-bucket",
      kmsKeyId: mainKms.key.id,
      tags,
    });

    // Create VPC infrastructure
    const vpc = new VpcModule(this, "vpc", {
      vpcCidrBlock: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.3.0/24", "10.0.4.0/24"],
      availabilityZones: ["eu-north-1a", "eu-north-1b"],
      flowLogBucketArn: s3.logBucket.arn,
      tags,
    });

    // Create IAM roles and policies
    const iam = new IamModule(this, "iam", {
      vpcId: vpc.vpcId,
      tags,
    });

    // Create EC2 instances with Auto Scaling
    const ec2 = new Ec2Module(this, "ec2", {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceType: "t3.micro",
      iamInstanceProfileName: iam.ec2InstanceProfile.name,
      sshCidr: "10.0.0.0/24", // Replace with actual admin IP range
      minCapacity: 2,
      maxCapacity: 5,
      tags,
    });

    // Create RDS database
    const rds = new RdsModule(this, "rds", {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceClass: "db.t3.small",
      engine: "mysql",
      engineVersion: "8.0",
      dbName: "productiondb",
      username: "admin",
      password: "StrongPasswordToBeReplaced", // Should be replaced with a secret
      kmsKeyId: rdsKms.key.id,
      tags,
    });

    // Enable CloudTrail for logging
    const cloudTrail = new CloudTrailModule(this, "cloudtrail", {
      s3BucketName: s3.logBucket.bucket,
      kmsKeyId: mainKms.key.id,
      tags,
    });

    // Enable AWS Config for compliance monitoring
    const configModule = new ConfigModule(this, "config", {
      s3BucketName: s3.logBucket.bucket,
      iamRoleArn: iam.configRole.arn,
      tags,
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.vpcId,
      description: "The ID of the VPC",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: vpc.publicSubnetIds,
      description: "The IDs of the public subnets",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: vpc.privateSubnetIds,
      description: "The IDs of the private subnets",
    });

    new TerraformOutput(this, "main_bucket_name", {
      value: s3.mainBucket.bucket,
      description: "The name of the main S3 bucket",
    });

    new TerraformOutput(this, "log_bucket_name", {
      value: s3.logBucket.bucket,
      description: "The name of the log S3 bucket",
    });

    new TerraformOutput(this, "rds_instance_endpoint", {
      value: rds.dbInstance.endpoint,
      description: "The connection endpoint for the RDS instance",
    });

    new TerraformOutput(this, "main_kms_key_arn", {
      value: mainKms.key.arn,
      description: "The ARN of the main KMS key",
    });

    new TerraformOutput(this, "rds_kms_key_arn", {
      value: rdsKms.key.arn,
      description: "The ARN of the RDS KMS key",
    });
  }
}

const app = new App();
new TapStack(app, "tap-stack");
app.synth();
```

Now let's review the implementation to ensure it meets all the requirements:

1. **Region & Environment Setup**: All resources are deployed in eu-north-1 and have consistent environment tagging.

2. **Storage Configuration**: Created S3 buckets with proper logging, encryption, and access restrictions.

3. **IAM & Access Management**: Implemented least privilege IAM roles and policies, with instance profiles for EC2 instances.

4. **Networking**: Created a VPC with public and private subnets, IGW, NAT gateway, and security groups with restricted access.

5. **Compute Resources**: Set up EC2 instances in an Auto Scaling Group with IAM instance profiles and CloudWatch monitoring.

6. **Database Layer**: Created an RDS instance in private subnets, encrypted at rest, with automatic backups.

7. **Monitoring & Logging**: Enabled CloudTrail for API activity logging and AWS Config for compliance monitoring.

8. **Encryption & Key Management**: Used KMS for key management and encryption of all storage resources.

Let's finalize both files and provide a complete solution:

For modules.ts:
- I've defined all required modules for VPC, IAM, S3, EC2, RDS, CloudTrail, Config, and KMS
- Each module takes a configuration interface and follows best practices for security and encryption

For tap-stack.ts:
- Imports and integrates all modules from modules.ts
- Sets up the AWS provider for eu-north-1
- Configures dependencies between modules
- Applies consistent tagging
- Outputs key resource identifiers

This implementation satisfies all the core requirements and constraints specified in the problem statement.
### Answer 
---

# Secure AWS Infrastructure with CDKTF

I've created a comprehensive AWS infrastructure using CDK for Terraform (CDKTF) in TypeScript, following all security, encryption, and availability best practices. Below are the two required files:

## modules.ts

This file contains modular, reusable components for each AWS service:

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  vpc,
  subnet,
  internetGateway,
  natGateway,
  routeTable,
  routeTableAssociation,
  flowLog,
  securityGroup,
  securityGroupRule,
  s3Bucket,
  s3BucketPolicy,
  s3BucketServerSideEncryptionConfiguration,
  s3BucketPublicAccessBlock,
  iamRole,
  iamPolicy,
  iamPolicyAttachment,
  iamInstanceProfile,
  launchTemplate,
  autoscalingGroup,
  dbInstance,
  dbSubnetGroup,
  cloudtrail,
  kmsKey,
  kmsAlias,
  configConfigurationRecorder,
  configDeliveryChannel,
  configConfigRule,
  eip,
} from "@cdktf/provider-aws";

// Module configuration interfaces
export interface VpcModuleConfig {
  vpcCidrBlock: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  flowLogBucketArn: string;
  tags?: { [key: string]: string };
}

export interface IamModuleConfig {
  vpcId: string;
  tags?: { [key: string]: string };
}

export interface S3ModuleConfig {
  bucketName: string;
  logBucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface Ec2ModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceType: string;
  iamInstanceProfileName: string;
  sshCidr: string;
  minCapacity: number;
  maxCapacity: number;
  keyName?: string;
  tags?: { [key: string]: string };
}

export interface RdsModuleConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass: string;
  engine: string;
  engineVersion: string;
  dbName: string;
  username: string;
  password: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface CloudTrailModuleConfig {
  s3BucketName: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export interface ConfigModuleConfig {
  s3BucketName: string;
  iamRoleArn: string;
  tags?: { [key: string]: string };
}

export interface KmsModuleConfig {
  description: string;
  tags?: { [key: string]: string };
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];
  public readonly flowLogId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC
    const mainVpc = new vpc.Vpc(this, "main", {
      cidrBlock: config.vpcCidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "main-vpc",
        ...config.tags,
      },
    });
    this.vpcId = mainVpc.id;

    // Create Internet Gateway
    const igw = new internetGateway.InternetGateway(this, "igw", {
      vpcId: mainVpc.id,
      tags: {
        Name: "main-igw",
        ...config.tags,
      },
    });
    this.internetGatewayId = igw.id;

    // Create public and private subnets
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];
    this.natGatewayIds = [];

    // Public route table
    const publicRouteTable = new routeTable.RouteTable(this, "public-route-table", {
      vpcId: mainVpc.id,
      tags: {
        Name: "public-route-table",
        ...config.tags,
      },
    });

    // Add route to Internet Gateway
    new routeTable.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Create subnets and NAT gateways across AZs
    for (let i = 0; i < config.availabilityZones.length; i++) {
      // Create public subnet
      if (i < config.publicSubnetCidrs.length) {
        const publicSubnet = new subnet.Subnet(this, `public-subnet-${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: config.publicSubnetCidrs[i],
          availabilityZone: config.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}`,
            ...config.tags,
          },
        });
        this.publicSubnetIds.push(publicSubnet.id);

        // Associate public subnet with public route table
        new routeTableAssociation.RouteTableAssociation(this, `public-route-assoc-${i}`, {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        });

        // Create NAT Gateway with Elastic IP in public subnet
        const eipForNat = new eip.Eip(this, `nat-eip-${i}`, {
          vpc: true,
          tags: {
            Name: `nat-eip-${i}`,
            ...config.tags,
          },
        });

        const natGateway = new natGateway.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eipForNat.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `nat-gateway-${i}`,
            ...config.tags,
          },
        });
        this.natGatewayIds.push(natGateway.id);

        // Create private subnet
        if (i < config.privateSubnetCidrs.length) {
          const privateSubnet = new subnet.Subnet(this, `private-subnet-${i}`, {
            vpcId: mainVpc.id,
            cidrBlock: config.privateSubnetCidrs[i],
            availabilityZone: config.availabilityZones[i],
            tags: {
              Name: `private-subnet-${i}`,
              ...config.tags,
            },
          });
          this.privateSubnetIds.push(privateSubnet.id);

          // Private route table
          const privateRouteTable = new routeTable.RouteTable(this, `private-route-table-${i}`, {
            vpcId: mainVpc.id,
            tags: {
              Name: `private-route-table-${i}`,
              ...config.tags,
            },
          });

          // Add route to NAT Gateway
          new routeTable.Route(this, `private-route-${i}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: natGateway.id,
          });

          // Associate private subnet with private route table
          new routeTableAssociation.RouteTableAssociation(this, `private-route-assoc-${i}`, {
            subnetId: privateSubnet.id,
            routeTableId: privateRouteTable.id,
          });
        }
      }
    }

    // Enable VPC Flow Logs
    const vpcFlowLog = new flowLog.FlowLog(this, "flow-log", {
      logDestination: config.flowLogBucketArn,
      logDestinationType: "s3",
      trafficType: "ALL",
      vpcId: mainVpc.id,
      tags: {
        Name: "vpc-flow-logs",
        ...config.tags,
      },
    });
    this.flowLogId = vpcFlowLog.id;
  }
}

// IAM Module
export class IamModule extends Construct {
  public readonly ec2Role: iamRole.IamRole;
  public readonly ec2InstanceProfile: iamInstanceProfile.IamInstanceProfile;
  public readonly configRole: iamRole.IamRole;
  
  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 Role with least privilege
    this.ec2Role = new iamRole.IamRole(this, "ec2-role", {
      name: "ec2-instance-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
      tags: config.tags,
    });

    // EC2 Policy for minimal permissions
    const ec2Policy = new iamPolicy.IamPolicy(this, "ec2-policy", {
      name: "ec2-minimal-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "logs:PutLogEvents",
              "logs:CreateLogStream",
              "logs:CreateLogGroup",
              "logs:DescribeLogStreams"
            ],
            Resource: "*",
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach policy to role
    new iamPolicyAttachment.IamPolicyAttachment(this, "ec2-policy-attachment", {
      name: "ec2-policy-attachment",
      roles: [this.ec2Role.name],
      policyArn: ec2Policy.arn,
    });

    // Create instance profile
    this.ec2InstanceProfile = new iamInstanceProfile.IamInstanceProfile(this, "ec2-instance-profile", {
      name: "ec2-instance-profile",
      role: this.ec2Role.name,
    });

    // AWS Config Role
    this.configRole = new iamRole.IamRole(this, "config-role", {
      name: "aws-config-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "config.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
      ],
      tags: config.tags,
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly mainBucket: s3Bucket.S3Bucket;
  public readonly logBucket: s3Bucket.S3Bucket;
  
  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create log bucket first
    this.logBucket = new s3Bucket.S3Bucket(this, "log-bucket", {
      bucket: config.logBucketName,
      acl: "log-delivery-write",
      tags: {
        Name: config.logBucketName,
        ...config.tags,
      },
    });

    // Block public access to log bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "log-bucket-public-access-block", {
      bucket: this.logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable encryption for log bucket
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfiguration(
      this,
      "log-bucket-encryption",
      {
        bucket: this.logBucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.kmsKeyId,
          },
        }],
      }
    );

    // Create main bucket
    this.mainBucket = new s3Bucket.S3Bucket(this, "main-bucket", {
      bucket: config.bucketName,
      loggingTargetBucket: this.logBucket.id,
      loggingTargetPrefix: "main-bucket-logs/",
      tags: {
        Name: config.bucketName,
        ...config.tags,
      },
    });

    // Block public access to main bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "main-bucket-public-access-block", {
      bucket: this.mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable encryption for main bucket
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfiguration(
      this,
      "main-bucket-encryption",
      {
        bucket: this.mainBucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.kmsKeyId,
          },
        }],
      }
    );

    // Create bucket policy to deny non-SSL access
    new s3BucketPolicy.S3BucketPolicy(this, "main-bucket-policy", {
      bucket: this.mainBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyNonSSLRequests",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              `arn:aws:s3:::${config.bucketName}`,
              `arn:aws:s3:::${config.bucketName}/*`,
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false",
              },
            },
          },
        ],
      }),
    });
  }
}

// EC2 Module
export class Ec2Module extends Construct {
  public readonly launchTemplate: launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: autoscalingGroup.AutoscalingGroup;
  
  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Create security group for EC2 instances
    const ec2SecurityGroup = new securityGroup.SecurityGroup(this, "ec2-security-group", {
      name: "ec2-security-group",
      vpcId: config.vpcId,
      description: "Security group for EC2 instances",
      tags: {
        Name: "ec2-security-group",
        ...config.tags,
      },
    });

    // Allow SSH from specified CIDR only
    new securityGroupRule.SecurityGroupRule(this, "ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [config.sshCidr],
      securityGroupId: ec2SecurityGroup.id,
    });

    // Allow only necessary outbound traffic
    new securityGroupRule.SecurityGroupRule(this, "https-egress", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ec2SecurityGroup.id,
    });

    // Create launch template
    this.launchTemplate = new launchTemplate.LaunchTemplate(this, "ec2-launch-template", {
      name: "ec2-launch-template",
      imageId: "ami-0989fb15ce71ba39e", // Amazon Linux 2 AMI in eu-north-1
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: [ec2SecurityGroup.id, ...config.securityGroupIds],
      iamInstanceProfile: {
        name: config.iamInstanceProfileName,
      },
      monitoring: {
        enabled: true, // Enable detailed CloudWatch monitoring
      },
      blockDeviceMappings: [
        {
          deviceName: "/dev/xvda",
          ebs: {
            volumeSize: 20,
            volumeType: "gp3",
            encrypted: true,
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            Name: "ec2-instance",
            ...config.tags,
          },
        },
      ],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscalingGroup.AutoscalingGroup(this, "ec2-asg", {
      name: "ec2-auto-scaling-group",
      maxSize: config.maxCapacity,
      minSize: config.minCapacity,
      desiredCapacity: config.minCapacity,
      vpcZoneIdentifiers: config.subnetIds,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      tags: Object.entries(config.tags || {}).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: dbInstance.DbInstance;
  
  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create security group for RDS
    const rdsSecurityGroup = new securityGroup.SecurityGroup(this, "rds-security-group", {
      name: "rds-security-group",
      vpcId: config.vpcId,
      description: "Security group for RDS instance",
      tags: {
        Name: "rds-security-group",
        ...config.tags,
      },
    });

    // Allow incoming traffic to RDS from EC2 security groups
    config.securityGroupIds.forEach((sgId, index) => {
      new securityGroupRule.SecurityGroupRule(this, `rds-ingress-${index}`, {
        type: "ingress",
        fromPort: 3306, // MySQL/Aurora default port
        toPort: 3306,
        protocol: "tcp",
        sourceSecurityGroupId: sgId,
        securityGroupId: rdsSecurityGroup.id,
      });
    });

    // Create DB subnet group
    const dbSubnetGroup = new dbSubnetGroup.DbSubnetGroup(this, "rds-subnet-group", {
      name: "rds-subnet-group",
      subnetIds: config.subnetIds,
      description: "Subnet group for RDS instance",
      tags: {
        Name: "rds-subnet-group",
        ...config.tags,
      },
    });

    // Create RDS instance
    this.dbInstance = new dbInstance.DbInstance(this, "rds-instance", {
      identifier: "production-db",
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      storageType: "gp2",
      name: config.dbName,
      username: config.username,
      password: config.password,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: true,
      storageEncrypted: true,
      kmsKeyId: config.kmsKeyId,
      backupRetentionPeriod: 7,
      copyTagsToSnapshot: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.dbName}-final-snapshot`,
      publiclyAccessible: false,
      tags: {
        Name: "production-db",
        ...config.tags,
      },
    });
  }
}

// CloudTrail Module
export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  
  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create CloudTrail
    this.trail = new cloudtrail.Cloudtrail(this, "cloudtrail", {
      name: "organization-trail",
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: "cloudtrail",
      enableLogging: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      kmsKeyId: config.kmsKeyId,
      tags: {
        Name: "organization-trail",
        ...config.tags,
      },
    });
  }
}

// Config Module
export class ConfigModule extends Construct {
  public readonly configRecorder: configConfigurationRecorder.ConfigConfigurationRecorder;
  public readonly deliveryChannel: configDeliveryChannel.ConfigDeliveryChannel;
  
  constructor(scope: Construct, id: string, config: ConfigModuleConfig) {
    super(scope, id);

    // Create AWS Config Configuration Recorder
    this.configRecorder = new configConfigurationRecorder.ConfigConfigurationRecorder(this, "config-recorder", {
      name: "default",
      roleArn: config.iamRoleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResources: true,
      },
    });

    // Create AWS Config Delivery Channel
    this.deliveryChannel = new configDeliveryChannel.ConfigDeliveryChannel(this, "config-delivery-channel", {
      name: "default",
      s3BucketName: config.s3BucketName,
      s3KeyPrefix: "config",
      snapshotDeliveryProperties: {
        deliveryFrequency: "Six_Hours",
      },
    });

    // Create AWS Config Rules for security compliance
    new configConfigRule.ConfigConfigRule(this, "s3-bucket-public-write-prohibited", {
      name: "s3-bucket-public-write-prohibited",
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_PUBLIC_WRITE_PROHIBITED",
      },
    });

    new configConfigRule.ConfigConfigRule(this, "encrypted-volumes", {
      name: "encrypted-volumes",
      source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES",
      },
    });

    new configConfigRule.ConfigConfigRule(this, "rds-storage-encrypted", {
      name: "rds-storage-encrypted",
      source: {
        owner: "AWS",
        sourceIdentifier: "RDS_STORAGE_ENCRYPTED",
      },
    });
  }
}

// KMS Module
export class KmsModule extends Construct {
  public readonly key: kmsKey.KmsKey;
  
  constructor(scope: Construct, id: string, config: KmsModuleConfig) {
    super(scope, id);

    // Create KMS key
    this.key = new kmsKey.KmsKey(this, "kms-key", {
      description: config.description,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "*",
            },
            Action: "kms:*",
            Resource: "*",
            Condition: {
              StringEquals: {
                "kms:CallerAccount": "${data.aws_caller_identity.current.account_id}",
              },
            },
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com",
            },
            Action: ["kms:GenerateDataKey*"],
            Resource: "*",
            Condition: {
              StringLike: {
                "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*",
              },
            },
          },
        ],
      }),
      tags: config.tags,
    });

    // Create KMS alias
    new kmsAlias.KmsAlias(this, "kms-alias", {
      name: `alias/${id}`,
      targetKeyId: this.key.id,
    });
  }
}
```

## tap-stack.ts

This file orchestrates all modules into a complete infrastructure stack:

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
  ConfigModule,
  KmsModule,
} from "./modules";

class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Initialize AWS Provider in eu-north-1
    new AwsProvider(this, "aws", {
      region: "eu-north-1",
    });

    // Global environment tags
    const tags = {
      Environment: "Production",
      Project: "TAP",
      ManagedBy: "CDKTF",
    };

    // Create KMS keys for different services
    const mainKms = new KmsModule(this, "main-kms", {
      description: "Main KMS key for encryption",
      tags,
    });

    const rdsKms = new KmsModule(this, "rds-kms", {
      description: "KMS key for RDS encryption",
      tags,
    });

    // Create S3 buckets
    const s3 = new S3Module(this, "s3", {
      bucketName: "tap-production-data-bucket",
      logBucketName: "tap-production-logs-bucket",
      kmsKeyId: mainKms.key.id,
      tags,
    });

    // Create VPC infrastructure
    const vpc = new VpcModule(this, "vpc", {
      vpcCidrBlock: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.3.0/24", "10.