import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { Construct } from 'constructs';

export class S3Stack extends Construct {

  private readonly bucket: S3Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // create an S3 bucket
    this.bucket = new S3Bucket(this, 'S3Bucket', {
      bucketPrefix: `cdktftest`,
    });
  }
  public getBucket(): S3Bucket {
    return this.bucket;
  }
}