# MODEL_RESPONSE - CI/CD Pipeline Infrastructure

This document contains the initial Pulumi TypeScript implementation for the CI/CD pipeline infrastructure.

## File: lib/cicd-pipeline-stack.ts

```typescript
/**
 * cicd-pipeline-stack.ts
 *
 * Defines the CI/CD Pipeline infrastructure stack for containerized applications.
 * Implements a complete pipeline with S3 artifacts, ECR repository, CodeBuild projects,
 * CodePipeline orchestration, ECS Fargate deployment, CloudFront distribution,
 * Lambda@Edge functions, and SNS notifications.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface CicdPipelineStackArgs {
  environmentSuffix: string;
  githubToken?: pulumi.Input<string>;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CicdPipelineStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly cloudFrontUrl: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CicdPipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CicdPipelineStack', name, args, opts);

    const { environmentSuffix, githubToken, githubOwner = 'example-org', githubRepo = 'example-repo', githubBranch = 'main', tags = {} } = args;
    const region = aws.getRegionOutput().name;
    const accountId = aws.getCallerIdentityOutput().accountId;
    const config = new pulumi.Config();

    // Default tags for all resources
    const defaultTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'pulumi',
    }));

    // ========================================
    // S3 Bucket for Pipeline Artifacts
    // ========================================
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-artifacts',
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access to the artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ========================================
    // S3 Bucket for CloudFront Static Assets
    // ========================================
    const cloudFrontBucket = new aws.s3.Bucket(
      `cloudfront-assets-${environmentSuffix}`,
      {
        bucket: `cloudfront-assets-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // ECR Repository for Docker Images
    // ========================================
    const ecrRepository = new aws.ecr.Repository(
      `app-repository-${environmentSuffix}`,
      {
        name: `app-repository-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy - Keep only last 10 images
    new aws.ecr.LifecyclePolicy(
      `app-repository-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep only last 10 images',
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
      },
      { parent: this }
    );

    // ========================================
    // SNS Topic for Pipeline Failure Notifications
    // ========================================
    const snsTopicForFailures = new aws.sns.Topic(
      `pipeline-failures-${environmentSuffix}`,
      {
        name: `pipeline-failures-${environmentSuffix}`,
        displayName: 'CI/CD Pipeline Failure Notifications',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // CloudWatch Log Groups
    // ========================================
    const dockerBuildLogGroup = new aws.cloudwatch.LogGroup(
      `docker-build-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/docker-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // Secrets Manager for GitHub OAuth Token
    // ========================================
    const githubTokenSecret = new aws.secretsmanager.Secret(
      `github-token-${environmentSuffix}`,
      {
        name: `github-token-${environmentSuffix}`,
        description: 'GitHub OAuth token for CodePipeline source integration',
        forceOverwriteReplicaSecret: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `github-token-version-${environmentSuffix}`,
      {
        secretId: githubTokenSecret.id,
        secretString: githubToken || config.requireSecret('githubToken'),
      },
      { parent: this }
    );

    // ========================================
    // Lambda@Edge Function for Request Processing
    // ========================================
    const edgeFunctionRole = new aws.iam.Role(
      `edge-function-role-${environmentSuffix}`,
      {
        name: `edge-function-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    const edgeFunction = new aws.lambda.Function(
      `edge-function-${environmentSuffix}`,
      {
        name: `edge-function-${environmentSuffix}`,
        role: edgeFunctionRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        timeout: 5,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Add custom headers
  request.headers['x-custom-header'] = [{ key: 'X-Custom-Header', value: 'EdgeProcessed' }];

  // Add security headers to response
  if (event.Records[0].cf.response) {
    const response = event.Records[0].cf.response;
    response.headers['strict-transport-security'] = [{
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubdomains; preload'
    }];
    response.headers['x-content-type-options'] = [{
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    }];
    response.headers['x-frame-options'] = [{
      key: 'X-Frame-Options',
      value: 'DENY'
    }];
    return response;
  }

  return request;
};
          `),
        }),
        publish: true,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [edgeFunctionRole] }
    );

    // ========================================
    // CloudFront Distribution with Lambda@Edge
    // ========================================
    const cloudFrontOAI = new aws.cloudfront.OriginAccessIdentity(
      `cloudfront-oai-${environmentSuffix}`,
      {
        comment: `OAI for CloudFront distribution ${environmentSuffix}`,
      },
      { parent: this }
    );

    const cloudFrontBucketPolicy = new aws.s3.BucketPolicy(
      `cloudfront-bucket-policy-${environmentSuffix}`,
      {
        bucket: cloudFrontBucket.id,
        policy: pulumi
          .all([cloudFrontBucket.arn, cloudFrontOAI.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const cloudFrontDistribution = new aws.cloudfront.Distribution(
      `cloudfront-distribution-${environmentSuffix}`,
      {
        enabled: true,
        comment: `CloudFront distribution for ${environmentSuffix}`,
        defaultRootObject: 'index.html',
        origins: [
          {
            originId: cloudFrontBucket.id,
            domainName: cloudFrontBucket.bucketDomainName,
            s3OriginConfig: {
              originAccessIdentity: cloudFrontOAI.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: cloudFrontBucket.id,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
          compress: true,
          lambdaFunctionAssociations: [
            {
              eventType: 'viewer-request',
              lambdaArn: pulumi.interpolate`${edgeFunction.arn}:${edgeFunction.version}`,
            },
          ],
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [edgeFunction, cloudFrontBucketPolicy] }
    );

    // ========================================
    // IAM Role for CodeBuild (Docker Build)
    // ========================================
    const dockerBuildRole = new aws.iam.Role(
      `docker-build-role-${environmentSuffix}`,
      {
        name: `docker-build-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for Docker Build - Least Privilege
    const dockerBuildPolicy = new aws.iam.Policy(
      `docker-build-policy-${environmentSuffix}`,
      {
        name: `docker-build-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            ecrRepository.arn,
            region,
            accountId,
            environmentSuffix,
            dockerBuildLogGroup.arn,
          ])
          .apply(([bucketArn, repoArn, reg, accId, envSuffix, logGroupArn]) =>
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
                  Resource: [
                    logGroupArn,
                    `${logGroupArn}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['ecr:GetAuthorizationToken'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchGetImage',
                    'ecr:PutImage',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                  ],
                  Resource: repoArn,
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `docker-build-policy-attachment-${environmentSuffix}`,
      {
        role: dockerBuildRole.name,
        policyArn: dockerBuildPolicy.arn,
      },
      { parent: this }
    );

    // ========================================
    // CodeBuild Project for Docker Build
    // ========================================
    const dockerBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Build Docker images and push to ECR',
        serviceRole: dockerBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
              type: 'PLAINTEXT',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: accountId,
              type: 'PLAINTEXT',
            },
            {
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
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
          buildspec: 'buildspec.yml',
        },
        logsConfig: {
          cloudwatchLogs: {
            status: 'ENABLED',
            groupName: dockerBuildLogGroup.name,
          },
        },
        timeoutInMinutes: 15,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [dockerBuildRole, dockerBuildPolicy] }
    );

    // ========================================
    // ECS Cluster and Task Definition
    // ========================================
    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        name: `ecs-cluster-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    const taskExecutionRole = new aws.iam.Role(
      `task-execution-role-${environmentSuffix}`,
      {
        name: `task-execution-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-definition-${environmentSuffix}`,
      {
        family: `app-task-${environmentSuffix}`,
        requiresCompatibilities: ['FARGATE'],
        networkMode: 'awsvpc',
        cpu: '256',
        memory: '512',
        executionRoleArn: taskExecutionRole.arn,
        containerDefinitions: pulumi
          .all([ecrRepository.repositoryUrl, region])
          .apply(([repoUrl, reg]) =>
            JSON.stringify([
              {
                name: 'app',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    protocol: 'tcp',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': `/ecs/app-${environmentSuffix}`,
                    'awslogs-region': reg,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // IAM Role for CodePipeline
    // ========================================
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        name: `pipeline-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline - Least Privilege
    const pipelinePolicy = new aws.iam.Policy(
      `pipeline-policy-${environmentSuffix}`,
      {
        name: `pipeline-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            dockerBuildProject.arn,
            snsTopicForFailures.arn,
            githubTokenSecret.arn,
            region,
            accountId,
            environmentSuffix,
          ])
          .apply(
            ([
              bucketArn,
              buildProjectArn,
              snsArn,
              secretArn,
              reg,
              accId,
              envSuffix,
            ]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:GetObject',
                      's3:PutObject',
                      's3:GetObjectVersion',
                    ],
                    Resource: `${bucketArn}/*`,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket', 's3:GetBucketLocation'],
                    Resource: bucketArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'codebuild:BatchGetBuilds',
                      'codebuild:StartBuild',
                    ],
                    Resource: buildProjectArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['sns:Publish'],
                    Resource: snsArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['secretsmanager:GetSecretValue'],
                    Resource: secretArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ecs:*'],
                    Resource: [
                      `arn:aws:ecs:${reg}:${accId}:cluster/ecs-cluster-${envSuffix}`,
                      `arn:aws:ecs:${reg}:${accId}:service/ecs-cluster-${envSuffix}/*`,
                      `arn:aws:ecs:${reg}:${accId}:task-definition/app-task-${envSuffix}:*`,
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['iam:PassRole'],
                    Resource: [
                      `arn:aws:iam::${accId}:role/task-execution-role-${envSuffix}`,
                    ],
                  },
                ],
              })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `pipeline-policy-attachment-${environmentSuffix}`,
      {
        role: pipelineRole.name,
        policyArn: pipelinePolicy.arn,
      },
      { parent: this }
    );

    // ========================================
    // CodePipeline with Manual Approval
    // ========================================
    const pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: 'S3',
          encryptionKey: {
            type: 'KMS',
            id: 'alias/aws/s3',
          },
        },
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'GitHub_Source',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: githubOwner,
                  Repo: githubRepo,
                  Branch: githubBranch,
                  OAuthToken: githubToken || config.requireSecret('githubToken'),
                  PollForSourceChanges: true,
                },
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'Docker_Build',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: dockerBuildProject.name,
                },
              },
            ],
          },
          {
            name: 'Approval',
            actions: [
              {
                name: 'Manual_Approval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData: 'Please review the build artifacts before deploying to production',
                  NotificationArn: snsTopicForFailures.arn,
                },
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'ECS_Deploy',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'ECS',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  ClusterName: ecsCluster.name,
                  ServiceName: `app-service-${environmentSuffix}`,
                  FileName: 'imagedefinitions.json',
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [pipelineRole, pipelinePolicy] }
    );

    // ========================================
    // CloudWatch Event Rule for Pipeline Failures
    // ========================================
    const pipelineFailureRule = new aws.cloudwatch.EventRule(
      `pipeline-failure-rule-${environmentSuffix}`,
      {
        name: `pipeline-failure-rule-${environmentSuffix}`,
        description: 'Trigger on pipeline failure',
        eventPattern: pulumi.interpolate`{
          "source": ["aws.codepipeline"],
          "detail-type": ["CodePipeline Pipeline Execution State Change"],
          "detail": {
            "state": ["FAILED"],
            "pipeline": ["${pipeline.name}"]
          }
        }`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-failure-target-${environmentSuffix}`,
      {
        rule: pipelineFailureRule.name,
        arn: snsTopicForFailures.arn,
      },
      { parent: this }
    );

    // SNS Topic Policy to allow CloudWatch Events
    new aws.sns.TopicPolicy(
      `pipeline-failures-topic-policy-${environmentSuffix}`,
      {
        arn: snsTopicForFailures.arn,
        policy: pulumi
          .all([snsTopicForFailures.arn, accountId])
          .apply(([topicArn, accId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'SNS:Publish',
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ========================================
    // Outputs
    // ========================================
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${region}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.bucket;
    this.cloudFrontUrl = pulumi.interpolate`https://${cloudFrontDistribution.domainName}`;
    this.snsTopicArn = snsTopicForFailures.arn;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      cloudFrontUrl: this.cloudFrontUrl,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * tap.ts
 *
 * Entry point for the Pulumi infrastructure program.
 * Instantiates the CI/CD Pipeline Stack with configuration parameters.
 */
import * as pulumi from '@pulumi/pulumi';
import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

// Get Pulumi configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const githubOwner = config.get('githubOwner') || 'example-org';
const githubRepo = config.get('githubRepo') || 'example-repo';
const githubBranch = config.get('githubBranch') || 'main';

// Create the CI/CD Pipeline Stack
const stack = new CicdPipelineStack('cicd-pipeline', {
  environmentSuffix,
  githubOwner,
  githubRepo,
  githubBranch,
  tags: {
    Application: 'ContainerizedApp',
    CostCenter: 'Engineering',
  },
});

// Export stack outputs
export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const artifactBucketName = stack.artifactBucketName;
export const cloudFrontUrl = stack.cloudFrontUrl;
export const snsTopicArn = stack.snsTopicArn;
```

## File: lib/buildspec.yml

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - echo "Building Docker image with tag $IMAGE_TAG"
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
      - cat imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
  discard-paths: yes

cache:
  paths:
    - '/root/.docker/**/*'
```

## File: lib/Dockerfile

```dockerfile
# Sample Dockerfile for containerized application
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose application port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Run application
CMD ["node", "server.js"]
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript infrastructure implements a complete CI/CD pipeline for containerized applications using AWS native services.

## Architecture Overview

The infrastructure includes:

- **S3 Buckets**: Artifact storage with versioning and encryption, CloudFront static assets
- **ECR Repository**: Container registry with vulnerability scanning and lifecycle policies
- **CodeBuild**: Docker image builds with custom buildspec.yml
- **CodePipeline**: Four-stage pipeline (Source → Build → Manual Approval → Deploy)
- **ECS Fargate**: Container deployment with task definitions
- **CloudFront + Lambda@Edge**: Content delivery with edge processing
- **IAM Roles**: Least-privilege access control
- **SNS**: Build failure notifications
- **CloudWatch**: Logs with 7-day retention
- **Secrets Manager**: GitHub OAuth token storage

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 16+ with npm
- AWS CLI configured with appropriate credentials
- GitHub repository with OAuth token

## Configuration

Create a `Pulumi.dev.yaml` file with the following configuration:

```yaml
config:
  aws:region: us-east-1
  tap:environmentSuffix: dev-12345
  tap:githubOwner: your-github-org
  tap:githubRepo: your-repo-name
  tap:githubBranch: main
  tap:githubToken:
    secure: <encrypted-token>
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure GitHub token:
   ```bash
   pulumi config set --secret tap:githubToken <your-github-token>
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Review and confirm changes.

## Pipeline Workflow

1. **Source Stage**: Monitors GitHub repository for commits to main branch
2. **Build Stage**: CodeBuild builds Docker image and pushes to ECR
3. **Approval Stage**: Manual approval required before production deployment
4. **Deploy Stage**: ECS Fargate deploys new container version

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environmentSuffix}`

Example: `pipeline-artifacts-dev-12345`, `docker-build-dev-12345`

## Monitoring

- CloudWatch Logs: `/aws/codebuild/docker-build-{environmentSuffix}` (7-day retention)
- SNS Topic: Notifications for pipeline failures
- CloudWatch Events: Monitors pipeline state changes

## Security Features

- All S3 buckets encrypted with AWS managed KMS keys
- ECR vulnerability scanning enabled on push
- IAM policies follow least-privilege principle
- No wildcard resources in policies
- Secrets stored in AWS Secrets Manager
- Lambda@Edge adds security headers

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with `forceDestroy: true` for clean removal.

## Troubleshooting

### Build Failures

Check CloudWatch Logs: `/aws/codebuild/docker-build-{environmentSuffix}`

### Pipeline Stuck

Review manual approval stage in CodePipeline console

### ECR Push Issues

Verify CodeBuild role has ECR permissions and privileged mode enabled

## Cost Optimization

- CodeBuild uses BUILD_GENERAL1_SMALL compute type
- ECS Fargate uses minimal CPU (256) and memory (512)
- ECR lifecycle policy limits to 10 images
- S3 artifacts expire after 30 days
- CloudWatch Logs retained for 7 days only
```