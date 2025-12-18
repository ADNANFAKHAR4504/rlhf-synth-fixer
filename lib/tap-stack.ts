import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

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

    // Create the serverless stack
    new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });

    // Add outputs at the parent stack level (required for CI/CD validation)
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Name of the deployed stack',
      exportName: `${this.stackName}-StackName`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where the stack is deployed',
      exportName: `${this.stackName}-Region`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}
