import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessInfrastructureStack } from './serverless-infrastructure-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const childStackName = `ServerlessInfrastructureStack${environmentSuffix}`;
    new ServerlessInfrastructureStack(this, childStackName, {
      stackName: childStackName,
      env: props?.env,
    });

    // ? Import your stacks here
    // import { MyStack } from './my-stack';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
