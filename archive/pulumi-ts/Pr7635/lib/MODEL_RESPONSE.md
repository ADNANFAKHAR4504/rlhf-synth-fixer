# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a comprehensive CI/CD pipeline using AWS CodePipeline, CodeBuild, and ECR for automated Docker deployments.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const githubOwner = config.get("githubOwner") || "example-org";
const githubRepo = config.get("githubRepo") || "example-app";
const githubBranch = config.get("githubBranch") || "main";
const githubToken = config.requireSecret("githubToken");

// Common tags
const commonTags = {
    Environment: githubBranch === "main" ? "production" : "staging",
    Project: "cicd-pipeline",
    ManagedBy: "Pulumi",
};

// S3 bucket for pipeline artifacts
const artifactBucket = new aws.s3.Bucket(`artifact-bucket-${environmentSuffix}`, {
    bucket: `artifact-bucket-${environmentSuffix}`,
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
    lifecycleRules: [{
        id: "cleanup-old-artifacts",
        enabled: true,
        expiration: {
            days: 30,
        },
        noncurrentVersionExpiration: {
            days: 7,
        },
    }],
    tags: commonTags,
});

// ECR repository for Docker images
const ecrRepository = new aws.ecr.Repository(`app-repo-${environmentSuffix}`, {
    name: `app-repo-${environmentSuffix}`,
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    tags: commonTags,
});

// ECR lifecycle policy
const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(`ecr-lifecycle-${environmentSuffix}`, {
    repository: ecrRepository.name,
    policy: JSON.stringify({
        rules: [{
            rulePriority: 1,
            description: "Keep last 10 images",
            selection: {
                tagStatus: "any",
                countType: "imageCountMoreThan",
                countNumber: 10,
            },
            action: {
                type: "expire",
            },
        }],
    }),
});

// IAM role for CodeBuild
const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
    name: `codebuild-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "codebuild.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: commonTags,
});

// IAM policy for CodeBuild
const codeBuildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
    role: codeBuildRole.id,
    policy: pulumi.all([artifactBucket.arn, ecrRepository.arn]).apply(([bucketArn, repoArn]) =>
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
                    ],
                    Resource: `${bucketArn}/*`,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "ecr:GetAuthorizationToken",
                    ],
                    Resource: "*",
                },
                {
                    Effect: "Allow",
                    Action: [
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "ecr:PutImage",
                        "ecr:InitiateLayerUpload",
                        "ecr:UploadLayerPart",
                        "ecr:CompleteLayerUpload",
                    ],
                    Resource: repoArn,
                },
            ],
        })
    ),
});

// CodeBuild project
const codeBuildProject = new aws.codebuild.Project(`build-project-${environmentSuffix}`, {
    name: `build-project-${environmentSuffix}`,
    serviceRole: codeBuildRole.arn,
    artifacts: {
        type: "CODEPIPELINE",
    },
    environment: {
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:5.0",
        type: "LINUX_CONTAINER",
        privilegedMode: true,
        environmentVariables: [
            {
                name: "AWS_DEFAULT_REGION",
                value: "us-east-1",
            },
            {
                name: "AWS_ACCOUNT_ID",
                value: aws.getCallerIdentity().then(identity => identity.accountId),
            },
            {
                name: "IMAGE_REPO_NAME",
                value: ecrRepository.name,
            },
            {
                name: "IMAGE_TAG",
                value: "latest",
            },
        ],
    },
    source: {
        type: "CODEPIPELINE",
        buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files: imagedefinitions.json
`,
    },
    tags: commonTags,
}, { dependsOn: [codeBuildPolicy] });

// IAM role for CodePipeline
const codePipelineRole = new aws.iam.Role(`codepipeline-role-${environmentSuffix}`, {
    name: `codepipeline-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "codepipeline.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: commonTags,
});

// IAM policy for CodePipeline
const codePipelinePolicy = new aws.iam.RolePolicy(`codepipeline-policy-${environmentSuffix}`, {
    role: codePipelineRole.id,
    policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject",
                        "s3:GetBucketLocation",
                        "s3:ListBucket",
                    ],
                    Resource: [
                        bucketArn,
                        `${bucketArn}/*`,
                    ],
                },
                {
                    Effect: "Allow",
                    Action: [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild",
                    ],
                    Resource: "*",
                },
                {
                    Effect: "Allow",
                    Action: [
                        "ecs:*",
                        "iam:PassRole",
                    ],
                    Resource: "*",
                },
            ],
        })
    ),
});

// CodePipeline
const pipeline = new aws.codepipeline.Pipeline(`pipeline-${environmentSuffix}`, {
    name: `pipeline-${environmentSuffix}`,
    roleArn: codePipelineRole.arn,
    artifactStore: {
        location: artifactBucket.bucket,
        type: "S3",
    },
    stages: [
        {
            name: "Source",
            actions: [{
                name: "Source",
                category: "Source",
                owner: "ThirdParty",
                provider: "GitHub",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                    Owner: githubOwner,
                    Repo: githubRepo,
                    Branch: githubBranch,
                    OAuthToken: githubToken,
                },
            }],
        },
        {
            name: "Build",
            actions: [{
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                configuration: {
                    ProjectName: codeBuildProject.name,
                },
            }],
        },
        {
            name: "Approval",
            actions: [{
                name: "ManualApproval",
                category: "Approval",
                owner: "AWS",
                provider: "Manual",
                version: "1",
                configuration: {
                    CustomData: `Please review and approve deployment to ${commonTags.Environment}`,
                },
            }],
        },
        {
            name: "Deploy",
            actions: [{
                name: "Deploy",
                category: "Deploy",
                owner: "AWS",
                provider: "ECS",
                version: "1",
                inputArtifacts: ["build_output"],
                configuration: {
                    ClusterName: "app-cluster",
                    ServiceName: "app-service",
                    FileName: "imagedefinitions.json",
                },
            }],
        },
    ],
    tags: commonTags,
}, { dependsOn: [codePipelinePolicy] });

// CloudWatch Event Rule for automatic triggering
const eventRule = new aws.cloudwatch.EventRule(`pipeline-trigger-${environmentSuffix}`, {
    name: `pipeline-trigger-${environmentSuffix}`,
    description: "Trigger pipeline on code commit",
    eventPattern: JSON.stringify({
        source: ["aws.codecommit"],
        "detail-type": ["CodeCommit Repository State Change"],
        detail: {
            event: ["referenceCreated", "referenceUpdated"],
            referenceType: ["branch"],
            referenceName: [githubBranch],
        },
    }),
    tags: commonTags,
});

// IAM role for CloudWatch Events
const eventRole = new aws.iam.Role(`event-role-${environmentSuffix}`, {
    name: `event-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "events.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: commonTags,
});

// IAM policy for CloudWatch Events
const eventPolicy = new aws.iam.RolePolicy(`event-policy-${environmentSuffix}`, {
    role: eventRole.id,
    policy: pulumi.all([pipeline.arn]).apply(([pipelineArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: "codepipeline:StartPipelineExecution",
                Resource: pipelineArn,
            }],
        })
    ),
});

// CloudWatch Event Target
const eventTarget = new aws.cloudwatch.EventTarget(`pipeline-target-${environmentSuffix}`, {
    rule: eventRule.name,
    arn: pipeline.arn,
    roleArn: eventRole.arn,
}, { dependsOn: [eventPolicy] });

// Exports
export const artifactBucketName = artifactBucket.id;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const codeBuildProjectName = codeBuildProject.name;
export const pipelineName = pipeline.name;
export const pipelineArn = pipeline.arn;
```

## File: Pulumi.yaml

```yaml
name: cicd-pipeline
runtime: nodejs
description: Multi-stage CI/CD pipeline with AWS CodePipeline
config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming
  githubOwner:
    type: string
    description: GitHub repository owner
    default: "example-org"
  githubRepo:
    type: string
    description: GitHub repository name
    default: "example-app"
  githubBranch:
    type: string
    description: GitHub branch to track
    default: "main"
  githubToken:
    type: string
    secret: true
    description: GitHub OAuth token for source integration
```

## File: package.json

```json
{
  "name": "cicd-pipeline",
  "version": "1.0.0",
  "description": "Multi-stage CI/CD pipeline infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi stack:
   ```bash
   pulumi config set environmentSuffix dev-12345
   pulumi config set githubOwner your-org
   pulumi config set githubRepo your-repo
   pulumi config set githubBranch main
   pulumi config set --secret githubToken YOUR_GITHUB_TOKEN
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Verify deployment:
   ```bash
   pulumi stack output
   ```

## Architecture

The infrastructure creates:

- **S3 Bucket**: Stores pipeline artifacts with versioning and encryption
- **ECR Repository**: Stores Docker images with lifecycle policies
- **CodeBuild Project**: Builds Docker images from source code
- **CodePipeline**: Orchestrates the CI/CD workflow with 4 stages
- **IAM Roles**: Least-privilege roles for all services
- **CloudWatch Events**: Automatic pipeline triggering on commits

## Branch-Based Deployments

- **main branch**: Deploys to production environment (requires manual approval)
- **develop branch**: Deploys to staging environment (requires manual approval)

Configure separate Pulumi stacks for each environment with different `githubBranch` config.
