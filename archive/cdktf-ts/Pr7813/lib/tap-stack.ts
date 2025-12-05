/**
 * Main TapStack component for CI/CD Pipeline Infrastructure
 *
 * This stack creates a complete CI/CD pipeline for containerized microservices with:
 * - CodePipeline with Source, Build, Test, and Deploy stages
 * - CodeBuild projects for unit tests and Docker image builds
 * - S3 bucket for artifact storage with encryption
 * - SNS notifications for pipeline state changes
 * - CodeDeploy for ECS blue-green deployments
 * - Manual approval gates for production deployment
 * - CloudWatch logging with proper retention
 * - IAM roles with least privilege access
 */
import * as pulumi from '@pulumi/pulumi';
import { IamStack } from './iam-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';
import { CodeBuildStack } from './codebuild-stack';
import { SnsStack } from './sns-stack';
import { CodeDeployStack } from './codedeploy-stack';
import { CodePipelineStack } from './codepipeline-stack';
import { SecretsStack } from './secrets-stack';

export interface TapStackArgs {
  environmentSuffix: string;
  region?: string;
  githubRepo: string;
  githubBranch: string;
  githubOwner: string;
  notificationEmail: string;
  ecsClusterName: string;
  ecsServiceName: string;
  ecsBlueTargetGroupName: string;
  ecsGreenTargetGroupName: string;
  albListenerArn: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly unitTestProjectArn: pulumi.Output<string>;
  public readonly dockerBuildProjectArn: pulumi.Output<string>;
  public readonly codeDeployApplicationArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:TapStack', name, args, opts);

    const region = args.region || 'us-east-2';

    const defaultTags = {
      Environment: args.environmentSuffix,
      Project: 'payment-processing-cicd',
      CostCenter: 'fintech-operations',
      ManagedBy: 'pulumi',
      ...args.tags,
    };

    // 1. Secrets Stack - Fetch existing Docker registry credentials
    const secretsStack = new SecretsStack(
      'secrets-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. IAM Stack - Create roles for CodePipeline, CodeBuild, and CodeDeploy
    const iamStack = new IamStack(
      'iam-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. S3 Stack - Artifact storage with encryption and lifecycle rules
    const s3Stack = new S3Stack(
      's3-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. CloudWatch Stack - Log groups for CodeBuild projects
    const cloudWatchStack = new CloudWatchStack(
      'cloudwatch-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. CodeBuild Stack - Unit test and Docker build projects
    const codeBuildStack = new CodeBuildStack(
      'codebuild-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        serviceRole: iamStack.codeBuildRoleArn,
        artifactBucket: s3Stack.artifactBucketName,
        unitTestLogGroup: cloudWatchStack.unitTestLogGroupName,
        dockerBuildLogGroup: cloudWatchStack.dockerBuildLogGroupName,
        dockerRegistrySecretArn: secretsStack.dockerRegistrySecretArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 6. SNS Stack - Pipeline failure notifications
    const snsStack = new SnsStack(
      'sns-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        notificationEmail: args.notificationEmail,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. CodeDeploy Stack - ECS blue-green deployments
    // Note: ECS cluster, service, ALB, and target groups are prerequisites
    // and must be created separately before deploying this CI/CD pipeline
    const codeDeployStack = new CodeDeployStack(
      'codedeploy-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        serviceRole: iamStack.codeDeployRoleArn,
        ecsClusterName: args.ecsClusterName,
        ecsServiceName: args.ecsServiceName,
        ecsBlueTargetGroupName: args.ecsBlueTargetGroupName,
        ecsGreenTargetGroupName: args.ecsGreenTargetGroupName,
        albListenerArn: args.albListenerArn,
        snsTopicArn: snsStack.topicArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 9. CodePipeline Stack - Orchestrate the entire pipeline
    const codePipelineStack = new CodePipelineStack(
      'codepipeline-stack',
      {
        environmentSuffix: args.environmentSuffix,
        region,
        serviceRole: iamStack.codePipelineRoleArn,
        artifactBucket: s3Stack.artifactBucketName,
        githubRepo: args.githubRepo,
        githubBranch: args.githubBranch,
        githubOwner: args.githubOwner,
        unitTestProjectName: codeBuildStack.unitTestProjectName,
        dockerBuildProjectName: codeBuildStack.dockerBuildProjectName,
        codeDeployApplicationName: codeDeployStack.applicationName,
        codeDeployDeploymentGroupName: codeDeployStack.deploymentGroupName,
        snsTopicArn: snsStack.topicArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Export stack outputs
    this.pipelineArn = codePipelineStack.pipelineArn;
    this.artifactBucketName = s3Stack.artifactBucketName;
    this.unitTestProjectArn = codeBuildStack.unitTestProjectArn;
    this.dockerBuildProjectArn = codeBuildStack.dockerBuildProjectArn;
    this.codeDeployApplicationArn = codeDeployStack.applicationArn;
    this.snsTopicArn = snsStack.topicArn;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      unitTestProjectArn: this.unitTestProjectArn,
      dockerBuildProjectArn: this.dockerBuildProjectArn,
      codeDeployApplicationArn: this.codeDeployApplicationArn,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
