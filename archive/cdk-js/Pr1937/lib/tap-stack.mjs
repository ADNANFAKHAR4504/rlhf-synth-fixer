import * as cdk from 'aws-cdk-lib';
import { ServiceDiscoveryStack } from './service-discovery-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the Service Discovery Stack
    new ServiceDiscoveryStack(
      scope,
      `ServiceDiscoveryStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: 'Service Discovery System with AWS Cloud Map and ALB',
      }
    );
  }
}

export { TapStack };
