import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBStack } from './ddb-stack';
import { ApiGatewayStack } from './rest-api-stack';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack');
    new ApiGatewayStack(this, 'ApiGatewayStack', {
      dynamoDBTable: dynamoDBStack.table,
    });
  }
}
