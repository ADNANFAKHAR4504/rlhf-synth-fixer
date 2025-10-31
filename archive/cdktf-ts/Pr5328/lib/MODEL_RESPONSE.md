```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import {
  AwsProvider,
  iam,
  kms,
  config as awsConfig,
  secretsmanager,
  cloudwatch,
  sns,
  s3,
  datasources,
} from '@cdktf/provider-aws';

interface SecureBaselineConfig {
  environment: string;
  projectName: string;
  alertEmail?: string;
  enableAutoRotation?: boolean;
  complianceLevel?: 'high' | 'medium' | 'low';
}

class SecureAwsBaselineStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: SecureBaselineConfig) {
    super(scope, id);

    // Provider configuration
    new AwsProvider(this, 'aws', {
      region: 'ap-southeast-1',
      defaultTags: [
        {
          tags: {
            Environment: config.environment,
            Project: config.projectName,
            ManagedBy: 'CDKTF',
            ComplianceLevel: config.complianceLevel || 'high',
            CreatedAt: new Date().toISOString(),
            Purpose: 'SOC2-Compliance',
          },
        },
      ],
    });

    // Get current AWS account and region
    const callerIdentity = new datasources.DataAwsCallerIdentity(
      this,
      'current',
      {}
    );
    const currentRegion = new datasources.DataAwsRegion(
      this,
      'current-region',
      {}
    );

    // ==================== S3 BUCKET FOR CONFIG ====================
    const configBucket = new s3.S3Bucket(this, 'config-bucket', {
      bucket: `${config.projectName}-${config.environment}-aws-config-${callerIdentity.accountId}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      },
      publicAccessBlock: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      lifecycleRule: [
        {
          enabled: true,
          id: 'expire-old-versions',
          noncurrentVersionExpiration: {
            days: 90,
          },
        },
      ],
      tags: {
        Name: `${config.projectName}-${config.environment}-config-bucket`,
        Purpose: 'AWS-Config-Storage',
      },
    });

    // Bucket policy for AWS Config
    new s3.S3BucketPolicy(this, 'config-bucket-policy', {
      bucket: configBucket.bucket,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSConfigBucketPermissionsCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: configBucket.arn,
          },
          {
            Sid: 'AWSConfigBucketExistenceCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 's3:ListBucket',
            Resource: configBucket.arn,
          },
          {
            Sid: 'AWSConfigBucketWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${configBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    // ==================== KMS KEYS ====================
    // Master KMS key for general encryption
    const masterKmsKey = new kms.KmsKey(this, 'master-kms-key', {
      description: `Master KMS key for ${config.projectName}-${config.environment}`,
      enableKeyRotation: config.enableAutoRotation !== false,
      deletionWindowInDays: 30,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow services to use the key',
            Effect: 'Allow',
            Principal: {
              Service: [
                'logs.amazonaws.com',
                'cloudtrail.amazonaws.com',
                'secretsmanager.amazonaws.com',
              ],
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.projectName}-${config.environment}-master-key`,
        Purpose: 'General-Encryption',
      },
    });

    const masterKmsAlias = new kms.KmsAlias(this, 'master-kms-alias', {
      name: `alias/${config.projectName}-${config.environment}-master`,
      targetKeyId: masterKmsKey.id,
    });

    // Secrets Manager KMS key
    const secretsKmsKey = new kms.KmsKey(this, 'secrets-kms-key', {
      description: `Secrets Manager KMS key for ${config.projectName}-${config.environment}`,
      enableKeyRotation: config.enableAutoRotation !== false,
      deletionWindowInDays: 30,
      tags: {
        Name: `${config.projectName}-${config.environment}-secrets-key`,
        Purpose: 'Secrets-Encryption',
      },
    });

    const secretsKmsAlias = new kms.KmsAlias(this, 'secrets-kms-alias', {
      name: `alias/${config.projectName}-${config.environment}-secrets`,
      targetKeyId: secretsKmsKey.id,
    });

    // ==================== IAM ROLES WITH MFA ====================
    // Trust policy requiring MFA
    const mfaTrustPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
          },
          Action: 'sts:AssumeRole',
          Condition: {
            Bool: {
              'aws:MultiFactorAuthPresent': 'true',
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '3600',
            },
          },
        },
      ],
    };

    // Admin role with MFA enforcement
    const adminRole = new iam.IamRole(this, 'admin-role-mfa', {
      name: `${config.projectName}-${config.environment}-admin-role`,
      assumeRolePolicy: JSON.stringify(mfaTrustPolicy),
      maxSessionDuration: 3600,
      tags: {
        Name: `${config.projectName}-${config.environment}-admin-role`,
        RequiresMFA: 'true',
      },
    });

    // Attach admin policy
    new iam.IamRolePolicyAttachment(this, 'admin-role-policy', {
      role: adminRole.name!,
      policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
    });

    // Developer role with MFA enforcement
    const developerRole = new iam.IamRole(this, 'developer-role-mfa', {
      name: `${config.projectName}-${config.environment}-developer-role`,
      assumeRolePolicy: JSON.stringify(mfaTrustPolicy),
      maxSessionDuration: 3600,
      tags: {
        Name: `${config.projectName}-${config.environment}-developer-role`,
        RequiresMFA: 'true',
      },
    });

    // Developer policy
    const developerPolicy = new iam.IamPolicy(this, 'developer-policy', {
      name: `${config.projectName}-${config.environment}-developer-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              's3:*',
              'lambda:*',
              'dynamodb:*',
              'rds:Describe*',
              'cloudwatch:*',
              'logs:*',
              'kms:Decrypt',
              'kms:GenerateDataKey',
            ],
            Resource: '*',
          },
          {
            Effect: 'Deny',
            Action: ['iam:*', 'organizations:*', 'account:*'],
            Resource: '*',
          },
        ],
      }),
    });

    new iam.IamRolePolicyAttachment(this, 'developer-role-policy-attachment', {
      role: developerRole.name!,
      policyArn: developerPolicy.arn,
    });

    // ==================== AWS CONFIG ====================
    // Config service role
    const configServiceRole = new iam.IamRole(this, 'config-service-role', {
      name: `${config.projectName}-${config.environment}-config-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    // Config service policy
    const configServicePolicy = new iam.IamPolicy(
      this,
      'config-service-policy',
      {
        name: `${config.projectName}-${config.environment}-config-policy`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetBucketAcl',
                's3:ListBucket',
                's3:PutObject',
                's3:GetObject',
              ],
              Resource: [configBucket.arn, `${configBucket.arn}/*`],
            },
            {
              Effect: 'Allow',
              Action: [
                'config:Put*',
                'config:Get*',
                'config:List*',
                'config:Describe*',
              ],
              Resource: '*',
            },
          ],
        }),
      }
    );

    new iam.IamRolePolicyAttachment(this, 'config-role-policy-attachment', {
      role: configServiceRole.name!,
      policyArn: configServicePolicy.arn,
    });

    new iam.IamRolePolicyAttachment(this, 'config-role-service-policy', {
      role: configServiceRole.name!,
      policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole',
    });

    // Config Recorder
    const configRecorder = new awsConfig.ConfigConfigurationRecorder(
      this,
      'config-recorder',
      {
        name: `${config.projectName}-${config.environment}-recorder`,
        roleArn: configServiceRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Config Delivery Channel
    const deliveryChannel = new awsConfig.ConfigDeliveryChannel(
      this,
      'config-delivery-channel',
      {
        name: `${config.projectName}-${config.environment}-delivery`,
        s3BucketName: configBucket.bucket,
        snapshotDeliveryProperties: {
          deliveryFrequency: 'TwentyFour_Hours',
        },
      }
    );

    // Start Config Recorder
    const configRecorderStatus =
      new awsConfig.ConfigConfigurationRecorderStatus(
        this,
        'config-recorder-status',
        {
          name: configRecorder.name,
          isEnabled: true,
          dependsOn: [deliveryChannel],
        }
      );

    // ==================== CONFIG RULES ====================
    // Rule 1: Check S3 bucket encryption
    const s3EncryptionRule = new awsConfig.ConfigConfigRule(
      this,
      's3-encryption-rule',
      {
        name: `${config.projectName}-${config.environment}-s3-encryption`,
        description: 'Checks that S3 buckets have encryption enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
        dependsOn: [configRecorderStatus],
      }
    );

    // Rule 2: Check EBS encryption
    const ebsEncryptionRule = new awsConfig.ConfigConfigRule(
      this,
      'ebs-encryption-rule',
      {
        name: `${config.projectName}-${config.environment}-ebs-encryption`,
        description: 'Checks that EBS volumes are encrypted',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
        dependsOn: [configRecorderStatus],
      }
    );

    // Rule 3: Check RDS encryption
    const rdsEncryptionRule = new awsConfig.ConfigConfigRule(
      this,
      'rds-encryption-rule',
      {
        name: `${config.projectName}-${config.environment}-rds-encryption`,
        description: 'Checks that RDS instances have encryption enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
        },
        dependsOn: [configRecorderStatus],
      }
    );

    // Rule 4: Check IAM password policy
    const iamPasswordPolicyRule = new awsConfig.ConfigConfigRule(
      this,
      'iam-password-policy-rule',
      {
        name: `${config.projectName}-${config.environment}-iam-password-policy`,
        description: 'Checks that IAM password policy is compliant',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
        inputParameters: JSON.stringify({
          RequireUppercaseCharacters: true,
          RequireLowercaseCharacters: true,
          RequireSymbols: true,
          RequireNumbers: true,
          MinimumPasswordLength: 14,
          PasswordReusePrevention: 24,
          MaxPasswordAge: 90,
        }),
        dependsOn: [configRecorderStatus],
      }
    );

    // Rule 5: Check MFA for root account
    const rootMfaRule = new awsConfig.ConfigConfigRule(this, 'root-mfa-rule', {
      name: `${config.projectName}-${config.environment}-root-mfa`,
      description: 'Checks that MFA is enabled for root account',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'ROOT_ACCOUNT_MFA_ENABLED',
      },
      dependsOn: [configRecorderStatus],
    });

    // Rule 6: Check unused credentials
    const unusedCredentialsRule = new awsConfig.ConfigConfigRule(
      this,
      'unused-credentials-rule',
      {
        name: `${config.projectName}-${config.environment}-unused-credentials`,
        description: 'Checks for unused IAM credentials',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'IAM_USER_UNUSED_CREDENTIALS_CHECK',
        },
        inputParameters: JSON.stringify({
          maxCredentialUsageAge: 90,
        }),
        dependsOn: [configRecorderStatus],
      }
    );

    // ==================== SECRETS MANAGER ====================
    // Database credentials secret with auto-rotation
    const dbSecret = new secretsmanager.SecretsmanagerSecret(
      this,
      'db-credentials',
      {
        name: `${config.projectName}-${config.environment}-db-credentials`,
        description: 'Database credentials with automatic rotation',
        kmsKeyId: secretsKmsKey.id,
        rotationRules:
          config.enableAutoRotation !== false
            ? {
                automaticallyAfterDays: 30,
              }
            : undefined,
        tags: {
          Name: `${config.projectName}-${config.environment}-db-secret`,
          Purpose: 'Database-Credentials',
        },
      }
    );

    // Initial secret value
    new secretsmanager.SecretsmanagerSecretVersion(
      this,
      'db-credentials-version',
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: Fn.base64encode(Fn.uuid()),
          engine: 'postgres',
          host: 'placeholder.rds.amazonaws.com',
          port: 5432,
          dbname: 'maindb',
        }),
      }
    );

    // API Key secret
    const apiKeySecret = new secretsmanager.SecretsmanagerSecret(
      this,
      'api-key-secret',
      {
        name: `${config.projectName}-${config.environment}-api-keys`,
        description: 'API keys for external services',
        kmsKeyId: secretsKmsKey.id,
        rotationRules:
          config.enableAutoRotation !== false
            ? {
                automaticallyAfterDays: 60,
              }
            : undefined,
        tags: {
          Name: `${config.projectName}-${config.environment}-api-keys`,
          Purpose: 'API-Keys',
        },
      }
    );

    // ==================== SNS TOPIC FOR ALERTS ====================
    const alertTopic = new sns.SnsTopic(this, 'security-alert-topic', {
      name: `${config.projectName}-${config.environment}-security-alerts`,
      displayName: 'Security Alert Notifications',
      kmsMasterKeyId: masterKmsKey.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-alerts`,
        Purpose: 'Security-Alerts',
      },
    });

    // Email subscription if provided
    if (config.alertEmail) {
      new sns.SnsTopicSubscription(this, 'alert-email-subscription', {
        topicArn: alertTopic.arn,
        protocol: 'email',
        endpoint: config.alertEmail,
      });
    }

    // ==================== CLOUDWATCH ALARMS ====================
    // Alarm 1: Root account usage
    const rootAccountAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'root-account-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-root-account-usage`,
        alarmDescription: 'Alert on root account usage',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'RootAccountUsage',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-root-usage-alarm`,
        },
      }
    );

    // Alarm 2: Unauthorized API calls
    const unauthorizedApiAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'unauthorized-api-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-unauthorized-api-calls`,
        alarmDescription: 'Alert on unauthorized API calls',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnauthorizedAPICalls',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-unauthorized-api-alarm`,
        },
      }
    );

    // Alarm 3: Failed console logins
    const failedConsoleLoginAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'failed-login-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-failed-console-logins`,
        alarmDescription: 'Alert on multiple failed console login attempts',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FailedConsoleLogins',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-failed-login-alarm`,
        },
      }
    );

    // Alarm 4: IAM policy changes
    const iamPolicyChangeAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'iam-policy-change-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-iam-policy-changes`,
        alarmDescription: 'Alert on IAM policy changes',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'IAMPolicyChanges',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-iam-change-alarm`,
        },
      }
    );

    // Alarm 5: Security group changes
    const securityGroupChangeAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'sg-change-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-security-group-changes`,
        alarmDescription: 'Alert on security group changes',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'SecurityGroupChanges',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-sg-change-alarm`,
        },
      }
    );

    // Alarm 6: KMS key deletion
    const kmsKeyDeletionAlarm = new cloudwatch.CloudwatchMetricAlarm(
      this,
      'kms-deletion-alarm',
      {
        alarmName: `${config.projectName}-${config.environment}-kms-key-deletion`,
        alarmDescription: 'Alert on KMS key deletion attempts',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'KMSKeyDeletion',
        namespace: 'CloudTrailMetrics',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        treatMissingData: 'notBreaching',
        alarmActions: [alertTopic.arn],
        tags: {
          Name: `${config.projectName}-${config.environment}-kms-deletion-alarm`,
        },
      }
    );

    // ==================== OUTPUTS ====================
    new TerraformOutput(this, 'master-kms-key-arn', {
      value: masterKmsKey.arn,
      description: 'ARN of the master KMS key for general encryption',
    });

    new TerraformOutput(this, 'secrets-kms-key-arn', {
      value: secretsKmsKey.arn,
      description: 'ARN of the KMS key for Secrets Manager',
    });

    new TerraformOutput(this, 'admin-role-arn', {
      value: adminRole.arn,
      description: 'ARN of the admin role with MFA enforcement',
    });

    new TerraformOutput(this, 'developer-role-arn', {
      value: developerRole.arn,
      description: 'ARN of the developer role with MFA enforcement',
    });

    new TerraformOutput(this, 'config-rule-s3-encryption', {
      value: s3EncryptionRule.name,
      description: 'Config rule name for S3 bucket encryption',
    });

    new TerraformOutput(this, 'config-rule-ebs-encryption', {
      value: ebsEncryptionRule.name,
      description: 'Config rule name for EBS volume encryption',
    });

    new TerraformOutput(this, 'config-rule-rds-encryption', {
      value: rdsEncryptionRule.name,
      description: 'Config rule name for RDS encryption',
    });

    new TerraformOutput(this, 'config-rule-iam-password-policy', {
      value: iamPasswordPolicyRule.name,
      description: 'Config rule name for IAM password policy',
    });

    new TerraformOutput(this, 'config-rule-root-mfa', {
      value: rootMfaRule.name,
      description: 'Config rule name for root account MFA',
    });

    new TerraformOutput(this, 'config-rule-unused-credentials', {
      value: unusedCredentialsRule.name,
      description: 'Config rule name for unused credentials check',
    });

    new TerraformOutput(this, 'security-alert-topic-arn', {
      value: alertTopic.arn,
      description: 'ARN of the SNS topic for security alerts',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: dbSecret.arn,
      description: 'ARN of the database credentials secret',
    });

    new TerraformOutput(this, 'api-key-secret-arn', {
      value: apiKeySecret.arn,
      description: 'ARN of the API keys secret',
    });

    new TerraformOutput(this, 'config-bucket-name', {
      value: configBucket.bucket,
      description: 'Name of the S3 bucket for AWS Config',
    });

    new TerraformOutput(this, 'environment', {
      value: config.environment,
      description: 'Current deployment environment',
    });
  }
}

// Main application
const app = new App();

// Get configuration from environment variables or use defaults
const config: SecureBaselineConfig = {
  environment: process.env.ENVIRONMENT || 'production',
  projectName: process.env.PROJECT_NAME || 'secure-baseline',
  alertEmail: process.env.ALERT_EMAIL,
  enableAutoRotation: process.env.ENABLE_AUTO_ROTATION !== 'false',
  complianceLevel:
    (process.env.COMPLIANCE_LEVEL as 'high' | 'medium' | 'low') || 'high',
};

// Create the stack
new SecureAwsBaselineStack(
  app,
  `${config.projectName}-${config.environment}`,
  config
);

app.synth();
```
