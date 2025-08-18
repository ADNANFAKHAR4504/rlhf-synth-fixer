import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessInfrastructureStack } from './serverless-infrastructure-stack';

// Import your stacks here
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

    // Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    new ServerlessInfrastructureStack(
      this,
      `ServerlessInfrastructureStack-${environmentSuffix}`,
      {
        environmentSuffix,
        description: `Serverless Infrastructure Stack for ${environmentSuffix} environment`,
      }
    );
  }
}
