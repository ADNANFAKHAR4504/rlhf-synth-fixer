import * as cdk from 'aws-cdk-lib';
import { ServerlessNotificationStack } from './serverless-notification-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the serverless notification service stack
    const serverlessNotificationStack = new ServerlessNotificationStack(
      scope,
      `ServerlessNotificationStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: `Serverless Notification Service for async task processing - ${environmentSuffix}`,
      }
    );

    // Store reference for potential use
    this.serverlessNotificationStack = serverlessNotificationStack;

    // Main orchestrator stack outputs
    new cdk.CfnOutput(this, `OrchestratorStatus${environmentSuffix}`, {
      value: 'ORCHESTRATOR_DEPLOYED',
      description: `Serverless notification service orchestrator status - ${environmentSuffix}`,
    });
  }
}

export { TapStack };
