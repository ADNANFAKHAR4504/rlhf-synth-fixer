import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as config from 'aws-cdk-lib/aws-config';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  vpcId?: string; // Make optional
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly securityBucket: s3.Bucket;
  public readonly cloudTrail: cloudtrail.Trail;
  public readonly guardDuty: guardduty.CfnDetector;
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly remediationFunction: lambda.Function;
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { projectName, environment, vpcId, environmentSuffix = '' } = props;

    // Get or create VPC - FIXED to handle non-existent VPC
    this.vpc = this.getOrCreateVpc(
      projectName,
      environment,
      environmentSuffix,
      vpcId
    );

    // Create KMS Key for encryption
    this.kmsKey = this.createKMSKey(projectName, environment);

    // Create security logging bucket
    this.securityBucket = this.createSecurityBucket(projectName, environment);

    // Setup CloudTrail
    this.cloudTrail = this.createCloudTrail(projectName, environment);

    // Setup AWS Config
    this.createConfigSetup(projectName, environment);

    // Setup GuardDuty
    this.guardDuty = this.createGuardDuty(projectName, environment);

    // Setup WAF
    this.webAcl = this.createWebACL(projectName, environment);

    // Setup IAM roles and policies
    this.createIAMRoles(projectName, environment);

    // Setup Systems Manager
    this.createSystemsManagerSetup(projectName, environment);

    // Setup automated remediation
    this.remediationFunction = this.createRemediationFunction(
      projectName,
      environment
    );

    // Setup monitoring and alerting
    this.createMonitoring(projectName, environment);

    // ==================== OUTPUTS FOR TESTING ====================
    // VPC Outputs
    new cdk.CfnOutput(this, 'SecurityVpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID used by security stack',
    });

    new cdk.CfnOutput(this, 'SecurityVpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
    });

    // KMS Outputs
    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN',
    });

    // S3 Outputs
    new cdk.CfnOutput(this, 'SecurityBucketName', {
      value: this.securityBucket.bucketName,
      description: 'Security logs bucket name',
    });

    new cdk.CfnOutput(this, 'SecurityBucketArn', {
      value: this.securityBucket.bucketArn,
      description: 'Security logs bucket ARN',
    });

    // CloudTrail Outputs

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: this.cloudTrail.trailArn,
      description: 'CloudTrail ARN',
    });

    // GuardDuty Output
    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: this.guardDuty.attrId,
      description: 'GuardDuty detector ID',
    });

    // WAF Output
    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF Web ACL ID',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    // Lambda Outputs
    new cdk.CfnOutput(this, 'RemediationFunctionName', {
      value: this.remediationFunction.functionName,
      description: 'Remediation Lambda function name',
    });

    new cdk.CfnOutput(this, 'RemediationFunctionArn', {
      value: this.remediationFunction.functionArn,
      description: 'Remediation Lambda function ARN',
    });

    // Regional Output
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
    });

    new cdk.CfnOutput(this, 'AccountId', {
      value: this.account,
      description: 'AWS account ID',
    });

    // Apply tags to all resources
    this.applyTags(projectName, environment);
  }

  private getOrCreateVpc(
    projectName: string,
    environment: string,
    environmentSuffix: string,
    vpcId?: string
  ): ec2.IVpc {
    // If no VPC ID provided, create a new one
    if (!vpcId) {
      return this.createNewVpc(projectName, environment, environmentSuffix);
    }

    try {
      // Try to import existing VPC
      return ec2.Vpc.fromLookup(this, 'ExistingVPC', {
        vpcId: vpcId,
      });
    } catch (error) {
      console.warn(
        `VPC ${vpcId} not found, creating new VPC for security stack`
      );
      return this.createNewVpc(projectName, environment, environmentSuffix);
    }
  }

  private createNewVpc(
    projectName: string,
    environment: string,
    environmentSuffix: string
  ): ec2.Vpc {
    return new ec2.Vpc(this, `${projectName}-${environment}-security-vpc`, {
      vpcName: `corp-${projectName}-security-vpc${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'), // Different CIDR than main stack
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }

  // ... rest of your methods (createKMSKey, createSecurityBucket, etc.) remain the same
  private createKMSKey(projectName: string, environment: string): kms.Key {
    const key = new kms.Key(
      this,
      `${projectName}-${environment}-security-key`,
      {
        alias: `${projectName}-${environment}-security-key`,
        description: 'KMS key for encrypting security-related resources',
        enableKeyRotation: true,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'Enable IAM root permissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow CloudTrail to encrypt logs',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              ],
              actions: ['kms:GenerateDataKey', 'kms:DescribeKey'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow Config to encrypt logs',
              effect: iam.Effect.ALLOW,
              principals: [new iam.ServicePrincipal('config.amazonaws.com')],
              actions: ['kms:GenerateDataKey', 'kms:DescribeKey'],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    return key;
  }

  private createSecurityBucket(
    projectName: string,
    environment: string
  ): s3.Bucket {
    const bucket = new s3.Bucket(
      this,
      `${projectName}-${environment}-security-logs-bucket`,
      {
        bucketName:
          `${projectName}-${environment}-security-logs-${this.account}`.toLowerCase(),
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        versioned: true,
        lifecycleRules: [
          {
            id: 'security-logs-lifecycle',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
            expiration: cdk.Duration.days(2555), // 7 years retention
          },
        ],
        serverAccessLogsPrefix: 'access-logs/',
        enforceSSL: true,
      }
    );

    // Add bucket policy to deny unencrypted uploads
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    return bucket;
  }

  private createCloudTrail(
    projectName: string,
    environment: string
  ): cloudtrail.Trail {
    // Create CloudWatch Log Group for CloudTrail
    const logGroup = new logs.LogGroup(
      this,
      `${projectName}-${environment}-cloudtrail-logs`,
      {
        logGroupName: `/aws/cloudtrail/${projectName}-${environment}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: this.kmsKey,
      }
    );

    // Create CloudTrail
    const trail = new cloudtrail.Trail(
      this,
      `${projectName}-${environment}-cloudtrail`,
      {
        trailName: `${projectName}-${environment}-security-trail`,
        bucket: this.securityBucket,
        s3KeyPrefix: 'cloudtrail-logs/',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: this.kmsKey,
        cloudWatchLogGroup: logGroup,
        sendToCloudWatchLogs: true,
      }
    );

    // Attach InsightSelectors to the underlying CfnTrail
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.addPropertyOverride('InsightSelectors', [
      { InsightType: 'ApiCallRateInsight' },
    ]);

    // Log all management events
    trail.logAllS3DataEvents();
    trail.logAllLambdaDataEvents();

    return trail;
  }

  private createConfigSetup(projectName: string, environment: string): void {
    // Create Config delivery channel bucket
    const configBucket = new s3.Bucket(
      this,
      `${projectName}-${environment}-config-bucket`,
      {
        bucketName:
          `${projectName}-${environment}-config-${this.account}`.toLowerCase(),
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
      }
    );

    // Create Config role
    const configRole = new iam.Role(
      this,
      `${projectName}-${environment}-config-role`,
      {
        roleName: `${projectName}-${environment}-config-role`,
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
        ],
        inlinePolicies: {
          ConfigDeliveryPermissions: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetBucketAcl',
                  's3:ListBucket',
                  's3:GetBucketLocation',
                ],
                resources: [configBucket.bucketArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:PutObject'],
                resources: [`${configBucket.bucketArn}/*`],
                conditions: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:GenerateDataKey', 'kms:Decrypt'],
                resources: [this.kmsKey.keyArn],
              }),
            ],
          }),
        },
      }
    );

    // Create Config configuration recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      `${projectName}-${environment}-config-recorder`,
      {
        name: `${projectName}-${environment}-config-recorder`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Create Config delivery channel
    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      `${projectName}-${environment}-config-delivery`,
      {
        name: `${projectName}-${environment}-config-delivery`,
        s3BucketName: configBucket.bucketName,
        s3KeyPrefix: 'config/',
        configSnapshotDeliveryProperties: {
          deliveryFrequency: 'Twelve_Hours',
        },
      }
    );

    deliveryChannel.addDependency(configRecorder);

    // Create compliance rules
    this.createConfigRules(projectName, environment);
  }

  private createConfigRules(projectName: string, environment: string): void {
    // S3 bucket public read prohibited
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-s3-public-read-prohibited`,
      {
        configRuleName: `${projectName}-${environment}-s3-bucket-public-read-prohibited`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      }
    );

    // S3 bucket public write prohibited
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-s3-public-write-prohibited`,
      {
        configRuleName: `${projectName}-${environment}-s3-bucket-public-write-prohibited`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      }
    );

    // Root access key check
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-root-access-key-check`,
      {
        configRuleName: `${projectName}-${environment}-root-access-key-check`,
        identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
      }
    );

    // MFA enabled for IAM console access
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-mfa-enabled-for-iam-console`,
      {
        configRuleName: `${projectName}-${environment}-mfa-enabled-for-iam-console-access`,
        identifier:
          config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      }
    );

    // Encrypted volumes
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-encrypted-volumes`,
      {
        configRuleName: `${projectName}-${environment}-encrypted-volumes`,
        identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      }
    );

    // RDS storage encrypted
    new config.ManagedRule(
      this,
      `${projectName}-${environment}-rds-storage-encrypted`,
      {
        configRuleName: `${projectName}-${environment}-rds-storage-encrypted`,
        identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      }
    );
  }

  private createGuardDuty(
    projectName: string,
    environment: string
  ): guardduty.CfnDetector {
    const detector = new guardduty.CfnDetector(
      this,
      `${projectName}-${environment}-guardduty`,
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        dataSources: {
          s3Logs: { enable: true },
          kubernetes: { auditLogs: { enable: true } },
          malwareProtection: {
            scanEc2InstanceWithFindings: { ebsVolumes: true },
          },
        },
      }
    );

    // Create EventBridge rule to capture GuardDuty findings
    const guardDutyRule = new events.Rule(
      this,
      `${projectName}-${environment}-guardduty-findings-rule`,
      {
        eventPattern: {
          source: ['aws.guardduty'],
          detailType: ['GuardDuty Finding'],
        },
      }
    );

    // Create CloudWatch Log Group for GuardDuty findings
    const guardDutyLogGroup = new logs.LogGroup(
      this,
      `${projectName}-${environment}-guardduty-findings`,
      {
        logGroupName: `/aws/events/guardduty/${projectName}-${environment}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: this.kmsKey,
      }
    );

    guardDutyRule.addTarget(new targets.CloudWatchLogGroup(guardDutyLogGroup));

    return detector;
  }

  private createWebACL(
    projectName: string,
    environment: string
  ): wafv2.CfnWebACL {
    const webAcl = new wafv2.CfnWebACL(
      this,
      `${projectName}-${environment}-web-acl`,
      {
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        name: `${projectName}-${environment}-web-acl`,
        description: 'Web ACL for application protection',
        rules: [
          {
            name: 'AWS-AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsMetric',
            },
          },
          {
            name: 'RateLimitRule',
            priority: 3,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${projectName}-${environment}-web-acl`,
        },
      }
    );

    return webAcl;
  }

  private createIAMRoles(projectName: string, environment: string): void {
    // Create a group that requires MFA
    const _mfaGroup = new iam.Group(
      this,
      `${projectName}-${environment}-mfa-required-group`,
      {
        groupName: `${projectName}-${environment}-mfa-required-group`,
        managedPolicies: [
          new iam.ManagedPolicy(
            this,
            `${projectName}-${environment}-force-mfa-policy`,
            {
              managedPolicyName: `${projectName}-${environment}-force-mfa-policy`,
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.DENY,
                  notActions: [
                    'iam:CreateVirtualMFADevice',
                    'iam:EnableMFADevice',
                    'iam:GetUser',
                    'iam:ListMFADevices',
                    'iam:ListVirtualMFADevices',
                    'iam:ResyncMFADevice',
                    'sts:GetSessionToken',
                  ],
                  resources: ['*'],
                  conditions: {
                    BoolIfExists: {
                      'aws:MultiFactorAuthPresent': 'false',
                    },
                  },
                }),
              ],
            }
          ),
        ],
      }
    );

    // Create security monitoring role
    const securityMonitoringRole = new iam.Role(
      this,
      `${projectName}-${environment}-security-monitoring-role`,
      {
        roleName: `${projectName}-${environment}-security-monitoring-role`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
        ],
        inlinePolicies: {
          SecurityMonitoringPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'guardduty:GetFindings',
                  'guardduty:ListDetectors',
                  'config:DescribeComplianceByConfigRule',
                  'config:DescribeConfigRules',
                  'cloudtrail:LookupEvents',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );
  }

  private createSystemsManagerSetup(
    projectName: string,
    environment: string
  ): void {
    // Create patch baseline for security updates
    const _patchBaseline = new ssm.CfnPatchBaseline(
      this,
      `${projectName}-${environment}-patch-baseline`,
      {
        name: `${projectName}-${environment}-security-patch-baseline`,
        operatingSystem: 'AMAZON_LINUX_2',
        description: 'Patch baseline for security updates',
        approvalRules: {
          patchRules: [
            {
              patchFilterGroup: {
                patchFilters: [
                  {
                    key: 'CLASSIFICATION',
                    values: ['Security', 'Critical'],
                  },
                ],
              },
              approveAfterDays: 0,
              enableNonSecurity: false,
              complianceLevel: 'CRITICAL',
            },
          ],
        },
        approvedPatches: [],
        rejectedPatches: [],
      }
    );

    // Create maintenance window
    const maintenanceWindow = new ssm.CfnMaintenanceWindow(
      this,
      `${projectName}-${environment}-maintenance-window`,
      {
        name: `${projectName}-${environment}-patch-maintenance-window`,
        description: 'Maintenance window for automated patching',
        duration: 4,
        cutoff: 1,
        schedule: 'cron(0 2 ? * SUN *)', // Every Sunday at 2 AM
        allowUnassociatedTargets: false,
      }
    );

    // Create patch group
    new ssm.CfnMaintenanceWindowTarget(
      this,
      `${projectName}-${environment}-patch-target`,
      {
        windowId: maintenanceWindow.ref,
        resourceType: 'INSTANCE',
        targets: [
          {
            key: 'tag:PatchGroup',
            values: [`${projectName}-${environment}`],
          },
        ],
      }
    );

    // Create patch task
    new ssm.CfnMaintenanceWindowTask(
      this,
      `${projectName}-${environment}-patch-task`,
      {
        windowId: maintenanceWindow.ref,
        taskType: 'RUN_COMMAND',
        taskArn: 'AWS-RunPatchBaseline',
        serviceRoleArn: this.createPatchingRole(projectName, environment)
          .roleArn,
        targets: [
          {
            key: 'WindowTargetIds',
            values: [maintenanceWindow.ref],
          },
        ],
        priority: 1,
        maxConcurrency: '50%',
        maxErrors: '0',
        taskParameters: {
          Operation: {
            values: ['Install'],
          },
        },
      }
    );
  }

  private createPatchingRole(
    projectName: string,
    environment: string
  ): iam.Role {
    return new iam.Role(this, `${projectName}-${environment}-patching-role`, {
      roleName: `${projectName}-${environment}-patching-role`,
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMMaintenanceWindowRole'
        ),
      ],
    });
  }

  private createRemediationFunction(
    projectName: string,
    environment: string
  ): lambda.Function {
    const remediationRole = new iam.Role(
      this,
      `${projectName}-${environment}-remediation-role`,
      {
        roleName: `${projectName}-${environment}-remediation-role`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          RemediationPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:PutBucketPublicAccessBlock',
                  's3:PutBucketAcl',
                  'ec2:ModifyInstanceAttribute',
                  'iam:AttachRolePolicy',
                  'iam:DetachRolePolicy',
                  'config:PutEvaluations',
                  'rds:ModifyDBInstance',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    const func = new lambda.Function(
      this,
      `${projectName}-${environment}-remediation-function`,
      {
        functionName: `${projectName}-${environment}-security-remediation`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        role: remediationRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          PROJECT_NAME: projectName,
          ENVIRONMENT: environment,
        },
        code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Automated remediation function for security compliance violations
    """
    try:
        # Parse the incoming event
        detail = event.get('detail', {})
        config_item = detail.get('configurationItem', {})
        resource_type = config_item.get('resourceType')
        resource_id = config_item.get('resourceId')
        
        logger.info(f"Processing remediation for {resource_type}: {resource_id}")
        
        if resource_type == 'AWS::S3::Bucket':
            remediate_s3_bucket(resource_id)
        elif resource_type == 'AWS::EC2::Instance':
            remediate_ec2_instance(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            remediate_rds_instance(resource_id)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Remediation completed for {resource_id}'
            })
        }
    except Exception as e:
        logger.error(f"Remediation failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def remediate_s3_bucket(bucket_name):
    """Remediate S3 bucket public access"""
    s3 = boto3.client('s3')
    
    # Block public access
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    logger.info(f"Blocked public access for bucket: {bucket_name}")

def remediate_ec2_instance(instance_id):
    """Remediate EC2 instance security issues"""
    ec2 = boto3.client('ec2')
    
    # Enable detailed monitoring if not already enabled
    ec2.monitor_instances(InstanceIds=[instance_id])
    logger.info(f"Enabled detailed monitoring for instance: {instance_id}")

def remediate_rds_instance(instance_id):
    """Remediate RDS instance security issues"""
    rds = boto3.client('rds')
    
    # Enable storage encryption if not enabled
    try:
        rds.modify_db_instance(
            DBInstanceIdentifier=instance_id,
            StorageEncrypted=True,
            ApplyImmediately=True
        )
        logger.info(f"Enabled storage encryption for RDS instance: {instance_id}")
    except Exception as e:
        logger.warning(f"Could not enable encryption for RDS instance {instance_id}: {e}")
`),
      }
    );

    return func;
  }

  private createMonitoring(projectName: string, environment: string): void {
    // Create EventBridge rule for Config compliance changes
    const configRule = new events.Rule(
      this,
      `${projectName}-${environment}-config-compliance-rule`,
      {
        eventPattern: {
          source: ['aws.config'],
          detailType: ['Config Rules Compliance Change'],
        },
      }
    );

    configRule.addTarget(new targets.LambdaFunction(this.remediationFunction));

    // Create EventBridge rule for unauthorized API calls
    const unauthorizedApiRule = new events.Rule(
      this,
      `${projectName}-${environment}-unauthorized-api-rule`,
      {
        eventPattern: {
          source: ['aws.cloudtrail'],
          detail: {
            errorCode: ['UnauthorizedOperation', 'AccessDenied'],
          },
        },
      }
    );

    // Create CloudWatch Log Group for security alerts
    const alertLogGroup = new logs.LogGroup(
      this,
      `${projectName}-${environment}-security-alerts`,
      {
        logGroupName: `/aws/events/security-alerts/${projectName}-${environment}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: this.kmsKey,
      }
    );

    unauthorizedApiRule.addTarget(
      new targets.CloudWatchLogGroup(alertLogGroup)
    );
  }

  private applyTags(projectName: string, environment: string): void {
    const tags = {
      Project: projectName,
      Environment: environment,
      Owner: 'SecurityTeam',
      CostCenter: 'Security',
      Compliance: 'Required',
      ManagedBy: 'CDK',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
