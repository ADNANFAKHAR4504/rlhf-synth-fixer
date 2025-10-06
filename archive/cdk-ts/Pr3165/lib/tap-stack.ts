import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebAppStack } from './webapp';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate WebApp stack as nested construct within this stack
    new WebAppStack(this, `WebAppStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
    });
  }
}
