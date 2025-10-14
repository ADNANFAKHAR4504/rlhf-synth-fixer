import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiComponentApplicationStack } from './multi-component-stack';

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

    // Instantiate the multi-component application stack
    new MultiComponentApplicationStack(
      this.node.root as cdk.App,
      'MultiComponentApplication',
      {
        ...props,
        stackName: `prod-multi-component-stack-${environmentSuffix}`,
      }
    );
  }
}
