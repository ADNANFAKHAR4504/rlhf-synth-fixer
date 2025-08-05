// main.ts - CDKTF Secure Enterprise Infrastructure 
// IaC – AWS Nova Model Breaking - Single File Implementation
// This file demonstrates the corrected implementation as requested in the prompt

import { Construct } from "constructs";
import { App, TerraformStack, S3Backend, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketLoggingA } from "@cdktf/provider-aws/lib/s3-bucket-logging";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamUser } from "@cdktf/provider-aws/lib/iam-user";
import { IamUserPolicyAttachment } from "@cdktf/provider-aws/lib/iam-user-policy-attachment";
import { IamAccountPasswordPolicy } from "@cdktf/provider-aws/lib/iam-account-password-policy";
import { Cloudtrail } from "@cdktf/provider-aws/lib/cloudtrail";
import { ConfigConfigurationRecorder } from "@cdktf/provider-aws/lib/config-configuration-recorder";
import { ConfigDeliveryChannel } from "@cdktf/provider-aws/lib/config-delivery-channel";
import { ConfigConfigRule } from "@cdktf/provider-aws/lib/config-config-rule";
import { GuarddutyDetector } from "@cdktf/provider-aws/lib/guardduty-detector";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

class SecureEnterpriseStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources - CORRECTED PROJECT NAME
    const commonTags = {
      Environment: "Production",
      Project: "IaC – AWS Nova Model Breaking", // Fixed: Exact prompt requirement
      ManagedBy: "CDKTF",
      SecurityLevel: "High"
    };

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [{ tags: commonTags }]
    });

    // Data sources
    const current = new DataAwsCallerIdentity(this, "current");

    // S3 Backend Configuration - CORRECTED with proper state management
    new S3Backend(this, {
      bucket: "prod-sec-terraform-state-bucket",
      key: "nova-model/terraform.tfstate",
      region: "us-east-1",
      dynamodbTable: "prod-sec-terraform-locks", 
      encrypt: true
    });

    // KMS Keys for encryption
    const mainKmsKey = new KmsKey(this, "prod-sec-main-kms-key", {
      description: "Main KMS key for prod-sec environment encryption",
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
          },
          {
            Sid: "Allow CloudWatch Logs",
            Effect: "Allow", 
            Principal: {
              Service: "logs.us-east-1.amazonaws.com"
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
      tags: { ...commonTags, Name: "prod-sec-main-kms-key" }
    });

    new KmsAlias(this, "prod-sec-main-kms-alias", {
      name: "alias/prod-sec-main-key",
      targetKeyId: mainKmsKey.keyId
    });

    // VPC Configuration
    const vpc = new Vpc(this, "prod-sec-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: "prod-sec-vpc" }
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "prod-sec-igw", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-igw" }
    });

    // Public Subnets in 2+ AZs as required
    const publicSubnet1 = new Subnet(this, "prod-sec-public-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: "us-east-1a",
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: "prod-sec-public-subnet-1", Type: "Public" }
    });

    const publicSubnet2 = new Subnet(this, "prod-sec-public-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: "us-east-1b",
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: "prod-sec-public-subnet-2", Type: "Public" }
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, "prod-sec-private-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.10.0/24",
      availabilityZone: "us-east-1a",
      tags: { ...commonTags, Name: "prod-sec-private-subnet-1", Type: "Private" }
    });

    const privateSubnet2 = new Subnet(this, "prod-sec-private-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.11.0/24",
      availabilityZone: "us-east-1b",
      tags: { ...commonTags, Name: "prod-sec-private-subnet-2", Type: "Private" }
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, "prod-sec-nat-eip-1", {
      domain: "vpc",
      tags: { ...commonTags, Name: "prod-sec-nat-eip-1" }
    });

    const eip2 = new Eip(this, "prod-sec-nat-eip-2", {
      domain: "vpc", 
      tags: { ...commonTags, Name: "prod-sec-nat-eip-2" }
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, "prod-sec-nat-gw-1", {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: { ...commonTags, Name: "prod-sec-nat-gw-1" }
    });

    const natGw2 = new NatGateway(this, "prod-sec-nat-gw-2", {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: { ...commonTags, Name: "prod-sec-nat-gw-2" }
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, "prod-sec-public-rt", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-public-rt" }
    });

    const privateRouteTable1 = new RouteTable(this, "prod-sec-private-rt-1", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-private-rt-1" }
    });

    const privateRouteTable2 = new RouteTable(this, "prod-sec-private-rt-2", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-private-rt-2" }
    });

    // Routes
    new Route(this, "prod-sec-public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    new Route(this, "prod-sec-private-route-1", {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw1.id
    });

    new Route(this, "prod-sec-private-route-2", {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw2.id
    });

    // Route Table Associations
    new RouteTableAssociation(this, "prod-sec-public-rta-1", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "prod-sec-public-rta-2", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "prod-sec-private-rta-1", {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id
    });

    new RouteTableAssociation(this, "prod-sec-private-rta-2", {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id
    });

    // Security Groups - CORRECTED Implementation (Fixed from MODEL_RESPONSE failures)
    const webSecurityGroup = new SecurityGroup(this, "prod-sec-web-sg", {
      name: "prod-sec-web-sg",
      description: "Security group for web tier",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS inbound"
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP inbound (redirect to HTTPS)"
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: { ...commonTags, Name: "prod-sec-web-sg", Tier: "Web" }
    });

    const appSecurityGroup = new SecurityGroup(this, "prod-sec-app-sg", {
      name: "prod-sec-app-sg", 
      description: "Security group for application tier",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 8080,
          toPort: 8080,
          protocol: "tcp",
          securityGroups: [webSecurityGroup.id], // FIXED: Correct reference
          description: "From web tier"
        }
      ],
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS outbound for API calls"
        }
      ],
      tags: { ...commonTags, Name: "prod-sec-app-sg", Tier: "Application" }
    });

    const dbSecurityGroup = new SecurityGroup(this, "prod-sec-db-sg", {
      name: "prod-sec-db-sg",
      description: "Security group for database tier", 
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          securityGroups: [appSecurityGroup.id], // FIXED: Correct reference
          description: "From application tier"
        }
      ],
      tags: { ...commonTags, Name: "prod-sec-db-sg", Tier: "Database" }
    });

    // S3 Buckets with security configurations
    const logsBucket = new S3Bucket(this, "prod-sec-logs-bucket", {
      bucket: `prod-sec-logs-${current.accountId}`,
      tags: { ...commonTags, Name: "prod-sec-logs-bucket", Purpose: "Logging" }
    });

    new S3BucketServerSideEncryptionConfigurationA(this, "prod-sec-logs-bucket-encryption", {
      bucket: logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: mainKmsKey.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      ]
    });

    new S3BucketPublicAccessBlock(this, "prod-sec-logs-bucket-pab", {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioningA(this, "prod-sec-logs-bucket-versioning", {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    const appDataBucket = new S3Bucket(this, "prod-sec-app-data-bucket", {
      bucket: `prod-sec-app-data-${current.accountId}`,
      tags: { ...commonTags, Name: "prod-sec-app-data-bucket", Purpose: "Application Data" }
    });

    new S3BucketServerSideEncryptionConfigurationA(this, "prod-sec-app-data-bucket-encryption", {
      bucket: appDataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: mainKmsKey.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      ]
    });

    new S3BucketPublicAccessBlock(this, "prod-sec-app-data-bucket-pab", {
      bucket: appDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioningA(this, "prod-sec-app-data-bucket-versioning", {
      bucket: appDataBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    new S3BucketLoggingA(this, "prod-sec-app-data-bucket-logging", {
      bucket: appDataBucket.id,
      targetBucket: logsBucket.id,
      targetPrefix: "s3-access-logs/"
    });

    // IAM Password Policy - ENHANCED with MFA requirements
    new IamAccountPasswordPolicy(this, "prod-sec-password-policy", {
      minimumPasswordLength: 14,
      requireLowercaseCharacters: true,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercaseCharacters: true,
      allowUsersToChangePassword: true,
      maxPasswordAge: 90,
      passwordReusePrevention: 12,
      hardExpiry: false
    });

    // MFA Enforcement Policy - ADDED to address missing MFA requirement
    const mfaEnforcementPolicy = new IamPolicy(this, "prod-sec-mfa-enforcement-policy", {
      name: "prod-sec-mfa-enforcement-policy",
      description: "Enforce MFA for critical operations",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyAllExceptUsersWithMFA",
            Effect: "Deny",
            NotAction: [
              "iam:CreateVirtualMFADevice",
              "iam:EnableMFADevice", 
              "iam:GetUser",
              "iam:ListMFADevices",
              "iam:ListVirtualMFADevices",
              "iam:ResyncMFADevice",
              "sts:GetSessionToken"
            ],
            Resource: "*",
            Condition: {
              BoolIfExists: {
                "aws:MultiFactorAuthPresent": "false"
              }
            }
          }
        ]
      }),
      tags: commonTags
    });

    // IAM Policies with least privilege
    const ec2ReadOnlyPolicy = new IamPolicy(this, "prod-sec-ec2-readonly-policy", {
      name: "prod-sec-ec2-readonly-policy",
      description: "Read-only access to EC2 resources",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ec2:Describe*",
              "ec2:Get*", 
              "ec2:List*"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: commonTags
    });

    const s3AppDataPolicy = new IamPolicy(this, "prod-sec-s3-app-data-policy", {
      name: "prod-sec-s3-app-data-policy",
      description: "Access to application data S3 bucket",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            Resource: `${appDataBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ListBucket"
            ],
            Resource: appDataBucket.arn
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: mainKmsKey.arn
          }
        ]
      }),
      tags: commonTags
    });

    // IAM Roles
    const appRole = new IamRole(this, "prod-sec-app-role", {
      name: "prod-sec-app-role",
      description: "Role for application instances",
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
      tags: commonTags
    });

    new IamRolePolicyAttachment(this, "prod-sec-app-role-s3-policy", {
      role: appRole.name,
      policyArn: s3AppDataPolicy.arn
    });

    // IAM Users with least privilege
    const devUser = new IamUser(this, "prod-sec-dev-user", {
      name: "prod-sec-dev-user",
      path: "/developers/",
      tags: { ...commonTags, UserType: "Developer" }
    });

    const opsUser = new IamUser(this, "prod-sec-ops-user", {
      name: "prod-sec-ops-user",
      path: "/operations/",
      tags: { ...commonTags, UserType: "Operations" }
    });

    new IamUserPolicyAttachment(this, "prod-sec-dev-user-ec2-readonly", {
      user: devUser.name,
      policyArn: ec2ReadOnlyPolicy.arn
    });

    new IamUserPolicyAttachment(this, "prod-sec-dev-user-mfa-enforcement", {
      user: devUser.name,
      policyArn: mfaEnforcementPolicy.arn
    });

    new IamUserPolicyAttachment(this, "prod-sec-ops-user-mfa-enforcement", {
      user: opsUser.name,
      policyArn: mfaEnforcementPolicy.arn
    });

    // Secrets Manager
    const dbSecret = new SecretsmanagerSecret(this, "prod-sec-db-credentials", {
      name: "prod-sec/database/credentials",
      description: "Database credentials for prod-sec environment",
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // SSM Parameters
    new SsmParameter(this, "prod-sec-app-config", {
      name: "/prod-sec/app/config",
      type: "SecureString",
      value: JSON.stringify({
        environment: "production",
        debug: false,
        logLevel: "INFO"
      }),
      keyId: mainKmsKey.arn,
      description: "Application configuration parameters",
      tags: commonTags
    });

    // CloudWatch Log Groups
    const appLogGroup = new CloudwatchLogGroup(this, "prod-sec-app-logs", {
      name: "/aws/ec2/prod-sec-app",
      retentionInDays: 90,
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    const vpcFlowLogGroup = new CloudwatchLogGroup(this, "prod-sec-vpc-flow-logs", {
      name: "/aws/vpc/prod-sec-flowlogs",
      retentionInDays: 30,
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // SNS Topic for alerts
    const alertsTopic = new SnsTopic(this, "prod-sec-security-alerts", {
      name: "prod-sec-security-alerts",
      tags: commonTags
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, "prod-sec-root-access-alarm", {
      alarmName: "prod-sec-root-access-alarm",
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 1,
      metricName: "RootAccessCount",
      namespace: "CWLogs",
      period: 300,
      statistic: "Sum",
      threshold: 1,
      alarmDescription: "Alert when root user access is detected",
      alarmActions: [alertsTopic.arn],
      tags: commonTags
    });

    new CloudwatchMetricAlarm(this, "prod-sec-unauthorized-api-calls", {
      alarmName: "prod-sec-unauthorized-api-calls",
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 1,
      metricName: "UnauthorizedAPICalls",
      namespace: "CWLogs",
      period: 300,
      statistic: "Sum",
      threshold: 5,
      alarmDescription: "Alert on unauthorized API calls",
      alarmActions: [alertsTopic.arn],
      tags: commonTags
    });

    // CloudTrail - CORRECTED Implementation
    const cloudtrail = new Cloudtrail(this, "prod-sec-cloudtrail", {
      name: "prod-sec-cloudtrail",
      s3BucketName: logsBucket.id,
      s3KeyPrefix: "cloudtrail-logs/",
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      enableLogFileValidation: true,
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // AWS Config - CORRECTED dependencies
    const configRole = new IamRole(this, "prod-sec-config-role", {
      name: "prod-sec-config-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow", 
            Principal: {
              Service: "config.amazonaws.com"
            }
          }
        ]
      }),
      managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/ConfigRole"],
      tags: commonTags
    });

    const configBucketPolicy = new IamPolicy(this, "prod-sec-config-bucket-policy", {
      name: "prod-sec-config-bucket-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetBucketAcl",
              "s3:ListBucket"
            ],
            Resource: logsBucket.arn
          },
          {
            Effect: "Allow",
            Action: "s3:PutObject",
            Resource: `${logsBucket.arn}/config-logs/*`,
            Condition: {
              StringEquals: {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      })
    });

    new IamRolePolicyAttachment(this, "prod-sec-config-role-bucket-policy", {
      role: configRole.name,
      policyArn: configBucketPolicy.arn
    });

    const configRecorder = new ConfigConfigurationRecorder(this, "prod-sec-config-recorder", {
      name: "prod-sec-config-recorder",
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true
      }
    });

    // FIXED: Added dependency for delivery channel
    const configDeliveryChannel = new ConfigDeliveryChannel(this, "prod-sec-config-delivery-channel", {
      name: "prod-sec-config-delivery-channel",
      s3BucketName: logsBucket.id,
      s3KeyPrefix: "config-logs/",
      dependsOn: [configRecorder]
    });

    // Config Rules
    new ConfigConfigRule(this, "prod-sec-s3-bucket-public-access-prohibited", {
      name: "s3-bucket-public-access-prohibited",
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
      },
      dependsOn: [configRecorder]
    });

    new ConfigConfigRule(this, "prod-sec-encrypted-volumes", {
      name: "encrypted-volumes",
      source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES"
      },
      dependsOn: [configRecorder]
    });

    new ConfigConfigRule(this, "prod-sec-iam-password-policy", {
      name: "iam-password-policy",
      source: {
        owner: "AWS",
        sourceIdentifier: "IAM_PASSWORD_POLICY"
      },
      inputParameters: JSON.stringify({
        RequireUppercaseCharacters: "true",
        RequireLowercaseCharacters: "true",
        RequireSymbols: "true",
        RequireNumbers: "true",
        MinimumPasswordLength: "14"
      }),
      dependsOn: [configRecorder]
    });

    // GuardDuty - ENHANCED with S3 protection
    new GuarddutyDetector(this, "prod-sec-guardduty", {
      enable: true,
      findingPublishingFrequency: "FIFTEEN_MINUTES",
      datasources: {
        s3Logs: {
          enable: true
        },
        kubernetes: {
          auditLogs: {
            enable: true
          }
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: {
              enable: true
            }
          }
        }
      },
      tags: commonTags
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.id,
      description: "VPC ID"
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: [publicSubnet1.id, publicSubnet2.id],
      description: "Public subnet IDs"
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: [privateSubnet1.id, privateSubnet2.id],
      description: "Private subnet IDs"
    });

    new TerraformOutput(this, "kms_key_id", {
      value: mainKmsKey.keyId,
      description: "Main KMS key ID"
    });

    new TerraformOutput(this, "security_group_ids", {
      value: {
        web: webSecurityGroup.id,
        app: appSecurityGroup.id,
        db: dbSecurityGroup.id
      },
      description: "Security group IDs by tier"
    });

    new TerraformOutput(this, "cloudtrail_name", {
      value: cloudtrail.name,
      description: "CloudTrail name"
    });

    new TerraformOutput(this, "logs_bucket_name", {
      value: logsBucket.bucket,
      description: "Logs S3 bucket name"
    });
  }
}

// CORRECTED: Application bootstrap with proper structure
const app = new App();
new SecureEnterpriseStack(app, "prod-sec");
app.synth();
