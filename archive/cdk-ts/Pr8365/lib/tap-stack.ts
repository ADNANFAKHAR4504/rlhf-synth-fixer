import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';

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

    // Create the network infrastructure stack
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Expose NetworkStack outputs through the main stack
    // This is required for CI/CD validation which expects at least one output
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: 'VPC ID for the TechCorp network',
    });

    new cdk.CfnOutput(this, 'DmzSecurityGroupId', {
      value: networkStack.dmzSecurityGroup.securityGroupId,
      description: 'Security Group ID for DMZ zone',
    });

    new cdk.CfnOutput(this, 'InternalSecurityGroupId', {
      value: networkStack.internalSecurityGroup.securityGroupId,
      description: 'Security Group ID for Internal zone',
    });

    new cdk.CfnOutput(this, 'SecureSecurityGroupId', {
      value: networkStack.secureSecurityGroup.securityGroupId,
      description: 'Security Group ID for Secure zone',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: networkStack.vpc.publicSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Comma-separated list of public subnet IDs (DMZ)',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: networkStack.vpc.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Comma-separated list of private subnet IDs (Internal)',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: networkStack.vpc.isolatedSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Comma-separated list of isolated subnet IDs (Secure)',
    });
  }
}
