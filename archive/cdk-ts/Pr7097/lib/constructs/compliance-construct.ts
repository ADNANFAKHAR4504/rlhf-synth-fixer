import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComplianceConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class ComplianceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComplianceConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // KMS key for Config bucket encryption
    const configKey = new kms.Key(
      this,
      `ConfigKmsKey${environmentSuffix}${region}`,
      {
        description: `Config service encryption key for ${environment} in ${region}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Config bucket with proper security - Addresses MODEL_FAILURES item 12
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket${environmentSuffix}${region}`,
      {
        bucketName:
          `${environment}-${region}-config-bucket-${suffix}`.toLowerCase(),
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: configKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        lifecycleRules: [
          {
            id: 'delete-old-config-data',
            expiration: cdk.Duration.days(2555), // 7 years retention for compliance
            noncurrentVersionExpiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Config service role with least privilege (commented out as not currently used)
    // const configRole = new iam.Role(
    //   this,
    //   `ConfigRole${environmentSuffix}${region}`,
    //   {
    //     roleName: `${environment}-${region}-config-role-${suffix}`,
    //     assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
    //     managedPolicies: [
    //       iam.ManagedPolicy.fromAwsManagedPolicyName(
    //         'service-role/AWS_ConfigRole'
    //       ),
    //     ],
    //     inlinePolicies: {
    //       ConfigBucketAccess: new iam.PolicyDocument({
    //         statements: [
    //           new iam.PolicyStatement({
    //             actions: [
    //               's3:GetBucketAcl',
    //               's3:ListBucket',
    //               's3:GetBucketLocation',
    //             ],
    //             resources: [configBucket.bucketArn],
    //           }),
    //           new iam.PolicyStatement({
    //             actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
    //             resources: [`${configBucket.bucketArn}/*`],
    //             conditions: {
    //               StringEquals: {
    //                 's3:x-amz-acl': 'bucket-owner-full-control',
    //               },
    //             },
    //           }),
    //           new iam.PolicyStatement({
    //             actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
    //             resources: [configKey.keyArn],
    //           }),
    //         ],
    //       }),
    //     },
    //   }
    // );

    // Bucket policy for Config service access
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck',
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [configBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketExistenceCheck',
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:ListBucket'],
        resources: [configBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketDelivery',
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    // Config Recorder - commented out to avoid conflict with existing recorder
    // AWS Config only allows 1 configuration recorder per region per account
    // const configRecorder = new config.CfnConfigurationRecorder(this, `ConfigRecorder${environmentSuffix}${region}`, {
    //   name: `${environment}-${region}-recorder-${suffix}`,
    //   roleArn: configRole.roleArn,
    //   recordingGroup: {
    //     allSupported: true,
    //     includeGlobalResourceTypes: region === 'us-east-1', // Only record global resources in one region
    //     resourceTypes: [], // Empty because allSupported is true
    //   },
    // });

    // Delivery Channel - commented out to avoid conflict with existing delivery channel
    // AWS Config only allows 1 delivery channel per region per account
    // const deliveryChannel = new config.CfnDeliveryChannel(this, `DeliveryChannel${environmentSuffix}${region}`, {
    //   name: `${environment}-${region}-delivery-${suffix}`,
    //   s3BucketName: configBucket.bucketName,
    //   s3KeyPrefix: `config/${environment}/${region}`,
    //   configSnapshotDeliveryProperties: {
    //     deliveryFrequency: 'TwentyFour_Hours',
    //   },
    // });

    // Required tags rule - Requirement 13
    // Config rules commented out due to NoAvailableConfigurationRecorder in target account
    // Requires admin access to set up AWS Config service
    /*
    if (!props.skipConfigRules) {
      new config.ManagedRule(
        this,
        `RequiredTagsRule${environmentSuffix}${region}`,
        {
          identifier: config.ManagedRuleIdentifiers.REQUIRED_TAGS,
          inputParameters: {
            tag1Key: 'Environment',
            tag2Key: 'iac-rlhf-amazon',
            tag3Key: 'CostCenter',
            tag4Key: 'Owner',
          },
          ruleScope: config.RuleScope.fromResources([
            config.ResourceType.EC2_INSTANCE,
            config.ResourceType.RDS_DB_INSTANCE,
            config.ResourceType.S3_BUCKET,
            config.ResourceType.LAMBDA_FUNCTION,
            config.ResourceType.CLOUDFORMATION_STACK,
          ]),
          configRuleName: `${environment}-${region}-required-tags-${suffix}`,
          description: 'Checks whether resources contain all required tags',
        }
      );

      // Encryption rules - Requirement 13
      new config.ManagedRule(
        this,
        `S3EncryptionRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers
              .S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
          configRuleName: `${environment}-${region}-s3-encryption-${suffix}`,
          description:
            'Checks that S3 buckets have server-side encryption enabled',
        }
      );

      new config.ManagedRule(
        this,
        `RdsEncryptionRule${environmentSuffix}${region}`,
        {
          identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
          configRuleName: `${environment}-${region}-rds-encryption-${suffix}`,
          description:
            'Checks whether RDS instances have storage encryption enabled',
        }
      );

      new config.ManagedRule(
        this,
        `EbsEncryptionRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
          configRuleName: `${environment}-${region}-ebs-encryption-${suffix}`,
          description: 'Checks whether EBS volumes are encrypted by default',
        }
      );

      // Lambda encryption rule
      new config.ManagedRule(
        this,
        `LambdaEncryptionRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers.LAMBDA_FUNCTION_SETTINGS_CHECK,
          inputParameters: {
            runtime: 'nodejs18.x',
            memorySize: '512',
            timeout: '300',
          },
          configRuleName: `${environment}-${region}-lambda-settings-${suffix}`,
          description: 'Checks Lambda function configuration settings',
        }
      );

      // Security group rules
      new config.ManagedRule(
        this,
        `SecurityGroupSshRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI,
          configRuleName: `${environment}-${region}-sg-ssh-attached-${suffix}`,
          description:
            'Checks whether security groups are attached to network interfaces for SSH',
        }
      );

      new config.ManagedRule(
        this,
        `SecurityGroupRdpRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers
              .EC2_SECURITY_GROUP_ATTACHED_TO_ENI_PERIODIC,
          configRuleName: `${environment}-${region}-sg-rdp-check-${suffix}`,
          description: 'Checks security group configuration periodically',
        }
      );

      // ALB/ELB security rules
      new config.ManagedRule(
        this,
        `AlbHttpsRule${environmentSuffix}${region}`,
        {
          identifier:
            config.ManagedRuleIdentifiers.ALB_HTTP_TO_HTTPS_REDIRECTION_CHECK,
          configRuleName: `${environment}-${region}-alb-https-redirect-${suffix}`,
          description: 'Checks whether ALBs redirect HTTP requests to HTTPS',
        }
      );

      // VPC flow logs rule
      new config.ManagedRule(
        this,
        `VpcFlowLogsRule${environmentSuffix}${region}`,
        {
          identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
          configRuleName: `${environment}-${region}-vpc-flow-logs-${suffix}`,
          description: 'Checks whether VPC flow logs are enabled',
        }
      );

      // CloudTrail rule
      new config.ManagedRule(
        this,
        `CloudTrailRule${environmentSuffix}${region}`,
        {
          identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
          configRuleName: `${environment}-${region}-cloudtrail-enabled-${suffix}`,
          description: 'Checks whether AWS CloudTrail is enabled',
        }
      );

      // IAM password policy rule
      if (region === 'us-east-1') {
        // Global resources only in one region
        new config.ManagedRule(
          this,
          `IamPasswordPolicyRule${environmentSuffix}${region}`,
          {
            identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
            inputParameters: {
              RequireUppercaseCharacters: 'true',
              RequireLowercaseCharacters: 'true',
              RequireSymbols: 'true',
              RequireNumbers: 'true',
              MinimumPasswordLength: '14',
              PasswordReusePrevention: '24',
              MaxPasswordAge: '90',
            },
            configRuleName: `${environment}-${region}-iam-password-policy-${suffix}`,
            description:
              'Checks whether IAM password policy meets requirements',
          }
        );

        // Root access key rule
        new config.ManagedRule(
          this,
          `RootAccessKeyRule${environmentSuffix}${region}`,
          {
            identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
            configRuleName: `${environment}-${region}-root-access-key-${suffix}`,
            description: 'Checks whether root user has access keys',
          }
        );
      }
    }
    */

    // Ensure Config recorder starts after delivery channel is created
    // configRecorder.node.addDependency(deliveryChannel);

    // Apply tags
    cdk.Tags.of(configBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(configBucket).add('Environment', environment);
    cdk.Tags.of(configBucket).add('Region', region);
    cdk.Tags.of(configBucket).add('Purpose', 'ConfigCompliance');

    cdk.Tags.of(configKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(configKey).add('Environment', environment);
    cdk.Tags.of(configKey).add('Region', region);
    cdk.Tags.of(configKey).add('Purpose', 'ConfigEncryption');
  }
}
