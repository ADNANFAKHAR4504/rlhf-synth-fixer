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
    new SecureNetworkStack(this, 'SecureNetworkEast', {
      environmentName: `${environmentSuffix}-east`,
      costCenter: 'CC-001-Security',
      env: {
        account: this.account,
        region: 'us-east-1',
      },
    });

    // Deploy to us-west-2
    new SecureNetworkStack(this, 'SecureNetworkWest', {
      environmentName: `${environmentSuffix}-west`,
      costCenter: 'CC-001-Security',
      env: {
        account: this.account,
        region: 'us-west-2',
      },
    });
  }
}
