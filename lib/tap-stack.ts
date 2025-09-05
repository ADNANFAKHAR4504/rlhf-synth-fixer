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

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get VPC ID from props or context
    const vpcId = props?.vpcId || this.node.tryGetContext('vpcId');

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Department: 'Security',
      Project: 'TapSecurity',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);

    // Import existing VPC if provided, otherwise create a new one
    let vpc: ec2.IVpc;
    if (vpcId) {
      vpc = ec2.Vpc.fromLookup(this, `ExistingVpc-${environmentSuffix}`, {
        vpcId: vpcId,
      });
    } else {
      vpc = new ec2.Vpc(this, `SecurityVpc-${environmentSuffix}`, {
        ipProtocol: ec2.IpProtocol.DUAL_STACK,
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 28,
            name: 'Isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
        enableDnsHostnames: true,
        enableDnsSupport: true,
      });
    }

    // 1. KMS Key for encryption
    const kmsKey = this.createKMSKey(environmentSuffix);

    // 2. Security logging bucket
    const securityBucket = this.createSecurityBucket(environmentSuffix, kmsKey);

    // 3. Setup CloudTrail
    this.createCloudTrail(environmentSuffix, securityBucket, kmsKey);

    // 4. Setup AWS Config
    this.createConfigSetup(environmentSuffix, vpc, kmsKey);

    // 5. Setup GuardDuty
    this.createGuardDuty(environmentSuffix, kmsKey);

    // 6. Setup WAF
    this.createWebACL(environmentSuffix);

    // 7. Setup IAM roles and policies
    this.createIAMRoles(environmentSuffix, securityBucket, kmsKey);

    // 8. Setup Systems Manager
    this.createSystemsManagerSetup(environmentSuffix);

    // 9. Setup automated remediation
    const remediationFunction =
      this.createRemediationFunction(environmentSuffix);

    // 10. Setup monitoring and alerting
    this.createMonitoring(environmentSuffix, remediationFunction, kmsKey);

    // 11. Output important values
    new cdk.CfnOutput(this, 'SecurityKmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for security resources',
    });

    new cdk.CfnOutput(this, 'SecurityBucketName', {
      value: securityBucket.bucketName,
      description: 'Security Logs Bucket Name',
    });
  }

  private createKMSKey(environmentSuffix: string): kms.Key {
    const key = new kms.Key(this, `TapSecurityKmsKey-${environmentSuffix}`, {
      description: `KMS key for security-related resources ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    return key;
  }

  private createSecurityBucket(
    environmentSuffix: string,
    kmsKey: kms.Key
  ): s3.Bucket {
    const bucket = new s3.Bucket(
      this,
      `TapSecurityBucket-${environmentSuffix}`,
      {
        bucketName: `tap-security-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
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
    environmentSuffix: string,
    securityBucket: s3.Bucket,
    kmsKey: kms.Key
  ): void {
    // Create CloudWatch Log Group for CloudTrail
    const logGroup = new logs.LogGroup(
      this,
      `TapCloudTrailLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/cloudtrail/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create CloudTrail with insight selector
    const trail = new cloudtrail.Trail(
      this,
      `TapCloudTrail-${environmentSuffix}`,
      {
        trailName: `tap-security-trail-${environmentSuffix}`,
        bucket: securityBucket,
        s3KeyPrefix: 'cloudtrail-logs/',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: kmsKey,
        cloudWatchLogGroup: logGroup,
        sendToCloudWatchLogs: true,
      }
    );

    // Log all S3 and Lambda data events
    trail.addS3EventSelector(
      [
        {
          bucket: securityBucket,
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
      }
    );

    // Log management events
  }

  private createConfigSetup(
    environmentSuffix: string,
    vpc: ec2.IVpc,
    kmsKey: kms.Key
  ): void {
    // Create Config delivery channel bucket
    const configBucket = new s3.Bucket(
      this,
      `TapConfigBucket-${environmentSuffix}`,
      {
        bucketName: `tap-config-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Create Config role
    const configRole = new iam.Role(
      this,
      `TapConfigRole-${environmentSuffix}`,
      {
        roleName: `tap-config-role-${environmentSuffix}`,
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
            ],
          }),
        },
      }
    );

    // Create Config configuration recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      `TapConfigRecorder-${environmentSuffix}`,
      {
        name: `tap-config-recorder-${environmentSuffix}`,
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
      `TapConfigDelivery-${environmentSuffix}`,
      {
        name: `tap-config-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.bucketName,
        s3KeyPrefix: 'config/',
      }
    );

    deliveryChannel.addDependency(configRecorder);

    // Create compliance rules
    this.createConfigRules(environmentSuffix);
  }

  private createConfigRules(environmentSuffix: string): void {
    // S3 bucket public read prohibited
    new config.ManagedRule(
      this,
      `TapS3PublicReadProhibited-${environmentSuffix}`,
      {
        configRuleName: `tap-s3-bucket-public-read-prohibited-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      }
    );

    // S3 bucket public write prohibited
    new config.ManagedRule(
      this,
      `TapS3PublicWriteProhibited-${environmentSuffix}`,
      {
        configRuleName: `tap-s3-bucket-public-write-prohibited-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      }
    );

    // Root access key check
    new config.ManagedRule(this, `TapRootAccessKeyCheck-${environmentSuffix}`, {
      configRuleName: `tap-root-access-key-check-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
    });

    // MFA enabled for IAM console access
    new config.ManagedRule(
      this,
      `TapMfaEnabledForIamConsole-${environmentSuffix}`,
      {
        configRuleName: `tap-mfa-enabled-for-iam-console-access-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      }
    );
  }

  private createGuardDuty(environmentSuffix: string, kmsKey: kms.Key): void {
    const detector = new guardduty.CfnDetector(
      this,
      `TapGuardDuty-${environmentSuffix}`,
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
      `TapGuardDutyRule-${environmentSuffix}`,
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
      `TapGuardDutyLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/events/guardduty/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    guardDutyRule.addTarget(new targets.CloudWatchLogGroup(guardDutyLogGroup));
  }

  private createWebACL(environmentSuffix: string): void {
    const webAcl = new wafv2.CfnWebACL(this, `TapWebAcl-${environmentSuffix}`, {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      name: `tap-web-acl-${environmentSuffix}`,
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
        metricName: `tap-web-acl-${environmentSuffix}`,
      },
    });
  }

  private createIAMRoles(
    environmentSuffix: string,
    securityBucket: s3.Bucket,
    kmsKey: kms.Key
  ): void {
    // Create a group that requires MFA
    const mfaGroup = new iam.Group(this, `TapMfaGroup-${environmentSuffix}`, {
      groupName: `tap-mfa-required-group-${environmentSuffix}`,
      managedPolicies: [
        new iam.ManagedPolicy(this, `TapForceMfaPolicy-${environmentSuffix}`, {
          managedPolicyName: `tap-force-mfa-policy-${environmentSuffix}`,
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
        }),
      ],
    });

    // Create application-specific roles with least privilege
    const appRole = new iam.Role(this, `TapAppRole-${environmentSuffix}`, {
      roleName: `tap-app-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        AppSpecificPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${securityBucket.bucketArn}/app-data/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Create instance profile for EC2
    new iam.CfnInstanceProfile(
      this,
      `TapInstanceProfile-${environmentSuffix}`,
      {
        instanceProfileName: `tap-app-instance-profile-${environmentSuffix}`,
        roles: [appRole.roleName],
      }
    );
  }

  private createSystemsManagerSetup(environmentSuffix: string): void {
    // Create patch baseline for security updates
    const patchBaseline = new ssm.CfnPatchBaseline(
      this,
      `TapPatchBaseline-${environmentSuffix}`,
      {
        name: `tap-security-patch-baseline-${environmentSuffix}`,
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
      `TapMaintenanceWindow-${environmentSuffix}`,
      {
        name: `tap-patch-maintenance-window-${environmentSuffix}`,
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
      `TapPatchTarget-${environmentSuffix}`,
      {
        windowId: maintenanceWindow.ref,
        resourceType: 'INSTANCE',
        targets: [
          {
            key: 'tag:PatchGroup',
            values: [`tap-security-${environmentSuffix}`],
          },
        ],
      }
    );

    // Create patch task
    new ssm.CfnMaintenanceWindowTask(
      this,
      `TapPatchTask-${environmentSuffix}`,
      {
        windowId: maintenanceWindow.ref,
        taskType: 'RUN_COMMAND',
        taskArn: 'AWS-RunPatchBaseline',
        serviceRoleArn: this.createPatchingRole(environmentSuffix).roleArn,
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

  private createPatchingRole(environmentSuffix: string): iam.Role {
    return new iam.Role(this, `TapPatchingRole-${environmentSuffix}`, {
      roleName: `tap-patching-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMMaintenanceWindowRole'
        ),
      ],
    });
  }

  private createRemediationFunction(
    environmentSuffix: string
  ): lambda.Function {
    const remediationRole = new iam.Role(
      this,
      `TapRemediationRole-${environmentSuffix}`,
      {
        roleName: `tap-remediation-role-${environmentSuffix}`,
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
      `TapRemediationFunction-${environmentSuffix}`,
      {
        functionName: `tap-security-remediation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        role: remediationRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          ENVIRONMENT: environmentSuffix,
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
`),
      }
    );

    return func;
  }

  private createMonitoring(
    environmentSuffix: string,
    remediationFunction: lambda.Function,
    kmsKey: kms.Key
  ): void {
    // Create EventBridge rule for Config compliance changes
    const configRule = new events.Rule(
      this,
      `TapConfigComplianceRule-${environmentSuffix}`,
      {
        eventPattern: {
          source: ['aws.config'],
          detailType: ['Config Rules Compliance Change'],
        },
      }
    );

    configRule.addTarget(new targets.LambdaFunction(remediationFunction));

    // Create EventBridge rule for unauthorized API calls
    const unauthorizedApiRule = new events.Rule(
      this,
      `TapUnauthorizedApiRule-${environmentSuffix}`,
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
      `TapSecurityAlertsLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/events/security-alerts/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    unauthorizedApiRule.addTarget(
      new targets.CloudWatchLogGroup(alertLogGroup)
    );
  }
}
