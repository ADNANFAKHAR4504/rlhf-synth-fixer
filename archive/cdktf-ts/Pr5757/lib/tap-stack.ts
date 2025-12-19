import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// Override AWS Region for ca-central-1 as specified in requirements
const AWS_REGION_OVERRIDE = 'ca-central-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Use ca-central-1 as specified in requirements
    const awsRegion = AWS_REGION_OVERRIDE;
    const defaultTags = props?.defaultTags || [
      {
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Instantiate Monitoring Stack
    new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      notificationEmail: 'alerts@example.com', // Should be parameterized in production
      awsRegion,
    });
  }
}
