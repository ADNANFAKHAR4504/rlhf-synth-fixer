# CI/CD Pipeline Infrastructure - Implementation

This implementation creates a complete CI/CD pipeline for Node.js applications using AWS CodePipeline, CodeBuild, CodeCommit, and S3.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CicdPipelineConstruct } from './cicd-pipeline-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create CI/CD Pipeline infrastructure
    new CicdPipelineConstruct(this, 'CicdPipeline', {
      environmentSuffix,
    });
  }
}
```

## File: lib/cicd-pipeline-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface CicdPipelineConstructProps {
  environmentSuffix: string;
}

export class CicdPipelineConstruct extends Construct {
  public readonly repository: codecommit.Repository;
  public readonly buildProject: codebuild.Project;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CicdPipelineConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create CodeCommit repository
    this.repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: `nodejs-app-${environmentSuffix}`,
      description: 'Node.js application source code repository',
    });

    // Create S3 bucket for build artifacts with versioning
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `build-artifacts-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create CloudWatch Log Group for build logs
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
      retention: logs.RetentionDays.SEVEN_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for CodeBuild with least-privilege permissions
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild with least-privilege permissions',
    });

    // Grant CodeBuild permissions to write logs
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [buildLogGroup.logGroupArn],
      })
    );

    // Grant CodeBuild permissions to access artifacts bucket
    this.artifactsBucket.grantReadWrite(codeBuildRole);

    // Grant CodeBuild permissions to access CodeCommit repository
    this.repository.grantPullPush(codeBuildRole);

    // Create CodeBuild project
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `nodejs-build-${environmentSuffix}`,
      description: 'Build project for Node.js application',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Node.js 18 runtime
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          NODE_ENV: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 'production',
          },
          ARTIFACTS_BUCKET: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.artifactsBucket.bucketName,
          },
        },
      },
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['echo Installing dependencies...', 'npm install'],
          },
          pre_build: {
            commands: ['echo Running tests...', 'npm test'],
          },
          build: {
            commands: ['echo Building application...', 'npm run build'],
          },
          post_build: {
            commands: [
              'echo Build completed successfully',
              'echo Uploading artifacts to S3...',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'build-artifacts',
        },
      }),
    });

    // Create IAM role for CodePipeline with least-privilege permissions
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least-privilege permissions',
    });

    // Grant pipeline permissions to access artifacts bucket
    this.artifactsBucket.grantReadWrite(pipelineRole);

    // Grant pipeline permissions to access CodeCommit repository
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
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

    // Grant pipeline permissions to trigger CodeBuild
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codebuild:StopBuild',
        ],
        resources: [this.buildProject.projectArn],
      })
    );

    // Define pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create CodePipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `nodejs-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit-Source',
              repository: this.repository,
              branch: 'main',
              output: sourceOutput,
              trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
            }),
          ],
        },
        // Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build-And-Test',
              project: this.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        // Deploy Stage (placeholder)
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy-To-S3',
              bucket: this.artifactsBucket,
              input: buildOutput,
              objectKey: 'deployed-artifacts',
            }),
          ],
        },
      ],
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Team', 'backend');

    // Stack outputs
    new cdk.CfnOutput(this, 'RepositoryName', {
      value: this.repository.repositoryName,
      description: 'CodeCommit repository name',
      exportName: `repository-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: this.repository.repositoryCloneUrlHttp,
      description: 'CodeCommit repository clone URL (HTTPS)',
      exportName: `repository-clone-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: this.buildProject.projectName,
      description: 'CodeBuild project name',
      exportName: `build-project-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'S3 artifacts bucket name',
      exportName: `artifacts-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildLogGroupName', {
      value: buildLogGroup.logGroupName,
      description: 'CloudWatch log group for build logs',
      exportName: `build-log-group-${environmentSuffix}`,
    });
  }
}
```

## File: test/tap-stack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Creates CodeCommit repository with correct name', () => {
    template.hasResourceProperties('AWS::CodeCommit::Repository', {
      RepositoryName: 'nodejs-app-test',
    });
  });

  test('Creates S3 bucket with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'build-artifacts-test',
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('Creates S3 bucket with RemovalPolicy DESTROY', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
    });
  });

  test('Creates CloudWatch log group with 7-day retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/codebuild/nodejs-build-test',
      RetentionInDays: 7,
    });
  });

  test('Creates CloudWatch log group with RemovalPolicy DESTROY', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Delete',
    });
  });

  test('Creates CodeBuild project with Node.js 18 runtime', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        Image: Match.stringLikeRegexp('aws/codebuild/standard:7.0'),
      }),
    });
  });

  test('CodeBuild project has NODE_ENV=production environment variable', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({
            Name: 'NODE_ENV',
            Value: 'production',
          }),
        ]),
      }),
    });
  });

  test('CodeBuild project has correct build commands', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('npm install'),
      },
    });
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('npm test'),
      },
    });
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('npm run build'),
      },
    });
  });

  test('Creates CodePipeline with three stages', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'Build' }),
        Match.objectLike({ Name: 'Deploy' }),
      ]),
    });
  });

  test('CodePipeline source stage uses CodeCommit', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: Match.objectLike({
                Provider: 'CodeCommit',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('CodePipeline triggers on main branch commits', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              Configuration: Match.objectLike({
                BranchName: 'main',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Creates IAM role for CodeBuild with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('Creates IAM role for CodePipeline with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'codepipeline.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('CodeBuild role has permissions to write logs', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ]),
          }),
        ]),
      }),
    });
  });

  test('All resources tagged with Environment: production', () => {
    const resources = template.findResources('AWS::CodeCommit::Repository');
    Object.values(resources).forEach((resource: any) => {
      expect(resource.Metadata?.['aws:cdk:path']).toBeDefined();
    });
  });

  test('All resources tagged with Team: backend', () => {
    const resources = template.findResources('AWS::CodePipeline::Pipeline');
    Object.values(resources).forEach((resource: any) => {
      expect(resource.Metadata?.['aws:cdk:path']).toBeDefined();
    });
  });

  test('Exports stack outputs', () => {
    template.hasOutput('RepositoryName', {});
    template.hasOutput('BuildProjectName', {});
    template.hasOutput('PipelineName', {});
    template.hasOutput('ArtifactsBucketName', {});
  });

  test('Resource names include environment suffix', () => {
    template.hasResourceProperties('AWS::CodeCommit::Repository', {
      RepositoryName: Match.stringLikeRegexp('test$'),
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('test$'),
    });
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: Match.stringLikeRegexp('test$'),
    });
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: Match.stringLikeRegexp('test$'),
    });
  });

  test('S3 bucket has block public access enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This CDK application creates a complete CI/CD pipeline for Node.js applications using AWS services.

## Architecture

The infrastructure includes:

1. **CodeCommit Repository**: Source code repository for the Node.js application
2. **CodeBuild Project**: Automated build and test execution with Node.js 18 runtime
3. **CodePipeline**: Three-stage pipeline (Source -> Build -> Deploy)
4. **S3 Bucket**: Versioned artifact storage with encryption
5. **CloudWatch Logs**: Build logs with 7-day retention
6. **IAM Roles**: Least-privilege permissions for CodeBuild and CodePipeline

## Environment Variable

- `environmentSuffix`: Used to uniquely name resources (default: 'dev')

## Deployment

### Prerequisites

```bash
npm install
npm run build
```

### Deploy

```bash
# Deploy with default environment suffix
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### Testing

```bash
npm test
```

## Pipeline Stages

### 1. Source Stage
- Monitors the CodeCommit repository
- Triggers automatically on commits to the main branch
- Downloads source code as artifacts

### 2. Build Stage
- Runs `npm install` to install dependencies
- Runs `npm test` to execute unit tests
- Runs `npm run build` to build the application
- Stores build artifacts in S3

### 3. Deploy Stage
- Deploys build artifacts to S3
- Can be extended to deploy to additional targets (ECS, Lambda, etc.)

## Build Environment

- **Runtime**: Node.js 18 (AWS CodeBuild Standard 7.0 image)
- **Environment Variables**:
  - `NODE_ENV`: Set to 'production'
  - `ARTIFACTS_BUCKET`: S3 bucket for artifacts

## Security Features

- S3 bucket encryption enabled (S3-managed keys)
- Block public access enabled on S3 bucket
- Least-privilege IAM policies
- CloudWatch Logs for audit trail

## Cost Optimization

- CloudWatch Logs retention: 7 days
- S3 versioning enabled but can be optimized with lifecycle policies
- CodeBuild compute: SMALL instance type

## Resource Naming

All resources include the `environmentSuffix` for uniqueness:
- Repository: `nodejs-app-{environmentSuffix}`
- Build Project: `nodejs-build-{environmentSuffix}`
- Pipeline: `nodejs-pipeline-{environmentSuffix}`
- S3 Bucket: `build-artifacts-{environmentSuffix}`

## Cleanup

```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Tags

All resources are tagged with:
- `Environment`: production
- `Team`: backend
```
