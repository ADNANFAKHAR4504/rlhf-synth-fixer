/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CicdPipelineStack } from './cicd-pipeline-stack';

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
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly dockerBuildProjectName: pulumi.Output<string>;
  public readonly pulumiDeployProjectName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Instantiate CI/CD Pipeline Stack
    const cicdPipelineStack = new CicdPipelineStack(
      'tap-cicd-pipeline',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs from CI/CD Pipeline Stack
    this.pipelineUrl = cicdPipelineStack.pipelineUrl;
    this.ecrRepositoryUri = cicdPipelineStack.ecrRepositoryUri;
    this.artifactBucketName = cicdPipelineStack.artifactBucketName;
    this.dockerBuildProjectName = cicdPipelineStack.dockerBuildProjectName;
    this.pulumiDeployProjectName = cicdPipelineStack.pulumiDeployProjectName;
    this.snsTopicArn = cicdPipelineStack.snsTopicArn;

    // Register the outputs of this component.
    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      dockerBuildProjectName: this.dockerBuildProjectName,
      pulumiDeployProjectName: this.pulumiDeployProjectName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
