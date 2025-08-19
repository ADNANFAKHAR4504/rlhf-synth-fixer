import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SecurityConfig } from '../../config/security-config';

/**
 * AWS Config Construct for compliance monitoring
 * Monitors compliance with security policies and best practices
 */
export class ConfigConstruct extends Construct {
  public readonly configBucket: s3.Bucket;
  public readonly configRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    encryptionKey: kms.Key,
    enableDeliveryChannel: boolean = false,
    enableConfigRecorder: boolean = false
  ) {
    super(scope, id);

    // S3 bucket for AWS Config logs
    this.configBucket = new s3.Bucket(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Config-Bucket`,
      {
        bucketName: `${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cfg-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}-${Date.now()}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [
          {
            id: 'DeleteOldConfigLogs',
            expiration: cdk.Duration.days(SecurityConfig.LOG_RETENTION_DAYS),
          },
        ],
      }
    );

    // IAM role for AWS Config service
    this.configRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Config-Role`,
      {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        description: 'IAM role for AWS Config service',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWS_ConfigRole'
          ),
        ],
        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-Config-Policy`]:
            new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:GetBucketAcl',
                    's3:ListBucket',
                    's3:PutObject',
                    's3:PutObjectAcl',
                  ],
                  resources: [
                    this.configBucket.bucketArn,
                    `${this.configBucket.bucketArn}/*`,
                  ],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'kms:GenerateDataKey',
                    'kms:Decrypt',
                    'kms:DescribeKey',
                  ],
                  resources: [encryptionKey.keyArn],
                }),
              ],
            }),
        },
      }
    );

    // Optional Configuration Recorder - only create if enabled
    let configRecorder: config.CfnConfigurationRecorder | undefined;
    if (enableConfigRecorder) {
      configRecorder = new config.CfnConfigurationRecorder(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-ConfigRecorder`,
        {
          name: 'default',
          roleArn: this.configRole.roleArn,
          recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: true,
          },
        }
      );

      // Optional Delivery Channel - only create if enabled
      if (enableDeliveryChannel) {
        const deliveryChannel = new config.CfnDeliveryChannel(
          this,
          `${SecurityConfig.RESOURCE_PREFIX}-DeliveryChannel`,
          {
            name: 'default',
            s3BucketName: this.configBucket.bucketName,
            s3KeyPrefix: 'config-logs',
            configSnapshotDeliveryProperties: {
              deliveryFrequency: 'TwentyFour_Hours',
            },
          }
        );

        // Ensure configuration recorder depends on delivery channel when enabled
        configRecorder.addDependency(deliveryChannel);
      }

      // Security-related Config rules - create after recorder
      const s3BucketPublicReadProhibited = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-S3BucketPublicReadProhibited`,
        {
          identifier:
            config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
          description: 'Ensures S3 buckets do not allow public read access',
        }
      );

      const s3BucketPublicWriteProhibited = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-S3BucketPublicWriteProhibited`,
        {
          identifier:
            config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
          description: 'Ensures S3 buckets do not allow public write access',
        }
      );

      const rdsStorageEncrypted = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-RDSStorageEncrypted`,
        {
          identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
          description: 'Ensures RDS instances are encrypted at rest',
        }
      );

      const iamPasswordPolicy = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-IAMPasswordPolicy`,
        {
          identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
          description:
            'Ensures IAM password policy meets security requirements',
        }
      );

      const rootAccountMFAEnabled = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-RootAccountMFAEnabled`,
        {
          identifier: config.ManagedRuleIdentifiers.ROOT_ACCOUNT_MFA_ENABLED,
          description: 'Ensures root account has MFA enabled',
        }
      );

      const cloudTrailEnabled = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-CloudTrailEnabled`,
        {
          identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
          description: 'Ensures CloudTrail is enabled for security auditing',
        }
      );

      const vpcDefaultSecurityGroupClosed = new config.ManagedRule(
        this,
        `${SecurityConfig.RESOURCE_PREFIX}-VPCDefaultSecurityGroupClosed`,
        {
          identifier:
            config.ManagedRuleIdentifiers.VPC_DEFAULT_SECURITY_GROUP_CLOSED,
          description: 'Ensures default VPC security group blocks all traffic',
        }
      );

      // Set up dependencies - rules depend on recorder
      s3BucketPublicReadProhibited.node.addDependency(configRecorder);
      s3BucketPublicWriteProhibited.node.addDependency(configRecorder);
      rdsStorageEncrypted.node.addDependency(configRecorder);
      iamPasswordPolicy.node.addDependency(configRecorder);
      rootAccountMFAEnabled.node.addDependency(configRecorder);
      cloudTrailEnabled.node.addDependency(configRecorder);
      vpcDefaultSecurityGroupClosed.node.addDependency(configRecorder);
    }
  }
}
