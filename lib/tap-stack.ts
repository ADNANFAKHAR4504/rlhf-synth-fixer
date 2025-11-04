import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'ap-northeast-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags || [];

    // Merge default tags with environment-specific tags
    const baseTags = defaultTags[0]?.tags || {};
    const enhancedTags: AwsProviderDefaultTags[] = [
      {
        tags: {
          ...baseTags,
          Environment: environmentSuffix,
          CostCenter: 'engineering',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: enhancedTags,
    });

    // Note: S3 Backend removed for local state management during testing
    // Uncomment for production use with proper state bucket
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });

    // Instantiate the infrastructure stack
    new InfrastructureStack(this, 'Infrastructure', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
