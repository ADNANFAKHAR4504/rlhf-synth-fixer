/**
 * CloudWatch Stack - Log groups for CodeBuild projects
 *
 * This stack creates CloudWatch Log Groups with:
 * - 30-day retention policy
 * - Separate log groups for unit tests and Docker builds
 * - Encryption at rest
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  region: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly unitTestLogGroupName: pulumi.Output<string>;
  public readonly dockerBuildLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CloudWatchStack', name, args, opts);

    // Log Group for Unit Test CodeBuild Project
    const unitTestLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-unit-test-logs-${args.environmentSuffix}`,
      {
        name: `/aws/codebuild/unit-test-${args.environmentSuffix}`,
        retentionInDays: 30,
        tags: args.tags,
      },
      { parent: this }
    );

    // Log Group for Docker Build CodeBuild Project
    const dockerBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-docker-build-logs-${args.environmentSuffix}`,
      {
        name: `/aws/codebuild/docker-build-${args.environmentSuffix}`,
        retentionInDays: 30,
        tags: args.tags,
      },
      { parent: this }
    );

    this.unitTestLogGroupName = unitTestLogGroup.name;
    this.dockerBuildLogGroupName = dockerBuildLogGroup.name;

    this.registerOutputs({
      unitTestLogGroupName: this.unitTestLogGroupName,
      dockerBuildLogGroupName: this.dockerBuildLogGroupName,
    });
  }
}
