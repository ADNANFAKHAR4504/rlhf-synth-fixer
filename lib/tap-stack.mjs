import * as cdk from 'aws-cdk-lib';
import { SecurityStack } from './security-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the comprehensive security stack
    new SecurityStack(this, `SecurityStack${environmentSuffix}`, {
      stackName: `TapStack${environmentSuffix}SecurityStack${environmentSuffix}`,
      env: props?.env,
      environmentSuffix: environmentSuffix,
    });
  }
}

export { TapStack };
