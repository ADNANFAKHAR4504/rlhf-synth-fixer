import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RegionalResourcesStack } from './stacks/regional-resources-stack';
import { S3CRRStack } from './stacks/s3-crr-stack';

const REGIONS = {
  PRIMARY: 'us-east-1',
  SECONDARY: 'us-west-2',
} as const;

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true, // Enable cross-region references
    });

    const environmentSuffix = props.environmentSuffix || 'dev';
    // Create a single domain name for the entire multi-region setup
    const domainName = `${environmentSuffix}.tap-us-east-1.turing229221.com`;
    const zoneId = 'Z0457876OLTG958Q3IXN';
    const currentRegion = this.region;
    const isPrimary = currentRegion === REGIONS.PRIMARY;

    // Create S3CRR stack first in PRIMARY region to get replication role
    let replicationRoleArn: string | undefined;
    if (isPrimary) {
      const s3CRRStack = new S3CRRStack(this, 'S3CRR', {
        env: {
          account: this.account,
          region: REGIONS.PRIMARY, // us-east-1
        },
        sourceBucketName: `globalmountpoint-content-${REGIONS.PRIMARY}-${environmentSuffix}`,
        destinationBucketName: `globalmountpoint-content-${REGIONS.SECONDARY}-${environmentSuffix}`,
      });
      replicationRoleArn = s3CRRStack.replicationRole.roleArn;
    }

    // Create regional resources for the current region
    // DNS logic is now handled within RegionalResourcesStack:
    // - Primary region creates hosted zone + primary DNS record
    // - Secondary region creates secondary DNS record using imported hosted zone
    const regionalStack = new RegionalResourcesStack(this, 'Regional', {
      environmentSuffix,
      region: currentRegion,
      isPrimary,
      domainName,
      zoneId,
      secondaryRegion: REGIONS.SECONDARY,
      replicationRoleArn,
      env: {
        account: this.account,
        region: currentRegion,
      },
    });

    // Ensure dependency if S3CRR stack exists
    if (isPrimary) {
      const s3CRRChild = this.node.tryFindChild('S3CRR');
      if (s3CRRChild) {
        regionalStack.node.addDependency(s3CRRChild);
      }
    }
    // Add tags
    cdk.Tags.of(this).add('Stack', 'TapStack');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', currentRegion);
    cdk.Tags.of(this).add('RegionType', isPrimary ? 'primary' : 'secondary');
  }
}
