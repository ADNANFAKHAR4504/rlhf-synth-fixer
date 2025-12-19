# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation provides a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, ECR, and supporting services.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'production',
      Team: 'devops',
      ...args.tags,
    };

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(`pipeline-artifacts-public-access-block-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(`app-repository-${environmentSuffix}`, {
      name: `app-repository-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: defaultTags,
    }, { parent: this });

    // ECR Lifecycle Policy
    new aws.ecr.LifecyclePolicy(`app-repository-lifecycle-${environmentSuffix}`, {
      repository: ecrRepository.name,
      policy: JSON.stringify({
        rules: [{
          rulePriority: 1,
          description: 'Keep last 30 images',
          selection: {
            tagStatus: 'any',
            countType: 'imageCountMoreThan',
            countNumber: 30,
          },
          action: {
            type: 'expire',
          },
        }],
      }),
    }, { parent: this });

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
      name: `/aws/codebuild/build-project-${environmentSuffix}`,
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      name: `codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'codebuild.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // IAM Policy for CodeBuild
    new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([artifactBucket.arn, ecrRepository.arn, buildLogGroup.arn]).apply(([bucketArn, repoArn, logArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
              ],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:PutImage',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `${logArn}:*`,
            },
          ],
        })
      ),
    }, { parent: this });

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(`build-project-${environmentSuffix}`, {
      name: `build-project-${environmentSuffix}`,
      serviceRole: codeBuildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:5.0',
        type: 'LINUX_CONTAINER',
        privilegedMode: true,
        environmentVariables: [
          {
            name: 'AWS_DEFAULT_REGION',
            value: 'us-east-1',
          },
          {
            name: 'AWS_ACCOUNT_ID',
            value: aws.getCallerIdentity().then(identity => identity.accountId),
          },
          {
            name: 'IMAGE_REPO_NAME',
            value: ecrRepository.name,
          },
          {
            name: 'IMAGE_TAG',
            value: 'latest',
          },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      - printf '{"ImageURI":"%s"}' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imageDetail.json
artifacts:
  files:
    - imageDetail.json
`,
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: buildLogGroup.name,
          status: 'ENABLED',
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(`pipeline-role-${environmentSuffix}`, {
      name: `pipeline-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'codepipeline.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // IAM Policy for CodePipeline
    new aws.iam.RolePolicy(`pipeline-policy-${environmentSuffix}`, {
      role: pipelineRole.id,
      policy: pulumi.all([artifactBucket.arn, codeBuildProject.arn]).apply(([bucketArn, projectArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              Resource: bucketArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              Resource: projectArn,
            },
          ],
        })
      ),
    }, { parent: this });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline-${environmentSuffix}`, {
      name: `cicd-pipeline-${environmentSuffix}`,
      roleArn: pipelineRole.arn,
      artifactStore: {
        location: artifactBucket.bucket,
        type: 'S3',
      },
      stages: [
        {
          name: 'Source',
          actions: [{
            name: 'Source',
            category: 'Source',
            owner: 'ThirdParty',
            provider: 'GitHub',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              Owner: 'your-github-username',
              Repo: 'your-repo-name',
              Branch: 'main',
              OAuthToken: pulumi.secret('{{resolve:secretsmanager:github-token}}'),
            },
          }],
        },
        {
          name: 'Build',
          actions: [{
            name: 'Build',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            version: '1',
            inputArtifacts: ['source_output'],
            outputArtifacts: ['build_output'],
            configuration: {
              ProjectName: codeBuildProject.name,
            },
          }],
        },
        {
          name: 'Approval',
          actions: [{
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              CustomData: 'Please review the build output and approve deployment',
            },
          }],
        },
      ],
      tags: defaultTags,
    }, { parent: this });

    // Exports
    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'production',
    Team: 'devops',
  },
});

export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
```

## Configuration

The infrastructure requires the following Pulumi configuration:

```bash
pulumi config set environmentSuffix <your-suffix>
```

For the GitHub source stage, you'll need to store your GitHub OAuth token in AWS Secrets Manager with the name `github-token`.

## Deployment

```bash
npm install
pulumi up
```

## Outputs

- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 bucket storing artifacts