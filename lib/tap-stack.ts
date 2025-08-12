import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureWebAppStack } from './secure-web-app-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
    });

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the secure stack (not relying on outputs directly anymore)
    new SecureWebAppStack(this, 'TfSecureWebAppStack', {
      environment: environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
      description:
        'Secure web application infrastructure with production-ready security configurations',
    });
  }
}
