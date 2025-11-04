import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';
import * as fs from 'fs';
import * as path from 'path';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

/**
 * Get AWS region from environment variable, fallback to lib/AWS_REGION file, then props, then default
 */
function getAwsRegion(props?: TapStackProps): string {
  // First priority: environment variable
  if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  }

  // Second priority: read from lib/AWS_REGION file
  const awsRegionFile = path.join(__dirname, 'AWS_REGION');
  if (fs.existsSync(awsRegionFile)) {
    try {
      const regionFromFile = fs.readFileSync(awsRegionFile, 'utf-8').trim();
      if (regionFromFile) {
        return regionFromFile;
      }
    } catch (error) {
      // Ignore file read errors and continue to next fallback
    }
  }

  // Third priority: props
  if (props?.awsRegion) {
    return props.awsRegion;
  }

  // Default: ap-northeast-2 as specified in PROMPT.md
  return 'ap-northeast-2';
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = getAwsRegion(props);
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
