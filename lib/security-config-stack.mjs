import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';

export class SecurityConfigStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;

    // S3 bucket for Config snapshots and history
    this.configBucket = new s3.Bucket(this, `ConfigBucket${environmentSuffix}`, {
      bucketName: `aws-config-security-${environmentSuffix}-${this.account}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kms.Key.fromKeyArn(this, 'ConfigEncryptionKey', encryptionKeyArn),
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
    });

    // SNS topic for compliance notifications
    this.complianceTopic = new sns.Topic(this, `ComplianceTopic${environmentSuffix}`, {
      topicName: `security-compliance-alerts-${environmentSuffix}`,
      displayName: 'Security Compliance Alerts',
      masterKey: kms.Key.fromKeyArn(this, 'TopicEncryptionKey', encryptionKeyArn),
    });

    // Security Config Rules - Using simplified rules that work

    // Rule 1: S3 bucket public read prohibited
    new config.ManagedRule(this, `S3BucketPublicReadProhibitedRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: 'Checks that Amazon S3 buckets do not allow public read access',
      configRuleName: `s3-bucket-public-read-prohibited-${environmentSuffix}`,
    });

    // Rule 2: S3 bucket public write prohibited
    new config.ManagedRule(this, `S3BucketPublicWriteProhibitedRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      description: 'Checks that Amazon S3 buckets do not allow public write access',
      configRuleName: `s3-bucket-public-write-prohibited-${environmentSuffix}`,
    });

    // Rule 3: S3 bucket server side encryption enabled
    new config.ManagedRule(this, `S3BucketSSLRequestsOnlyRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SSL_REQUESTS_ONLY,
      description: 'Checks that Amazon S3 bucket policies require SSL',
      configRuleName: `s3-bucket-ssl-requests-only-${environmentSuffix}`,
    });

    // Rule 4: IAM password policy check
    new config.ManagedRule(this, `IAMPasswordPolicyRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Checks whether the account password policy for IAM users meets specified requirements',
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
    });

    // Rule 5: EBS volume encryption check
    new config.ManagedRule(this, `EBSEncryptedRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      description: 'Checks whether Amazon EBS encryption is enabled by default',
      configRuleName: `ebs-encryption-by-default-${environmentSuffix}`,
    });

    // Rule 6: MFA enabled for IAM console access
    new config.ManagedRule(this, `MFAEnabledRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      description: 'Checks whether MFA is enabled for IAM users with console access',
      configRuleName: `mfa-enabled-for-iam-console-${environmentSuffix}`,
    });

    // Rule 7: IAM user no policies check
    new config.ManagedRule(this, `IAMUserNoPoliciesRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.IAM_USER_NO_POLICIES_CHECK,
      description: 'Checks that none of your IAM users have policies attached directly',
      configRuleName: `iam-user-no-policies-${environmentSuffix}`,
    });

    // Rule 8: IAM policy no statements with admin access
    new config.ManagedRule(this, `IAMPolicyNoAdminAccessRule${environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS,
      description: 'Checks that AWS Identity and Access Management (IAM) policies do not allow admin access',
      configRuleName: `iam-policy-no-admin-access-${environmentSuffix}`,
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `ConfigBucketName${environmentSuffix}`, {
      value: this.configBucket.bucketName,
      description: 'Config S3 Bucket Name',
      exportName: `SecurityStack-ConfigBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ComplianceTopicArn${environmentSuffix}`, {
      value: this.complianceTopic.topicArn,
      description: 'Compliance SNS Topic ARN',
      exportName: `SecurityStack-ComplianceTopic-${environmentSuffix}`,
    });
  }
}