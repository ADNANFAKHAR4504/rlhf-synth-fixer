import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { ServerlessStack } from './serverless-stack';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Create the serverless data processing stack
    const serverlessStack = new ServerlessStack(
      this,
      'ServerlessDataProcessing',
      {
        environmentSuffix: environmentSuffix,
        env: {
          account: cdk.Stack.of(this).account,
          region: cdk.Stack.of(this).region,
        },
      }
    );

    // Export key outputs from nested stack at parent level
    new cdk.CfnOutput(this, 'ServerlessStackName', {
      value: serverlessStack.stackName,
      description: 'Name of the Serverless Data Processing Stack',
      exportName: `ServerlessStackName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `Region-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Account', {
      value: this.account,
      description: 'AWS Account ID',
      exportName: `Account-${environmentSuffix}`,
    });
  }
}
