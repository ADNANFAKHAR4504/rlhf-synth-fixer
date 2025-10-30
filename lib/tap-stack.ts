/**
 * tap-stack.ts
 *
 * Main Pulumi stack for the serverless payment webhook processing system.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './apigateway-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the payment webhook system.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'production',
      Project: 'payment-processor',
    }));

    // Create CloudWatch Log Groups
    const cloudWatchStack = new CloudWatchStack(
      'cloudwatch',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create DynamoDB table for transaction storage
    const dynamoDBStack = new DynamoDBStack(
      'dynamodb',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create S3 bucket for report storage
    const s3Stack = new S3Stack(
      's3',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create Lambda functions
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        tableName: dynamoDBStack.tableName,
        bucketName: s3Stack.bucketName,
        webhookLogGroupName: cloudWatchStack.webhookLogGroupName,
        reportLogGroupName: cloudWatchStack.reportLogGroupName,
        tags,
      },
      { parent: this }
    );

    // Create API Gateway
    const apiGatewayStack = new ApiGatewayStack(
      'apigateway',
      {
        environmentSuffix,
        webhookLambdaArn: lambdaStack.webhookLambdaArn,
        webhookLambdaName: lambdaStack.webhookLambdaName,
        tags,
      },
      { parent: this }
    );

    this.apiEndpoint = apiGatewayStack.apiEndpoint;
    this.tableName = dynamoDBStack.tableName;
    this.bucketName = s3Stack.bucketName;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableName: this.tableName,
      bucketName: this.bucketName,
    });
  }
}
