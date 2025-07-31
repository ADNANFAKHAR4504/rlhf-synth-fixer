import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ResourcesStack } from './resources-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly resourcesStack: ResourcesStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create the resources infrastructure stack
    this.resourcesStack = new ResourcesStack(this, 'ResourcesStack', {
      environmentSuffix,
      env: props?.env,
    });
  }
}
