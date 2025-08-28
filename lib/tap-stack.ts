import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as cloudformation from 'aws-cdk-lib/aws-cloudformation';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  /**
   * The source repository type ('codecommit' or 'github')
   */
  sourceType: 'codecommit' | 'github';

  /**
   * Repository name or GitHub repo (owner/repo format for GitHub)
   */
  repositoryName: string;

  /**
   * Branch to track (default: 'main')
   */
  branch?: string;

  /**
   * GitHub connection ARN (required for GitHub source)
   */
  githubConnectionArn?: string;

  /**
   * Environment name for tagging
   */
  environment: string;

  /**
   * Project name for tagging
   */
  projectName: string;
}

export class TapStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;
  public readonly buildProject: codebuild.Project;
  public readonly testProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Apply organizational tags to all resources in this stack
    const commonTags = {
      'Project': props.projectName,
      'Environment': props.environment,
      'ManagedBy': 'CDK',
      'Region': 'us-east-1'
    };

    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(this).add('Region', commonTags.Region);

    // Create S3 bucket for pipeline artifacts
    this.artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `tap-pipeline-artifacts-${props.environment.toLowerCase()}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Create CodeCommit repository if using CodeCommit as source
    let sourceRepository: codecommit.Repository | undefined;
    if (props.sourceType === 'codecommit') {
      sourceRepository = new codecommit.Repository(this, 'SourceRepository', {
        repositoryName: props.repositoryName,
        description: `Source repository for ${props.projectName} project`,
      });
    }

    // Create IAM roles with least privilege
    const pipelineRole = this.createPipelineRole();
    const buildRole = this.createBuildRole();
    const deployRole = this.createDeployRole();

    // Create CodeBuild projects
    this.buildProject = this.createBuildProject('BuildProject', buildRole, 'buildspec.yml');
    this.testProject = this.createBuildProject('TestProject', buildRole, 'buildspec-test.yml');

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-pipeline-${props.environment.toLowerCase()}`,
      role: pipelineRole,
      artifactBucket: this.artifactBucket,
      stages: this.createPipelineStages(props, sourceRepository, deployRole),
      restartExecutionOnUpdate: true,
    });

    // Output important ARNs and names
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'ARN of the created pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
    });

    if (sourceRepository) {
      new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
        value: sourceRepository.repositoryCloneUrlHttp,
        description: 'HTTP clone URL of the source repository',
      });
    }
  }

  private createPipelineRole(): iam.Role {
    const role = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least privilege access',
    });

    // Least privilege policy for pipeline
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetBucketVersioning',
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
      ],
      resources: [
        this.artifactBucket.bucketArn,
        `${this.artifactBucket.bucketArn}/*`,
      ],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: ['*'], // Will be refined after build projects are created
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudformation:CreateStack',
        'cloudformation:DeleteStack',
        'cloudformation:DescribeStacks',
        'cloudformation:UpdateStack',
        'cloudformation:CreateChangeSet',
        'cloudformation:DeleteChangeSet',
        'cloudformation:DescribeChangeSet',
        'cloudformation:ExecuteChangeSet',
        'cloudformation:SetStackPolicy',
        'cloudformation:ValidateTemplate',
      ],
      resources: ['*'],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'iam:PassRole',
      ],
      resources: ['*'],
      conditions: {
        StringEqualsIfExists: {
          'iam:PassedToService': [
            'cloudformation.amazonaws.com',
          ],
        },
      },
    }));

    return role;
  }

  private createBuildRole(): iam.Role {
    const role = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild projects with least privilege access',
    });

    // CloudWatch Logs permissions
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
      ],
    }));

    // S3 permissions for artifacts
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
      ],
      resources: [
        `${this.artifactBucket.bucketArn}/*`,
      ],
    }));

    // CodeBuild report permissions (for test results)
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codebuild:CreateReportGroup',
        'codebuild:CreateReport',
        'codebuild:UpdateReport',
        'codebuild:BatchPutTestCases',
        'codebuild:BatchPutCodeCoverages',
      ],
      resources: [
        `arn:aws:codebuild:${this.region}:${this.account}:report-group/*`,
      ],
    }));

    return role;
  }

  private createDeployRole(): iam.Role {
    const role = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      description: 'IAM role for CloudFormation deployments',
    });

    // Add necessary permissions for your application deployment
    // This is a basic set - customize based on your application needs
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
    );

    // For production, replace PowerUserAccess with specific permissions
    // Example for common AWS services:
    /*
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:*',
        'apigateway:*',
        'dynamodb:*',
        's3:*',
        'iam:CreateRole',
        'iam:DeleteRole',
        'iam:AttachRolePolicy',
        'iam:DetachRolePolicy',
        'iam:PassRole',
      ],
      resources: ['*'],
    }));
    */

    return role;
  }

  private createBuildProject(id: string, role: iam.Role, buildspecFile: string): codebuild.Project {
    return new codebuild.Project(this, id, {
      projectName: `tap-${id.toLowerCase()}-${this.stackName}`,
      role: role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(buildspecFile),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      timeout: cdk.Duration.minutes(30),
    });
  }

  private createPipelineStages(
    props: TapStackProps,
    sourceRepository?: codecommit.Repository,
    deployRole?: iam.Role
  ): codepipeline.StageProps[] {
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    const stages: codepipeline.StageProps[] = [
      // Source Stage
      {
        stageName: 'Source',
        actions: [this.createSourceAction(props, sourceRepository, sourceOutput)],
      },

      // Build Stage
      {
        stageName: 'Build',
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: this.buildProject,
            input: sourceOutput,
            outputs: [buildOutput],
            runOrder: 1,
          }),
        ],
      },

      // Test Stage
      {
        stageName: 'Test',
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: 'UnitTests',
            project: this.testProject,
            input: sourceOutput,
            runOrder: 1,
          }),
        ],
      },

      // Deploy Stage
      {
        stageName: 'Deploy',
        actions: [
          new codepipeline_actions.CloudFormationCreateUpdateStackAction({
            actionName: 'Deploy',
            templatePath: buildOutput.atPath('packaged-template.yaml'),
            stackName: `tap-application-${props.environment.toLowerCase()}`,
            adminPermissions: false,
            role: deployRole,
            runOrder: 1,
            parameterOverrides: {
              Environment: props.environment,
              ProjectName: props.projectName,
            },
          }),
        ],
      },
    ];

    return stages;
  }

  private createSourceAction(
    props: TapStackProps,
    sourceRepository?: codecommit.Repository,
    output?: codepipeline.Artifact
  ): codepipeline_actions.Action {
    if (props.sourceType === 'codecommit' && sourceRepository) {
      return new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'Source',
        repository: sourceRepository,
        branch: props.branch || 'main',
        output: output!,
      });
    } else if (props.sourceType === 'github') {
      if (!props.githubConnectionArn) {
        throw new Error('GitHub connection ARN is required for GitHub source');
      }

      return new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'Source',
        owner: props.repositoryName.split('/')[0],
        repo: props.repositoryName.split('/')[1],
        branch: props.branch || 'main',
        output: output!,
        connectionArn: props.githubConnectionArn,
      });
    } else {
      throw new Error('Invalid source type or missing repository configuration');
    }
  }

  /**
   * Add a new stage to the pipeline (for extensibility)
   */
  public addStage(stage: codepipeline.StageProps): void {
    this.pipeline.addStage(stage);
  }

  /**
   * Add a new action to an existing stage (for extensibility)
   */
  public addActionToStage(stageName: string, action: codepipeline_actions.Action): void {
    const stage = this.pipeline.stages.find(s => s.stageName === stageName);
    if (stage) {
      stage.addAction(action);
    } else {
      throw new Error(`Stage ${stageName} not found`);
    }
  }
}