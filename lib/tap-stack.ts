import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from './ddb-stack';
import { ApiGatewayStack } from './rest-api-stack';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack');
    new ApiGatewayStack(this, 'ApiGatewayStack', { dynamoDBTable: dynamoDBStack.table });
    
  }
}