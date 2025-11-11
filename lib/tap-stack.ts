/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { KmsModule } from './kms-module';
import { IamModule } from './iam-module';
import { S3Module } from './s3-module';
import { MonitoringModule } from './monitoring-module';
import { ScpModule } from './scp-module';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it via environment variable AWS_REGION_OVERRIDE. Otherwise, it will use the prop or default to 'ap-southeast-1'.
const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE || '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-southeast-1';
    const stateBucketRegion = props?.stateBucketRegion || 'ap-southeast-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [
      {
        tags: {
          Environment: environmentSuffix,
          DataClassification: 'sensitive',
          ComplianceScope: 'pci-dss',
          ManagedBy: 'cdktf',
        },
      },
    ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with encryption
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      // Note: For state locking, use dynamodb_table parameter with a DynamoDB table
      // dynamodb_table: 'terraform-state-lock'
    });

    // Get current AWS account ID
    // Create S3 bucket for Config delivery
    const configBucket = new S3Bucket(this, 'config-bucket', {
      bucket: `aws-config-delivery-${environmentSuffix}`,
      tags: {
        Name: `config-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Create KMS keys for S3 and logs
    const s3KmsModule = new KmsModule(this, 's3-kms', {
      environmentSuffix,
      keyType: 's3',
      region: awsRegion,
    });

    const logsKmsModule = new KmsModule(this, 'logs-kms', {
      environmentSuffix,
      keyType: 'logs',
      region: awsRegion,
    });

    // Create S3 bucket with encryption
    const s3Module = new S3Module(this, 's3-storage', {
      environmentSuffix,
      kmsKeyArn: s3KmsModule.key.arn,
    });

    // Create IAM roles and policies
    const iamModule = new IamModule(this, 'iam-security', {
      environmentSuffix,
      s3BucketArn: s3Module.bucket.arn,
      kmsKeyArn: s3KmsModule.key.arn,
      allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12'],
    });

    // Add bucket policy to Config bucket to allow AWS Config to write
    new S3BucketPolicy(this, 'config-bucket-policy', {
      bucket: configBucket.id,
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
            Sid: 'AWSConfigBucketPutObject',
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

    // Create monitoring and compliance infrastructure
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      environmentSuffix,
      logsKmsKeyArn: logsKmsModule.key.arn,
      configBucketName: configBucket.bucket,
      alertEmail: 'security-team@example.com',
    });

    // Create service control policies
    const scpModule = new ScpModule(this, 'scp', {
      environmentSuffix,
    });

    // Outputs
    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3KmsModule.key.keyId,
      description: 'KMS Key ID for S3 encryption',
    });

    new TerraformOutput(this, 'logs-kms-key-id', {
      value: logsKmsModule.key.keyId,
      description: 'KMS Key ID for CloudWatch Logs encryption',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'Payment data S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'Payment data S3 bucket ARN',
    });

    new TerraformOutput(this, 'payment-role-arn', {
      value: iamModule.paymentProcessingRole.arn,
      description: 'Payment processing IAM role ARN',
    });

    new TerraformOutput(this, 'cross-account-role-arn', {
      value: iamModule.crossAccountRole.arn,
      description: 'Cross-account access IAM role ARN',
    });

    new TerraformOutput(this, 'audit-log-group-name', {
      value: monitoringModule.auditLogGroup.name,
      description: 'CloudWatch audit log group name',
    });

    new TerraformOutput(this, 'compliance-topic-arn', {
      value: monitoringModule.complianceTopic.arn,
      description: 'SNS topic ARN for compliance alerts',
    });

    new TerraformOutput(this, 'security-scp-id', {
      value: scpModule.securityPolicy.id,
      description: 'Service Control Policy ID for security enforcement',
    });
  }
}
