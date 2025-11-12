I'll fix the TypeScript errors and other issues in the code. The main problem is with the S3 lifecycle configuration structure and some other type mismatches.

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { DataAwsRegion } from "@cdktf/provider-aws/lib/data-aws-region";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

// VPC and Networking
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";

// Storage
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";

// Compute
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";

// Database
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";

// IAM
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";

// KMS
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";

// CloudWatch
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";

// Parameter Store & Secrets Manager
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";

// CloudTrail
import { CloudtrailTrail } from "@cdktf/provider-aws/lib/cloudtrail-trail";

class SecureInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Provider Configuration
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [
        {
          tags: {
            Environment: "production",
            Project: "secure-infrastructure",
            ManagedBy: "cdktf",
            SecurityCompliant: "true"
          }
        }
      ]
    });

    // Data Sources
    const current = new DataAwsCallerIdentity(this, "current");
    const currentRegion = new DataAwsRegion(this, "current-region");
    const availabilityZones = new DataAwsAvailabilityZones(this, "available", {
      state: "available"
    });

    // ===========================================
    // KMS Keys for Encryption
    // ===========================================

    const kmsKeyS3 = new KmsKey(this, "kms-key-s3", {
      description: "KMS key for S3 bucket encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: [
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: "s3-encryption-key"
      }
    });

    new KmsAlias(this, "kms-alias-s3", {
      name: "alias/s3-encryption-key",
      targetKeyId: kmsKeyS3.keyId
    });

    const kmsKeyRds = new KmsKey(this, "kms-key-rds", {
      description: "KMS key for RDS encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: "rds-encryption-key"
      }
    });

    new KmsAlias(this, "kms-alias-rds", {
      name: "alias/rds-encryption-key",
      targetKeyId: kmsKeyRds.keyId
    });

    const kmsKeyEbs = new KmsKey(this, "kms-key-ebs", {
      description: "KMS key for EBS encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: "ebs-encryption-key"
      }
    });

    new KmsAlias(this, "kms-alias-ebs", {
      name: "alias/ebs-encryption-key",
      targetKeyId: kmsKeyEbs.keyId
    });

    // ===========================================
    // Parameter Store for Configuration
    // ===========================================

    const allowedSshCidr = new SsmParameter(this, "allowed-ssh-cidr", {
      name: "/secure-infrastructure/allowed-ssh-cidr",
      type: "String",
      value: "10.0.0.0/8", // Replace with your actual allowed IP range
      description: "Allowed CIDR block for SSH access",
      tags: {
        Name: "allowed-ssh-cidr"
      }
    });

    // ===========================================
    // Secrets Manager for Sensitive Data
    // ===========================================

    const dbPassword = new SecretsmanagerSecret(this, "db-password", {
      name: "secure-infrastructure/db-password",
      description: "Database password for RDS instance",
      kmsKeyId: kmsKeyS3.arn,
      tags: {
        Name: "db-password"
      }
    });

    new SecretsmanagerSecretVersion(this, "db-password-version", {
      secretId: dbPassword.id,
      secretString: JSON.stringify({
        password: "ChangeMe123!@#" // In production, generate this securely
      })
    });

    // ===========================================
    // Central Logging S3 Bucket
    // ===========================================

    const loggingBucket = new S3Bucket(this, "central-logging-bucket", {
      bucket: `secure-infrastructure-logs-${current.accountId}-${currentRegion.name}`,
      tags: {
        Name: "central-logging-bucket",
        Purpose: "centralized-logging"
      }
    });

    new S3BucketServerSideEncryptionConfiguration(this, "logging-bucket-encryption", {
      bucket: loggingBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKeyS3.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      ]
    });

    new S3BucketPublicAccessBlock(this, "logging-bucket-pab", {
      bucket: loggingBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioning(this, "logging-bucket-versioning", {
      bucket: loggingBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    new S3BucketLifecycleConfiguration(this, "logging-bucket-lifecycle", {
      bucket: loggingBucket.id,
      rule: [
        {
          id: "log-retention-policy",
          status: "Enabled",
          expiration: [
            {
              days: 90
            }
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 30
            }
          ],
          transition: [
            {
              days: 30,
              storageClass: "STANDARD_IA"
            },
            {
              days: 60,
              storageClass: "GLACIER"
            }
          ]
        }
      ]
    });

    // ===========================================
    // VPC and Networking
    // ===========================================

    const vpc = new Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "main-vpc"
      }
    });

    const internetGateway = new InternetGateway(this, "main-igw", {
      vpcId: vpc.id,
      tags: {
        Name: "main-igw"
      }
    });

    // Public Subnets (for NAT Gateways and Load Balancers)
    const publicSubnet1 = new Subnet(this, "public-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: availabilityZones.names[0],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: "public-subnet-1",
        Type: "public"
      }
    });

    const publicSubnet2 = new Subnet(this, "public-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: availabilityZones.names[1],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: "public-subnet-2",
        Type: "public"
      }
    });

    // Private Subnets (for Application Servers)
    const privateSubnet1 = new Subnet(this, "private-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.10.0/24",
      availabilityZone: availabilityZones.names[0],
      tags: {
        Name: "private-subnet-1",
        Type: "private"
      }
    });

    const privateSubnet2 = new Subnet(this, "private-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.11.0/24",
      availabilityZone: availabilityZones.names[1],
      tags: {
        Name: "private-subnet-2",
        Type: "private"
      }
    });

    // Database Subnets (Private, isolated)
    const dbSubnet1 = new Subnet(this, "db-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.20.0/24",
      availabilityZone: availabilityZones.names[0],
      tags: {
        Name: "db-subnet-1",
        Type: "database"
      }
    });

    const dbSubnet2 = new Subnet(this, "db-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.21.0/24",
      availabilityZone: availabilityZones.names[1],
      tags: {
        Name: "db-subnet-2",
        Type: "database"
      }
    });

    // NAT Gateways for Private Subnet Internet Access
    const natEip1 = new Eip(this, "nat-eip-1", {
      domain: "vpc",
      tags: {
        Name: "nat-eip-1"
      }
    });

    const natGateway1 = new NatGateway(this, "nat-gateway-1", {
      allocationId: natEip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: "nat-gateway-1"
      }
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, "public-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: "public-route-table"
      }
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id
    });

    new RouteTableAssociation(this, "public-rta-1", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "public-rta-2", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id
    });

    const privateRouteTable = new RouteTable(this, "private-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: "private-route-table"
      }
    });

    new Route(this, "private-route", {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway1.id
    });

    new RouteTableAssociation(this, "private-rta-1", {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id
    });

    new RouteTableAssociation(this, "private-rta-2", {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id
    });

    // Database Route Table (No internet access)
    const dbRouteTable = new RouteTable(this, "db-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: "db-route-table"
      }
    });

    new RouteTableAssociation(this, "db-rta-1", {
      subnetId: dbSubnet1.id,
      routeTableId: dbRouteTable.id
    });

    new RouteTableAssociation(this, "db-rta-2", {
      subnetId: dbSubnet2.id,
      routeTableId: dbRouteTable.id
    });

    // ===========================================
    // Security Groups
    // ===========================================

    // Bastion Host Security Group
    const bastionSg = new SecurityGroup(this, "bastion-sg", {
      name: "bastion-security-group",
      description: "Security group for bastion host",
      vpcId: vpc.id,
      tags: {
        Name: "bastion-sg"
      }
    });

    new SecurityGroupRule(this, "bastion-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [allowedSshCidr.value],
      securityGroupId: bastionSg.id,
      description: "SSH access from allowed CIDR"
    });

    new SecurityGroupRule(this, "bastion-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: bastionSg.id,
      description: "All outbound traffic"
    });

    // Application Security Group
    const appSg = new SecurityGroup(this, "app-sg", {
      name: "application-security-group",
      description: "Security group for application servers",
      vpcId: vpc.id,
      tags: {
        Name: "app-sg"
      }
    });

    new SecurityGroupRule(this, "app-ssh-from-bastion", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      sourceSecurityGroupId: bastionSg.id,
      securityGroupId: appSg.id,
      description: "SSH from bastion host"
    });

    new SecurityGroupRule(this, "app-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: appSg.id,
      description: "HTTP from VPC"
    });

    new SecurityGroupRule(this, "app-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: appSg.id,
      description: "HTTPS from VPC"
    });

    new SecurityGroupRule(this, "app-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: appSg.id,
      description: "All outbound traffic"
    });

    // Database Security Group
    const dbSg = new SecurityGroup(this, "db-sg", {
      name: "database-security-group",
      description: "Security group for database servers",
      vpcId: vpc.id,
      tags: {
        Name: "db-sg"
      }
    });

    new SecurityGroupRule(this, "db-mysql-from-app", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
      description: "MySQL from application servers"
    });

    // ===========================================
    // IAM Roles and Policies
    // ===========================================

    // EC2 Instance Role
    const ec2Role = new IamRole(this, "ec2-role", {
      name: "secure-infrastructure-ec2-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: "ec2-role"
      }
    });

    new IamRolePolicy(this, "ec2-role-policy", {
      name: "ec2-cloudwatch-logs-policy",
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams"
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:*`
          },
          {
            Effect: "Allow",
            Action: [
              "s3:PutObject",
              "s3:PutObjectAcl"
            ],
            Resource: `${loggingBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "ssm:GetParameter",
              "ssm:GetParameters"
            ],
            Resource: `arn:aws:ssm:${currentRegion.name}:${current.accountId}:parameter/secure-infrastructure/*`
          }
        ]
      })
    });

    new IamRolePolicyAttachment(this, "ec2-ssm-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    const ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "secure-infrastructure-ec2-profile",
      role: ec2Role.name
    });

    // Lambda Execution Role
    const lambdaRole = new IamRole(this, "lambda-role", {
      name: "secure-infrastructure-lambda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: "lambda-role"
      }
    });

    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    new IamRolePolicyAttachment(this, "lambda-vpc-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    });

    new IamRolePolicy(this, "lambda-role-policy", {
      name: "lambda-custom-policy",
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:PutObject",
              "s3:PutObjectAcl"
            ],
            Resource: `${loggingBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue"
            ],
            Resource: dbPassword.arn
          }
        ]
      })
    });

    // RDS Enhanced Monitoring Role
    const rdsMonitoringRole = new IamRole(this, "rds-monitoring-role", {
      name: "rds-monitoring-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "monitoring.rds.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: "rds-monitoring-role"
      }
    });

    new IamRolePolicyAttachment(this, "rds-monitoring-policy", {
      role: rdsMonitoringRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
    });

    // ===========================================
    // CloudWatch Log Groups
    // ===========================================

    const ec2LogGroup = new CloudwatchLogGroup(this, "ec2-log-group", {
      name: "/aws/ec2/secure-infrastructure",
      retentionInDays: 30,
      kmsKeyId: kmsKeyS3.arn,
      tags: {
        Name: "ec2-log-group"
      }
    });

    const lambdaLogGroup = new CloudwatchLogGroup(this, "lambda-log-group", {
      name: "/aws/lambda/secure-infrastructure",
      retentionInDays: 30,
      kmsKeyId: kmsKeyS3.arn,
      tags: {
        Name: "lambda-log-group"
      }
    });

    // ===========================================
    // Database Setup
    // ===========================================

    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: "secure-infrastructure-db-subnet-group",
      subnetIds: [dbSubnet1.id, dbSubnet2.id],
      description: "Subnet group for RDS database",
      tags: {
        Name: "db-subnet-group"
      }
    });

    const rdsInstance = new DbInstance(this, "rds-instance", {
      identifier: "secure-infrastructure-db",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: "gp2",
      storageEncrypted: true,
      kmsKeyId: kmsKeyRds.arn,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      dbName: "secureapp",
      username: "admin",
      password: "ChangeMe123!@#", // In production, use manage_user_password
      vpcSecurityGroupIds: [dbSg.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: "secure-infrastructure-db-final-snapshot",
      deletionProtection: true,
      monitoringInterval: 60,
      monitoringRoleArn: rdsMonitoringRole.arn,
      enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
      tags: {
        Name: "secure-infrastructure-db",
        BackupEnabled: "true"
      }
    });

    // ===========================================
    // EC2 Instances
    // ===========================================

    // Bastion Host
    const bastionInstance = new Instance(this, "bastion-instance", {
      ami: "ami-0abcdef1234567890", // Update with latest Amazon Linux 2 AMI ID
      instanceType: "t3.micro",
      keyName: "your-key-pair", // Replace with your key pair name
      vpcSecurityGroupIds: [bastionSg.id],
      subnetId: publicSubnet1.id,
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s`,
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: 20,
        encrypted: true,
        kmsKeyId: kmsKeyEbs.arn,
        deleteOnTermination: true
      },
      tags: {
        Name: "bastion-host",
        Type: "bastion"
      }
    });

    // Application Server
    const appInstance = new Instance(this, "app-instance", {
      ami: "ami-0abcdef1234567890", // Update with latest Amazon Linux 2 AMI ID
      instanceType: "t3.small",
      keyName: "your-key-pair", // Replace with your key pair name
      vpcSecurityGroupIds: [appSg.id],
      subnetId: privateSubnet1.id,
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent docker
systemctl start docker
systemctl enable docker
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s`,
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: 30,
        encrypted: true,
        kmsKeyId: kmsKeyEbs.arn,
        deleteOnTermination: true
      },
      tags: {
        Name: "application-server",
        Type: "application"
      }
    });

    // ===========================================
    // Lambda Function
    // ===========================================

    const lambdaFunction = new LambdaFunction(this, "lambda-function", {
      functionName: "secure-infrastructure-lambda",
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "python3.9",
      filename: "lambda.zip", // You'll need to create this zip file
      sourceCodeHash: "dummy-hash", // Replace with actual hash
      timeout: 30,
      memorySize: 128,
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [appS
```
