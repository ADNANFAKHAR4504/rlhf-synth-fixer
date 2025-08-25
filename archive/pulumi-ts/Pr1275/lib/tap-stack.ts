/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the serverless application infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { CloudWatchStack } from './cloudwatch-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the serverless application.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create DynamoDB stack
    const dynamoDBStack = new DynamoDBStack(
      'tap-dynamodb',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create Lambda stack
    const lambdaStack = new LambdaStack(
      'tap-lambda',
      {
        environmentSuffix: environmentSuffix,
        tableName: dynamoDBStack.tableName,
        tags: tags,
      },
      { parent: this }
    );

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(
      'tap-api',
      {
        environmentSuffix: environmentSuffix,
        lambdaFunction: lambdaStack.lambdaFunction,
        tags: tags,
      },
      { parent: this }
    );

    // Create CloudWatch stack
    new CloudWatchStack(
      'tap-cloudwatch',
      {
        environmentSuffix: environmentSuffix,
        lambdaFunctionName: lambdaStack.lambdaFunctionName,
        apiGatewayName: apiGatewayStack.apiGatewayName,
        tags: tags,
      },
      { parent: this }
    );

    this.apiEndpoint = apiGatewayStack.apiEndpoint;
    this.tableName = dynamoDBStack.tableName;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableName: this.tableName,
    });
  }
}
