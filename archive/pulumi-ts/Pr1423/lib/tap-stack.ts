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
import { CiCdResources } from './cicd';

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
   * GitHub repository URL for the CI/CD pipeline source.
   */
  githubRepoUrl?: string;

  /**
   * Slack webhook URL for notifications.
   */
  slackWebhookUrl?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., CiCdResources) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly sampleLambdaArn: pulumi.Output<string>;
  public readonly artifactsBucketName: pulumi.Output<string>;
  public readonly slackSecretArn: pulumi.Output<string>;
  public readonly webhookUrl: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config();
    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const slackWebhookUrl =
      config.get('slackWebhookUrl') ||
      'https://hooks.slack.com/services/T0711111111/B0711111111/1234567890';

    // --- Instantiate CI/CD Resources ---
    const cicdResources = new CiCdResources(
      'tap-cicd',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        githubRepoUrl: args.githubRepoUrl,
        slackWebhookUrl: slackWebhookUrl,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    this.pipelineName = cicdResources.pipelineName;
    this.codeBuildProjectName = cicdResources.codeBuildProjectName;
    this.lambdaFunctionName = cicdResources.lambdaFunctionName;
    this.sampleLambdaArn = cicdResources.sampleLambdaArn;
    this.artifactsBucketName = cicdResources.artifactsBucketName;
    this.slackSecretArn = cicdResources.slackSecretArn;
    this.webhookUrl = cicdResources.webhookUrl;

    // Register the outputs of this component.
    this.registerOutputs({
      pipelineName: this.pipelineName,
      codeBuildProjectName: this.codeBuildProjectName,
      lambdaFunctionName: this.lambdaFunctionName,
      sampleLambdaArn: this.sampleLambdaArn,
      artifactsBucketName: this.artifactsBucketName,
      slackSecretArn: this.slackSecretArn,
      webhookUrl: this.webhookUrl,
    });
  }
}
