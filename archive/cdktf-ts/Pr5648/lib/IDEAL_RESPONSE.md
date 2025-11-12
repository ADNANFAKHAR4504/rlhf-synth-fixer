```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsPartition } from '@cdktf/provider-aws/lib/data-aws-partition';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsKeyPolicy } from '@cdktf/provider-aws/lib/kms-key-policy';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const region = 'ap-southeast-1';

    // Provider
    new AwsProvider(this, 'aws', {
      region,
    });

    // Helpers
    const caller = new DataAwsCallerIdentity(this, 'caller-id', {});
    const partition = new DataAwsPartition(this, 'partition', {});
    const accountId = caller.accountId;
    const logServicePrincipal = `logs.${region}.amazonaws.com`;

    // ---------------------------
    // 1) KMS key (primary) + explicit key policy
    // ---------------------------
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `SOC 2 Baseline Key - ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: { Environment: environmentSuffix },
    });

    const kmsPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'kms-key-policy-doc',
      {
        statement: [
          {
            sid: 'EnableIAMRootAccess',
            actions: ['kms:*'],
            principals: [
              {
                type: 'AWS',
                identifiers: [
                  `arn:${partition.partition}:iam::${accountId}:root`,
                ],
              },
            ],
            resources: ['*'],
          },
          {
            sid: 'AllowCloudTrail',
            actions: ['kms:GenerateDataKey*', 'kms:Decrypt', 'kms:Encrypt'],
            principals: [
              { type: 'Service', identifiers: ['cloudtrail.amazonaws.com'] },
            ],
            resources: ['*'],
          },
          {
            sid: 'AllowCloudWatchLogs',
            actions: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:Describe*',
              'kms:CreateGrant',
            ],
            principals: [
              { type: 'Service', identifiers: [logServicePrincipal] },
            ],
            resources: ['*'],
            condition: [
              {
                test: 'ArnLike',
                variable: 'kms:EncryptionContext:aws:logs:arn',
                values: [
                  `arn:${partition.partition}:logs:${region}:${accountId}:*`,
                ],
              },
            ],
          },
          {
            sid: 'AllowConfig',
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
            principals: [
              { type: 'Service', identifiers: ['config.amazonaws.com'] },
            ],
            resources: ['*'],
          },
        ],
      }
    );

    const kmsKeyPolicy = new KmsKeyPolicy(this, 'kms-key-policy', {
      keyId: kmsKey.id,
      policy: kmsPolicyDoc.json,
      dependsOn: [kmsKey],
    });

    const kmsKeyIdOrArn = kmsKey.arn;

    // ---------------------------
    // 2) IAM Role requiring MFA for admin actions
    // ---------------------------
    const mfaAdminAssume = new DataAwsIamPolicyDocument(
      this,
      'mfa-admin-assume',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'AWS',
                identifiers: [
                  `arn:${partition.partition}:iam::${accountId}:root`,
                ],
              },
            ],
            condition: [
              {
                test: 'Bool',
                variable: 'aws:MultiFactorAuthPresent',
                values: ['true'],
              },
            ],
          },
        ],
      }
    );

    const mfaAdminRole = new IamRole(this, 'mfa-admin-role', {
      name: `MfaAdminRole-${environmentSuffix}`,
      assumeRolePolicy: mfaAdminAssume.json,
      tags: { Environment: environmentSuffix },
    });

    // ---------------------------
    // 3) Secrets Manager
    // ---------------------------
    const secret = new SecretsmanagerSecret(this, 'secret', {
      name: `soc-baseline-secret-${environmentSuffix}`,
      description: 'SOC 2 Baseline Secret',
      kmsKeyId: kmsKeyIdOrArn,
      tags: { Environment: environmentSuffix },
      dependsOn: [kmsKeyPolicy],
    });

    new SecretsmanagerSecretVersion(this, 'secret-version', {
      secretId: secret.id,
      secretString: '{"username":"admin","password":"InitialPassword123!"}',
      dependsOn: [secret],
    });

    // ---------------------------
    // 4) CloudTrail + S3 bucket for logs + CloudWatch Log Group
    // ---------------------------
    const trailBucket = new S3Bucket(this, 'trail-bucket', {
      bucket: `soc-baseline-trail-logs-${accountId}-${environmentSuffix}`,
      forceDestroy: true,
      tags: { Environment: environmentSuffix },
      dependsOn: [kmsKeyPolicy],
    });

    new S3BucketPublicAccessBlock(this, 'trail-bucket-pab', {
      bucket: trailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const trailBucketPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'trail-bucket-policy-doc',
      {
        statement: [
          {
            sid: 'AWSCloudTrailAclCheck',
            actions: ['s3:GetBucketAcl'],
            resources: [trailBucket.arn],
            principals: [
              { type: 'Service', identifiers: ['cloudtrail.amazonaws.com'] },
            ],
          },
          {
            sid: 'AWSCloudTrailWrite',
            actions: ['s3:PutObject'],
            resources: [`${trailBucket.arn}/AWSLogs/${accountId}/*`],
            principals: [
              { type: 'Service', identifiers: ['cloudtrail.amazonaws.com'] },
            ],
            condition: [
              {
                test: 'StringEquals',
                variable: 's3:x-amz-acl',
                values: ['bucket-owner-full-control'],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'trail-bucket-policy', {
      bucket: trailBucket.id,
      policy: trailBucketPolicyDoc.json,
    });

    // CloudWatch Log Group for CloudTrail
    const logGroup = new CloudwatchLogGroup(this, 'cloudtrail-log-group', {
      name: `/aws/cloudtrail/SOC-Baseline-Trail-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: kmsKeyIdOrArn,
      dependsOn: [kmsKey, kmsKeyPolicy],
    });

    // IAM role & policy for CloudTrail to publish to CloudWatch Logs
    const cloudtrailLogsRole = new IamRole(this, 'cloudtrail-logs-role', {
      name: `CloudTrail-CloudWatch-Logs-Role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'cloudtrail-assume',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                { type: 'Service', identifiers: ['cloudtrail.amazonaws.com'] },
              ],
            },
          ],
        }
      ).json,
    });

    const cloudtrailLogsPolicy = new IamPolicy(this, 'cloudtrail-logs-policy', {
      name: `CloudTrail-CloudWatch-Logs-Policy-${environmentSuffix}`,
      policy: new DataAwsIamPolicyDocument(this, 'cloudtrail-logs-policy-doc', {
        statement: [
          {
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [`${logGroup.arn}:*`],
          },
        ],
      }).json,
    });

    new IamRolePolicyAttachment(this, 'cloudtrail-logs-attach', {
      role: cloudtrailLogsRole.name,
      policyArn: cloudtrailLogsPolicy.arn,
    });

    // --- FIX: CloudTrail needs ":*" suffix for cloudWatchLogsGroupArn ---
    new Cloudtrail(this, 'cloudtrail', {
      name: `SOC-Baseline-Trail-${environmentSuffix}`,
      s3BucketName: trailBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      cloudWatchLogsGroupArn: `${logGroup.arn}:*`, // <-- FIXED: Added :* suffix
      cloudWatchLogsRoleArn: cloudtrailLogsRole.arn,
      kmsKeyId: kmsKeyIdOrArn,
      tags: { Environment: environmentSuffix },
      dependsOn: [trailBucket, logGroup, kmsKeyPolicy, cloudtrailLogsRole],
    });

    // ---------------------------
    // 6) CloudWatch metric filters and alarms
    // ---------------------------
    const rootActivityFilter = new CloudwatchLogMetricFilter(
      this,
      'root-activity-filter',
      {
        name: `RootUserActivityFilter-${environmentSuffix}`,
        logGroupName: logGroup.name,
        pattern: '{ $.userIdentity.type = "Root" }',
        metricTransformation: {
          name: 'RootUserActivity',
          namespace: 'SOCBaseline/CloudTrail',
          value: '1',
        },
      }
    );

    const rootActivityAlarm = new CloudwatchMetricAlarm(
      this,
      'root-activity-alarm',
      {
        alarmName: `RootUserActivityAlarm-${environmentSuffix}`,
        alarmDescription: 'Alarm for Root user activity',
        metricName: rootActivityFilter.metricTransformation.name,
        namespace: rootActivityFilter.metricTransformation.namespace,
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        threshold: 1,
        treatMissingData: 'notBreaching',
        tags: { Environment: environmentSuffix },
      }
    );

    const loginFailureFilter = new CloudwatchLogMetricFilter(
      this,
      'login-failure-filter',
      {
        name: `ConsoleLoginFailureFilter-${environmentSuffix}`,
        logGroupName: logGroup.name,
        pattern:
          '{ ($.eventName = "ConsoleLogin") && ($.errorMessage = "Failed authentication") }',
        metricTransformation: {
          name: 'ConsoleLoginFailures',
          namespace: 'SOCBaseline/CloudTrail',
          value: '1',
        },
      }
    );

    const loginFailureAlarm = new CloudwatchMetricAlarm(
      this,
      'login-failure-alarm',
      {
        alarmName: `ConsoleLoginFailureAlarm-${environmentSuffix}`,
        alarmDescription: 'Alarm for 3+ console login failures in 5 minutes',
        metricName: loginFailureFilter.metricTransformation.name,
        namespace: loginFailureFilter.metricTransformation.namespace,
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        threshold: 3,
        treatMissingData: 'notBreaching',
        tags: { Environment: environmentSuffix },
      }
    );

    // ---------------------------
    // Outputs
    // ---------------------------
    new TerraformOutput(this, 'KmsKeyArn', { value: kmsKey.arn });
    new TerraformOutput(this, 'IamRoleArn', { value: mfaAdminRole.arn });
    new TerraformOutput(this, 'SecretArn', { value: secret.arn });
    new TerraformOutput(this, 'RootActivityAlarmName', {
      value: rootActivityAlarm.alarmName,
    });
    new TerraformOutput(this, 'LoginFailureAlarmName', {
      value: loginFailureAlarm.alarmName,
    });
  }
}
```