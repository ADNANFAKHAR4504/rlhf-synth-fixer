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
import { CICDStack } from './ci-cd-stack';

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
   * GitHub personal access token for pipeline source
   */
  githubToken?: pulumi.Input<string>;

  /**
   * GitHub repository in format 'owner/repo'
   */
  githubRepo?: string;

  /**
   * GitHub branch to monitor
   */
  githubBranch?: string;

  /**
   * ECS cluster name for deployment
   */
  ecsClusterName?: string;

  /**
   * ECS service name for deployment
   */
  ecsServiceName?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
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

    // Instantiate CI/CD Stack
    const cicdStack = new CICDStack(
      'cicd',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        githubToken: args.githubToken,
        githubRepo: args.githubRepo,
        githubBranch: args.githubBranch,
        ecsClusterName: args.ecsClusterName,
        ecsServiceName: args.ecsServiceName,
      },
      { parent: this }
    );

    // Expose outputs
    this.artifactBucketName = cicdStack.artifactBucketName;
    this.ecrRepositoryUrl = cicdStack.ecrRepositoryUrl;
    this.pipelineName = cicdStack.pipelineName;
    this.snsTopicArn = cicdStack.snsTopicArn;

    // Register the outputs of this component
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
