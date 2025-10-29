import { Construct } from 'constructs';
// --- FIX: Remove DataAwsCallerIdentity and DataAwsPartition from 'cdktf' import ---
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
// --- FIX: Add correct imports for data sources ---
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsPartition } from '@cdktf/provider-aws/lib/data-aws-partition';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
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
// --- FIX: Add Config Recorder and Delivery Channel imports ---
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const region = 'us-east-1';

    new AwsProvider(this, 'aws', {
      region: region,
    });

    const callerId = new DataAwsCallerIdentity(this, 'caller-id', {});
    const partition = new DataAwsPartition(this, 'partition', {});

    // --- 1. KMS Key for Encryption ---
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `SOC 2 Baseline Key - ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: { Environment: environmentSuffix },
    });

    // --- 2. IAM Role with MFA ---
    const mfaAdminRole = new IamRole(this, 'mfa-admin-role', {
      name: `MfaAdminRole-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'mfa-admin-assume-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'AWS',
                  // Allows any user in the account to assume this role
                  identifiers: [
                    `arn:${partition.partition}:iam::${callerId.accountId}:root`,
                  ],
                },
              ],
              // This condition enforces MFA
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
      ).json,
      tags: { Environment: environmentSuffix },
    });

    // --- 3. Secrets Manager ---
    const secret = new SecretsmanagerSecret(this, 'secret', {
      name: `soc-baseline-secret-${environmentSuffix}`,
      description: 'SOC 2 Baseline Secret',
      kmsKeyId: kmsKey.id,
      tags: { Environment: environmentSuffix },
    });

    new SecretsmanagerSecretVersion(this, 'secret-version', {
      secretId: secret.id,
      secretString: '{"username":"admin","password":"InitialPassword123!"}',
    });

    // --- 4. CloudTrail and S3 Bucket for Logs ---
    const trailBucket = new S3Bucket(this, 'trail-bucket', {
      bucket: `soc-baseline-trail-logs-${callerId.accountId}-${environmentSuffix}`,
      forceDestroy: true,
      tags: { Environment: environmentSuffix },
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
            resources: [`${trailBucket.arn}/AWSLogs/${callerId.accountId}/*`],
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

    const trailBucketPolicy = new S3BucketPolicy(this, 'trail-bucket-policy', {
      bucket: trailBucket.id,
      policy: trailBucketPolicyDoc.json,
    });

    const logGroup = new CloudwatchLogGroup(this, 'cloudtrail-log-group', {
      name: `/aws/cloudtrail/SOC-Baseline-Trail-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: kmsKey.id,
    });

    // --- FIX: Create explicit IAM Role for CloudTrail logging ---
    const cloudtrailLogsRole = new IamRole(this, 'cloudtrail-logs-role', {
      name: `CloudTrail-CloudWatch-Logs-Role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'cloudtrail-assume-policy',
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
    // --- END FIX ---

    new Cloudtrail(this, 'cloudtrail', {
      name: `SOC-Baseline-Trail-${environmentSuffix}`,
      s3BucketName: trailBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      cloudWatchLogsGroupArn: `${logGroup.arn}:*`,
      // --- FIX: Pass the new role's ARN ---
      cloudWatchLogsRoleArn: cloudtrailLogsRole.arn,
      kmsKeyId: kmsKey.id,
      tags: { Environment: environmentSuffix },
      dependsOn: [trailBucketPolicy, cloudtrailLogsRole, logGroup],
    });

    // --- 5. AWS Config Rules ---

    const configRole = new IamRole(this, 'config-role', {
      name: `SOC-Baseline-Config-Role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'config-assume-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                { type: 'Service', identifiers: ['config.amazonaws.com'] },
              ],
            },
          ],
        }
      ).json,
    });

    new IamRolePolicyAttachment(this, 'config-role-attach', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    });

    const configRecorder = new ConfigConfigurationRecorder(
      this,
      'config-recorder',
      {
        name: `soc-baseline-recorder-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
        dependsOn: [configRole],
      }
    );

    new ConfigDeliveryChannel(this, 'config-channel', {
      name: `soc-baseline-channel-${environmentSuffix}`,
      s3BucketName: trailBucket.id,
      s3KmsKeyArn: kmsKey.arn,
      dependsOn: [trailBucket, configRecorder],
    });
    // --- END FIX ---

    const ebsRule = new ConfigConfigRule(this, 'ebs-encryption-rule', {
      name: `ebs-encryption-by-default-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        // --- FIX: Correct rule name ---
        sourceIdentifier: 'EC2_EBS_ENCRYPTION_BY_DEFAULT',
      },
      tags: { Environment: environmentSuffix },
      // --- FIX: Add dependency on the recorder ---
      dependsOn: [configRecorder],
    });

    const s3Rule = new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-encryption-enabled-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      tags: { Environment: environmentSuffix },
      // --- FIX: Add dependency on the recorder ---
      dependsOn: [configRecorder],
    });

    // --- 6. CloudWatch Alarms for Unauthorized Activity ---
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

    // --- Outputs ---
    new TerraformOutput(this, 'KmsKeyArn', { value: kmsKey.arn });
    new TerraformOutput(this, 'IamRoleArn', { value: mfaAdminRole.arn });
    new TerraformOutput(this, 'SecretArn', { value: secret.arn });
    new TerraformOutput(this, 'EbsEncryptionRuleName', { value: ebsRule.name });
    new TerraformOutput(this, 'S3EncryptionRuleName', { value: s3Rule.name });
    new TerraformOutput(this, 'RootActivityAlarmName', {
      // --- FIX: Use .alarmName instead of .name ---
      value: rootActivityAlarm.alarmName,
    });
    new TerraformOutput(this, 'LoginFailureAlarmName', {
      // --- FIX: Use .alarmName instead of .name ---
      value: loginFailureAlarm.alarmName,
    });
  }
}
