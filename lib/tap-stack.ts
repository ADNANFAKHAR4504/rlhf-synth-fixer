import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsPartition } from '@cdktf/provider-aws/lib/data-aws-partition';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

/**
 * Props for the TapStack.
 * Requires an environmentSuffix for resource naming.
 */
export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const suffix = props.environmentSuffix;
    const region = 'us-east-1';
    const tags = {
      Project: 'SecureBaseline',
      Environment: suffix,
    };

    // --- 0. Provider and Account Info ---
    new AwsProvider(this, 'aws', {
      region: region,
    });

    const identity = new DataAwsCallerIdentity(this, 'identity', {});
    const partition = new DataAwsPartition(this, 'partition', {});

    // --- 1. KMS Key with Rotation ---
    // Creates a customer-managed key with automatic rotation enabled.
    const kmsKey = new KmsKey(this, 'compliance-key', {
      description: `KMS key for SOC 2 compliance - ${suffix}`,
      enableKeyRotation: true,
      tags: tags,
    });

    // --- 2. IAM Role with MFA Enforcement ---
    // This policy denies all actions unless MFA is present.
    const mfaPolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowViewAccountInfo',
          Effect: 'Allow',
          Action: [
            'iam:ListAccountAliases',
            'iam:ListUsers',
            'iam:GetAccountSummary',
          ],
          Resource: '*',
        },
        {
          Sid: 'AllowActionsWithMFA',
          Effect: 'Allow',
          Action: '*',
          Resource: '*',
          Condition: {
            Bool: { 'aws:MultiFactorAuthPresent': 'true' },
          },
        },
        {
          Sid: 'DenyActionsWithoutMFA',
          Effect: 'Deny',
          Action: '*',
          Resource: '*',
          Condition: {
            BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' },
          },
        },
      ],
    };

    const mfaPolicy = new IamPolicy(this, 'mfa-enforcement-policy', {
      name: `MfaEnforcementPolicy-${suffix}`,
      policy: JSON.stringify(mfaPolicyDocument),
      description: 'Enforces MFA for all actions',
      tags: tags,
    });

    // Assume role policy that allows a user to assume this role.
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: `arn:${partition.partition}:iam::${identity.accountId}:root`,
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    const mfaAdminRole = new IamRole(this, 'mfa-admin-role', {
      name: `MfaAdminRole-${suffix}`,
      assumeRolePolicy: JSON.stringify(assumeRolePolicy),
      tags: tags,
    });

    // Attach the MFA policy
    new IamRolePolicyAttachment(this, 'mfa-policy-attachment', {
      role: mfaAdminRole.name,
      policyArn: mfaPolicy.arn,
    });

    // Attach AdministratorAccess (as an example, this role is powerful)
    // The MFA policy will still override this, requiring MFA.
    new IamRolePolicyAttachment(this, 'admin-policy-attachment', {
      role: mfaAdminRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
    });

    // --- 3. Secrets Manager Secret ---
    // Create a secret and a version. Rotation requires a Lambda,
    // so we'll just create the secret itself.
    const secret = new SecretsmanagerSecret(this, 'baseline-secret', {
      name: `soc-baseline-secret-${suffix}`,
      description: 'SOC 2 baseline demo secret',
      kmsKeyId: kmsKey.id,
      tags: tags,
    });

    new SecretsmanagerSecretVersion(this, 'baseline-secret-version', {
      secretId: secret.id,
      secretString: JSON.stringify({
        username: 'admin',
        password: 'initial-password',
      }),
    });

    // --- 4. AWS Config Rules for Encryption ---
    const ebsRule = new ConfigConfigRule(this, 'ebs-encryption-rule', {
      name: `ebs-encryption-by-default-${suffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'EBS_ENCRYPTION_BY_DEFAULT',
      },
      description: 'Checks if EBS encryption is enabled by default.',
      tags: tags,
    });

    const s3Rule = new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-bucket-server-side-encryption-enabled-${suffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      description: 'Checks if S3 buckets have server-side encryption enabled.',
      tags: tags,
    });

    // --- 5. CloudWatch Alarms for Unauthorized Activity ---
    // First, create a Trail and S3 bucket for logs
    const trailBucket = new S3Bucket(this, 'trail-bucket', {
      bucket: `soc-baseline-trail-logs-${suffix}`,
      forceDestroy: true, // OK for demo, not for production
      tags: tags,
    });

    // S3 policy for CloudTrail to write
    const trailBucketPolicyJson = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AWSCloudTrailAclCheck',
          Effect: 'Allow',
          Principal: { Service: 'cloudtrail.amazonaws.com' },
          Action: 's3:GetBucketAcl',
          Resource: trailBucket.arn,
        },
        {
          Sid: 'AWSCloudTrailWrite',
          Effect: 'Allow',
          Principal: { Service: 'cloudtrail.amazonaws.com' },
          Action: 's3:PutObject',
          Resource: `${trailBucket.arn}/*`,
          Condition: {
            StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
          },
        },
      ],
    };

    // --- FIX: Save the S3BucketPolicy resource to a variable ---
    const trailBucketPolicyResource = new S3BucketPolicy(
      this,
      'trail-bucket-policy',
      {
        bucket: trailBucket.id,
        policy: JSON.stringify(trailBucketPolicyJson),
      }
    );

    const logGroup = new CloudwatchLogGroup(this, 'trail-log-group', {
      name: `/aws/cloudtrail/soc-baseline-logs-${suffix}`,
      retentionInDays: 7,
      tags: tags,
    });

    const trail = new Cloudtrail(this, 'cloudtrail', {
      name: `SOC-Baseline-Trail-${suffix}`,
      s3BucketName: trailBucket.id,
      cloudWatchLogsGroupArn: `${logGroup.arn}:*`,
      cloudWatchLogsRoleArn: mfaAdminRole.arn, // Re-using role for simplicity
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      tags: tags,
      // --- FIX: Depend on the S3BucketPolicy *resource*, not the JSON object ---
      dependsOn: [trailBucketPolicyResource, logGroup],
    });

    // Metric Filter for Root User Activity
    // --- FIX: Corrected class name ---
    const rootUserFilter = new CloudwatchLogMetricFilter(
      this,
      'root-user-filter',
      {
        name: `RootUserActivityFilter-${suffix}`,
        logGroupName: logGroup.name,
        metricTransformation: {
          name: 'RootUserActivity',
          namespace: 'Security/SOC2',
          value: '1',
        },
        // Filters for any activity by the root user
        pattern: '{ $.userIdentity.type = "Root" }',
        dependsOn: [trail],
      }
    );

    // Alarm for Root User Activity
    const rootAlarm = new CloudwatchMetricAlarm(this, 'root-user-alarm', {
      alarmName: `RootUserActivityAlarm-${suffix}`,
      alarmDescription: 'Fires when any AWS API call is made by the Root user.',
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 1,
      metricName: rootUserFilter.metricTransformation.name,
      namespace: rootUserFilter.metricTransformation.namespace,
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      alarmActions: [], // Add SNS topic ARN here
      okActions: [],
      tags: tags,
    });

    // Metric Filter for Console Login Failures
    // --- FIX: Corrected class name ---
    const loginFailureFilter = new CloudwatchLogMetricFilter(
      this,
      'login-failure-filter',
      {
        name: `ConsoleLoginFailureFilter-${suffix}`,
        logGroupName: logGroup.name,
        metricTransformation: {
          name: 'ConsoleLoginFailures',
          namespace: 'Security/SOC2',
          value: '1',
        },
        // Filters for console logins that fail
        pattern:
          '{ ($.eventName = "ConsoleLogin") && ($.errorMessage = "Failed authentication") }',
        dependsOn: [trail],
      }
    );

    // Alarm for Console Login Failures
    const loginFailureAlarm = new CloudwatchMetricAlarm(
      this,
      'login-failure-alarm',
      {
        alarmName: `ConsoleLoginFailureAlarm-${suffix}`,
        alarmDescription:
          'Fires when 3 or more console login failures occur in 5 minutes.',
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: loginFailureFilter.metricTransformation.name,
        namespace: loginFailureFilter.metricTransformation.namespace,
        period: 300,
        statistic: 'Sum',
        threshold: 3,
        alarmActions: [], // Add SNS topic ARN here
        okActions: [],
        tags: tags,
      }
    );

    // --- 6. Outputs ---
    new TerraformOutput(this, 'KmsKeyArn', {
      value: kmsKey.arn,
      description: 'ARN of the KMS key with rotation enabled',
    });

    new TerraformOutput(this, 'IamRoleArn', {
      value: mfaAdminRole.arn,
      description: 'ARN of the IAM role that enforces MFA',
    });

    new TerraformOutput(this, 'SecretArn', {
      value: secret.arn,
      description: 'ARN of the Secrets Manager secret',
    });

    new TerraformOutput(this, 'EbsEncryptionRuleName', {
      value: ebsRule.name,
      description: 'Name of the AWS Config rule for EBS encryption',
    });

    new TerraformOutput(this, 'S3EncryptionRuleName', {
      value: s3Rule.name,
      description: 'Name of the AWS Config rule for S3 encryption',
    });

    new TerraformOutput(this, 'RootActivityAlarmName', {
      value: rootAlarm.alarmName,
      description: 'Name of the CloudWatch alarm for Root user activity',
    });

    new TerraformOutput(this, 'LoginFailureAlarmName', {
      value: loginFailureAlarm.alarmName,
      description: 'Name of the CloudWatch alarm for console login failures',
    });
  }
}
