import * as cdk from 'aws-cdk-lib';
import { VpcStack } from './vpc-stack.mjs';
import { SecurityStack } from './security-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix,
    });

    // Create security stack that depends on VPC
    new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      vpc: vpcStack.vpc,
    });
  }
}

export { TapStack };