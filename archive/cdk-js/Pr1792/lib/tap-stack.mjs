import * as cdk from 'aws-cdk-lib';
import { ServerlessAppStack } from './serverless-app-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create ServerlessApp infrastructure stack
    new ServerlessAppStack(this, 'ServerlessAppInfrastructure', {
      stackName: `ServerlessApp-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      env: props.env,
    });
  }
}

export { TapStack };
