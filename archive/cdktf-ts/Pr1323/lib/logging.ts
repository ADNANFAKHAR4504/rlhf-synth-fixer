import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

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

    const bucketName = `${props.environment}-${props.region}-trail-bucket`;

    const trailBucket = new S3Bucket(this, 'CloudTrailBucket', {
      bucket: bucketName,
      tags: {
        ...props.tags,
        Name: bucketName,
      },
    });

    // Add bucket policy for CloudTrail
    new S3BucketPolicy(this, 'CloudTrailBucketPolicy', {
      bucket: trailBucket.bucket,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 's3:GetBucketAcl',
            Resource: `arn:aws:s3:::${bucketName}`,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${bucketName}/AWSLogs/*`,
            Condition: {
              StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
            },
          },
        ],
      }),
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
