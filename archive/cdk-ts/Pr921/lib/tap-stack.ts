import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  }
}
