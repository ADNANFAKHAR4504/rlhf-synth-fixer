import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkVpcStack } from './cdk-vpc-stack';
import { CdkComputeStack } from './cdk-compute-stack';
import { CdkServiceNetworkConstruct } from './cdk-constructs';

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
    const vpcStack = new CdkVpcStack(
      this,
      `cdk-vpc-stack-${environmentSuffix}`,
      {
        environmentSuffix,
      }
    );

    // Create Compute Stack with VPC reference
    new CdkComputeStack(this, `cdk-compute-stack-${environmentSuffix}`, {
      vpc: vpcStack.vpc,
      environmentSuffix,
    });

    // Create VPC Lattice Service Network for advanced service networking
    new CdkServiceNetworkConstruct(
      this,
      `cdk-service-network-${environmentSuffix}`,
      {
        vpc: vpcStack.vpc,
        environmentSuffix,
      }
    );
  }
}
