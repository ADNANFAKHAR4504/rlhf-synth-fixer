import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AnalyticsStack } from './analytics';

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

    // Create the analytics stack
    new AnalyticsStack(scope, `AnalyticsStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      env: props?.env || { region: 'us-east-1' },
    });
  }
}
