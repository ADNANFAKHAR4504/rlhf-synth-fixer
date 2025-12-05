import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsFargateStack } from './ecs-fargate-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * Main stack that orchestrates all infrastructure
 * This is a BASELINE deployment for IaC optimization demonstration
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create ECS Fargate infrastructure with baseline configuration
    new EcsFargateStack(this, 'EcsFargateStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}
