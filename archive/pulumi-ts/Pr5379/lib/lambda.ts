/**
 * Lambda function deployment with X-Ray tracing
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface LambdaMigrationArgs {
  functionName: string;
  handler: string;
  codeS3Bucket: pulumi.Input<string>;
  codeS3Key: string;
  roleArn: pulumi.Input<string>;
  environment?: { [key: string]: string };
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaMigration extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: LambdaMigrationArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:LambdaMigration', name, {}, opts);

    // Create log group with 30-day retention
    this.logGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/${args.functionName}-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/${args.functionName}-${args.environmentSuffix}`,
        retentionInDays: 30,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create Lambda function
    this.function = new aws.lambda.Function(
      `${args.functionName}-${args.environmentSuffix}`,
      {
        name: `${args.functionName}-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: args.handler,
        role: args.roleArn,
        s3Bucket: args.codeS3Bucket,
        s3Key: args.codeS3Key,
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        environment: {
          variables: {
            ...args.environment,
            ENVIRONMENT: 'production',
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: args.tags,
      },
      { parent: this, dependsOn: [this.logGroup] }
    );

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
    });
  }
}
