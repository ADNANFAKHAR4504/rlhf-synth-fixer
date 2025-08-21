import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from './infrastructure-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the infrastructure stack as a nested stack
    const infrastructureStack = new InfrastructureStack(this, 'Infrastructure', {
      environmentSuffix,
      env: props?.env,
    });
  }
}

export { TapStack };
