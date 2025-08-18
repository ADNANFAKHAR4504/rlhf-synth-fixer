import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SecureFoundationalEnvironmentStack } from './secure-foundational-environment-stack';
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    new SecureFoundationalEnvironmentStack(
      this,
      'SecureFoundationalEnvironment',
      {
        environmentSuffix: environmentSuffix,
        description: `Secure foundational AWS environment for ${environmentSuffix} - IaC AWS Nova Model Breaking project`,
        env: {
          region: 'us-east-1',
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
      }
    );
  }
}
