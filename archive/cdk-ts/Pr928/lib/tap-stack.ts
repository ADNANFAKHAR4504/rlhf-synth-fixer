import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack-simplified';

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

    // Create the security stack with all security configurations
    new SecurityStack(this, 'SecurityStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
      description:
        'Secure web application infrastructure with security best practices',
    });
  }
}
