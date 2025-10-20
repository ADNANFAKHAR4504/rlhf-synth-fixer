### Reasoning Trace
---

The user wants a production-ready AWS CDKTF TypeScript project with exactly two files that implements a comprehensive secure web application infrastructure. Let me break down all the requirements:

1. VPC & Networking - Multi-AZ VPC with public/private subnets, IGW, NAT Gateways, route tables, NACLs
2. IAM & Least Privilege - Roles and policies for various services, no wildcards, MFA examples
3. S3 & Encryption - Audit/backup buckets with SSE, block public access, access logging
4. RDS & Secrets - Multi-AZ RDS with Secrets Manager integration, encryption
5. Monitoring & Logging - CloudTrail, VPC Flow Logs, CloudWatch alarms, GuardDuty, AWS Config
6. API Gateway & Logging - Optional, with logging and WAF integration
7. WAF & Layer 7 Protection - WAFv2 WebACL with managed rules
8. Compute & Auto-scaling - ASG with ALB, private subnets, IAM roles
9. SSM & Secrets Management - Secrets Manager for sensitive data
10. Backups & Recovery - RDS automated backups
11. Security Controls - Security groups, NACLs, S3 policies, EBS encryption
12. Outputs & Documentation - Comprehensive outputs and inline documentation

I need to create two files:
- `lib/modules.ts` - Reusable constructs for all components
- `lib/tap-stack.ts` - Main stack orchestrating all modules

This is a complex requirement that needs comprehensive implementation. Let me structure this carefully.
### Answer 
---

I'll generate a comprehensive production-ready AWS CDKTF TypeScript project for a secure, resilient web application infrastructure. Here are the two files:

## lib/modules.ts

```typescript
import { Construct } from "constructs";
import * as aws from "@cdktf/provider-aws";
import { TerraformOutput } from "cdktf";
import { Fn } from "cdktf";

// ================================================================================
// VPC Module - Multi-AZ VPC with public/private subnets, NAT, and security controls
// ================================================================================
export class SecureVpcConstruct extends Construct {
  public vpc: aws.vpc.Vpc;
  public publicSubnets: aws.subnet.Subnet[] = [];
  public privateSubnets: aws.subnet.Subnet[] = [];
  public natGateways: aws.natGateway.NatGateway[] = [];
  public internetGateway: aws.internetGateway.InternetGateway;

  constructor(scope: Construct, id: string, config: {
    vpcCidr: string;
    publicSubnetCidrs: string[];
    privateSubnetCidrs: string[];
    availabilityZones: string[];
    projectName: string;
    environment: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create VPC with DNS support and hostnames for private DNS resolution
    this.vpc = new aws.vpc.Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-vpc`
      }
    });

    // Create Internet Gateway for public subnet outbound traffic
    this.internetGateway = new aws.internetGateway.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-igw`
      }
    });

    // Create public subnets across AZs
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-public-${index + 1}`,
          Type: "public"
        }
      });
      this.publicSubnets.push(subnet);
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.eip.Eip[] = [];
    this.publicSubnets.forEach((_, index) => {
      const eip = new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-nat-eip-${index + 1}`
        }
      });
      eips.push(eip);
    });

    // Create NAT Gateways in public subnets for private subnet outbound traffic
    this.publicSubnets.forEach((subnet, index) => {
      const natGateway = new aws.natGateway.NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-nat-${index + 1}`
        }
      });
      this.natGateways.push(natGateway);
    });

    // Create private subnets across AZs
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-${index + 1}`,
          Type: "private"
        }
      });
      this.privateSubnets.push(subnet);
    });

    // Create public route table and associate with public subnets
    const publicRouteTable = new aws.routeTable.RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-rt`
      }
    });

    // Add route to Internet Gateway for public subnets
    new aws.route.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Create private route tables (one per AZ for resilience)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-private-rt-${index + 1}`
        }
      });

      // Add route to NAT Gateway for private subnets
      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index % this.natGateways.length].id
      });

      new aws.routeTableAssociation.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Create Network ACLs for defense-in-depth
    this.createNetworkAcls(config);
  }

  private createNetworkAcls(config: any) {
    // Public subnet NACL - Allow inbound HTTP/HTTPS, ephemeral ports, and deny all else
    const publicNacl = new aws.networkAcl.NetworkAcl(this, "public-nacl", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-public-nacl`
      }
    });

    // NACL rules for public subnets
    // Inbound: Allow HTTP/HTTPS from anywhere, ephemeral ports for responses
    new aws.networkAclRule.NetworkAclRule(this, "public-nacl-in-http", {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
      egress: false
    });

    new aws.networkAclRule.NetworkAclRule(this, "public-nacl-in-https", {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
      egress: false
    });

    new aws.networkAclRule.NetworkAclRule(this, "public-nacl-in-ephemeral", {
      networkAclId: publicNacl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: false
    });

    // Outbound: Allow all (NAT Gateway needs to reach internet)
    new aws.networkAclRule.NetworkAclRule(this, "public-nacl-out-all", {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true
    });

    // Associate public NACL with public subnets
    this.publicSubnets.forEach((subnet, index) => {
      new aws.networkAclAssociation.NetworkAclAssociation(this, `public-nacl-assoc-${index}`, {
        subnetId: subnet.id,
        networkAclId: publicNacl.id
      });
    });

    // Private subnet NACL - More restrictive, only allow VPC traffic and responses
    const privateNacl = new aws.networkAcl.NetworkAcl(this, "private-nacl", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-private-nacl`
      }
    });

    // Inbound: Allow traffic from VPC CIDR
    new aws.networkAclRule.NetworkAclRule(this, "private-nacl-in-vpc", {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: config.vpcCidr,
      egress: false
    });

    // Inbound: Allow ephemeral ports for internet responses via NAT
    new aws.networkAclRule.NetworkAclRule(this, "private-nacl-in-ephemeral", {
      networkAclId: privateNacl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: false
    });

    // Outbound: Allow all (needed for updates, external APIs)
    new aws.networkAclRule.NetworkAclRule(this, "private-nacl-out-all", {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: "-1",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      egress: true
    });

    // Associate private NACL with private subnets
    this.privateSubnets.forEach((subnet, index) => {
      new aws.networkAclAssociation.NetworkAclAssociation(this, `private-nacl-assoc-${index}`, {
        subnetId: subnet.id,
        networkAclId: privateNacl.id
      });
    });
  }
}

// ================================================================================
// IAM Module - Least privilege roles and policies
// ================================================================================
export class IamRoleConstruct extends Construct {
  public role: aws.iamRole.IamRole;

  constructor(scope: Construct, id: string, config: {
    roleName: string;
    assumeRolePolicy: any;
    managedPolicyArns?: string[];
    inlinePolicies?: Array<{ name: string; policy: any }>;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    this.role = new aws.iamRole.IamRole(this, "role", {
      name: config.roleName,
      assumeRolePolicy: JSON.stringify(config.assumeRolePolicy),
      managedPolicyArns: config.managedPolicyArns,
      tags: config.tags
    });

    // Attach inline policies if provided
    config.inlinePolicies?.forEach((inlinePolicy, index) => {
      new aws.iamRolePolicy.IamRolePolicy(this, `policy-${index}`, {
        role: this.role.id,
        name: inlinePolicy.name,
        policy: JSON.stringify(inlinePolicy.policy)
      });
    });
  }

  // Helper to generate least-privilege EC2 instance policy
  static getEc2InstancePolicy(bucketArns: string[], secretArns: string[]): any {
    return {
      Version: "2012-10-17",
      Statement: [
        // S3 access - specific buckets only
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ],
          Resource: [
            ...bucketArns,
            ...bucketArns.map(arn => `${arn}/*`)
          ]
        },
        // Secrets Manager - read only for specific secrets
        {
          Effect: "Allow",
          Action: [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ],
          Resource: secretArns
        },
        // CloudWatch Logs
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams"
          ],
          Resource: "arn:aws:logs:*:*:*"
        },
        // SSM Session Manager
        {
          Effect: "Allow",
          Action: [
            "ssm:UpdateInstanceInformation",
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel",
            "ec2messages:AcknowledgeMessage",
            "ec2messages:DeleteMessage",
            "ec2messages:FailMessage",
            "ec2messages:GetEndpoint",
            "ec2messages:GetMessages",
            "ec2messages:SendReply"
          ],
          Resource: "*"
        }
      ]
    };
  }

  // Example MFA-required policy for sensitive actions
  static getMfaRequiredPolicyExample(): string {
    return `
    // Example IAM policy requiring MFA for sensitive actions
    // This should be attached to IAM users/groups in the AWS Console
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyAllExceptListedIfNoMFA",
          "Effect": "Deny",
          "NotAction": [
            "iam:CreateVirtualMFADevice",
            "iam:EnableMFADevice",
            "iam:GetUser",
            "iam:ListMFADevices",
            "iam:ListVirtualMFADevices",
            "iam:ResyncMFADevice",
            "sts:GetSessionToken"
          ],
          "Resource": "*",
          "Condition": {
            "BoolIfExists": {
              "aws:MultiFactorAuthPresent": "false"
            }
          }
        }
      ]
    }
    `;
  }
}

// ================================================================================
// S3 Module - Encrypted buckets with security controls
// ================================================================================
export class SecureS3BucketConstruct extends Construct {
  public bucket: aws.s3Bucket.S3Bucket;
  public bucketAcl: aws.s3BucketAcl.S3BucketAcl;
  public bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: {
    bucketName: string;
    versioning?: boolean;
    encryption?: "SSE-S3" | "SSE-KMS";
    kmsKeyArn?: string;
    lifecycleRules?: Array<{
      id: string;
      enabled: boolean;
      transitionDays?: number;
      expirationDays?: number;
      storageClass?: string;
    }>;
    accessLogging?: {
      targetBucket: string;
      targetPrefix: string;
    };
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create the bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, "bucket", {
      bucket: config.bucketName,
      tags: config.tags
    });

    // Configure bucket ACL - private by default
    this.bucketAcl = new aws.s3BucketAcl.S3BucketAcl(this, "bucket-acl", {
      bucket: this.bucket.id,
      acl: "private"
    });

    // Block all public access
    this.bucketPublicAccessBlock = new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // Enable versioning if specified
    if (config.versioning) {
      new aws.s3BucketVersioning.S3BucketVersioningA(this, "versioning", {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: "Enabled"
        }
      });
    }

    // Configure encryption
    const encryptionConfig: any = {
      bucket: this.bucket.id,
      rule: []
    };

    if (config.encryption === "SSE-KMS" && config.kmsKeyArn) {
      encryptionConfig.rule.push({
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
          kmsMasterKeyId: config.kmsKeyArn
        },
        bucketKeyEnabled: true
      });
    } else {
      encryptionConfig.rule.push({
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256"
        }
      });
    }

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this, "encryption", encryptionConfig
    );

    // Configure access logging if specified
    if (config.accessLogging) {
      new aws.s3BucketLogging.S3BucketLoggingA(this, "logging", {
        bucket: this.bucket.id,
        targetBucket: config.accessLogging.targetBucket,
        targetPrefix: config.accessLogging.targetPrefix
      });
    }

    // Configure lifecycle rules if specified
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(this, "lifecycle", {
        bucket: this.bucket.id,
        rule: config.lifecycleRules.map(rule => ({
          id: rule.id,
          status: rule.enabled ? "Enabled" : "Disabled",
          transition: rule.transitionDays ? [{
            days: rule.transitionDays,
            storageClass: rule.storageClass || "STANDARD_IA"
          }] : undefined,
          expiration: rule.expirationDays ? {
            days: rule.expirationDays
          } : undefined
        }))
      });
    }

    // Create bucket policy to explicitly deny public access
    new aws.s3BucketPolicy.S3BucketPolicy(this, "bucket-policy", {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyInsecureTransport",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              this.bucket.arn,
              `${this.bucket.arn}/*`
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false"
              }
            }
          },
          {
            Sid: "DenyPublicReadWrite",
            Effect: "Deny",
            Principal: "*",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringNotLike: {
                "aws:userid": "AIDAI*" // Allow only authenticated AWS users
              }
            }
          }
        ]
      })
    });
  }
}

// ================================================================================
// RDS Module - Multi-AZ encrypted database with Secrets Manager
// ================================================================================
export class SecureRdsConstruct extends Construct {
  public dbInstance: aws.dbInstance.DbInstance;
  public dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public dbSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: {
    instanceIdentifier: string;
    engine: string;
    engineVersion: string;
    instanceClass: string;
    allocatedStorage: number;
    storageEncrypted: boolean;
    kmsKeyId?: string;
    multiAz: boolean;
    backupRetentionPeriod: number;
    backupWindow: string;
    maintenanceWindow: string;
    deletionProtection: boolean;
    vpcId: string;
    subnetIds: string[];
    allowedSecurityGroups: string[];
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create DB subnet group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(this, "subnet-group", {
      name: `${config.instanceIdentifier}-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${config.instanceIdentifier}-subnet-group`
      }
    });

    // Create security group for RDS
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, "sg", {
      name: `${config.instanceIdentifier}-sg`,
      description: "Security group for RDS database",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.instanceIdentifier}-sg`
      }
    });

    // Allow inbound from application security groups
    config.allowedSecurityGroups.forEach((sgId, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `sg-rule-${index}`, {
        type: "ingress",
        fromPort: config.engine === "postgres" ? 5432 : 3306,
        toPort: config.engine === "postgres" ? 5432 : 3306,
        protocol: "tcp",
        sourceSecurityGroupId: sgId,
        securityGroupId: this.dbSecurityGroup.id
      });
    });

    // Create secret for database credentials
    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(this, "db-secret", {
      name: `${config.instanceIdentifier}-credentials`,
      description: `Database credentials for ${config.instanceIdentifier}`,
      tags: config.tags
    });

    // Create secret version with initial random password
    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(this, "db-secret-version", {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({
        username: "dbadmin",
        password: Fn.random(32), // Generate random password
        engine: config.engine,
        host: "", // Will be updated after RDS creation
        port: config.engine === "postgres" ? 5432 : 3306,
        dbInstanceIdentifier: config.instanceIdentifier
      })
    });

    // Parse secret to get credentials
    const secretData = Fn.jsondecode(
      Fn.element(
        Fn.tolist([
          new aws.dataAwsSecretsmanagerSecretVersion.DataAwsSecretsmanagerSecretVersion(this, "secret-version", {
            secretId: this.dbSecret.id
          }).secretString
        ]),
        0
      )
    );

    // Create RDS instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, "db", {
      identifier: config.instanceIdentifier,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp3",
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: config.kmsKeyId,
      
      dbName: "appdb",
      username: Fn.lookup(secretData, "username", "dbadmin"),
      password: Fn.lookup(secretData, "password", ""),
      
      multiAz: config.multiAz,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: config.backupWindow,
      maintenanceWindow: config.maintenanceWindow,
      
      deletionProtection: config.deletionProtection,
      skipFinalSnapshot: !config.deletionProtection,
      finalSnapshotIdentifier: config.deletionProtection ? `${config.instanceIdentifier}-final-snapshot` : undefined,
      
      enabledCloudwatchLogsExports: config.engine === "postgres" ? ["postgresql"] : ["error", "general", "slowquery"],
      
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      
      tags: {
        ...config.tags,
        Name: config.instanceIdentifier
      }
    });

    // Enable automated secret rotation (requires Lambda function - documented as manual step)
    // Note: AWS provides managed rotation Lambda for RDS. Enable via console or additional CDK code.
  }
}

// ================================================================================
// ALB & Auto Scaling Module
// ================================================================================
export class WebApplicationConstruct extends Construct {
  public alb: aws.lb.Lb;
  public targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public asg: aws.autoscalingGroup.AutoscalingGroup;
  public launchTemplate: aws.launchTemplate.LaunchTemplate;
  public albSecurityGroup: aws.securityGroup.SecurityGroup;
  public appSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    vpcId: string;
    publicSubnetIds: string[];
    privateSubnetIds: string[];
    instanceType: string;
    amiId: string;
    keyName?: string;
    minSize: number;
    maxSize: number;
    desiredCapacity: number;
    healthCheckPath: string;
    instanceRole: aws.iamRole.IamRole;
    allowedCidrs: string[];
    userData?: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create security group for ALB
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(this, "alb-sg", {
      name: `${config.projectName}-${config.environment}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-alb-sg`
      }
    });

    // Allow inbound HTTP/HTTPS from allowed CIDRs
    new aws.securityGroupRule.SecurityGroupRule(this, "alb-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: config.allowedCidrs,
      securityGroupId: this.albSecurityGroup.id
    });

    new aws.securityGroupRule.SecurityGroupRule(this, "alb-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: config.allowedCidrs,
      securityGroupId: this.albSecurityGroup.id
    });

    // Allow all egress
    new aws.securityGroupRule.SecurityGroupRule(this, "alb-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id
    });

    // Create security group for application instances
    this.appSecurityGroup = new aws.securityGroup.SecurityGroup(this, "app-sg", {
      name: `${config.projectName}-${config.environment}-app-sg`,
      description: "Security group for application instances",
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-app-sg`
      }
    });

    // Allow inbound from ALB only
    new aws.securityGroupRule.SecurityGroupRule(this, "app-from-alb", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.appSecurityGroup.id
    });

    // Allow all egress for updates and external API calls
    new aws.securityGroupRule.SecurityGroupRule(this, "app-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.appSecurityGroup.id
    });

    // Create Application Load Balancer
    this.alb = new aws.lb.Lb(this, "alb", {
      name: `${config.projectName}-${config.environment}-alb`,
      loadBalancerType: "application",
      subnets: config.publicSubnetIds,
      securityGroups: [this.albSecurityGroup.id],
      enableDeletionProtection: config.environment === "production",
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-alb`
      }
    });

    // Create target group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, "tg", {
      name: `${config.projectName}-${config.environment}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: config.vpcId,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        path: config.healthCheckPath,
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200"
      },
      deregistrationDelay: 30,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-tg`
      }
    });

    // Create ALB listener
    new aws.lbListener.LbListener(this, "listener", {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultAction: [{
        type: "forward",
        targetGroupArn: this.targetGroup.arn
      }]
    });

    // Create IAM instance profile
    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(this, "instance-profile", {
      name: `${config.projectName}-${config.environment}-instance-profile`,
      role: config.instanceRole.name
    });

    // Create launch template
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(this, "lt", {
      name: `${config.projectName}-${config.environment}-lt`,
      imageId: config.amiId,
      instanceType: config.instanceType,
      keyName: config.keyName,
      
      iamInstanceProfile: {
        arn: instanceProfile.arn
      },
      
      vpcSecurityGroupIds: [this.appSecurityGroup.id],
      
      blockDeviceMappings: [{
        deviceName: "/dev/xvda",
        ebs: {
          volumeSize: 20,
          volumeType: "gp3",
          encrypted: true,
          deleteOnTermination: true
        }
      }],
      
      metadataOptions: {
        httpEndpoint: "enabled",
        httpTokens: "required", // IMDSv2 only for security
        httpPutResponseHopLimit: 1
      },
      
      userData: config.userData ? Fn.base64encode(config.userData) : undefined,
      
      tagSpecifications: [{
        resourceType: "instance",
        tags: {
          ...config.tags,
          Name: `${config.projectName}-${config.environment}-instance`
        }
      }],
      
      tags: config.tags
    });

    // Create Auto Scaling Group
    this.asg = new aws.autoscalingGroup.AutoscalingGroup(this, "asg", {
      name: `${config.projectName}-${config.environment}-asg`,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest"
      },
      
      vpcZoneIdentifier: config.privateSubnetIds,
      targetGroupArns: [this.targetGroup.arn],
      
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      
      enabledMetrics: [
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances"
      ],
      
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true
      }))
    });

    // Create scaling policies
    new aws.autoscalingPolicy.AutoscalingPolicy(this, "scale-up", {
      name: `${config.projectName}-${config.environment}-scale-up`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: "ChangeInCapacity",
      scalingAdjustment: 1,
      cooldown: 300,
      policyType: "SimpleScaling"
    });

    new aws.autoscalingPolicy.AutoscalingPolicy(this, "scale-down", {
      name: `${config.projectName}-${config.environment}-scale-down`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: "ChangeInCapacity",
      scalingAdjustment: -1,
      cooldown: 300,
      policyType: "SimpleScaling"
    });

    // Target tracking scaling policy for CPU utilization
    new aws.autoscalingPolicy.AutoscalingPolicy(this, "cpu-target-tracking", {
      name: `${config.projectName}-${config.environment}-cpu-tracking`,
      autoscalingGroupName: this.asg.name,
      policyType: "TargetTrackingScaling",
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ASGAverageCPUUtilization"
        },
        targetValue: 70
      }
    });
  }
}

// ================================================================================
// CloudTrail & Audit Module
// ================================================================================
export class AuditingConstruct extends Construct {
  public trail: aws.cloudtrail.Cloudtrail;
  public auditBucket: SecureS3BucketConstruct;
  public logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    includeGlobalServiceEvents: boolean;
    enableLogFileValidation: boolean;
    eventSelectors?: Array<{
      includeManagementEvents: boolean;
      readWriteType: string;
      dataResources?: Array<{
        type: string;
        values: string[];
      }>;
    }>;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create audit bucket for CloudTrail logs
    this.auditBucket = new SecureS3BucketConstruct(this, "audit-bucket", {
      bucketName: `${config.projectName}-${config.environment}-cloudtrail-logs-${Date.now()}`,
      versioning: true,
      encryption: "SSE-S3",
      lifecycleRules: [{
        id: "archive-old-logs",
        enabled: true,
        transitionDays: 90,
        storageClass: "GLACIER",
        expirationDays: 2555 // 7 years retention
      }],
      tags: {
        ...config.tags,
        Purpose: "CloudTrail-Audit"
      }
    });

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, "log-group", {
      name: `/aws/cloudtrail/${config.projectName}-${config.environment}`,
      retentionInDays: 90,
      kmsKeyId: undefined, // Use default CloudWatch Logs encryption
      tags: config.tags
    });

    // Create IAM role for CloudTrail to write to CloudWatch Logs
    const cloudTrailRole = new aws.iamRole.IamRole(this, "cloudtrail-role", {
      name: `${config.projectName}-${config.environment}-cloudtrail-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
            Service: "cloudtrail.amazonaws.com"
          },
          Action: "sts:AssumeRole"
        }]
      }),
      tags: config.tags
    });

    // Attach policy to CloudTrail role for CloudWatch Logs
    new aws.iamRolePolicy.IamRolePolicy(this, "cloudtrail-policy", {
      role: cloudTrailRole.id,
      name: "CloudWatchLogsPolicy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          Resource: `${this.logGroup.arn}:*`
        }]
      })
    });

    // Create CloudTrail S3 bucket policy
    new aws.s3BucketPolicy.S3BucketPolicy(this, "cloudtrail-bucket-policy", {
      bucket: this.auditBucket.bucket.id,
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
            Resource: this.auditBucket.bucket.arn
          },
          {
            Sid: "AWSCloudTrailWrite",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: "s3:PutObject",
            Resource: `${this.auditBucket.bucket.arn}/*`,
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
    this.trail = new aws.cloudtrail.Cloudtrail(this, "trail", {
      name: `${config.projectName}-${config.environment}-trail`,
      s3BucketName: this.auditBucket.bucket.id,
      includeGlobalServiceEvents: config.includeGlobalServiceEvents,
      isMultiRegionTrail: true, // Best practice for comprehensive logging
      enableLogFileValidation: config.enableLogFileValidation,
      
      cloudWatchLogsGroupArn: `${this.logGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudTrailRole.arn,
      
      eventSelector: config.eventSelectors || [{
        includeManagementEvents: true,
        readWriteType: "All",
        dataResource: [
          {
            type: "AWS::S3::Object",
            values: ["arn:aws:s3:::*/"]
          }
        ]
      }],
      
      tags: config.tags
    });
  }
}

// ================================================================================
// Monitoring & Alerting Module
// ================================================================================
export class MonitoringConstruct extends Construct {
  public snsTopic: aws.snsTopic.SnsTopic;
  public alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[] = [];

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    alertEmail: string;
    asgName?: string;
    albArn?: string;
    rdsInstanceId?: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create SNS topic for alerts
    this.snsTopic = new aws.snsTopic.SnsTopic(this, "alert-topic", {
      name: `${config.projectName}-${config.environment}-alerts`,
      displayName: `${config.projectName} ${config.environment} Alerts`,
      kmsKeyId: "alias/aws/sns",
      tags: config.tags
    });

    // Create SNS subscription
    new aws.snsTopicSubscription.SnsTopicSubscription(this, "email-subscription", {
      topicArn: this.snsTopic.arn,
      protocol: "email",
      endpoint: config.alertEmail
    });

    // Create CloudWatch alarms
    if (config.asgName) {
      // High CPU utilization alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "high-cpu", {
        alarmName: `${config.projectName}-${config.environment}-high-cpu`,
        alarmDescription: "Alert when CPU utilization is too high",
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          AutoScalingGroupName: config.asgName
        },
        tags: config.tags
      }));
    }

    if (config.albArn) {
      // ALB target health alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "unhealthy-targets", {
        alarmName: `${config.projectName}-${config.environment}-unhealthy-targets`,
        alarmDescription: "Alert when ALB has unhealthy targets",
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "UnHealthyHostCount",
        namespace: "AWS/ELB",
        period: 60,
        statistic: "Average",
        threshold: 0,
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: config.albArn.split("/").slice(-3).join("/")
        },
        tags: config.tags
      }));
    }

    if (config.rdsInstanceId) {
      // RDS free storage space alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "rds-low-storage", {
        alarmName: `${config.projectName}-${config.environment}-rds-low-storage`,
        alarmDescription: "Alert when RDS free storage is low",
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 1,
        metricName: "FreeStorageSpace",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 1073741824, // 1 GB in bytes
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: config.rdsInstanceId
        },
        tags: config.tags
      }));

      // RDS high CPU alarm
      this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "rds-high-cpu", {
        alarmName: `${config.projectName}-${config.environment}-rds-high-cpu`,
        alarmDescription: "Alert when RDS CPU utilization is high",
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: config.rdsInstanceId
        },
        tags: config.tags
      }));
    }

    // Unauthorized API calls alarm (requires CloudTrail metrics filter)
    this.alarms.push(new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "unauthorized-api-calls", {
      alarmName: `${config.projectName}-${config.environment}-unauthorized-api-calls`,
      alarmDescription: "Alert on unauthorized API calls",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "UnauthorizedAPICalls",
      namespace: "CloudTrailMetrics",
      period: 300,
      statistic: "Sum",
      threshold: 5,
      alarmActions: [this.snsTopic.arn],
      treatMissingData: "notBreaching",
      tags: config.tags
    }));
  }
}

// ================================================================================
// GuardDuty Module
// ================================================================================
export class GuardDutyConstruct extends Construct {
  public detector: aws.guarddutyDetector.GuarddutyDetector;

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    enableS3Protection: boolean;
    findingPublishingFrequency: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    this.detector = new aws.guarddutyDetector.GuarddutyDetector(this, "detector", {
      enable: true,
      findingPublishingFrequency: config.findingPublishingFrequency,
      datasources: {
        s3Logs: {
          enable: config.enableS3Protection
        },
        kubernetes: {
          auditLogs: {
            enable: false // Enable if using EKS
          }
        }
      },
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-guardduty`
      }
    });
  }
}

// ================================================================================
// AWS Config Module
// ================================================================================
export class ConfigConstruct extends Construct {
  public configRecorder: aws.configConfigurationRecorder.ConfigConfigurationRecorder;
  public deliveryChannel: aws.configDeliveryChannel.ConfigDeliveryChannel;
  public configBucket: SecureS3BucketConstruct;

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    includeGlobalResources: boolean;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create S3 bucket for Config recordings
    this.configBucket = new SecureS3BucketConstruct(this, "config-bucket", {
      bucketName: `${config.projectName}-${config.environment}-aws-config-${Date.now()}`,
      versioning: true,
      encryption: "SSE-S3",
      lifecycleRules: [{
        id: "archive-old-configs",
        enabled: true,
        transitionDays: 90,
        storageClass: "STANDARD_IA"
      }],
      tags: {
        ...config.tags,
        Purpose: "AWS-Config"
      }
    });

    // Create IAM role for Config
    const configRole = new aws.iamRole.IamRole(this, "config-role", {
      name: `${config.projectName}-${config.environment}-config-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
            Service: "config.amazonaws.com"
          },
          Action: "sts:AssumeRole"
        }]
      }),
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/ConfigRole"
      ],
      tags: config.tags
    });

    // Add S3 bucket policy for Config
    new aws.iamRolePolicy.IamRolePolicy(this, "config-s3-policy", {
      role: configRole.id,
      name: "ConfigS3Policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetBucketAcl",
              "s3:ListBucket"
            ],
            Resource: this.configBucket.bucket.arn
          },
          {
            Effect: "Allow",
            Action: "s3:PutObject",
            Resource: `${this.configBucket.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      })
    });

    // Create Config recorder
    this.configRecorder = new aws.configConfigurationRecorder.ConfigConfigurationRecorder(this, "recorder", {
      name: `${config.projectName}-${config.environment}-recorder`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: config.includeGlobalResources
      }
    });

    // Create delivery channel
    this.deliveryChannel = new aws.configDeliveryChannel.ConfigDeliveryChannel(this, "delivery-channel", {
      name: `${config.projectName}-${config.environment}-delivery-channel`,
      s3BucketName: this.configBucket.bucket.id,
      snsTopicArn: undefined, // Optional: Add SNS topic for Config notifications
      snapshotDeliveryProperties: {
        deliveryFrequency: "TwentyFour_Hours"
      }
    });

    // Start Config recorder
    new aws.configConfigurationRecorderStatus.ConfigConfigurationRecorderStatus(this, "recorder-status", {
      name: this.configRecorder.name,
      isEnabled: true,
      dependsOn: [this.deliveryChannel]
    });
  }
}

// ================================================================================
// VPC Flow Logs Module
// ================================================================================
export class VpcFlowLogsConstruct extends Construct {
  public flowLog: aws.flowLog.FlowLog;
  public logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: {
    vpcId: string;
    projectName: string;
    environment: string;
    retentionDays: number;
    trafficType: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    // Create CloudWatch Log Group for VPC Flow Logs
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, "log-group", {
      name: `/aws/vpc/flowlogs/${config.projectName}-${config.environment}`,
      retentionInDays: config.retentionDays,
      tags: config.tags
    });

    // Create IAM role for Flow Logs
    const flowLogRole = new aws.iamRole.IamRole(this, "flow-log-role", {
      name: `${config.projectName}-${config.environment}-flow-log-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
            Service: "vpc-flow-logs.amazonaws.com"
          },
          Action: "sts:AssumeRole"
        }]
      }),
      tags: config.tags
    });

    // Attach policy for CloudWatch Logs
    new aws.iamRolePolicy.IamRolePolicy(this, "flow-log-policy", {
      role: flowLogRole.id,
      name: "CloudWatchLogPolicy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
          ],
          Resource: "*"
        }]
      })
    });

    // Create VPC Flow Log
    this.flowLog = new aws.flowLog.FlowLog(this, "flow-log", {
      resourceId: config.vpcId,
      resourceType: "VPC",
      trafficType: config.trafficType,
      logDestinationType: "cloud-watch-logs",
      logGroupName: this.logGroup.name,
      iamRoleArn: flowLogRole.arn,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-${config.environment}-flow-log`
      }
    });
  }
}

// ================================================================================
// WAF Module
// ================================================================================
export class WafConstruct extends Construct {
  public webAcl: aws.wafv2WebAcl.Wafv2WebAcl;

  constructor(scope: Construct, id: string, config: {
    projectName: string;
    environment: string;
    scope: "REGIONAL" | "CLOUDFRONT";
    resourceArn?: string;
    tags: { [key: string]: string };
  }) {
    super(scope, id);

    this.webAcl = new aws.wafv2WebAcl.Wafv2WebAcl(this, "web-acl", {
      name: `${config.projectName}-${config.environment}-web-acl`,
      description: `WAF rules for ${config.projectName} ${config.environment}`,
      scope: config.scope,
      
      defaultAction: {
        allow: {}
      },
      
      rule: [
        // AWS Managed Core Rule Set
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet"
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: "AWSManagedRulesCommonRuleSetMetric",
            sampledRequestsEnabled: true
          }
        },
        // AWS Managed Known Bad Inputs Rule Set
        {
          name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
          priority: 2,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet"
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: "AWSManagedRulesKnownBadInputsRuleSetMetric",
            sampledRequestsEnabled: true
          }
        },
        // AWS Managed SQL Database Rule Set
        {
          name: "AWS-AWSManagedRulesSQLiRuleSet",
          priority: 3,
          overrideAction: {
            none: {}
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesSQLiRuleSet"
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: "AWSManagedRulesSQLiRuleSetMetric",
            sampledRequestsEnabled: true
          }
        },
        // Custom rate limit rule
        {
          name: "RateLimitRule",
          priority: 4,
          action: {
            block: {}
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: "IP"
            }
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: "RateLimitRuleMetric",
            sampledRequestsEnabled: true
          }
        }
        // Example custom rule (commented)
        // {
        //   name: "BlockSpecificIPRule",
        //   priority: 5,
        //   action: {
        //     block: {}
        //   },
        //   statement: {
        //     ipSetReferenceStatement: {
        //       arn: "arn:aws:wafv2:region:account:regional/ipset/name/id"
        //     }
        //   },
        //   visibilityConfig: {
        //     cloudwatchMetricsEnabled: true,
        //     metricName: "BlockSpecificIPRuleMetric",
        //     sampledRequestsEnabled: true
        //   }
        // }
      ],
      
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.projectName}-${config.environment}-waf-metric`,
        sampledRequestsEnabled: true
      },
      
      tags: config.tags
    });

    // Associate WAF with resource if provided
    if (config.resourceArn) {
      new aws.wafv2WebAclAssociation.Wafv2WebAclAssociation(this, "waf-association", {
        resourceArn: config.resourceArn,
        webAclArn: this.webAcl.arn
      });
    }
  }
}

// ================================================================================
// SSM Parameter Store Helper
// ================================================================================
export class SsmParameterConstruct extends Construct {
  public parameter: aws.ssmParameter.SsmParameter;

  constructor(scope: Construct, id: string,