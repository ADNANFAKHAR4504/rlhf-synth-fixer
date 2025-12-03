import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaComponentArgs {
  environmentSuffix: string;
  functionName: string;
  handler: string;
  code: pulumi.asset.AssetArchive;
  memorySize: number;
  role: aws.iam.Role;
  environment?: { variables: { [key: string]: pulumi.Input<string> } };
  deadLetterQueue: aws.sqs.Queue;
  provisionedConcurrency?: number;
  logRetentionDays?: number;
  tags: { [key: string]: string };
}

export class LambdaComponent extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: LambdaComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaComponent', name, {}, opts);

    // Create log group with retention policy
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${args.functionName}-logs`,
      {
        name: `/aws/lambda/${args.functionName}`,
        retentionInDays: args.logRetentionDays || 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create Lambda function with right-sized memory and DLQ
    this.function = new aws.lambda.Function(
      args.functionName,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: args.handler,
        role: args.role.arn,
        memorySize: args.memorySize,
        timeout: 60,
        code: args.code,
        environment: args.environment,
        deadLetterConfig: {
          targetArn: args.deadLetterQueue.arn,
        },
        tags: args.tags,
        publish: true, // Required for versioning
      },
      { parent: this, dependsOn: [this.logGroup] }
    );

    // Add provisioned concurrency if specified
    if (args.provisionedConcurrency) {
      // Create alias for provisioned concurrency
      const functionAlias = new aws.lambda.Alias(
        `${args.functionName}-alias`,
        {
          functionName: this.function.name,
          functionVersion: this.function.version,
          name: 'live',
        },
        { parent: this }
      );

      // Configure provisioned concurrency on alias
      new aws.lambda.ProvisionedConcurrencyConfig(
        `${args.functionName}-concurrency`,
        {
          functionName: this.function.name,
          qualifier: functionAlias.name,
          provisionedConcurrentExecutions: args.provisionedConcurrency,
        },
        { parent: this, dependsOn: [functionAlias] }
      );
    }

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
      logGroupName: this.logGroup.name,
    });
  }
}
