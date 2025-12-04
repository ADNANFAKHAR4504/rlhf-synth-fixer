import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { MultiRegionDRStack } from './multi-region-dr-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // awsRegion: override available but not used (multi-region deployment uses hardcoded regions)
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider for primary region
    const primaryProvider = new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: defaultTags,
      alias: 'primary',
    });

    // Configure AWS Provider for secondary region
    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: 'us-east-2',
      defaultTags: defaultTags,
      alias: 'secondary',
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate multi-region DR stack
    new MultiRegionDRStack(this, 'MultiRegionDR', {
      environmentSuffix,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-east-2',
      domainName: `dr-app-${environmentSuffix}.example.com`,
      primaryProvider,
      secondaryProvider,
    });
  }
}
