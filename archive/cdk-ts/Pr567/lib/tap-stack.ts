import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiRegionStack } from './multi-region-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Deploy to us-east-1 (main region)
    new MultiRegionStack(scope, `GlobalApp-USEast1-${environmentSuffix}`, {
      region: 'us-east-1',
      isMainRegion: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      },
    });

    // Deploy to eu-west-1
    new MultiRegionStack(scope, `GlobalApp-EUWest1-${environmentSuffix}`, {
      region: 'eu-west-1',
      isMainRegion: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'eu-west-1',
      },
    });
  }
}
