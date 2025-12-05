import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * TapStack - Complete CI/CD Pipeline for Node.js Application
 *
 * This stack creates a comprehensive CI/CD pipeline including:
 * - CodeCommit repository for source control
 * - CodeBuild project for building and testing
 * - CodePipeline with Source, Build, and Deploy stages
 * - S3 bucket for artifact storage
 * - IAM roles with least privilege access
 * - CloudWatch Logs for build monitoring
 */
export class TapStack extends cdk.Stack {
  public readonly repository: codecommit.Repository;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildProject: codebuild.Project;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 1. Create CodeCommit Repository
    // This repository will store the Node.js application source code
    this.repository = new codecommit.Repository(this, 'AppRepository', {
      repositoryName: `nodejs-app-repo-${environmentSuffix}`,
      description: `Node.js application repository for CI/CD pipeline (${environmentSuffix})`,
    });

    // 2. Create S3 Bucket for Build Artifacts
    // Versioning is enabled as required for artifact history and rollback capability
    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}-${this.account}`,
      versioned: true, // Required: Enable versioning for artifacts
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow cleanup in non-prod environments
      autoDeleteObjects: true, // Clean up objects on bucket deletion
      lifecycleRules: [
        {
          // Automatically clean up old artifact versions after 30 days
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // 3. Create CloudWatch Log Group for CodeBuild
    // Log retention set to 7 days as specified in requirements
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/nodejs-app-build-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK, // 7 days as required
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. Create IAM Role for CodeBuild with Least Privilege
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `codebuild-nodejs-app-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild project with least privilege access',
    });

    // Grant minimal permissions to CodeBuild
    // Only what's needed for build, test, and artifact upload
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLogsAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          buildLogGroup.logGroupArn,
          `${buildLogGroup.logGroupArn}:*`,
        ],
      })
    );

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3ArtifactAccess',
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
        resources: [
          this.artifactBucket.bucketArn,
          `${this.artifactBucket.bucketArn}/*`,
        ],
      })
    );

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CodeCommitAccess',
        effect: iam.Effect.ALLOW,
        actions: ['codecommit:GitPull'],
        resources: [this.repository.repositoryArn],
      })
    );

    // 5. Create CodeBuild Project
    // Configured to run npm install, npm test, and npm build
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `nodejs-app-build-${environmentSuffix}`,
      description:
        'Build project for Node.js application with automated testing',
      role: codeBuildRole,
      source: codebuild.Source.codeCommit({
        repository: this.repository,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId(
          'aws/codebuild/standard:6.0'
        ), // Required: standard:6.0 image
        computeType: codebuild.ComputeType.SMALL, // Cost-effective for Node.js builds
        privileged: false, // No Docker daemon access needed
        environmentVariables: {
          NODE_ENV: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 'production', // Required: NODE_ENV=production
          },
          ARTIFACT_BUCKET: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.artifactBucket.bucketName,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18', // Use Node.js 18 LTS
            },
            commands: [
              'echo "Installing dependencies..."',
              'npm install', // Required: npm install
            ],
          },
          pre_build: {
            commands: [
              'echo "Running tests..."',
              'npm test', // Required: npm test
            ],
          },
          build: {
            commands: [
              'echo "Building application..."',
              'npm run build', // Required: npm build
              'echo "Build completed successfully"',
            ],
          },
          post_build: {
            commands: ['echo "Build finished at $(date)"'],
          },
        },
        artifacts: {
          files: ['**/*'],
          'exclude-paths': ['node_modules/**/*', '.git/**/*'],
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
      timeout: cdk.Duration.minutes(15), // Required: 15-minute timeout
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
          enabled: true,
        },
      },
      cache: codebuild.Cache.local(
        codebuild.LocalCacheMode.SOURCE,
        codebuild.LocalCacheMode.CUSTOM
      ),
    });

    // 6. Create IAM Role for CodePipeline with Least Privilege
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `codepipeline-nodejs-app-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least privilege access',
    });

    // Grant minimal permissions to CodePipeline
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CodeCommitAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'codecommit:GetBranch',
          'codecommit:GetCommit',
          'codecommit:UploadArchive',
          'codecommit:GetUploadArchiveStatus',
          'codecommit:CancelUploadArchive',
        ],
        resources: [this.repository.repositoryArn],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3ArtifactAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: [
          this.artifactBucket.bucketArn,
          `${this.artifactBucket.bucketArn}/*`,
        ],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CodeBuildAccess',
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: [this.buildProject.projectArn],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFormationAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DeleteStack',
          'cloudformation:UpdateStack',
          'cloudformation:CreateChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:SetStackPolicy',
        ],
        resources: [
          `arn:aws:cloudformation:${this.region}:${this.account}:stack/nodejs-app-*`,
        ],
      })
    );

    // IAM PassRole permission for CloudFormation
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'IAMPassRole',
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'cloudformation.amazonaws.com',
          },
        },
      })
    );

    // 7. Create Artifacts for Pipeline Stages
    const sourceOutput = new codepipeline.Artifact('SourceArtifact');
    const buildOutput = new codepipeline.Artifact('BuildArtifact');

    // 8. Create CloudFormation Role for Deploy Stage
    const cfnRole = new iam.Role(this, 'CloudFormationRole', {
      roleName: `cloudformation-deploy-role-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        pipelineRole
      ),
      description: 'IAM role for CloudFormation deployments',
      managedPolicies: [
        // Grant necessary permissions for CloudFormation to create/update resources
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
      ],
    });

    // 9. Create CodePipeline with Three Stages
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `nodejs-app-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: true,
      stages: [
        {
          // Stage 1: Source - CodeCommit Repository
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: this.repository,
              branch: 'main', // Required: Trigger on main branch commits
              output: sourceOutput,
              trigger: codepipeline_actions.CodeCommitTrigger.EVENTS, // Required: Auto-trigger on commits
              variablesNamespace: 'SourceVariables',
            }),
          ],
        },
        {
          // Stage 2: Build - CodeBuild Project
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild_Build',
              project: this.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              variablesNamespace: 'BuildVariables',
            }),
          ],
        },
        {
          // Stage 3: Deploy - CloudFormation
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'CloudFormation_Deploy',
              stackName: `nodejs-app-stack-${environmentSuffix}`,
              templatePath: buildOutput.atPath('cloudformation-template.json'),
              adminPermissions: false,
              role: cfnRole,
              deploymentRole: cfnRole,
              cfnCapabilities: [
                cdk.CfnCapabilities.NAMED_IAM,
                cdk.CfnCapabilities.AUTO_EXPAND,
              ],
              parameterOverrides: {
                EnvironmentSuffix: environmentSuffix,
              },
              variablesNamespace: 'DeployVariables',
            }),
          ],
        },
      ],
    });

    // 10. Outputs
    // Export important resource identifiers for reference
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      description: 'CodeCommit repository clone URL (HTTPS)',
      value: this.repository.repositoryCloneUrlHttp,
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlSsh', {
      description: 'CodeCommit repository clone URL (SSH)',
      value: this.repository.repositoryCloneUrlSsh,
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      description: 'CodePipeline ARN',
      value: this.pipeline.pipelineArn,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      description: 'CodePipeline name',
      value: this.pipeline.pipelineName,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      description: 'S3 bucket for build artifacts',
      value: this.artifactBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      description: 'CodeBuild project name',
      value: this.buildProject.projectName,
    });

    new cdk.CfnOutput(this, 'BuildLogGroupName', {
      description: 'CloudWatch log group for builds',
      value: buildLogGroup.logGroupName,
    });

    // Add tags for resource tracking
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'NodeJS-CICD');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
