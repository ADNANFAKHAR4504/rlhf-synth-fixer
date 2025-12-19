/**
 * tap-stack.ts
 *
 * Main Pulumi stack for CI/CD Pipeline infrastructure.
 * Creates a multi-stage CodePipeline with GitHub integration.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodePipelineStack } from './codepipeline-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * GitHub repository owner (required for pipeline source)
   */
  githubOwner?: string;

  /**
   * GitHub repository name (required for pipeline source)
   */
  githubRepo?: string;

  /**
   * GitHub branch to monitor (default: main)
   */
  githubBranch?: string;

  /**
   * Email address for SNS notifications
   */
  notificationEmail?: string;
}

/**
 * Main Pulumi component resource for the CI/CD Pipeline infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};
    const githubOwner = args.githubOwner || 'example-owner';
    const githubRepo = args.githubRepo || 'example-repo';
    const githubBranch = args.githubBranch || 'main';
    const notificationEmail = args.notificationEmail || 'devops@example.com';

    // Create Lambda function for deployment target
    const lambdaStack = new LambdaStack(
      'lambda-stack',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create monitoring and notification infrastructure
    const monitoringStack = new MonitoringStack(
      'monitoring-stack',
      {
        environmentSuffix,
        tags,
        notificationEmail,
      },
      { parent: this }
    );

    // Create CodePipeline infrastructure
    const pipelineStack = new CodePipelineStack(
      'pipeline-stack',
      {
        environmentSuffix,
        tags,
        githubOwner,
        githubRepo,
        githubBranch,
        lambdaFunctionName: lambdaStack.functionName,
        snsTopicArn: monitoringStack.snsTopicArn,
      },
      { parent: this }
    );

    // Expose outputs
    this.pipelineArn = pipelineStack.pipelineArn;
    this.artifactBucketName = pipelineStack.artifactBucketName;
    this.lambdaFunctionArn = lambdaStack.functionArn;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      lambdaFunctionArn: this.lambdaFunctionArn,
    });
  }
}
