import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ParameterStack } from './parameter-stack';
import { EventBridgeStack } from './eventbridge-stack';

export interface LambdaStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  bucketName: pulumi.Output<string>;
  lambdaRoleArn: pulumi.Output<string>;
  lambdaCodeObject?: aws.s3.BucketObject;
  parameterStack: ParameterStack;
  eventBridgeStack: EventBridgeStack;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create Lambda function with code from S3 bucket
    const lambdaOptions: aws.lambda.FunctionArgs = {
      name: `tap-lambda-${environmentSuffix}`,
      role: args.lambdaRoleArn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',

      // Code from S3 bucket (as required)
      s3Bucket: args.bucketName,
      s3Key: 'lambda-function.zip',

      // Configuration for improved scaling (2024 feature)
      timeout: 30,
      memorySize: 128,

      // Environment variables - Enhanced with Parameter Store and EventBridge integration
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
          NODE_ENV: 'production',
          // Parameter Store configuration
          DB_ENDPOINT_PARAM: args.parameterStack.dbEndpointParam.name,
          DB_USERNAME_PARAM: args.parameterStack.dbUsernameParam.name,
          DB_PASSWORD_PARAM: args.parameterStack.dbPasswordParam.name,
          DB_NAME_PARAM: args.parameterStack.dbNameParam.name,
          // EventBridge configuration
          EVENT_BUS_NAME: args.eventBridgeStack.customEventBus.name,
          EVENT_SOURCE: `tap.application.${environmentSuffix}`,
        },
      },

      // Logging configuration
      loggingConfig: {
        logFormat: 'JSON',
        logGroup: `/aws/lambda/tap-lambda-${environmentSuffix}`,
      },

      tags: args.tags,
    };

    // Add dependency on S3 object if provided
    const dependsOn = args.lambdaCodeObject
      ? [args.lambdaCodeObject]
      : undefined;

    this.lambdaFunction = new aws.lambda.Function(
      `tap-lambda-${environmentSuffix}`,
      lambdaOptions,
      { parent: this, dependsOn }
    );

    // Create CloudWatch log group
    new aws.cloudwatch.LogGroup(
      `tap-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/tap-lambda-${environmentSuffix}`,
        retentionInDays: 14,
        tags: args.tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      functionName: this.lambdaFunction.name,
      functionArn: this.lambdaFunction.arn,
    });
  }
}
