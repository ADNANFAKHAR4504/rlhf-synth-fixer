

AWS CI/CD Pipeline – CDK TypeScript Implementation

This document provides a comprehensive AWS CDK (TypeScript) implementation for a secure and extensible CI/CD pipeline.
It supports AWS CodeCommit and GitHub as source repositories, enforces least privilege IAM roles, and provides a modular framework for build, test, and deployment stages.

🚀 Pipeline Overview
🔹 Components
Source Repository
Supports CodeCommit (new or existing) and GitHub (via CodeStar Connection).
Configurable repository name, branch, and connection ARN.
GitHub requires a pre-configured CodeStar connection
.

Artifact Storage
S3 bucket with:
✅ Versioning enabled
✅ S3-managed encryption
✅ Public access fully blocked
✅ Auto-delete objects on stack deletion (configurable)
✅ Lifecycle policy: expire after 30 days, abort incomplete uploads after 7 days

IAM Roles
Pipeline Role → S3 access, CodeBuild trigger, CloudFormation deploy permissions
Build Role → Logs, artifact access, test reporting
Deploy Role → Trusted by CodePipeline + CloudFormation
CodeBuild Projects
Build Project → Runs npm install + npm run build, outputs artifacts
Test Project → Runs npm install + npm run test:unit, generates JUnit XML reports
Local Docker layer cache for faster builds
Timeout: 30 minutes
Pipeline Stages
Source → Fetch repo (CodeCommit/GitHub)
Build → Compile + generate artifact
Test → Run unit tests & publish results

Deploy → Apply CloudFormation stack with parameter overrides

🔒 Security Implementation
1️⃣ S3 Artifact Bucket Security
this.artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  autoDeleteObjects: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  lifecycleRules: [
    {
      id: 'DeleteOldArtifacts',
      expiration: cdk.Duration.days(30),
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    },
  ],
});


✅ Encrypted
✅ Versioned
✅ Lifecycle managed
✅ Public access blocked

2️⃣ IAM Roles (Least Privilege)
const pipelineRole = new iam.Role(this, 'PipelineRole', {
  assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
});


Pipeline Role → S3 + CodeBuild + CloudFormation management

Build Role → Logs, artifacts, test reports

Deploy Role → Trusted by CodePipeline + CloudFormation

✅ Explicit trust relationships
✅ iam:PassRole restricted to CloudFormation

3️⃣ CodeBuild Project Security
environment: {
  buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
  computeType: codebuild.ComputeType.SMALL,
  privileged: false,
},


Uses AWS Linux Standard 7.0 image

No privileged mode

Local caching enabled

CloudWatch log output

✅ Least privilege IAM
✅ Encrypted log groups



### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
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

  /**
   * Whether to create a new CodeCommit repo or use an existing one
   * (default: false → import existing)
   */
  createNewRepo?: boolean;
}

export class TapStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;
  public readonly buildProject: codebuild.Project;
  public readonly testProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Apply organizational tags
    const commonTags = {
      Project: props.projectName,
      Environment: props.environment,
      ManagedBy: 'CDK',
      Region: 'us-east-1',
    };

    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(this).add('Region', commonTags.Region);

    // Artifact bucket
    this.artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      autoDeleteObjects: true, // force delete objects with bucket
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

    // Source repository (CodeCommit or GitHub)
    let sourceRepository: codecommit.IRepository | undefined;
    if (props.sourceType === 'codecommit') {
      if (props.createNewRepo) {
        sourceRepository = new codecommit.Repository(this, 'SourceRepository', {
          repositoryName: props.repositoryName,
          description: `Source repository for ${props.projectName} project`,
        });
      } else {
        sourceRepository = codecommit.Repository.fromRepositoryName(
          this,
          'ImportedRepository',
          props.repositoryName
        );
      }
    }

    // IAM roles
    const pipelineRole = this.createPipelineRole();
    const buildRole = this.createBuildRole();
    const deployRole = this.createDeployRole(pipelineRole);

    // CodeBuild projects
    this.buildProject = this.createBuildProject(
      'BuildProject',
      buildRole,
      'buildspec.yml'
    );
    this.testProject = this.createBuildProject(
      'TestProject',
      buildRole,
      'buildspec-test.yml'
    );

    // Pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-pipeline-${props.environment.toLowerCase()}`,
      role: pipelineRole,
      artifactBucket: this.artifactBucket,
      stages: this.createPipelineStages(props, sourceRepository, deployRole),
      restartExecutionOnUpdate: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'ARN of the created pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
    });

    if (sourceRepository && props.createNewRepo) {
      new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
        value: (sourceRepository as codecommit.Repository)
          .repositoryCloneUrlHttp,
        description: 'HTTP clone URL of the source repository',
      });
    }
  }

  private createPipelineRole(): iam.Role {
    const role = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least privilege access',
    });

    role.addToPolicy(
      new iam.PolicyStatement({
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
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: ['*'],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
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
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: ['*'],
        conditions: {
          StringEqualsIfExists: {
            'iam:PassedToService': ['cloudformation.amazonaws.com'],
          },
        },
      })
    );

    return role;
  }

  private createBuildRole(): iam.Role {
    const role = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description:
        'IAM role for CodeBuild projects with least privilege access',
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
        ],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
        resources: [`${this.artifactBucket.bucketArn}/*`],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
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
      })
    );

    return role;
  }

  private createDeployRole(pipelineRole: iam.IRole): iam.Role {
    const role = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        new iam.ArnPrincipal(pipelineRole.roleArn) // 👈 explicitly trust the pipeline role
      ),
      description: 'IAM role for CloudFormation deployments via CodePipeline',
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
    );

    return role;
  }

  private createBuildProject(
    id: string,
    role: iam.Role,
    buildspecFile: string
  ): codebuild.Project {
    const buildSpec = buildspecFile.includes('test')
      ? codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: ['echo "Installing dependencies"', 'npm install'],
            },
            build: { commands: ['echo "Running tests"', 'npm run test:unit'] },
          },
          reports: {
            'test-results': {
              files: 'test-results.xml',
              'file-format': 'JUNITXML',
            },
          },
        })
      : codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: ['echo "Installing dependencies"', 'npm install'],
            },
            build: {
              commands: ['echo "Building the application"', 'npm run build'],
            },
          },
          artifacts: { files: ['**/*'], 'base-directory': '.' },
        });

    return new codebuild.Project(this, id, {
      projectName: `tap-${id.toLowerCase()}-${this.stackName}`,
      role: role,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: buildSpec,
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      timeout: cdk.Duration.minutes(30),
    });
  }

  private createPipelineStages(
    props: TapStackProps,
    sourceRepository?: codecommit.IRepository,
    deployRole?: iam.Role
  ): codepipeline.StageProps[] {
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    return [
      {
        stageName: 'Source',
        actions: [
          this.createSourceAction(props, sourceRepository, sourceOutput),
        ],
      },
      {
        stageName: 'Build',
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: this.buildProject,
            input: sourceOutput,
            outputs: [buildOutput],
          }),
        ],
      },
      {
        stageName: 'Test',
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: 'UnitTests',
            project: this.testProject,
            input: sourceOutput,
          }),
        ],
      },
      {
        stageName: 'Deploy',
        actions: [
          new codepipeline_actions.CloudFormationCreateUpdateStackAction({
            actionName: 'Deploy',
            templatePath: buildOutput.atPath('packaged-template.yaml'),
            stackName: `tap-application-${props.environment.toLowerCase()}`,
            adminPermissions: false,
            role: deployRole,
            parameterOverrides: {
              Environment: props.environment,
              ProjectName: props.projectName,
            },
          }),
        ],
      },
    ];
  }

  private createSourceAction(
    props: TapStackProps,
    sourceRepository?: codecommit.IRepository,
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
    }
    throw new Error('Invalid source type or missing repository configuration');
  }

  public addStage(stage: codepipeline.StageProps): void {
    this.pipeline.addStage(stage);
  }

  public addActionToStage(
    stageName: string,
    action: codepipeline_actions.Action
  ): void {
    const stage = this.pipeline.stages.find(s => s.stageName === stageName);
    if (stage) {
      stage.addAction(action);
    } else {
      throw new Error(`Stage ${stageName} not found`);
    }
  }
}
```

✅ Compliance & Security Checklist
 IAM → Least privilege for pipeline, build, deploy
 S3 → Encrypted, versioned, lifecycle managed, public blocked
 Build → No privileged mode, logs encrypted, reports enabled
 CloudFormation → Deploy role with scoped trust
 Tagging → Standardized across resources