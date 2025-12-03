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
   * Email address for build notifications
   */
  notificationEmail?: string;

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
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
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
    const notificationEmail = args.notificationEmail || 'devops@example.com';

    // Instantiate CodeBuild Stack
    const codebuildStack = new CodeBuildStack(
      'codebuild',
      {
        environmentSuffix: environmentSuffix,
        notificationEmail: notificationEmail,
      },
      { parent: this }
    );

    // Expose outputs from nested components
    this.codeBuildProjectName = codebuildStack.projectName;
    this.artifactBucketName = codebuildStack.bucketName;
    this.snsTopicArn = codebuildStack.topicArn;

    // Register the outputs of this component
    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
