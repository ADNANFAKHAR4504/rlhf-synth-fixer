import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
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

    this.trail = new Cloudtrail(this, 'CloudTrail', {
      name: `${props.environment}-${props.region}-trail`,
      s3BucketName: `${props.environment}-${props.region}-trail-bucket`,
      isMultiRegionTrail: true,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-trail`,
      },
    });
  }
}
