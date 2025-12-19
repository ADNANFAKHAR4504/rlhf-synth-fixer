import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiRegionDRStack } from './multi-region-dr-stack';

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

    // Create the high-availability trading platform solution
    new MultiRegionDRStack(this, 'MultiRegionDR', {
      environmentSuffix,
    });
  }
}
