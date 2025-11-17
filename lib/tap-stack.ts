import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Note: This TapStack is a coordinator. The actual stacks are instantiated in bin/tap.ts
    // to ensure proper cross-region and cross-stack dependencies.

    // This stack can be used for shared resources or configuration if needed,
    // but the multi-region DR architecture requires stacks to be created at the app level.
  }
}

// Export stack classes for use in bin/tap.ts
export { DRRegionStack } from './dr-region-stack';
export { PrimaryRegionStack } from './primary-region-stack';
export { Route53FailoverStack } from './route53-failover-stack';
