import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiEnvStack, getEnvironmentConfig } from './multi-env-stack';

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

    // Get environment-specific configuration
    const config = getEnvironmentConfig(environmentSuffix);

    // Create the MultiEnvStack
    const multiEnvStackId = `TapStackMultiEnvStack${environmentSuffix}`;
    new MultiEnvStack(scope, multiEnvStackId, {
      stackName: multiEnvStackId,
      config: config,
      env: environmentSuffix,
    });
  }
}
