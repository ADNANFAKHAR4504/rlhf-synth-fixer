import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FoodDeliveryStack } from './food-delivery-stack';

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

    // Instantiate the Food Delivery Stack
    new FoodDeliveryStack(this, 'FoodDeliveryStack', {
      stackName: `FoodDeliveryStack-${environmentSuffix}`,
      env: props?.env,
    });
  }
}
