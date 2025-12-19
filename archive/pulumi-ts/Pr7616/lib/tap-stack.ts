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
import { CodeBuildStack } from './codebuild-stack';

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
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketArn: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const tags = args.tags || {};

    // Create CodeBuild stack for CI/CD pipeline
    const codeBuildStack = new CodeBuildStack(
      'tap-codebuild',
      {
        githubRepoUrl: 'https://github.com/example/nodejs-microservice',
        githubBranch: 'main',
        buildTimeoutMinutes: 15,
        logRetentionDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs from nested components
    this.artifactBucketArn = codeBuildStack.artifactBucketArn;
    this.codeBuildProjectName = codeBuildStack.codeBuildProjectName;

    // Register the outputs of this component
    this.registerOutputs({
      artifactBucketArn: this.artifactBucketArn,
      codeBuildProjectName: this.codeBuildProjectName,
    });
  }
}
