import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { ConfigConfigurationRecorderStatus } from '@cdktf/provider-aws/lib/config-configuration-recorder-status';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';

export interface ConfigStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class ConfigStack extends Construct {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for Config
    const configBucket = new S3Bucket(this, 'config-bucket', {
      bucket: `trading-config-${environmentSuffix}`,
      tags: {
        Name: `trading-config-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new S3BucketVersioningA(this, 'config-bucket-versioning', {
      bucket: configBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'config-bucket-public-access', {
      bucket: configBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create IAM role for Config
    const configRole = new IamRole(this, 'config-role', {
      name: `trading-config-role-${environmentSuffix}`,
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
        Name: `trading-config-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach AWS managed policy for Config
    new IamRolePolicyAttachment(this, 'config-policy-attachment', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    });

    // Create Configuration Recorder
    const recorder = new ConfigConfigurationRecorder(this, 'config-recorder', {
      name: `trading-config-recorder-${environmentSuffix}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create Delivery Channel
    const deliveryChannel = new ConfigDeliveryChannel(
      this,
      'delivery-channel',
      {
        name: `trading-config-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.id,
        dependsOn: [recorder],
      }
    );

    // Start the recorder
    new ConfigConfigurationRecorderStatus(this, 'recorder-status', {
      name: recorder.name,
      isEnabled: true,
      dependsOn: [deliveryChannel],
    });

    // PCI-DSS Config Rules

    // Rule: S3 bucket encryption enabled
    new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-bucket-server-side-encryption-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have server-side encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      dependsOn: [recorder],
    });

    // Rule: S3 bucket versioning enabled
    new ConfigConfigRule(this, 's3-versioning-rule', {
      name: `s3-bucket-versioning-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have versioning enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
      },
      dependsOn: [recorder],
    });

    // Rule: RDS encryption enabled
    new ConfigConfigRule(this, 'rds-encryption-rule', {
      name: `rds-storage-encrypted-${environmentSuffix}`,
      description: 'Checks that RDS instances have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
      },
      dependsOn: [recorder],
    });

    // Rule: CloudWatch log group encryption
    new ConfigConfigRule(this, 'cloudwatch-log-encryption-rule', {
      name: `cloudwatch-log-group-encrypted-${environmentSuffix}`,
      description: 'Checks that CloudWatch Log Groups are encrypted',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
      },
      dependsOn: [recorder],
    });

    // Rule: DynamoDB encryption enabled
    new ConfigConfigRule(this, 'dynamodb-encryption-rule', {
      name: `dynamodb-table-encrypted-kms-${environmentSuffix}`,
      description: 'Checks that DynamoDB tables use KMS encryption',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
      },
      dependsOn: [recorder],
    });

    // Rule: IAM password policy
    new ConfigConfigRule(this, 'iam-password-policy-rule', {
      name: `iam-password-policy-${environmentSuffix}`,
      description: 'Checks IAM password policy for compliance',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'IAM_PASSWORD_POLICY',
      },
      dependsOn: [recorder],
    });

    // Rule: VPC flow logs enabled
    new ConfigConfigRule(this, 'vpc-flow-logs-rule', {
      name: `vpc-flow-logs-enabled-${environmentSuffix}`,
      description: 'Checks that VPC flow logs are enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
      },
      dependsOn: [recorder],
    });
  }
}
