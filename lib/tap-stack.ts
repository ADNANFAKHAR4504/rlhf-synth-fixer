import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly serverlessStack: ServerlessStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Default allowed IP CIDRs - can be overridden via context
    const allowedIpCidrs = this.node.tryGetContext('allowedIpCidrs') || [
      '0.0.0.0/0',
    ];

    // Create the serverless stack for user data processing
    // Note: ServerlessStack is created as a separate stack (not a nested stack)
    // to avoid cross-stack reference issues when accessing its resources
    this.serverlessStack = new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix,
      allowedIpCidrs,
      env: {
        account: this.account,
        region: 'us-east-1', // Fixed region as per requirements
      },
    });

    // Outputs are already defined in ServerlessStack itself
    // No need to duplicate them here to avoid cross-stack reference errors
  }
}
