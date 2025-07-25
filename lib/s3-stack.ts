import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export class S3Stack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // create an S3 bucket
    const bucket = new S3Bucket(this, 'S3Bucket', {
      bucketPrefix: `CdkTfTsTest`,
      versioning: {
        enabled: true,
      },
    });

    // Output the bucket name in the S3Stack
    new TerraformOutput(this, "bucket_name", {
      value: bucket.id,
      description: "The name of the S3 bucket created by CDKTF",
    });
  }
}