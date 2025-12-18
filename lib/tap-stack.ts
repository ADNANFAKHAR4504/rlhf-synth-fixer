import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDbStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';

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

    // Create DynamoDB stack
    const dynamoDbStack = new DynamoDbStack(
      this,
      `DynamoDbStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: {
          account: this.account,
          region: this.region,
        },
      }
    );

    // Create Lambda stack
    const lambdaStack = new LambdaStack(
      this,
      `LambdaStack-${environmentSuffix}`,
      {
        environmentSuffix,
        usersTable: dynamoDbStack.usersTable,
        env: {
          account: this.account,
          region: this.region,
        },
      }
    );

    // Lambda stack depends on DynamoDB stack
    lambdaStack.addDependency(dynamoDbStack);

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(
      this,
      `ApiGatewayStack-${environmentSuffix}`,
      {
        environmentSuffix,
        createUserFunction: lambdaStack.createUserFunction,
        getUserFunction: lambdaStack.getUserFunction,
        deleteUserFunction: lambdaStack.deleteUserFunction,
        env: {
          account: this.account,
          region: this.region,
        },
      }
    );

    // API Gateway stack depends on Lambda stack
    apiGatewayStack.addDependency(lambdaStack);

    // Add tags for resource management
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'UserManagementAPI');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Export main outputs from the parent stack
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: dynamoDbStack.usersTable.tableName,
      exportName: `TapStack-UsersTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: dynamoDbStack.usersTable.tableArn,
      exportName: `TapStack-UsersTableArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CreateUserFunctionArn', {
      value: lambdaStack.createUserFunction.functionArn,
      exportName: `TapStack-CreateUserFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'GetUserFunctionArn', {
      value: lambdaStack.getUserFunction.functionArn,
      exportName: `TapStack-GetUserFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeleteUserFunctionArn', {
      value: lambdaStack.deleteUserFunction.functionArn,
      exportName: `TapStack-DeleteUserFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGatewayStack.api.url,
      exportName: `TapStack-ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: apiGatewayStack.api.restApiId,
      exportName: `TapStack-ApiGatewayId-${environmentSuffix}`,
    });
  }
}
