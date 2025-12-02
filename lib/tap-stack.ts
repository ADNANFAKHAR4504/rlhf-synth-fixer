/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the CodeBuild automated build infrastructure.
 * Orchestrates S3 artifact storage, CodeBuild project, IAM roles, CloudWatch Logs,
 * SNS notifications, and EventBridge rules for build failure detection.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ArtifactBucket } from './artifact-bucket';
import { CodeBuildProject } from './codebuild-project';
import { BuildNotifications } from './build-notifications';

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
 * Represents the main Pulumi component resource for the CodeBuild infrastructure.
 *
 * This component orchestrates the instantiation of:
 * - S3 bucket for build artifacts
 * - CodeBuild project with Node.js configuration
 * - IAM roles and policies
 * - CloudWatch Logs for build output
 * - SNS topic for notifications
 * - EventBridge rule for failure detection
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
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
    const tags = args.tags || {
      Environment: 'production',
      Team: 'devops',
    };

    // Create S3 bucket for build artifacts
    const artifactBucket = new ArtifactBucket(
      'artifact-bucket',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create CodeBuild project with IAM role and CloudWatch Logs
    const codeBuildProject = new CodeBuildProject(
      'codebuild-project',
      {
        environmentSuffix: environmentSuffix,
        artifactBucketName: artifactBucket.bucketName,
        artifactBucketArn: artifactBucket.bucketArn,
        tags: tags,
      },
      { parent: this }
    );

    // Create SNS topic and EventBridge rule for build failure notifications
    const buildNotifications = new BuildNotifications(
      'build-notifications',
      {
        environmentSuffix: environmentSuffix,
        codeBuildProjectArn: codeBuildProject.projectArn,
        tags: tags,
      },
      { parent: this }
    );

    // Export outputs
    this.artifactBucketName = artifactBucket.bucketName;
    this.codeBuildProjectName = codeBuildProject.projectName;
    this.snsTopicArn = buildNotifications.snsTopicArn;

    // Register the outputs of this component
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
