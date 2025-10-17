import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InfraStack } from './infrastructure';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    new InfraStack(this, 'InfraStack', {
      environmentSuffix,
      projectName: this.node.tryGetContext('projectName'),
      apiThrottleRate: this.node.tryGetContext('apiThrottleRate'),
      apiThrottleBurst: this.node.tryGetContext('apiThrottleBurst'),
      lambdaMemorySize: this.node.tryGetContext('lambdaMemorySize'),
      lambdaTimeout: this.node.tryGetContext('lambdaTimeout'),
      dynamodbReadCapacity: this.node.tryGetContext('dynamodbReadCapacity'),
      dynamodbWriteCapacity: this.node.tryGetContext('dynamodbWriteCapacity'),
      enablePointInTimeRecovery: this.node.tryGetContext(
        'enablePointInTimeRecovery'
      ),
      logRetentionDays: this.node.tryGetContext('logRetentionDays'),
      enableApiGatewayCaching: this.node.tryGetContext(
        'enableApiGatewayCaching'
      ),
      apiGatewayCacheSize: this.node.tryGetContext('apiGatewayCacheSize'),
      apiGatewayCacheTtl: this.node.tryGetContext('apiGatewayCacheTtl'),
    });
  }
}
