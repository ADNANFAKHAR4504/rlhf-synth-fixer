import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBStack } from './ddb-stack';
import { ApiGatewayStack } from './rest-api-stack';

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

    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      environmentSuffix,
    });

    new ApiGatewayStack(this, 'ApiGatewayStack', {
      dynamoDBTable: dynamoDBStack.table,
      environmentSuffix,
    });
  }
}
