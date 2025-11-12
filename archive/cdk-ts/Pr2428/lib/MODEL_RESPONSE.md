
## Project Structure

```
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   ├── tapstack.test.ts
│   └── pipeline-integration.test.ts
├── buildspec.yml
├── buildspec-test.yml
└── package.json (updated dependencies)
```

## 1. Main Stack Definition (`lib/tapstack.ts`)

```typescript
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
```

## 2. CDK App Entry Point (`bin/tap.ts`)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tapstack';

const app = new cdk.App();

// Get configuration from context or environment variables
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'Dev';
const sourceType = app.node.tryGetContext('sourceType') || 'codecommit';
const repositoryName = app.node.tryGetContext('repositoryName') || 'tap-source-repo';
const branch = app.node.tryGetContext('branch') || 'main';
const githubConnectionArn = app.node.tryGetContext('githubConnectionArn');
const projectName = 'IaC - AWS Nova Model Breaking';

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  sourceType: sourceType as 'codecommit' | 'github',
  repositoryName,
  branch,
  githubConnectionArn,
  environment,
  projectName,
  description: `CI/CD Pipeline for ${projectName} - ${environment} environment`,
});

app.synth();
```

## 3. Build Specification Files

### `buildspec.yml` (Build Stage)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo Installing dependencies...
      - npm ci
      
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Build started on `date`
      - echo Installing AWS CDK...
      - npm install -g aws-cdk
      
  build:
    commands:
      - echo Build started on `date`
      - echo Compiling TypeScript...
      - npm run build
      - echo Synthesizing CDK app...
      - cdk synth --output cdk.out
      - echo Packaging CloudFormation template...
      - aws cloudformation package --template-file cdk.out/TapStack.template.json --s3-bucket $CODEBUILD_SOURCE_REPO_URL --output-template-file packaged-template.yaml
      
  post_build:
    commands:
      - echo Build completed on `date`

artifacts:
  files:
    - packaged-template.yaml
    - cdk.out/**/*
  name: BuildArtifacts

cache:
  paths:
    - node_modules/**/*
```

### `buildspec-test.yml` (Test Stage)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo Installing dependencies...
      - npm ci
      
  pre_build:
    commands:
      - echo Pre-build phase started on `date`
      
  build:
    commands:
      - echo Running unit tests...
      - npm test
      - echo Running linting...
      - npm run lint
      - echo Running security audit...
      - npm audit --audit-level moderate
      
  post_build:
    commands:
      - echo Tests completed on `date`

reports:
  jest_reports:
    files:
      - coverage/lcov.info
    base-directory: coverage
    file-format: CLOVER

cache:
  paths:
    - node_modules/**/*
```

## 4. Unit Tests (`test/tapstack.test.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tapstack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'test-repo',
      environment: 'Test',
      projectName: 'Test Project',
    });
    template = Template.fromStack(stack);
  });

  test('Creates CodePipeline with correct stages', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
        }),
        Match.objectLike({
          Name: 'Build',
        }),
        Match.objectLike({
          Name: 'Test',
        }),
        Match.objectLike({
          Name: 'Deploy',
        }),
      ]),
    });
  });

  test('Creates S3 bucket for artifacts', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Creates CodeBuild projects for build and test', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 2);
    
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: 'aws/codebuild/standard:7.0',
        Type: 'LINUX_CONTAINER',
        ComputeType: 'BUILD_GENERAL1_SMALL',
      },
    });
  });

  test('Creates CodeCommit repository when sourceType is codecommit', () => {
    template.hasResourceProperties('AWS::CodeCommit::Repository', {
      RepositoryName: 'test-repo',
    });
  });

  test('Creates IAM roles with least privilege', () => {
    // Pipeline role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codepipeline.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    // Build role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    // Deploy role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudformation.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  test('Applies organizational tags to resources', () => {
    const resources = template.findResources('AWS::CodePipeline::Pipeline');
    const pipelineLogicalId = Object.keys(resources)[0];
    
    template.hasResource('AWS::CodePipeline::Pipeline', {
      Properties: Match.anyValue(),
      Metadata: Match.objectLike({
        'aws:cdk:path': Match.stringLikeRegexp('TestTapStack'),
      }),
    });
  });

  test('Creates CloudFormation deployment action', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Deploy',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
                Version: '1',
              },
              Configuration: Match.objectLike({
                ActionMode: 'CREATE_UPDATE',
                StackName: 'tap-application-test',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Throws error for GitHub source without connection ARN', () => {
    expect(() => {
      new TapStack(app, 'TestGitHubStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        sourceType: 'github',
        repositoryName: 'owner/repo',
        environment: 'Test',
        projectName: 'Test Project',
      });
    }).toThrow('GitHub connection ARN is required for GitHub source');
  });

  test('Creates GitHub source action when properly configured', () => {
    const githubStack = new TapStack(app, 'TestGitHubStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'github',
      repositoryName: 'owner/repo',
      environment: 'Test',
      projectName: 'Test Project',
      githubConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
    });

    const githubTemplate = Template.fromStack(githubStack);
    
    githubTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Provider: 'CodeStarSourceConnection',
                Version: '1',
              },
              Configuration: Match.objectLike({
                ConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
                FullRepositoryId: 'owner/repo',
                BranchName: 'main',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Extensibility - can add new stages', () => {
    const newStage: cdk.aws_codepipeline.StageProps = {
      stageName: 'Integration',
      actions: [
        new cdk.aws_codepipeline_actions.ManualApprovalAction({
          actionName: 'ManualApproval',
        }),
      ],
    };

    expect(() => {
      stack.addStage(newStage);
    }).not.toThrow();
  });
});
```

## 5. Integration Tests (`test/pipeline-integration.test.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tapstack';

describe('Pipeline Integration Tests', () => {
  test('End-to-end pipeline configuration is valid', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'IntegrationTestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'integration-test-repo',
      environment: 'Integration',
      projectName: 'Integration Test Project',
    });

    const template = Template.fromStack(stack);

    // Verify pipeline has all required stages in correct order
    const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
    const pipelineProps = Object.values(pipeline)[0].Properties;
    const stages = pipelineProps.Stages;

    expect(stages).toHaveLength(4);
    expect(stages[0].Name).toBe('Source');
    expect(stages[1].Name).toBe('Build');
    expect(stages[2].Name).toBe('Test');
    expect(stages[3].Name).toBe('Deploy');
  });

  test('IAM permissions are correctly configured for cross-service access', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'PermissionTestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'permission-test-repo',
      environment: 'Test',
      projectName: 'Permission Test Project',
    });

    const template = Template.fromStack(stack);

    // Verify pipeline role has necessary permissions
    const pipelineRole = template.findResources('AWS::IAM::Role', {
      Properties: {
        AssumedRolePolicy: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      },
    });

    expect(Object.keys(pipelineRole)).toHaveLength(1);

    // Verify build role has CloudWatch Logs permissions
    const buildRole = template.findResources('AWS::IAM::Role', {
      Properties: {
        AssumedRolePolicy: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      },
    });

    expect(Object.keys(buildRole)).toHaveLength(1);
  });

  test('S3 bucket lifecycle and security configuration', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'S3TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 's3-test-repo',
      environment: 'Test',
      projectName: 'S3 Test Project',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'DeleteOldArtifacts',
            Status: 'Enabled',
            ExpirationInDays: 30,
            AbortIncompleteMultipartUpload: {
              DaysAfterInitiation: 7,
            },
          },
        ],
      },
    });
  });

  test('CodeBuild projects have appropriate timeout and caching', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'CodeBuildTestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'codebuild-test-repo',
      environment: 'Test',
      projectName: 'CodeBuild Test Project',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CodeBuild::Project', {
      TimeoutInMinutes: 30,
      Cache: {
        Type: 'LOCAL',
        Modes: ['LOCAL_DOCKER_LAYER_CACHE'],
      },
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Image: 'aws/codebuild/standard:7.0',
        Type: 'LINUX_CONTAINER',
        PrivilegedMode: false,
      },
    });
  });

  test('Pipeline extensibility methods work correctly', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'ExtensibilityTestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'extensibility-test-repo',
      environment: 'Test',
      projectName: 'Extensibility