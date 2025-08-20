import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';

export class SecurityConfigStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;
    // Get region from AWS_REGION environment variable set by CICD or use us-west-2 as default
    const region = process.env.AWS_REGION || 'us-west-2';
    const stackSuffix = `${environmentSuffix}-${region}`;

    // S3 bucket for Config snapshots and history
    this.configBucket = new s3.Bucket(
      this,
      `ConfigBucket${environmentSuffix}`,
      {
        bucketName: `aws-config-security-${environmentSuffix}-${this.account}-${cdk.Aws.REGION}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kms.Key.fromKeyArn(
          this,
          'ConfigEncryptionKey',
          encryptionKeyArn
        ),
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            expiration: cdk.Duration.days(2555), // 7 years retention
            noncurrentVersionExpiration: cdk.Duration.days(365),
          },
        ],
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // SNS topic for compliance notifications
    this.complianceTopic = new sns.Topic(
      this,
      `ComplianceTopic${environmentSuffix}`,
      {
        topicName: `security-compliance-alerts-${environmentSuffix}`,
        displayName: 'Security Compliance Alerts',
        masterKey: kms.Key.fromKeyArn(
          this,
          'TopicEncryptionKey',
          encryptionKeyArn
        ),
      }
    );

    // Create IAM service role for AWS Config
    const configServiceRole = new iam.Role(
      this,
      `ConfigServiceRole${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWS_ConfigRole'
          ),
        ],
      }
    );

    // Grant Config service permissions to write to S3 bucket
    this.configBucket.grantWrite(configServiceRole);
    this.configBucket.grantRead(configServiceRole);

    // Add bucket policy for AWS Config service
    this.configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [this.configBucket.bucketArn],
      })
    );

    this.configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketExistenceCheck',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:GetBucketLocation'],
        resources: [this.configBucket.bucketArn],
      })
    );

    this.configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketDelivery',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:PutObject'],
        resources: [`${this.configBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Create Configuration Recorder (required for Config rules)
    const configurationRecorder = new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder${environmentSuffix}`,
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configServiceRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Create Delivery Channel (required for Config rules)
    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      `ConfigDeliveryChannel${environmentSuffix}`,
      {
        name: `config-delivery-channel-${environmentSuffix}`,
        s3BucketName: this.configBucket.bucketName,
      }
    );

    // Security Config Rules - Using simplified rules that work

    // Rule 1: S3 bucket public read prohibited
    const s3PublicReadRule = new config.ManagedRule(
      this,
      `S3BucketPublicReadProhibitedRule${environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
        description:
          'Checks that Amazon S3 buckets do not allow public read access',
        configRuleName: `s3-bucket-public-read-prohibited-${environmentSuffix}`,
      }
    );

    // Rule 2: S3 bucket public write prohibited
    const s3PublicWriteRule = new config.ManagedRule(
      this,
      `S3BucketPublicWriteProhibitedRule${environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
        description:
          'Checks that Amazon S3 buckets do not allow public write access',
        configRuleName: `s3-bucket-public-write-prohibited-${environmentSuffix}`,
      }
    );

    // Rule 3: S3 bucket server side encryption enabled
    const s3SslRule = new config.ManagedRule(
      this,
      `S3BucketSSLRequestsOnlyRule${environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SSL_REQUESTS_ONLY,
        description: 'Checks that Amazon S3 bucket policies require SSL',
        configRuleName: `s3-bucket-ssl-requests-only-${environmentSuffix}`,
      }
    );

    // Rule 4: IAM password policy check
    const iamPasswordRule = new config.ManagedRule(
      this,
      `IAMPasswordPolicyRule${environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
        description:
          'Checks whether the account password policy for IAM users meets specified requirements',
        configRuleName: `iam-password-policy-${environmentSuffix}`,
        inputParameters: {
          RequireUppercaseCharacters: true,
          RequireLowercaseCharacters: true,
          RequireSymbols: true,
          RequireNumbers: true,
          MinimumPasswordLength: 14,
          PasswordReusePrevention: 24,
          MaxPasswordAge: 90,
        },
      }
    );

    // Rule 5: EBS volume encryption check
    const ebsEncryptionRule = new config.ManagedRule(
      this,
      `EBSEncryptedRule${environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
        description:
          'Checks whether Amazon EBS encryption is enabled by default',
        configRuleName: `ebs-encryption-by-default-${environmentSuffix}`,
      }
    );

    // Rule 6: MFA enabled for IAM console access
    const mfaRule = new config.ManagedRule(
      this,
      `MFAEnabledRule${environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
        description:
          'Checks whether MFA is enabled for IAM users with console access',
        configRuleName: `mfa-enabled-for-iam-console-${environmentSuffix}`,
      }
    );

    // Rule 7: IAM user no policies check
    const iamUserPoliciesRule = new config.ManagedRule(
      this,
      `IAMUserNoPoliciesRule${environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.IAM_USER_NO_POLICIES_CHECK,
        description:
          'Checks that none of your IAM users have policies attached directly',
        configRuleName: `iam-user-no-policies-${environmentSuffix}`,
      }
    );

    // Rule 8: IAM policy no statements with admin access
    const iamAdminAccessRule = new config.ManagedRule(
      this,
      `IAMPolicyNoAdminAccessRule${environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers
            .IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS,
        description:
          'Checks that AWS Identity and Access Management (IAM) policies do not allow admin access',
        configRuleName: `iam-policy-no-admin-access-${environmentSuffix}`,
      }
    );

    // Ensure Config rules depend on the recorder and delivery channel
    const configRules = [
      s3PublicReadRule,
      s3PublicWriteRule,
      s3SslRule,
      iamPasswordRule,
      ebsEncryptionRule,
      mfaRule,
      iamUserPoliciesRule,
      iamAdminAccessRule,
    ];

    configRules.forEach(rule => {
      rule.node.addDependency(configurationRecorder);
      rule.node.addDependency(deliveryChannel);
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `ConfigBucketName${stackSuffix}`, {
      value: this.configBucket.bucketName,
      description: 'Config S3 Bucket Name',
      exportName: `SecurityStack-ConfigBucket-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `ComplianceTopicArn${stackSuffix}`, {
      value: this.complianceTopic.topicArn,
      description: 'Compliance SNS Topic ARN',
      exportName: `SecurityStack-ComplianceTopic-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `ConfigRecorderName${stackSuffix}`, {
      value: configurationRecorder.name,
      description: 'Configuration Recorder Name',
      exportName: `SecurityStack-ConfigRecorder-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `ConfigDeliveryChannelName${stackSuffix}`, {
      value: deliveryChannel.name,
      description: 'Config Delivery Channel Name',
      exportName: `SecurityStack-DeliveryChannel-${stackSuffix}`,
    });
  }
}
