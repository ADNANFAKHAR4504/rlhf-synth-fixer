/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface MonitoringModuleProps {
  environmentSuffix: string;
  logsKmsKeyArn: string;
  configBucketName: string;
  alertEmail: string;
}

export class MonitoringModule extends Construct {
  public readonly auditLogGroup: CloudwatchLogGroup;
  public readonly complianceTopic: SnsTopic;

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const { environmentSuffix, logsKmsKeyArn, configBucketName, alertEmail } =
      props;

    // Create CloudWatch log group with encryption
    this.auditLogGroup = new CloudwatchLogGroup(this, 'audit-logs', {
      name: `/aws/payment-processing/audit-${environmentSuffix}`,
      retentionInDays: 365,
      kmsKeyId: logsKmsKeyArn,
      tags: {
        Name: `audit-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create SNS topic for compliance alerts
    this.complianceTopic = new SnsTopic(this, 'compliance-topic', {
      name: `compliance-alerts-${environmentSuffix}`,
      displayName: 'PCI-DSS Compliance Alerts',
      kmsMasterKeyId: logsKmsKeyArn,
      tags: {
        Name: `compliance-topic-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, 'compliance-email-subscription', {
      topicArn: this.complianceTopic.arn,
      protocol: 'email',
      endpoint: alertEmail,
    });

    // Create IAM role for Config
    const configRole = new IamRole(this, 'config-role', {
      name: `aws-config-role-${environmentSuffix}`,
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
      tags: {
        Name: `config-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Attach AWS managed policy for Config
    new IamRolePolicyAttachment(this, 'config-policy-attachment', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    });

    // Create Config recorder
    const configRecorder = new ConfigConfigurationRecorder(
      this,
      'config-recorder',
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Create Config delivery channel
    const deliveryChannel = new ConfigDeliveryChannel(this, 'config-delivery', {
      name: `config-delivery-${environmentSuffix}`,
      s3BucketName: configBucketName,
      snsTopicArn: this.complianceTopic.arn,
      dependsOn: [configRecorder],
    });

    // Config rule: S3 bucket encryption enabled
    new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-bucket-encryption-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: S3 bucket versioning enabled
    new ConfigConfigRule(this, 's3-versioning-rule', {
      name: `s3-bucket-versioning-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have versioning enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: IAM MFA enabled
    new ConfigConfigRule(this, 'iam-mfa-rule', {
      name: `iam-user-mfa-enabled-${environmentSuffix}`,
      description: 'Checks that MFA is enabled for all IAM users',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'IAM_USER_MFA_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: CloudWatch log encryption enabled
    new ConfigConfigRule(this, 'cloudwatch-log-encryption-rule', {
      name: `cloudwatch-log-group-encrypted-${environmentSuffix}`,
      description: 'Checks that CloudWatch log groups are encrypted',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: KMS key rotation enabled
    new ConfigConfigRule(this, 'kms-rotation-rule', {
      name: `cmk-backing-key-rotation-enabled-${environmentSuffix}`,
      description: 'Checks that KMS keys have rotation enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });
  }
}
