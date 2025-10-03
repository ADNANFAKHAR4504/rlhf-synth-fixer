import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { InfrastructureStack } from './infrastructure-stack';

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

    // Instantiate the Infrastructure Stack
    new InfrastructureStack(this, `InfrastructureStack-${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
    });
  }
}
