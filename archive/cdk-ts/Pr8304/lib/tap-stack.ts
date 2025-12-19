import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureNetworkStack } from './secure-network-stack';

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

    // Deploy to us-east-1
    const eastStack = new SecureNetworkStack(this, 'SecureNetworkEast', {
      environmentName: `${environmentSuffix}-east`,
      costCenter: 'CC-001-Security',
      env: {
        account: this.account,
        region: 'us-east-1',
      },
    });

    // Deploy to us-west-2
    const westStack = new SecureNetworkStack(this, 'SecureNetworkWest', {
      environmentName: `${environmentSuffix}-west`,
      costCenter: 'CC-001-Security',
      env: {
        account: this.account,
        region: 'us-west-2',
      },
    });

    // Add outputs to the parent stack for deployment validation
    new cdk.CfnOutput(this, 'EastVpcId', {
      value: eastStack.vpc.vpcId,
      description: 'VPC ID for us-east-1 region',
    });

    new cdk.CfnOutput(this, 'WestVpcId', {
      value: westStack.vpc.vpcId,
      description: 'VPC ID for us-west-2 region',
    });

    new cdk.CfnOutput(this, 'EastFlowLogsBucket', {
      value: eastStack.flowLogsBucket.bucketName,
      description: 'Flow logs bucket for us-east-1',
    });

    new cdk.CfnOutput(this, 'WestFlowLogsBucket', {
      value: westStack.flowLogsBucket.bucketName,
      description: 'Flow logs bucket for us-west-2',
    });
  }
}
