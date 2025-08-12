import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityStack } from './security-stack';
import { ComputeStack } from './compute-stack';

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

    // Create VPC Stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix: environmentSuffix,
    });

    // Create Security Stack
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpc: vpcStack.vpc,
      environmentSuffix: environmentSuffix,
    });

    // Create Compute Stack
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: vpcStack.vpc,
      publicSubnet: vpcStack.publicSubnet,
      privateSubnet: vpcStack.privateSubnet,
      securityGroupPublic: securityStack.securityGroupPublic,
      securityGroupPrivate: securityStack.securityGroupPrivate,
      environmentSuffix: environmentSuffix,
    });

    // Ensure proper dependency order
    securityStack.addDependency(vpcStack);
    computeStack.addDependency(securityStack);
  }
}
