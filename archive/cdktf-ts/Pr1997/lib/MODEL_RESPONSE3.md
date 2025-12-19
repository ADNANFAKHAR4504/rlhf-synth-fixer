You're right! The CDKTF provider has specific naming conventions and some classes have different names. Let me provide the corrected versions of both files:

## modules.ts (Fully Corrected)

```typescript
import { Construct } from "constructs";
import { 
  provider,
  dataAwsCallerIdentity,
  dataAwsRegion,
  iamRole,
  iamPolicy,
  iamRolePolicyAttachment,
  kmsKey,
  kmsAlias,
  s3Bucket,
  s3BucketServerSideEncryptionConfiguration,
  s3BucketVersioning,
  s3BucketLogging,
  s3BucketPublicAccessBlock,
  s3BucketReplicationConfiguration,
  securityGroup,
  securityGroupRule,
  vpc,
  subnet,
  internetGateway,
  routeTable,
  route,
  routeTableAssociation,
  cloudtrail,
  cloudwatchLogGroup,
  backupVault,
  backupPlan,
  backupSelection,
  cloudwatchMetricAlarm,
  snsTopicSubscription,
  snsTopic
} from "@cdktf/provider-aws";

export interface SecureInfraConfig {
  approvedIpRanges: string[];
  securityTeamEmail: string;
  backupRegion: string;
  environment: string;
}

export class SecureInfrastructureModules extends Construct {
  public readonly iamRole: iamRole.IamRole;
  public readonly kmsKey: kmsKey.KmsKey;
  public readonly mainBucket: s3Bucket.S3Bucket;
  public readonly logBucket: s3Bucket.S3Bucket;
  public readonly backupBucket: s3Bucket.S3Bucket;
  public readonly vpc: vpc.Vpc;
  public readonly securityGroup: securityGroup.SecurityGroup;
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly backupVault: backupVault.BackupVault;
  public readonly snsAlertTopic: snsTopic.SnsTopic;
  public readonly unauthorizedAccessAlarm: cloudwatchMetricAlarm.CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, config: SecureInfraConfig) {
    super(scope, id);

    // Get current AWS account and region info
    const current = new dataAwsCallerIdentity.DataAwsCallerIdentity(this, "current");
    const region = new dataAwsRegion.DataAwsRegion(this, "current-region");

    // =============================================================================
    // KMS KEY - Encrypt all data at rest with customer-managed key
    // =============================================================================
    this.kmsKey = new kmsKey.KmsKey(this, "SecProject-KMS-Key", {
      description: "KMS key for SecProject encryption at rest",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      enableKeyRotation: true, // Security best practice: automatic key rotation
      deletionWindowInDays: 30, // Allow recovery if accidentally deleted
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            // Allow root account full access to prevent lockout
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            // Allow CloudTrail to use the key for log encryption
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey",
              "kms:Encrypt",
              "kms:GenerateDataKey*",
              "kms:ReEncrypt*"
            ],
            Resource: "*"
          },
          {
            // Allow S3 service to use the key for bucket encryption
            Sid: "Allow S3 Service",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            },
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey",
              "kms:Encrypt",
              "kms:GenerateDataKey*",
              "kms:ReEncrypt*"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: "SecProject-KMS-Key",
        Environment: config.environment,
        Purpose: "Data encryption at rest"
      }
    });

    // Create KMS alias for easier reference
    new kmsAlias.KmsAlias(this, "SecProject-KMS-Alias", {
      name: "alias/secproject-encryption-key",
      targetKeyId: this.kmsKey.keyId
    });

    // =============================================================================
    // VPC - Isolated network environment
    // =============================================================================
    this.vpc = new vpc.Vpc(this, "SecProject-VPC", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "SecProject-VPC",
        Environment: config.environment
      }
    });

    // Public subnet for resources that need internet access
    const publicSubnet = new subnet.Subnet(this, "SecProject-PublicSubnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: "us-east-1a",
      mapPublicIpOnLaunch: false, // Security: Don't auto-assign public IPs
      tags: {
        Name: "SecProject-PublicSubnet",
        Type: "Public"
      }
    });

    // Private subnet for sensitive resources
    const privateSubnet = new subnet.Subnet(this, "SecProject-PrivateSubnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: "us-east-1b",
      tags: {
        Name: "SecProject-PrivateSubnet",
        Type: "Private"
      }
    });

    // Internet Gateway for public subnet
    const igw = new internetGateway.InternetGateway(this, "SecProject-IGW", {
      vpcId: this.vpc.id,
      tags: {
        Name: "SecProject-IGW"
      }
    });

    // Route table for public subnet
    const publicRouteTable = new routeTable.RouteTable(this, "SecProject-PublicRT", {
      vpcId: this.vpc.id,
      tags: {
        Name: "SecProject-PublicRT"
      }
    });

    new route.Route(this, "SecProject-PublicRoute", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    new routeTableAssociation.RouteTableAssociation(this, "SecProject-PublicRTAssoc", {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id
    });

    // =============================================================================
    // SECURITY GROUPS - Network-level access control
    // =============================================================================
    this.securityGroup = new securityGroup.SecurityGroup(this, "SecProject-SecurityGroup", {
      name: "SecProject-SG",
      description: "Security group with restricted access to approved IP ranges only",
      vpcId: this.vpc.id,
      tags: {
        Name: "SecProject-SecurityGroup",
        Environment: config.environment
      }
    });

    // Inbound rules: Only allow traffic from approved IP ranges
    config.approvedIpRanges.forEach((ipRange, index) => {
      new securityGroupRule.SecurityGroupRule(this, `SecProject-InboundRule-${index}`, {
        type: "ingress",
        fromPort: 443,
        toPort: 443,
        protocol: "tcp",
        cidrBlocks: [ipRange],
        securityGroupId: this.securityGroup.id,
        description: `HTTPS access from approved IP range ${ipRange}`
      });

      // SSH access for administrative purposes (port 22)
      new securityGroupRule.SecurityGroupRule(this, `SecProject-SSHRule-${index}`, {
        type: "ingress",
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: [ipRange],
        securityGroupId: this.securityGroup.id,
        description: `SSH access from approved IP range ${ipRange}`
      });
    });

    // Outbound rules: Allow HTTPS and DNS only
    new securityGroupRule.SecurityGroupRule(this, "SecProject-OutboundHTTPS", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "HTTPS outbound for AWS API calls and updates"
    });

    new securityGroupRule.SecurityGroupRule(this, "SecProject-OutboundDNS", {
      type: "egress",
      fromPort: 53,
      toPort: 53,
      protocol: "udp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "DNS resolution"
    });

    // =============================================================================
    // S3 BUCKETS - Encrypted storage with proper access controls
    // =============================================================================

    // Log bucket for CloudTrail and other service logs
    this.logBucket = new s3Bucket.S3Bucket(this, "SecProject-LogBucket", {
      bucket: `secproject-logs-${current.accountId}-${region.name}`,
      tags: {
        Name: "SecProject-LogBucket",
        Environment: config.environment,
        Purpose: "Centralized logging"
      }
    });

    // Encrypt log bucket with KMS
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(this, "SecProject-LogBucket-Encryption", {
      bucket: this.logBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
          kmsMasterKeyId: this.kmsKey.arn
        },
        bucketKeyEnabled: true // Reduce KMS API calls for cost optimization
      }]
    });

    // Enable versioning on log bucket for audit trail integrity
    new s3BucketVersioning.S3BucketVersioningA(this, "SecProject-LogBucket-Versioning", {
      bucket: this.logBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    // Block all public access to log bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "SecProject-LogBucket-PublicBlock", {
      bucket: this.logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // Main application bucket
    this.mainBucket = new s3Bucket.S3Bucket(this, "SecProject-MainBucket", {
      bucket: `secproject-main-${current.accountId}-${region.name}`,
      tags: {
        Name: "SecProject-MainBucket",
        Environment: config.environment,
        Purpose: "Application data storage"
      }
    });

    // Encrypt main bucket with KMS
    new s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(this, "SecProject-MainBucket-Encryption", {
      bucket: this.mainBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
          kmsMasterKeyId: this.kmsKey.arn
        },
        bucketKeyEnabled: true
      }]
    });

    // Enable versioning on main bucket
    new s3BucketVersioning.S3BucketVersioningA(this, "SecProject-MainBucket-Versioning", {
      bucket: this.mainBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    // Block public access to main bucket
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "SecProject-MainBucket-PublicBlock", {
      bucket: this.mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // Enable access logging for main bucket
    new s3BucketLogging.S3BucketLoggingA(this, "SecProject-MainBucket-Logging", {
      bucket: this.mainBucket.id,
      targetBucket: this.logBucket.id,
      targetPrefix: "access-logs/"
    });

    // Cross-region backup bucket
    this.backupBucket = new s3Bucket.S3Bucket(this, "SecProject-BackupBucket", {
      bucket: `secproject-backup-${current.accountId}-${config.backupRegion}`,
      provider: new provider.AwsProvider(this, "backup-provider", {
        region: config.backupRegion,
        alias: "backup"
      }),
      tags: {
        Name: "SecProject-BackupBucket",
        Environment: config.environment,
        Purpose: "Cross-region backup storage"
      }
    });

    // Cross-region replication for disaster recovery
    new s3BucketReplicationConfiguration.S3BucketReplicationConfiguration(this, "SecProject-CrossRegionReplication", {
      role: this.createReplicationRole(current.accountId).arn,
      bucket: this.mainBucket.id,
      rule: [{
        id: "ReplicateToBackupRegion",
        status: "Enabled",
        destination: {
          bucket: this.backupBucket.arn,
          encryptionConfiguration: {
            replicaKmsKeyId: this.kmsKey.arn
          }
        }
      }]
    });

    // =============================================================================
    // IAM ROLE - Least privilege access for application
    // =============================================================================
    this.iamRole = new iamRole.IamRole(this, "SecProject-AppRole", {
      name: "SecProject-ApplicationRole",
      description: "Least privilege role for SecProject application",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com" // Adjust based on your compute service
            }
          }
        ]
      }),
      tags: {
        Name: "SecProject-AppRole",
        Environment: config.environment
      }
    });

    // Fine-grained policy for S3 access
    const s3Policy = new iamPolicy.IamPolicy(this, "SecProject-S3Policy", {
      name: "SecProject-S3AccessPolicy",
      description: "Limited S3 access for application bucket only",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            // Allow read/write to main bucket only
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:GetObjectVersion"
            ],
            Resource: `${this.mainBucket.arn}/*`
          },
          {
            // Allow listing main bucket contents
            Effect: "Allow",
            Action: [
              "s3:ListBucket",
              "s3:GetBucketLocation"
            ],
            Resource: this.mainBucket.arn
          },
          {
            // Allow KMS operations for encryption/decryption
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey",
              "kms:Encrypt",
              "kms:GenerateDataKey*",
              "kms:ReEncrypt*"
            ],
            Resource: this.kmsKey.arn
          }
        ]
      })
    });

    // CloudWatch logging policy
    const loggingPolicy = new iamPolicy.IamPolicy(this, "SecProject-LoggingPolicy", {
      name: "SecProject-CloudWatchLogsPolicy",
      description: "Allow application to write to CloudWatch Logs",
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
            Resource: `arn:aws:logs:${region.name}:${current.accountId}:log-group:/aws/secproject/*`
          }
        ]
      })
    });

    // Attach policies to role
    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, "SecProject-S3PolicyAttachment", {
      role: this.iamRole.name,
      policyArn: s3Policy.arn
    });

    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, "SecProject-LoggingPolicyAttachment", {
      role: this.iamRole.name,
      policyArn: loggingPolicy.arn
    });

    // =============================================================================
    // CLOUDTRAIL - Comprehensive API activity logging
    // =============================================================================
    const cloudTrailLogGroup = new cloudwatchLogGroup.CloudwatchLogGroup(this, "SecProject-CloudTrailLogs", {
      name: "/aws/cloudtrail/secproject",
      retentionInDays: 90, // Retain logs for compliance
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: "SecProject-CloudTrailLogs",
        Environment: config.environment
      }
    });

    this.cloudTrail = new cloudtrail.Cloudtrail(this, "SecProject-CloudTrail", {
      name: "SecProject-AuditTrail",
      s3BucketName: this.logBucket.bucket,
      s3KeyPrefix: "cloudtrail/",
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: this.kmsKey.arn,
      cloudWatchLogsGroupArn: `${cloudTrailLogGroup.arn}:*`,
      cloudWatchLogsRoleArn: this.createCloudTrailRole(current.accountId).arn,
      eventSelector: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResource: [{
          type: "AWS::S3::Object",
          values: [`${this.mainBucket.arn}/*`]
        }]
      }],
      tags: {
        Name: "SecProject-CloudTrail",
        Environment: config.environment
      }
    });

    // =============================================================================
    // BACKUP STRATEGY - AWS Backup service for automated backups
    // =============================================================================
    this.backupVault = new backupVault.BackupVault(this, "SecProject-BackupVault", {
      name: "SecProject-BackupVault",
      kmsKeyArn: this.kmsKey.arn,
      tags: {
        Name: "SecProject-BackupVault",
        Environment: config.environment
      }
    });

    const backupPlanResource: backupPlan.BackupPlan = new backupPlan.BackupPlan(this, "SecProject-BackupPlan", {
      name: "SecProject-BackupPlan",
      rule: [{
        ruleName: "DailyBackups",
        targetVaultName: this.backupVault.name,
        schedule: "cron(0 5 ? * * *)", // Daily at 5 AM UTC
        lifecycle: {
          coldStorageAfter: 30,
          deleteAfter: 365
        },
        copyAction: [{
          destinationVaultArn: `arn:aws:backup:${config.backupRegion}:${current.accountId}:backup-vault:SecProject-BackupVault-${config.backupRegion}`,
          lifecycle: {
            coldStorageAfter: 30,
            deleteAfter: 365
          }
        }]
      }],
      tags: {
        Name: "SecProject-BackupPlan",
        Environment: config.environment
      }
    });

    new backupSelection.BackupSelection(this, "SecProject-BackupSelection", {
      iamRoleArn: this.createBackupRole(current.accountId).arn,
      name: "SecProject-BackupSelection",
      planId: backupPlanResource.id,
      resources: [
        this.mainBucket.arn
      ]
    });

    // =============================================================================
    // ALERTS AND MONITORING - Security incident detection
    // =============================================================================
    this.snsAlertTopic = new snsTopic.SnsTopic(this, "SecProject-SecurityAlerts", {
      name: "SecProject-SecurityAlerts",
      displayName: "SecProject Security Alerts",
      kmsMasterKeyId: this.kmsKey.id,
      tags: {
        Name: "SecProject-SecurityAlerts",
        Environment: config.environment
      }
    });

    // Subscribe security team email to alerts
    new snsTopicSubscription.SnsTopicSubscription(this, "SecProject-SecurityTeamSubscription", {
      topicArn: this.snsAlertTopic.arn,
      protocol: "email",
      endpoint: config.securityTeamEmail
    });

    // CloudWatch alarm for unauthorized access attempts
    this.unauthorizedAccessAlarm = new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "SecProject-UnauthorizedAccessAlarm", {
      alarmName: "SecProject-UnauthorizedAccessAttempts",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "ErrorCount",
      namespace: "AWS/CloudTrailMetrics",
      period: 300,
      statistic: "Sum",
      threshold: 5,
      alarmDescription: "Alert when unauthorized access attempts are detected",
      alarmActions: [this.snsAlertTopic.arn],
      treatMissingData: "notBreaching",
      tags: {
        Name: "SecProject-UnauthorizedAccessAlarm",
        Environment: config.environment
      }
    });

    // Additional alarm for failed console logins
    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "SecProject-FailedLoginAlarm", {
      alarmName: "SecProject-FailedConsoleLogins",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "ConsoleLoginFailures",
      namespace: "AWS/CloudTrailMetrics",
      period: 300,
      statistic: "Sum",
      threshold: 3,
      alarmDescription: "Alert on multiple failed console login attempts",
      alarmActions: [this.snsAlertTopic.arn],
      tags: {
        Name: "SecProject-FailedLoginAlarm",
        Environment: config.environment
      }
    });
  }

  // Helper method to create CloudTrail service role
  private createCloudTrailRole(accountId: string): iamRole.IamRole {
    const role = new iamRole.IamRole(this, "SecProject-CloudTrailRole", {
      name: "SecProject-CloudTrailRole",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            }
          }
        ]
      })
    });

    const policy = new iamPolicy.IamPolicy(this, "SecProject-CloudTrailLogsPolicy", {
      name: "SecProject-CloudTrailLogsPolicy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream"
            ],
            Resource: `arn:aws:logs:*:${accountId}:log-group:/aws/cloudtrail/secproject:*`
          }
        ]
      })
    });

    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, "SecProject-CloudTrailLogsPolicyAttachment", {
      role: role.name,
      policyArn: policy.arn
    });

    return role;
  }

  // Helper method to create S3 replication role
  private createReplicationRole(accountId: string): iamRole.IamRole {
    const role = new iamRole.IamRole(this, "SecProject-ReplicationRole", {
      name: "SecProject-ReplicationRole",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "s3.amazonaws.com"
            }
          }
        ]
      })
    });

    const policy = new iamPolicy.IamPolicy(this, "SecProject-ReplicationPolicy", {
      name: "SecProject-ReplicationPolicy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl"
            ],
            Resource: `${this.mainBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ListBucket"
            ],
            Resource: this.mainBucket.arn
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ReplicateObject",
              "s3:ReplicateDelete"
            ],
            Resource: `${this.backupBucket.arn}/*`
          }
        ]
      })
    });

    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, "SecProject-ReplicationPolicyAttachment", {
      role: role.name,
      policyArn: policy.arn
    });

    return role;
  }

  // Helper method to create AWS Backup service role
  private createBackupRole(accountId: string): iamRole.IamRole {
    const role = new iamRole.IamRole(this, "SecProject-BackupRole", {
      name: "SecProject-BackupRole",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "backup.amazonaws.com"
            }
          }
        ]
      })
    });

    // Attach AWS managed policy for backup service
    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, "SecProject-BackupServicePolicy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
    });

    return role;
  }
}
```

## tap-stack.ts (Complete and Corrected)

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { provider } from "@cdktf/provider-aws";
import { SecureInfrastructureModules, SecureInfraConfig } from "./modules";

/**
 * Main stack that orchestrates the secure infrastructure deployment
 * This stack wires up all the security modules with appropriate configuration
 */
export class TapSecurityStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // =============================================================================
    // PROVIDER CONFIGURATION
    // =============================================================================
    new provider.AwsProvider(this, "aws", {
      region: "us-east-1", // Primary region as specified
      defaultTags: {
        tags: {
          Project: "SecProject",
          ManagedBy: "Terraform-CDK",
          SecurityLevel: "High",
          Environment: "production"
        }
      }
    });

    // =============================================================================
    // CONFIGURATION - Centralized security parameters
    // =============================================================================
    const secureConfig: SecureInfraConfig = {
      // Approved IP ranges - Replace with your organization's IP ranges
      // These should be your office networks, VPN endpoints, etc.
      approvedIpRanges: [
        "203.0.113.0/24",    // Example: Office network range
        "198.51.100.0/24",   // Example: VPN network range
        "192.0.2.0/24"       // Example: Admin network range
      ],
      
      // Security team email for alerts - Replace with actual security team email
      securityTeamEmail: "security-team@yourcompany.com",
      
      // Backup region for disaster recovery - Different from primary region
      backupRegion: "us-west-2",
      
      // Environment designation
      environment: "production"
    };

    // =============================================================================
    // DEPLOY SECURE INFRASTRUCTURE MODULES
    // =============================================================================
    const secureInfra = new SecureInfrastructureModules(
      this, 
      "SecProject-Infrastructure", 
      secureConfig
    );

    // =============================================================================
    // OUTPUTS - Important resource identifiers for external reference
    // =============================================================================
    
    // IAM Role ARN - For applications to assume this role
    new TerraformOutput(this, "iam-role-arn", {
      description: "ARN of the least-privilege IAM role for applications",
      value: secureInfra.iamRole.arn,
      sensitive: false
    });

    // Main S3 Bucket Name - For application configuration
    new TerraformOutput(this, "main-bucket-name", {
      description: "Name of the main encrypted S3 bucket for application data",
      value: secureInfra.mainBucket.bucket,
      sensitive: false
    });

    // Log S3 Bucket Name - For log aggregation configuration
    new TerraformOutput(this, "log-bucket-name", {
      description: "Name of the encrypted S3 bucket for centralized logging",
      value: secureInfra.logBucket.bucket,
      sensitive: false
    });

    // KMS Key ID - For additional encryption needs
    new TerraformOutput(this, "kms-key-id", {
      description: "ID of the KMS key used for encryption at rest",
      value: secureInfra.kmsKey.keyId,
      sensitive: false
    });

    // KMS Key ARN - For IAM policies and cross-service encryption
    new TerraformOutput