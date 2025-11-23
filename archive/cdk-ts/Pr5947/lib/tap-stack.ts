import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EksClusterStack } from './eks-cluster-stack';

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

    // Instantiate EKS cluster stack
    new EksClusterStack(this, 'EksCluster', {
      environmentSuffix,
    });
  }
}
