import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebhookStack } from './webhook';

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

    // Define the stage name for the environment
    const stageName = this.node.tryGetContext('stage') || 'dev';

    // Optional custom domain configuration
    const customDomain = this.node.tryGetContext('customDomain');
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    const certificateArn = this.node.tryGetContext('certificateArn');

    // Create the webhook processing stack
    new WebhookStack(this, `WebhookStack-${environmentSuffix}`, {
      stageName,
      environmentSuffix,
      domainName: customDomain,
      hostedZoneId: hostedZoneId,
      certificateArn: certificateArn,
      env: props?.env,
    });
  }
}
