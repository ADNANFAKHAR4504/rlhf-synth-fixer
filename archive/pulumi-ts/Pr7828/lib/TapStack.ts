import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * CI/CD Pipeline Integration Stack
 *
 * This stack creates a complete CI/CD pipeline infrastructure including:
 * - S3 bucket for artifacts
 * - ECR repository for container images
 * - CodeBuild project for building applications
 * - CodePipeline for orchestrating the workflow
 * - IAM roles and policies
 * - CloudWatch logging
 */

// Get stack configuration
const environmentSuffix = pulumi.getStack().toLowerCase();
const region = aws.config.region || 'us-east-1';

// Tags for all resources
const tags = {
  Project: 'tap-stack',
  Environment: environmentSuffix,
  ManagedBy: 'Pulumi',
  Purpose: 'CI/CD Pipeline Integration',
  Region: region,
};

// 1. S3 Bucket for Artifacts
const artifactBucket = new aws.s3.Bucket(`tap-artifacts-${environmentSuffix}`, {
  bucket: `tap-artifacts-${environmentSuffix}-${region}`,
  acl: 'private',
  versioning: {
    enabled: true,
  },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRules: [
    {
      enabled: true,
      expiration: {
        days: 90,
      },
      noncurrentVersionExpiration: {
        days: 30,
      },
    },
  ],
  tags: tags,
});

// Block public access to artifact bucket
new aws.s3.BucketPublicAccessBlock(
  `tap-artifacts-public-access-block-${environmentSuffix}`,
  {
    bucket: artifactBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// 2. ECR Repository for Docker Images
const ecrRepository = new aws.ecr.Repository(
  `tap-ecr-repo-${environmentSuffix}`,
  {
    name: `tap-ecr-repo-${environmentSuffix}`,
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    imageTagMutability: 'MUTABLE',
    encryptionConfigurations: [
      {
        encryptionType: 'AES256',
      },
    ],
    tags: tags,
  }
);

// ECR Lifecycle Policy
new aws.ecr.LifecyclePolicy(`tap-ecr-lifecycle-${environmentSuffix}`, {
  repository: ecrRepository.name,
  policy: JSON.stringify({
    rules: [
      {
        rulePriority: 1,
        description: 'Keep last 10 images',
        selection: {
          tagStatus: 'any',
          countType: 'imageCountMoreThan',
          countNumber: 10,
        },
        action: {
          type: 'expire',
        },
      },
    ],
  }),
});

// 3. IAM Role for CodeBuild
const codeBuildRole = new aws.iam.Role(
  `tap-codebuild-role-${environmentSuffix}`,
  {
    name: `tap-codebuild-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'codebuild.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: tags,
  }
);

// CodeBuild Policy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const codeBuildPolicy = new aws.iam.RolePolicy(
  `tap-codebuild-policy-${environmentSuffix}`,
  {
    role: codeBuildRole.id,
    policy: pulumi
      .all([artifactBucket.arn, ecrRepository.arn])
      .apply(([bucketArn, _repoArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:GetObjectVersion'],
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
          ],
        })
      ),
  }
);

// 4. CloudWatch Log Group for CodeBuild
const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
  `tap-codebuild-logs-${environmentSuffix}`,
  {
    name: `/aws/codebuild/tap-project-${environmentSuffix}`,
    retentionInDays: 30,
    tags: tags,
  }
);

// 5. CodeBuild Project
const codeBuildProject = new aws.codebuild.Project(
  `tap-codebuild-project-${environmentSuffix}`,
  {
    name: `tap-project-${environmentSuffix}`,
    description: 'Build project for CI/CD pipeline',
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
          value: region,
          type: 'PLAINTEXT',
        },
        {
          name: 'AWS_ACCOUNT_ID',
          value: aws.getCallerIdentity().then(id => id.accountId),
          type: 'PLAINTEXT',
        },
        {
          name: 'IMAGE_REPO_NAME',
          value: ecrRepository.name,
          type: 'PLAINTEXT',
        },
        {
          name: 'IMAGE_TAG',
          value: 'latest',
          type: 'PLAINTEXT',
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
artifacts:
  files:
    - '**/*'`,
    },
    logsConfig: {
      cloudwatchLogs: {
        groupName: codeBuildLogGroup.name,
        status: 'ENABLED',
      },
    },
    tags: tags,
  }
);

// 6. IAM Role for CodePipeline
const codePipelineRole = new aws.iam.Role(
  `tap-codepipeline-role-${environmentSuffix}`,
  {
    name: `tap-codepipeline-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'codepipeline.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: tags,
  }
);

// CodePipeline Policy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const codePipelinePolicy = new aws.iam.RolePolicy(
  `tap-codepipeline-policy-${environmentSuffix}`,
  {
    role: codePipelineRole.id,
    policy: pulumi
      .all([artifactBucket.arn, codeBuildProject.arn])
      .apply(([bucketArn, buildArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              Resource: [bucketArn, `${bucketArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              Resource: buildArn,
            },
          ],
        })
      ),
  }
);

// 7. CodePipeline
const pipeline = new aws.codepipeline.Pipeline(
  `tap-pipeline-${environmentSuffix}`,
  {
    name: `tap-pipeline-${environmentSuffix}`,
    roleArn: codePipelineRole.arn,
    artifactStores: [
      {
        location: artifactBucket.bucket,
        type: 'S3',
        region: region,
      },
    ],
    stages: [
      {
        name: 'Source',
        actions: [
          {
            name: 'Source',
            category: 'Source',
            owner: 'AWS',
            provider: 'S3',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              S3Bucket: artifactBucket.bucket,
              S3ObjectKey: 'source.zip',
            },
          },
        ],
      },
      {
        name: 'Build',
        actions: [
          {
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
          },
        ],
      },
    ],
    tags: tags,
  }
);

// CloudWatch Log Group for CodePipeline
const pipelineLogGroup = new aws.cloudwatch.LogGroup(
  `tap-pipeline-logs-${environmentSuffix}`,
  {
    name: `/aws/codepipeline/tap-pipeline-${environmentSuffix}`,
    retentionInDays: 30,
    tags: tags,
  }
);

// Exports
export const artifactBucketName = artifactBucket.bucket;
export const artifactBucketArn = artifactBucket.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const ecrRepositoryName = ecrRepository.name;
export const ecrRepositoryArn = ecrRepository.arn;
export const codeBuildProjectName = codeBuildProject.name;
export const codeBuildProjectArn = codeBuildProject.arn;
export const codeBuildRoleArn = codeBuildRole.arn;
export const codePipelineName = pipeline.name;
export const codePipelineArn = pipeline.arn;
export const codePipelineRoleArn = codePipelineRole.arn;
export const codeBuildLogGroupName = codeBuildLogGroup.name;
export const pipelineLogGroupName = pipelineLogGroup.name;
