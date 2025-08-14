import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { Construct } from 'constructs';

interface LoggingProps {
  environment: string;
  region: string;
  tags: { [key: string]: string };
}

export class Logging extends Construct {
  public readonly trail: Cloudtrail;

  constructor(scope: Construct, id: string, props: LoggingProps) {
    super(scope, id);

    // Create the S3 bucket for CloudTrail logs
    const trailBucket = new S3Bucket(this, 'CloudTrailBucket', {
      bucket: `${props.environment}-${props.region}-trail-bucket`,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-trail-bucket`,
      },
    });

    // Create the CloudTrail resource
    this.trail = new Cloudtrail(this, 'CloudTrail', {
      name: `${props.environment}-${props.region}-trail`,
      s3BucketName: trailBucket.bucket,
      isMultiRegionTrail: true,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-trail`,
      },
    });
  }
}
