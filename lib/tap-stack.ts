import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import your modules here
import {
  createKmsKey,
  createS3BucketWithKms,
  createSnsTopicWithPolicy,
  createSqsWithDlqAndKms,
  createLeastPrivilegeIamRoles,
  CreatedKmsKey,
  CreatedS3Bucket,
  CreatedSnsTopic,
  CreatedSqsQueues,
  CreatedIamRoles,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'tap-stack',
      ManagedBy: 'terraform',
    };

    // Create KMS key for encryption
    const kmsModule: CreatedKmsKey = createKmsKey(
      this,
      `tap-kms-${environmentSuffix}`,
      {
        description: `TAP Stack KMS key for ${environmentSuffix} environment`,
        tags: commonTags,
        allowedPrincipals: [`arn:aws:iam::${current.accountId}:root`],
        accountId: current.accountId,
      }
    );

    // Create S3 bucket with KMS encryption
    const s3Module: CreatedS3Bucket = createS3BucketWithKms(
      this,
      `tap-s3-${environmentSuffix}`,
      {
        bucketName: `tap-data-bucket-tss-${environmentSuffix}-${current.accountId}`,
        kmsKeyArn: kmsModule.key.arn,
        tags: commonTags,
        accountId: current.accountId,
        enableBucketPolicy: false, // Keep disabled to avoid deployment issues
      }
    );

    // Create SNS topic
    const snsModule: CreatedSnsTopic = createSnsTopicWithPolicy(
      this,
      `tap-sns-${environmentSuffix}`,
      {
        topicName: `tap-notifications-${environmentSuffix}`,
        allowedAwsAccounts: [current.accountId],
        tags: commonTags,
        accountId: current.accountId,
      }
    );

    // Create SQS queue with DLQ
    const sqsModule: CreatedSqsQueues = createSqsWithDlqAndKms(
      this,
      `tap-sqs-${environmentSuffix}`,
      {
        queueName: `tap-processing-queue-${environmentSuffix}`,
        dlqName: `tap-processing-dlq-${environmentSuffix}`,
        kmsKeyArn: kmsModule.key.arn,
        snsTopicArn: snsModule.topic.arn,
        maxReceiveCount: 3,
        tags: commonTags,
      }
    );

    // Create IAM roles with least privilege
    const iamModule: CreatedIamRoles = createLeastPrivilegeIamRoles(
      this,
      `tap-iam-${environmentSuffix}`,
      {
        rolePrefix: `tap-${environmentSuffix}`,
        s3BucketArn: s3Module.bucket.arn,
        snsTopicArn: snsModule.topic.arn,
        sqsQueueArn: sqsModule.mainQueue.arn,
        dlqArn: sqsModule.dlq.arn,
        kmsKeyArn: kmsModule.key.arn,
        tags: commonTags,
      }
    );

    // Terraform Outputs - exactly 10 as requested
    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID for encryption',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN for encryption',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for data storage',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 bucket ARN for data storage',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: snsModule.topic.arn,
      description: 'SNS topic ARN for notifications',
    });

    new TerraformOutput(this, 'sqs-queue-url', {
      value: sqsModule.mainQueue.id,
      description: 'SQS main queue URL for message processing',
    });

    new TerraformOutput(this, 'sqs-dlq-url', {
      value: sqsModule.dlq.id,
      description: 'SQS dead letter queue URL',
    });

    new TerraformOutput(this, 's3-iam-role-arn', {
      value: iamModule.s3Role.arn,
      description: 'IAM role ARN for S3 access',
    });

    new TerraformOutput(this, 'sqs-iam-role-arn', {
      value: iamModule.sqsRole.arn,
      description: 'IAM role ARN for SQS access',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
