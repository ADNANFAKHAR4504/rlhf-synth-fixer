import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  outputs?: Record<string, string>;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // This stack serves as a placeholder - actual multi-region infrastructure
    // is deployed via separate stacks instantiated in bin/tap.ts
    new cdk.CfnOutput(this, 'DeploymentInfo', {
      value: `Multi-region deployment for environment: ${environmentSuffix}`,
      description: 'Information about the current deployment',
    });

    // If outputs are provided from other stacks, aggregate them here
    // This ensures the deployment validation script can find all outputs
    if (props?.outputs) {
      Object.entries(props.outputs).forEach(([key, value]) => {
        new cdk.CfnOutput(this, key, {
          value: value,
          description: `Aggregated output: ${key}`,
        });
      });
    }
  }
}
