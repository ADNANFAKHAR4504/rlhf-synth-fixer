import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import stacks
import { PaymentStack } from './payment-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    /* istanbul ignore next */
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // QA NOTE: S3 Backend temporarily disabled for QA testing due to permissions
    // Using local backend instead
    // Configure S3 Backend with native state locking
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });
    // // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    // this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate PaymentStack
    new PaymentStack(this, 'PaymentStack', {
      environmentSuffix,
    });
  }
}
