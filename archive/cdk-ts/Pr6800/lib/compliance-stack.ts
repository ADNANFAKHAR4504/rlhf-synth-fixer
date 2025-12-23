import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

interface ComplianceStackProps {
  environmentSuffix: string;
}

export class ComplianceStack extends Construct {
  constructor(scope: Construct, id: string, props: ComplianceStackProps) {
    super(scope, id);

    // Note: AWS Config Recorder and Delivery Channel are not created here
    // because AWS only allows 1 configuration recorder per region per account.
    // This stack assumes an existing Config recorder is already set up at the account level.
    // The Config Rules below will use the existing account-level recorder.

    // PCI-DSS Compliance Rules

    // 1. Encryption at rest for S3
    new config.ManagedRule(this, 'S3BucketEncryptionRule', {
      configRuleName: `s3-bucket-encryption-${props.environmentSuffix}`,
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that S3 buckets have encryption enabled',
    });

    // 2. S3 bucket logging enabled
    new config.ManagedRule(this, 'S3BucketLoggingRule', {
      configRuleName: `s3-bucket-logging-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_LOGGING_ENABLED,
      description: 'Checks that S3 buckets have access logging enabled',
    });

    // 3. S3 bucket versioning enabled
    new config.ManagedRule(this, 'S3BucketVersioningRule', {
      configRuleName: `s3-bucket-versioning-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
      description: 'Checks that S3 buckets have versioning enabled',
    });

    // 4. RDS encryption at rest
    new config.ManagedRule(this, 'RdsEncryptionRule', {
      configRuleName: `rds-storage-encrypted-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances have encryption enabled',
    });

    // 5. RDS backup enabled
    new config.ManagedRule(this, 'RdsBackupRule', {
      configRuleName: `db-backup-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.RDS_DB_INSTANCE_BACKUP_ENABLED,
      description: 'Checks that RDS instances have automated backups enabled',
    });

    // 6. VPC flow logs enabled
    new config.ManagedRule(this, 'VpcFlowLogsRule', {
      configRuleName: `vpc-flow-logs-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
      description: 'Checks that VPC has flow logs enabled',
    });

    // 7. CloudWatch log group encryption
    new config.ManagedRule(this, 'CloudWatchLogsEncryptionRule', {
      configRuleName: `cloudwatch-log-encryption-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.CLOUDWATCH_LOG_GROUP_ENCRYPTED,
      description: 'Checks that CloudWatch Log Groups are encrypted',
    });

    // 8. IAM password policy
    new config.ManagedRule(this, 'IamPasswordPolicyRule', {
      configRuleName: `iam-password-policy-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: 'Checks that IAM password policy meets requirements',
      inputParameters: {
        RequireUppercaseCharacters: 'true',
        RequireLowercaseCharacters: 'true',
        RequireSymbols: 'true',
        RequireNumbers: 'true',
        MinimumPasswordLength: '14',
        PasswordReusePrevention: '24',
        MaxPasswordAge: '90',
      },
    });

    // 9. Root account MFA enabled
    new config.ManagedRule(this, 'RootMfaEnabledRule', {
      configRuleName: `root-account-mfa-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.ROOT_ACCOUNT_MFA_ENABLED,
      description: 'Checks that root account has MFA enabled',
    });

    // 10. DynamoDB point-in-time recovery
    new config.ManagedRule(this, 'DynamoDbPitrRule', {
      configRuleName: `dynamodb-pitr-enabled-${props.environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.DYNAMODB_PITR_ENABLED,
      description:
        'Checks that DynamoDB tables have point-in-time recovery enabled',
    });
  }
}
