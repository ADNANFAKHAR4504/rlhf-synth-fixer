import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './compute-stack';
import { SecurityStack } from './security-stack';
import { VpcStack } from './vpc-stack';

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

    // Export outputs from child stacks for integration tests
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcStack.vpc.vpcId,
      description: 'VPC ID from VPC Stack',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: vpcStack.publicSubnet.subnetId,
      description: 'Public Subnet ID from VPC Stack',
      exportName: `${this.stackName}-PublicSubnetId`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: vpcStack.privateSubnet.subnetId,
      description: 'Private Subnet ID from VPC Stack',
      exportName: `${this.stackName}-PrivateSubnetId`,
    });

    new cdk.CfnOutput(this, 'PublicSecurityGroupId', {
      value: securityStack.securityGroupPublic.securityGroupId,
      description: 'Public Security Group ID from Security Stack',
      exportName: `${this.stackName}-PublicSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'PrivateSecurityGroupId', {
      value: securityStack.securityGroupPrivate.securityGroupId,
      description: 'Private Security Group ID from Security Stack',
      exportName: `${this.stackName}-PrivateSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'PublicInstanceId', {
      value: computeStack.publicInstance.instanceId,
      description: 'Public EC2 Instance ID from Compute Stack',
      exportName: `${this.stackName}-PublicInstanceId`,
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: computeStack.privateInstance.instanceId,
      description: 'Private EC2 Instance ID from Compute Stack',
      exportName: `${this.stackName}-PrivateInstanceId`,
    });

    new cdk.CfnOutput(this, 'KeyPairName', {
      value: computeStack.keyPair.keyPairName,
      description: 'EC2 Key Pair Name from Compute Stack',
      exportName: `${this.stackName}-KeyPairName`,
    });
  }
}
