import * as aws from "@cdktf/provider-aws";
import { TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface LifecycleRule {
  id: string;
  status: string;
  expiration: { days: number };
  noncurrent_version_expiration: { noncurrent_days: number };
}

interface S3StackConfig {
  environment: string;
  bucketName: string;
  enableVersioning?: boolean;
  lifecycleRules?: LifecycleRule[];
  commonTags: { [key: string]: string };
}

export class S3Stack extends TerraformStack {
  public readonly bucketId: string;
  public readonly bucketArn: string;
  public readonly bucketDomainName: string;
  public readonly accessLogsBucketId: string;

  constructor(scope: Construct, id: string, config: S3StackConfig) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: process.env.AWS_REGION || "us-west-2",
    });

    const mainBucket = new aws.s3Bucket.S3Bucket(this, "MainBucket", {
      bucket: config.bucketName,
      tags: {
        ...config.commonTags,
        Name: config.bucketName,
        Type: "Storage",
      },
    });

    new aws.s3BucketVersioning.S3BucketVersioningA(this, "Versioning", {
      bucket: mainBucket.id,
      versioningConfiguration: {
        status: config.enableVersioning ? "Enabled" : "Disabled",
      },
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      "Encryption",
      {
        bucket: mainBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "PublicAccess", {
      bucket: mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(this, "Lifecycle", {
        bucket: mainBucket.id,
        rule: config.lifecycleRules.map((rule) => ({
          id: rule.id,
          status: rule.status,
          expiration: [{ days: rule.expiration.days }],
          noncurrentVersionExpiration: [
            { noncurrentDays: rule.noncurrent_version_expiration.noncurrent_days },
          ],
        })),
      });
    }

    const accessLogBucket = new aws.s3Bucket.S3Bucket(this, "AccessLogsBucket", {
      bucket: `${config.bucketName}-access-logs`,
      tags: {
        ...config.commonTags,
        Name: `${config.bucketName}-access-logs`,
        Type: "AccessLogs",
      },
    });

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "AccessLogsPublicAccess", {
      bucket: accessLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      "AccessLogsEncryption",
      {
        bucket: accessLogBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketLogging.S3BucketLoggingA(this, "BucketLogging", {
      bucket: mainBucket.id,
      targetBucket: accessLogBucket.id,
      targetPrefix: "access-logs/",
    });

    this.bucketId = mainBucket.id;
    this.bucketArn = mainBucket.arn;
    this.bucketDomainName = mainBucket.bucketDomainName;
    this.accessLogsBucketId = accessLogBucket.id;

    new TerraformOutput(this, "bucket_id", { value: this.bucketId });
    new TerraformOutput(this, "bucket_arn", { value: this.bucketArn });
    new TerraformOutput(this, "bucket_domain_name", { value: this.bucketDomainName });
    new TerraformOutput(this, "access_logs_bucket_id", { value: this.accessLogsBucketId });
  }
}
