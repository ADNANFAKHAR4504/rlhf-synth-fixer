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

  /**
   * GitHub connection ARN for CodePipeline source
   */
  githubConnectionArn?: string;

  /**
   * GitHub repository in format owner/repo
   */
  githubRepo?: string;

  /**
   * GitHub branch to track
   */
  githubBranch?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;

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
    const cicdStack = new CicdPipelineStack(
      'cicd-pipeline',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        githubConnectionArn: args.githubConnectionArn,
        githubRepo: args.githubRepo,
        githubBranch: args.githubBranch,
      },
      { parent: this }
    );

    // Expose outputs from nested components
    this.pipelineUrl = cicdStack.pipelineUrl;
    this.ecrRepositoryUri = cicdStack.ecrRepositoryUri;
    this.artifactBucketName = cicdStack.artifactBucketName;
    this.buildProjectName = cicdStack.buildProjectName;

    // Register the outputs of this component
    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
    });
  }
}
