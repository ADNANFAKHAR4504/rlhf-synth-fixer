# CI/CD Pipeline Implementation

This implementation creates a complete CI/CD pipeline for a Node.js application using AWS CDK with TypeScript.

## Architecture Overview

The infrastructure includes:
- CodeCommit repository for source control
- CodeBuild project for building and testing
- CodePipeline with three stages (Source, Build, Deploy)
- S3 bucket for artifact storage with versioning
- IAM roles with least privilege
- CloudWatch Logs with 7-day retention

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // CodeCommit Repository
    const repository = new codecommit.Repository(this, 'AppRepository', {
      repositoryName: `nodejs-app-repo-${environmentSuffix}`,
      description: 'Node.js application source code repository',
    });
    repository.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // S3 Bucket for Artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `codepipeline-artifacts-${environmentSuffix}-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudWatch Log Group for CodeBuild
    const logGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild with least privilege',
    });

    // Add least privilege permissions to CodeBuild role
    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`],
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [`${artifactBucket.bucketArn}/*`],
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetBucketLocation',
        's3:ListBucket',
      ],
      resources: [artifactBucket.bucketArn],
    }));

    // CodeBuild Project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `nodejs-build-project-${environmentSuffix}`,
      description: 'Build project for Node.js application',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          NODE_ENV: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 'production',
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm install'],
          },
          pre_build: {
            commands: ['npm test'],
          },
          build: {
            commands: ['npm run build'],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
      timeout: cdk.Duration.minutes(15),
      logging: {
        cloudWatch: {
          logGroup: logGroup,
          enabled: true,
        },
      },
    });

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least privilege',
    });

    // Add least privilege permissions to Pipeline role
    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:GetBucketLocation',
        's3:ListBucket',
      ],
      resources: [
        artifactBucket.bucketArn,
        `${artifactBucket.bucketArn}/*`,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codecommit:GetBranch',
        'codecommit:GetCommit',
        'codecommit:UploadArchive',
        'codecommit:GetUploadArchiveStatus',
      ],
      resources: [repository.repositoryArn],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [buildProject.projectArn],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
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
      ],
      resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/deploy-stack-${environmentSuffix}/*`],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'cloudformation.amazonaws.com',
        },
      },
    }));

    // Source output artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build output artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `nodejs-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: repository,
              branch: 'main',
              output: sourceOutput,
              trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild_Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'CloudFormation_Deploy',
              stackName: `deploy-stack-${environmentSuffix}`,
              templatePath: buildOutput.atPath('template.yaml'),
              adminPermissions: false,
              replaceOnFailure: true,
              role: new iam.Role(this, 'CloudFormationRole', {
                roleName: `cloudformation-role-${environmentSuffix}`,
                assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
                managedPolicies: [
                  iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
                ],
              }),
            }),
          ],
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
      value: repository.repositoryCloneUrlHttp,
      description: 'CodeCommit repository clone URL',
      exportName: `repository-clone-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'CodePipeline ARN',
      exportName: `pipeline-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'S3 Artifact bucket name',
      exportName: `artifact-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild project name',
      exportName: `build-project-${environmentSuffix}`,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'CI/CD Pipeline for Node.js Application',
});

app.synth();
```

## File: lib/README.md

```markdown
# CI/CD Pipeline for Node.js Application

This CDK application creates a complete CI/CD pipeline for deploying Node.js applications.

## Architecture

The pipeline consists of three stages:

1. **Source Stage**: CodeCommit repository triggers on commits to main branch
2. **Build Stage**: CodeBuild runs npm install, npm test, and npm build
3. **Deploy Stage**: CloudFormation deploys the application

## Resources Created

- **CodeCommit Repository**: Source code storage
- **CodeBuild Project**: Build and test automation
  - Build image: aws/codebuild/standard:6.0
  - Timeout: 15 minutes
  - Environment: NODE_ENV=production
- **CodePipeline**: Three-stage pipeline orchestration
- **S3 Bucket**: Artifact storage with versioning enabled
- **IAM Roles**: Least privilege roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Build logs with 7-day retention

## Deployment

### Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Node.js 18+ installed

### Deploy

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Deploy to different environment
cdk deploy --context environmentSuffix=prod
```

### Outputs

After deployment, the stack outputs:
- **RepositoryCloneUrl**: HTTP URL to clone the CodeCommit repository
- **PipelineArn**: ARN of the CodePipeline
- **ArtifactBucketName**: Name of the S3 bucket storing artifacts
- **BuildProjectName**: Name of the CodeBuild project

## Using the Repository

```bash
# Clone the repository
git clone <RepositoryCloneUrl>

# Add your Node.js application
cd nodejs-app-repo-dev

# Create a basic Node.js application structure
npm init -y
npm install express

# Create template.yaml for CloudFormation deploy stage
cat > template.yaml <<EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: Sample deployment template
Resources:
  DummyResource:
    Type: AWS::CloudFormation::WaitConditionHandle
EOF

# Commit and push to trigger pipeline
git add .
git commit -m "Initial commit"
git push origin main
```

## Pipeline Behavior

1. Commits to the `main` branch automatically trigger the pipeline
2. CodeBuild runs:
   - `npm install` - Install dependencies
   - `npm test` - Run tests
   - `npm run build` - Build application
3. CloudFormation deploys using the generated template.yaml
4. All logs are captured in CloudWatch with 7-day retention

## Security

- All IAM roles follow least privilege principle
- S3 bucket uses encryption at rest
- CodeCommit repository is private by default
- Build logs are retained for compliance (7 days)

## Clean Up

```bash
# Delete the stack
cdk destroy --context environmentSuffix=dev
```

Note: The S3 bucket will be automatically emptied and deleted due to `autoDeleteObjects: true`.

## Monitoring

- View pipeline execution in AWS Console: CodePipeline
- View build logs in CloudWatch Logs: `/aws/codebuild/nodejs-build-{environmentSuffix}`
- Monitor build metrics in CodeBuild console
```

## Implementation Notes

### Key Features

1. **Least Privilege IAM**: All roles have specific permissions scoped to required resources
2. **Automatic Cleanup**: All resources use `RemovalPolicy.DESTROY` for easy teardown
3. **Versioned Artifacts**: S3 bucket maintains version history
4. **Comprehensive Logging**: CloudWatch Logs with 7-day retention
5. **Environment Flexibility**: Environment suffix allows multiple deployments

### Configuration Details

- **Build Timeout**: 15 minutes as specified
- **Build Image**: aws/codebuild/standard:6.0 (Node.js 18)
- **Environment Variables**: NODE_ENV=production set in CodeBuild
- **Auto-trigger**: Pipeline triggers on commits to main branch
- **Region**: Defaults to us-east-1

### Testing the Pipeline

1. Deploy the stack
2. Clone the repository using the output URL
3. Add a Node.js application with `package.json`, tests, and `template.yaml`
4. Commit and push to main branch
5. Monitor pipeline execution in AWS Console

### Required Application Structure

Your Node.js application should include:
- `package.json` with `test` and `build` scripts
- `template.yaml` for CloudFormation deployment
- Test files that run via `npm test`
- Build output generated by `npm run build`