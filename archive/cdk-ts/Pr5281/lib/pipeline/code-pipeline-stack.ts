import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { SecurityConfig } from '../security/secrets-config';
import { BuildStage } from './build-stage';
import { DeployStage } from './deploy-stage';

export interface CodePipelineStackProps {
  config: any;
  removalPolicy: cdk.RemovalPolicy;
  securityConfig: SecurityConfig;
  appSourcePath: string;
  notificationLambda: cdk.aws_lambda_nodejs.NodejsFunction | undefined;
}

export class CodePipelineStack extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;
  public readonly sourceBucket: s3.Bucket;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id);

    const { config, removalPolicy, securityConfig, notificationLambda } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create artifacts bucket with versioning and encryption
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: resourceName('pipeline-artifacts'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
    });

    // Create source bucket for S3 webhook trigger
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: resourceName('pipeline-source'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      eventBridgeEnabled: true, // Enable EventBridge for webhook-like behavior
    });
    this.sourceBucket = sourceBucket;

    const deploySourceCode = this.deploySourceCode(props.appSourcePath);

    // Create ECR repository for Docker images
    this.ecrRepository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: resourceName('app-images'),
      imageTagMutability: ecr.TagMutability.MUTABLE,
      emptyOnDelete: removalPolicy === cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
      removalPolicy,
    });

    // Create pipeline role
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: resourceName('pipeline-role'),
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: this.createPipelinePolicy(
          this.artifactsBucket.bucketArn,
          sourceBucket.bucketArn,
          config.targetAccountId
        ),
      },
    });

    // Create build stage
    const buildStage = new BuildStage(this, 'BuildStage', {
      config,
      artifactsBucket: this.artifactsBucket,
      ecrRepository: this.ecrRepository,
      securityConfig,
      removalPolicy,
    });

    // Grant ECR permissions to CodeBuild role
    this.ecrRepository.grantPullPush(buildStage.buildProject.role!);

    // Create deploy stage
    const deployStage = new DeployStage(this, 'DeployStage', {
      config,
      ecrRepository: this.ecrRepository,
      removalPolicy,
    });

    if (notificationLambda) {
      deployStage.approvalTopic.addSubscription(
        new subscriptions.LambdaSubscription(notificationLambda)
      );
    }

    // Define pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: resourceName('pipeline'),
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceBucket,
              bucketKey: cdk.Fn.select(0, deploySourceCode.objectKeys),
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS, // Webhook-like trigger
            }),
          ],
        },
        // Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildTypeScriptApp',
              project: buildStage.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: { value: config.environmentSuffix },
                ARTIFACTS_BUCKET: { value: this.artifactsBucket.bucketName },
              },
            }),
          ],
        },
        // Test Stage
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'RunUnitTests',
              project: buildStage.testProject,
              input: buildOutput,
              outputs: [testOutput],
              runOrder: 1,
            }),
          ],
        },
        // Manual Approval Stage
        {
          stageName: 'Approval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ManualApproval',
              notificationTopic: deployStage.approvalTopic,
              additionalInformation: `Deploy to ${config.environmentSuffix} environment`,
              runOrder: 1,
            }),
          ],
        },
        // Deploy Stage
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.ElasticBeanstalkDeployAction({
              actionName: 'DeployToElasticBeanstalk',
              applicationName: deployStage.application.applicationName!,
              environmentName: deployStage.environment.environmentName!,
              input: buildOutput,
              runOrder: 1,
            }),
          ],
        },
      ],
    });
    this.pipeline.node.addDependency(deploySourceCode);

    // Add stack outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Name of the CodePipeline',
      exportName: `${resourceName('pipeline-name')}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'Name of the artifacts S3 bucket',
      exportName: `${resourceName('artifacts-bucket')}`,
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Name of the source S3 bucket',
      exportName: `${resourceName('source-bucket')}`,
    });

    new cdk.CfnOutput(this, 'PipelineRoleArn', {
      value: pipelineRole.roleArn,
      description: 'ARN of the pipeline IAM role',
      exportName: `${resourceName('pipeline-role-arn')}`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'URI of the ECR repository',
      exportName: `${resourceName('ecr-repository-uri')}`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: this.ecrRepository.repositoryName,
      description: 'Name of the ECR repository',
      exportName: `${resourceName('ecr-repository-name')}`,
    });
  }

  private createPipelinePolicy(
    artifactsBucketArn: string,
    sourceBucketArn: string,
    targetAccountId: string
  ): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [
            artifactsBucketArn,
            `${artifactsBucketArn}/*`,
            sourceBucketArn,
            `${sourceBucketArn}/*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [`arn:aws:iam::${targetAccountId}:role/*`],
          conditions: {
            StringEquals: {
              'iam:ResourceTag/AllowCrossAccountDeployment': 'true',
            },
          },
        }),
      ],
    });
  }

  private deploySourceCode(sourcePath: string): s3_deployment.BucketDeployment {
    const deploySourceCode = new s3_deployment.BucketDeployment(
      this,
      'DeploySourceCode',
      {
        sources: [s3_deployment.Source.asset(sourcePath)],
        destinationBucket: this.sourceBucket,
        extract: false,
        prune: false,
      }
    );
    return deploySourceCode;
  }
}
