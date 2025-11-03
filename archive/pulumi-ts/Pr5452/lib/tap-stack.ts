import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CloudWatchStack } from './cloudwatch-stack';
import { DynamoDBStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './apigateway-stack';

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
      Environment: environmentSuffix,
      Project: 'payment-processor',
      ...t,
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

    // Create Lambda function for webhook handling
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        tags,
        tableName: dynamoDBStack.tableName,
        bucketName: s3Stack.bucketName,
        webhookLogGroupName: cloudWatchStack.webhookLogGroupName,
        reportLogGroupName: cloudWatchStack.reportLogGroupName,
      },
      { parent: this }
    );

    // Create API Gateway for webhook endpoint
    const apiGatewayStack = new ApiGatewayStack(
      'apigateway',
      {
        environmentSuffix,
        tags,
        webhookLambdaArn: lambdaStack.webhookLambdaArn,
        webhookLambdaName: lambdaStack.webhookLambdaName,
      },
      { parent: this }
    );

    // Export key outputs
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
