import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityStack } from './security-stack';

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

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix,
    });

    // Create security stack that depends on VPC
    new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      vpc: vpcStack.vpc,
    });
  }
}
