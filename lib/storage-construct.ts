import { Construct } from "constructs";
// Import S3, encryption, logging from @cdktf/provider-aws as needed
import { SecurityConstruct } from "./security-construct";

interface StorageConstructProps {
  prefix: string;
  security: SecurityConstruct;
}

export class StorageConstruct extends Construct {
  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);
    // For each region, create S3 bucket with KMS encryption and logging
    Object.keys(props.security.kmsKeys).forEach(region => {
      const kmsKey = props.security.kmsKeys[region];
      const { S3Bucket, S3BucketEncryption, S3BucketPublicAccessBlock, CloudwatchLogGroup } = require("@cdktf/provider-aws");
      const bucket = new S3Bucket(this, `${props.prefix}-s3-bucket-${region}`, {
        provider: kmsKey.provider,
        bucket: `${props.prefix}-bucket-${region}`,
        tags: {
          Name: `${props.prefix}-s3-bucket-${region}`,
          Environment: props.prefix,
        },
      });
      new S3BucketEncryption(this, `${props.prefix}-s3-bucket-encryption-${region}`, {
        provider: kmsKey.provider,
        bucket: bucket.id,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: kmsKey.arn,
              sseAlgorithm: "aws:kms",
            },
          },
        },
      });
      new S3BucketPublicAccessBlock(this, `${props.prefix}-s3-bucket-pab-${region}`, {
        provider: kmsKey.provider,
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });
      // Enable logging for S3 bucket (to CloudWatch)
      new CloudwatchLogGroup(this, `${props.prefix}-s3-logs-${region}`, {
        provider: kmsKey.provider,
        name: `/aws/s3/${props.prefix}-bucket-${region}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `${props.prefix}-s3-logs-${region}`,
          Environment: props.prefix,
        },
      });
    });
  }
}
