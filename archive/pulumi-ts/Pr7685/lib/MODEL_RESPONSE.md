# CI/CD Pipeline Infrastructure - MODEL RESPONSE

This document contains the complete implementation of a CI/CD pipeline for containerized applications using **Pulumi with TypeScript**.

## Overview

This infrastructure creates a complete CI/CD pipeline for containerized applications using AWS CodePipeline, CodeBuild, ECR, and supporting services. All resources follow the environmentSuffix naming pattern and include proper encryption, tagging, and security configurations.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Infrastructure for Containerized Applications
 *
 * This module creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild,
 * ECR, and supporting services for containerized application deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly snsTopic: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};
    const githubOwner = args.githubOwner || 'example-org';
    const githubRepo = args.githubRepo || 'example-app';
    const githubBranch = args.githubBranch || 'main';

    const resourceTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'CICD-Pipeline',
      ManagedBy: 'Pulumi',
    }));

    // KMS Key for Encryption
    const kmsKey = new aws.kms.Key(`pipeline-kms-${environmentSuffix}`, {
      description: `KMS key for pipeline artifacts encryption - ${environmentSuffix}`,
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags: resourceTags,
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`pipeline-kms-alias-${environmentSuffix}`, {
      name: `alias/pipeline-artifacts-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      tags: resourceTags,
      forceDestroy: true,
    }, { parent: this });

    const bucketVersioning = new aws.s3.BucketVersioningV2(`pipeline-artifacts-versioning-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `pipeline-artifacts-encryption-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        }],
      },
      { parent: this }
    );

    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-access-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    const bucketLifecycleRule = new aws.s3.BucketLifecycleConfigurationV2(
      `pipeline-artifacts-lifecycle-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [{
          id: 'delete-old-artifacts',
          status: 'Enabled',
          expiration: {
            days: 30,
          },
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
          },
        }],
      },
      { parent: this, dependsOn: [bucketVersioning] }
    );

    // ECR Repository
    const ecrRepository = new aws.ecr.Repository(`app-repo-${environmentSuffix}`, {
      name: `app-repo-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      encryptionConfigurations: [{
        encryptionType: 'KMS',
        kmsKey: kmsKey.arn,
      }],
      imageTagMutability: 'MUTABLE',
      forceDelete: true,
      tags: resourceTags,
    }, { parent: this });

    const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(`app-repo-lifecycle-${environmentSuffix}`, {
      repository: ecrRepository.name,
      policy: JSON.stringify({
        rules: [{
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
        }],
      }),
    }, { parent: this });

    // IAM Roles
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      name: `codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'codebuild.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: resourceTags,
    }, { parent: this });

    const codeBuildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      name: `codebuild-policy-${environmentSuffix}`,
      role: codeBuildRole.id,
      policy: pulumi.all([artifactBucket.arn, ecrRepository.arn, kmsKey.arn]).apply(([bucketArn, repoArn, keyArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
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
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey', 'kms:Encrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*'],
              Resource: keyArn,
            },
          ],
        })
      ),
    }, { parent: this });

    const codePipelineRole = new aws.iam.Role(`codepipeline-role-${environmentSuffix}`, {
      name: `codepipeline-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'codepipeline.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: resourceTags,
    }, { parent: this });

    const codePipelinePolicy = new aws.iam.RolePolicy(`codepipeline-policy-${environmentSuffix}`, {
      name: `codepipeline-policy-${environmentSuffix}`,
      role: codePipelineRole.id,
      policy: pulumi.all([artifactBucket.arn, kmsKey.arn]).apply(([bucketArn, keyArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:GetObjectVersion', 's3:GetBucketVersioning'],
              Resource: [bucketArn, `${bucketArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey', 'kms:Encrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*'],
              Resource: keyArn,
            },
          ],
        })
      ),
    }, { parent: this });

    const eventsRole = new aws.iam.Role(`events-role-${environmentSuffix}`, {
      name: `events-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'events.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: resourceTags,
    }, { parent: this });

    const eventsPolicy = new aws.iam.RolePolicy(`events-policy-${environmentSuffix}`, {
      name: `events-policy-${environmentSuffix}`,
      role: eventsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: 'codepipeline:StartPipelineExecution',
          Resource: '*',
        }],
      }),
    }, { parent: this });

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(`docker-build-${environmentSuffix}`, {
      name: `docker-build-${environmentSuffix}`,
      description: 'Builds Docker images from GitHub repository',
      serviceRole: codeBuildRole.arn,
      artifacts: { type: 'CODEPIPELINE' },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:7.0',
        type: 'LINUX_CONTAINER',
        imagePullCredentialsType: 'CODEBUILD',
        privilegedMode: true,
        environmentVariables: [
          { name: 'AWS_DEFAULT_REGION', value: aws.getRegionOutput().name },
          { name: 'AWS_ACCOUNT_ID', value: aws.getCallerIdentityOutput().accountId },
          { name: 'IMAGE_REPO_NAME', value: ecrRepository.name },
          { name: 'IMAGE_TAG', value: 'latest' },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: 'buildspec.yml',
      },
      logsConfig: {
        cloudwatchLogs: {
          status: 'ENABLED',
          groupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
        },
      },
      tags: resourceTags,
    }, { parent: this, dependsOn: [codeBuildPolicy] });

    // SNS Topic
    const snsTopic = new aws.sns.Topic(`pipeline-notifications-${environmentSuffix}`, {
      name: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline State Change Notifications',
      kmsMasterKeyId: kmsKey.id,
      tags: resourceTags,
    }, { parent: this });

    const snsTopicPolicy = new aws.sns.TopicPolicy(`pipeline-notifications-policy-${environmentSuffix}`, {
      arn: snsTopic.arn,
      policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'events.amazonaws.com' },
            Action: 'SNS:Publish',
            Resource: topicArn,
          }],
        })
      ),
    }, { parent: this });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
      name: `app-pipeline-${environmentSuffix}`,
      roleArn: codePipelineRole.arn,
      artifactStores: [{
        location: artifactBucket.bucket,
        type: 'S3',
        encryptionKey: { id: kmsKey.arn, type: 'KMS' },
      }],
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
              Owner: githubOwner,
              Repo: githubRepo,
              Branch: githubBranch,
              OAuthToken: '{{resolve:secretsmanager:github-token:SecretString:token}}',
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
            configuration: { ProjectName: codeBuildProject.name },
          }],
        },
        {
          name: 'Deploy',
          actions: [{
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              CustomData: 'Please review and approve the deployment',
              NotificationArn: snsTopic.arn,
            },
          }],
        },
      ],
      tags: resourceTags,
    }, { parent: this, dependsOn: [codePipelinePolicy, snsTopicPolicy] });

    // CloudWatch Event Rules
    const pipelineEventRule = new aws.cloudwatch.EventRule(`pipeline-state-change-${environmentSuffix}`, {
      name: `pipeline-state-change-${environmentSuffix}`,
      description: 'Capture all pipeline state changes',
      eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"]
  }
}`,
      tags: resourceTags,
    }, { parent: this });

    const pipelineEventTarget = new aws.cloudwatch.EventTarget(`pipeline-state-change-target-${environmentSuffix}`, {
      rule: pipelineEventRule.name,
      arn: snsTopic.arn,
      inputTransformer: {
        inputPaths: {
          pipeline: '$.detail.pipeline',
          state: '$.detail.state',
          execution: '$.detail.execution-id',
        },
        inputTemplate: '"Pipeline <pipeline> changed state to <state>. Execution ID: <execution>"',
      },
    }, { parent: this });

    const buildFailureRule = new aws.cloudwatch.EventRule(`build-failure-${environmentSuffix}`, {
      name: `build-failure-${environmentSuffix}`,
      description: 'Capture CodeBuild build failures',
      eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["FAILED"],
    "project-name": ["${codeBuildProject.name}"]
  }
}`,
      tags: resourceTags,
    }, { parent: this });

    const buildFailureTarget = new aws.cloudwatch.EventTarget(`build-failure-target-${environmentSuffix}`, {
      rule: buildFailureRule.name,
      arn: snsTopic.arn,
      inputTransformer: {
        inputPaths: {
          project: '$.detail.project-name',
          status: '$.detail.build-status',
        },
        inputTemplate: '"Build project <project> failed with status <status>"',
      },
    }, { parent: this });

    // Outputs
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${aws.getRegionOutput().name}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.bucket;
    this.snsTopic = snsTopic.arn;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      snsTopicArn: this.snsTopic,
      pipelineName: pipeline.name,
      codeBuildProjectName: codeBuildProject.name,
      kmsKeyId: kmsKey.keyId,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const githubOwner = process.env.GITHUB_OWNER || 'example-org';
const githubRepo = process.env.GITHUB_REPO || 'example-app';
const githubBranch = process.env.GITHUB_BRANCH || 'main';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: { tags: defaultTags },
});

const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
    githubOwner,
    githubRepo,
    githubBranch,
  },
  { provider }
);

export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const artifactBucketName = stack.artifactBucketName;
export const snsTopicArn = stack.snsTopic;
```

## Implementation Summary

All 8 requirements implemented:

1. S3 bucket with versioning and 30-day lifecycle rule
2. ECR repository with image scanning and retain last 10 images policy
3. CodeBuild project for Docker builds with buildspec.yml
4. CodePipeline with Source (GitHub), Build (CodeBuild), Deploy (manual approval) stages
5. IAM roles with least-privilege permissions for all services
6. CloudWatch Event Rules triggering SNS notifications on pipeline state changes
7. All resources tagged with Environment, Project, ManagedBy
8. Exported pipeline URL and ECR repository URI

All resources use environmentSuffix pattern and include proper encryption with KMS.
