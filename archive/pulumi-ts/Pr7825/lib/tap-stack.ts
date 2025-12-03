import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodeBuildPipelineStack } from './codebuild-pipeline-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly repositoryCloneUrl: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;
  public readonly buildProjectArn: pulumi.Output<string>;
  public readonly artifactsBucketName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly serviceRoleArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly eventBridgeRuleArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    const pipelineStack = new CodeBuildPipelineStack(
      'codebuild-pipeline',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        notificationEmail: args.notificationEmail,
      },
      { parent: this }
    );

    this.repositoryCloneUrl = pipelineStack.repositoryCloneUrl;
    this.buildProjectName = pipelineStack.buildProjectName;
    this.buildProjectArn = pipelineStack.buildProjectArn;
    this.artifactsBucketName = pipelineStack.artifactsBucketName;
    this.logGroupName = pipelineStack.logGroupName;
    this.serviceRoleArn = pipelineStack.serviceRoleArn;
    this.snsTopicArn = pipelineStack.snsTopicArn;
    this.kmsKeyArn = pipelineStack.kmsKeyArn;
    this.eventBridgeRuleArn = pipelineStack.eventBridgeRuleArn;
    this.dashboardUrl = pipelineStack.dashboardUrl;

    this.registerOutputs({
      repositoryCloneUrl: this.repositoryCloneUrl,
      buildProjectName: this.buildProjectName,
      buildProjectArn: this.buildProjectArn,
      artifactsBucketName: this.artifactsBucketName,
      logGroupName: this.logGroupName,
      serviceRoleArn: this.serviceRoleArn,
      snsTopicArn: this.snsTopicArn,
      kmsKeyArn: this.kmsKeyArn,
      eventBridgeRuleArn: this.eventBridgeRuleArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
