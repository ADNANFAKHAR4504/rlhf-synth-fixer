import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface S3StackProps {
  bucketPrefix: string;
  versioningEnabled?: boolean;
}

export class S3Stack extends TerraformStack {
    private readonly s3Bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const bucketPrefix = props.bucketPrefix;
    const versioningEnabled = props.versioningEnabled !== undefined ? props.versioningEnabled : false;

    // Create S3 bucket with name prefix and versioning enabled
     this.s3Bucket = new S3Bucket(this, 'S3Bucket', {
      bucketPrefix: bucketPrefix,
      tags: {
        Purpose: 'CDKTF Workflow Test',
        ManagedBy: 'CDKTF',
      },
     });
    

    // Enable versioning on the bucket
    new S3BucketVersioningA(this, 'S3BucketVersioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: versioningEnabled ? 'Enabled' : 'Suspended',
      },
    });
  }

  getBucketInfo() {
    return {
      bucketName: this.s3Bucket.id,
      bucketArn: this.s3Bucket.arn,
      bucketVersioningStatus: this.s3Bucket.versioning.enabled
    }
  }
}
