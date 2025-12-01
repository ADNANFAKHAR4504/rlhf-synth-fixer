/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Integration for Containerized Applications
 * This module creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and Lambda.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the CI/CD Pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const defaultTags = {
      Environment: 'production',
      Team: 'devops',
      ...((args.tags as Record<string, string>) || {}),
    };

    // 1. Create S3 bucket for pipeline artifacts with versioning and lifecycle rules
    const artifactBucket = new aws.s3.Bucket(
      'pipeline-artifact-bucket',
      {
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. Create ECR repository with image scanning and lifecycle policy
    const ecrRepository = new aws.ecr.Repository(
      'docker-image-repo',
      {
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR lifecycle policy to keep only last 10 images
    new aws.ecr.LifecyclePolicy(
      'ecr-lifecycle-policy',
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

    // 3. Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      'codebuild-role',
      {
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

    // CodeBuild policy with least privilege
    const codeBuildPolicy = new aws.iam.RolePolicy(
      'codebuild-policy',
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
                  Resource: 'arn:aws:logs:*:*:log-group:/aws/codebuild/*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
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
      },
      { parent: this }
    );

    // 4. Create CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      'codebuild-logs',
      {
        name: '/aws/codebuild/pipeline-build',
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      'docker-build-project',
      {
        serviceRole: codeBuildRole.arn,
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
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: aws.getRegionOutput().name,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: JSON.stringify({
            version: '0.2',
            phases: {
              pre_build: {
                commands: [
                  'echo Logging in to Amazon ECR...',
                  'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
                  'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                  'IMAGE_TAG=${COMMIT_HASH:=latest}',
                ],
              },
              build: {
                commands: [
                  'echo Build started on `date`',
                  'echo Building the Docker image...',
                  'docker build -t $ECR_REPOSITORY_URI:latest .',
                  'docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG',
                ],
              },
              post_build: {
                commands: [
                  'echo Build completed on `date`',
                  'echo Pushing the Docker images...',
                  'docker push $ECR_REPOSITORY_URI:latest',
                  'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
                  'echo Writing image definitions file...',
                  'printf \'[{"name":"app","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json',
                ],
              },
            },
            artifacts: {
              files: ['imagedefinitions.json'],
            },
          }),
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codeBuildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // 6. Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      'lambda-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Lambda policy for ECR tagging
    const lambdaPolicy = new aws.iam.RolePolicy(
      'lambda-policy',
      {
        role: lambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": "arn:aws:logs:*:*:*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "ecr:DescribeImages",
                "ecr:PutImage",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer"
              ],
              "Resource": "${ecrRepository.arn}"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // 7. Create Lambda function to tag production images
    const tagImageLambda = new aws.lambda.Function(
      'tag-production-image',
      {
        runtime: 'python3.9',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os

ecr_client = boto3.client('ecr')

def handler(event, context):
    """Tag the latest ECR image with 'production' tag after successful build"""
    repository_name = os.environ['ECR_REPOSITORY_NAME']

    try:
        # Get the latest image
        response = ecr_client.describe_images(
            repositoryName=repository_name,
            filter={'tagStatus': 'TAGGED'}
        )

        if not response['imageDetails']:
            print('No images found in repository')
            return {
                'statusCode': 404,
                'body': json.dumps('No images found')
            }

        # Sort by push date and get the latest
        latest_image = sorted(
            response['imageDetails'],
            key=lambda x: x['imagePushedAt'],
            reverse=True
        )[0]

        image_digest = latest_image['imageDigest']

        # Get manifest to re-tag
        manifest_response = ecr_client.batch_get_image(
            repositoryName=repository_name,
            imageIds=[{'imageDigest': image_digest}]
        )

        if manifest_response['images']:
            manifest = manifest_response['images'][0]['imageManifest']

            # Put image with production tag
            ecr_client.put_image(
                repositoryName=repository_name,
                imageTag='production',
                imageManifest=manifest
            )

            print(f'Successfully tagged image {image_digest} as production')
            return {
                'statusCode': 200,
                'body': json.dumps('Successfully tagged image as production')
            }
        else:
            print('Failed to get image manifest')
            return {
                'statusCode': 500,
                'body': json.dumps('Failed to get image manifest')
            }

    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
`),
        }),
        environment: {
          variables: {
            ECR_REPOSITORY_NAME: ecrRepository.name,
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // 8. Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      'pipeline-role',
      {
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

    // CodePipeline policy
    const pipelinePolicy = new aws.iam.RolePolicy(
      'pipeline-policy',
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildProject.arn, tagImageLambda.arn])
          .apply(([bucketArn, buildArn, lambdaArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:GetBucketVersioning',
                    's3:PutObject',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: buildArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['lambda:InvokeFunction'],
                  Resource: lambdaArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 9. Create CodePipeline with S3 source (instead of GitHub due to CodeStar Connection limitation)
    const pipeline = new aws.codepipeline.Pipeline(
      'cicd-pipeline',
      {
        roleArn: pipelineRole.arn,
        artifactStores: [
          {
            type: 'S3',
            location: artifactBucket.bucket,
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
                  PollForSourceChanges: 'true',
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
          {
            name: 'Deploy',
            actions: [
              {
                name: 'TagProduction',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  FunctionName: tagImageLambda.name,
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // 10. Create CloudWatch Event Rule to trigger pipeline (would be for GitHub webhooks in production)
    const eventRole = new aws.iam.Role(
      'event-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const eventPolicy = new aws.iam.RolePolicy(
      'event-policy',
      {
        role: eventRole.id,
        policy: pipeline.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'codepipeline:StartPipelineExecution',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CloudWatch Event Rule for S3 source changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      'pipeline-trigger-rule',
      {
        description: 'Trigger pipeline on source changes',
        eventPattern: pulumi.interpolate`{
          "source": ["aws.s3"],
          "detail-type": ["AWS API Call via CloudTrail"],
          "detail": {
            "eventSource": ["s3.amazonaws.com"],
            "eventName": ["PutObject"],
            "requestParameters": {
              "bucketName": ["${artifactBucket.bucket}"]
            }
          }
        }`,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [eventPolicy] }
    );

    new aws.cloudwatch.EventTarget(
      'pipeline-trigger-target',
      {
        rule: pipelineEventRule.name,
        arn: pipeline.arn,
        roleArn: eventRole.arn,
      },
      { parent: this }
    );

    // Export outputs
    this.artifactBucketName = artifactBucket.bucket;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.pipelineName = pipeline.name;
    this.codeBuildProjectName = codeBuildProject.name;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      codeBuildProjectName: this.codeBuildProjectName,
    });
  }
}
