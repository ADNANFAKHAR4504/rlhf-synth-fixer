import * as cdk from 'aws-cdk-lib';
import { HighAvailableStack } from './high-available.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the high-availability web architecture stack
    const highAvailableStack = new HighAvailableStack(
      scope,
      `HighAvailableStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: `High-Availability Web Architecture - ${environmentSuffix}`,
      }
    );

    // Store reference for potential use
    this.highAvailableStack = highAvailableStack;

    // Main orchestrator stack outputs
    new cdk.CfnOutput(this, `OrchestratorStatus${environmentSuffix}`, {
      value: 'ORCHESTRATOR_DEPLOYED',
      description: `High-availability web architecture orchestrator status - ${environmentSuffix}`,
    });
  }
}

export { TapStack };