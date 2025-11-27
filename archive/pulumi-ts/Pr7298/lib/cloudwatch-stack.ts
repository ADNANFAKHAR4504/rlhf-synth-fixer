/**
 * cloudwatch-stack.ts
 *
 * Defines CloudWatch Log Groups with KMS encryption.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly pipelineLogGroup: aws.cloudwatch.LogGroup;
  public readonly codebuildLogGroup: aws.cloudwatch.LogGroup;
  public readonly lambdaLogGroup: aws.cloudwatch.LogGroup;
  public readonly ecsLogGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: CloudWatchStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // CodePipeline log group
    this.pipelineLogGroup = new aws.cloudwatch.LogGroup(
      `pipeline-logs-${environmentSuffix}`,
      {
        name: `/aws/codepipeline/${environmentSuffix}`,
        retentionInDays: 30,
        // kmsKeyId: kmsKeyId, // Removed to avoid KMS propagation timing issues
        tags: {
          ...tags,
          Name: `pipeline-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CodeBuild log group
    this.codebuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/${environmentSuffix}`,
        retentionInDays: 30,
        // kmsKeyId: kmsKeyId, // Removed to avoid KMS propagation timing issues
        tags: {
          ...tags,
          Name: `codebuild-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda log group
    this.lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/deploy-orchestrator-${environmentSuffix}`,
        retentionInDays: 30,
        // kmsKeyId: kmsKeyId, // Removed to avoid KMS propagation timing issues
        tags: {
          ...tags,
          Name: `lambda-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS log group
    this.ecsLogGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/${environmentSuffix}`,
        retentionInDays: 30,
        // kmsKeyId: kmsKeyId, // Removed to avoid KMS propagation timing issues
        tags: {
          ...tags,
          Name: `ecs-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      pipelineLogGroupName: this.pipelineLogGroup.name,
      pipelineLogGroupArn: this.pipelineLogGroup.arn,
      codebuildLogGroupName: this.codebuildLogGroup.name,
      lambdaLogGroupName: this.lambdaLogGroup.name,
      ecsLogGroupName: this.ecsLogGroup.name,
    });
  }
}
