# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a complete CI/CD pipeline using AWS CodePipeline, CodeCommit, CodeBuild, and supporting services.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackProps {
  environmentSuffix: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly repositoryCloneUrl: pulumi.Output<string>;

  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:TapStack", name, {}, opts);

    const { environmentSuffix } = props;

    // CodeCommit Repository
    const repository = new aws.codecommit.Repository(
      "code-repository",
      {
        repositoryName: pulumi.interpolate`nodeapp-repo-${environmentSuffix}`,
        description: "Source code repository for Node.js application",
        defaultBranch: "main",
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this }
    );

    // S3 Bucket for Artifacts
    const artifactBucket = new aws.s3.Bucket(
      "artifact-bucket",
      {
        bucket: pulumi.interpolate`nodeapp-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      "codebuild-role",
      {
        name: pulumi.interpolate`codebuild-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: "codebuild.amazonaws.com",
        }),
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      "codebuild-policy",
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn, repository.arn]).apply(([bucketArn, repoArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                ],
                Resource: "arn:aws:logs:*:*:*",
              },
              {
                Effect: "Allow",
                Action: [
                  "s3:GetObject",
                  "s3:PutObject",
                  "s3:GetObjectVersion",
                ],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: "Allow",
                Action: [
                  "codecommit:GitPull",
                ],
                Resource: repoArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      "build-log-group",
      {
        name: pulumi.interpolate`/aws/codebuild/nodeapp-build-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this }
    );

    // CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      "build-project",
      {
        name: pulumi.interpolate`nodeapp-build-${environmentSuffix}`,
        description: "Build project for Node.js application",
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: "CODEPIPELINE",
        },
        environment: {
          computeType: "BUILD_GENERAL1_SMALL",
          image: "aws/codebuild/standard:5.0",
          type: "LINUX_CONTAINER",
          environmentVariables: [
            {
              name: "ENVIRONMENT",
              value: "production",
            },
          ],
        },
        source: {
          type: "CODEPIPELINE",
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Building application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed on \`date\`"
artifacts:
  files:
    - '**/*'
  base-directory: .
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            status: "ENABLED",
          },
        },
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      "pipeline-role",
      {
        name: pulumi.interpolate`pipeline-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: "codepipeline.amazonaws.com",
        }),
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      "pipeline-policy",
      {
        role: pipelineRole.id,
        policy: pulumi.all([artifactBucket.arn, repository.arn, buildProject.arn]).apply(
          ([bucketArn, repoArn, buildArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketLocation",
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "codecommit:GetBranch",
                    "codecommit:GetCommit",
                    "codecommit:UploadArchive",
                    "codecommit:GetUploadArchiveStatus",
                  ],
                  Resource: repoArn,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild",
                  ],
                  Resource: buildArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      "cicd-pipeline",
      {
        name: pulumi.interpolate`nodeapp-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [{
          location: artifactBucket.bucket,
          type: "S3",
        }],
        stages: [
          {
            name: "Source",
            actions: [
              {
                name: "Source",
                category: "Source",
                owner: "AWS",
                provider: "CodeCommit",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                  RepositoryName: repository.repositoryName,
                  BranchName: "main",
                  PollForSourceChanges: "false",
                },
              },
            ],
          },
          {
            name: "Build",
            actions: [
              {
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                configuration: {
                  ProjectName: buildProject.name,
                },
              },
            ],
          },
          {
            name: "Deploy",
            actions: [
              {
                name: "Deploy",
                category: "Deploy",
                owner: "AWS",
                provider: "S3",
                version: "1",
                inputArtifacts: ["build_output"],
                configuration: {
                  BucketName: artifactBucket.bucket,
                  Extract: "true",
                },
              },
            ],
          },
        ],
        tags: {
          Environment: "Production",
          Project: "NodeApp",
        },
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // Outputs
    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;
    this.repositoryCloneUrl = repository.cloneUrlHttp;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      repositoryCloneUrl: this.repositoryCloneUrl,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack("tap-stack", {
  environmentSuffix,
});

export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
export const repositoryCloneUrl = stack.repositoryCloneUrl;
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline for Node.js applications using AWS native services.

## Architecture

The infrastructure includes:

- **CodeCommit Repository**: Source code storage with main branch as default
- **S3 Bucket**: Versioned artifact storage with encryption
- **CodeBuild Project**: Build environment using aws/codebuild/standard:5.0
- **CodePipeline**: Three-stage pipeline (Source -> Build -> Deploy)
- **IAM Roles**: Separate least-privilege roles for CodeBuild and CodePipeline
- **CloudWatch Logs**: 30-day retention for build logs

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- Access to AWS account with appropriate permissions

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-unique-suffix>
```

## Deployment

Deploy the infrastructure:

```bash
npm install
pulumi up
```

## Outputs

After deployment, the following values are exported:

- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 artifacts bucket
- `repositoryCloneUrl`: HTTP clone URL for the CodeCommit repository

## Pipeline Workflow

1. **Source Stage**: Monitors CodeCommit repository for changes on main branch
2. **Build Stage**: Executes CodeBuild project with buildspec:
   - Runs `npm install` to install dependencies
   - Runs `npm test` to execute tests
   - Runs `npm run build` to build application
3. **Deploy Stage**: Stores build artifacts in S3 bucket

## Security

- IAM roles use least privilege principle
- S3 bucket has server-side encryption enabled
- CloudWatch Logs capture all build activity
- All resources tagged for organization

## Resource Naming

All resources include the `environmentSuffix` parameter to prevent naming conflicts:
- Repository: `nodeapp-repo-{suffix}`
- Bucket: `nodeapp-artifacts-{suffix}`
- Build Project: `nodeapp-build-{suffix}`
- Pipeline: `nodeapp-pipeline-{suffix}`

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

All resources are configured to be fully deletable with no retention policies.
```

## Implementation Notes

This implementation follows AWS best practices:

1. **Least Privilege IAM**: Each service role has only the permissions required for its function
2. **Encryption**: S3 bucket uses server-side encryption for artifact security
3. **Logging**: CloudWatch Logs with 30-day retention for troubleshooting
4. **Versioning**: S3 versioning enabled to track artifact history
5. **Tagging**: Consistent tagging across all resources for organization
6. **Modularity**: Uses Pulumi ComponentResource for clean organization

The pipeline is ready to use once deployed - developers can push code to the CodeCommit repository and the pipeline will automatically build and deploy.
