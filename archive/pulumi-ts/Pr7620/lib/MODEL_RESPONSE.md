# CI/CD Pipeline Implementation - Pulumi TypeScript

This implementation creates a complete CI/CD pipeline infrastructure using AWS CodePipeline, CodeBuild, S3, ECR, and supporting services.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly sqsQueueUrl: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly dynamodbTableName: pulumi.Output<string>;

  constructor(name: string, props?: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const environmentSuffix = props?.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const region = props?.awsRegion || process.env.AWS_REGION || 'us-east-1';

    // S3 Bucket for Pipeline Artifacts
    const artifactsBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
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
            id: 'delete-old-artifacts',
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
      },
      { parent: this }
    );

    // ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(
      `app-images-${environmentSuffix}`,
      {
        name: `app-images-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy to keep only last 10 images
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${environmentSuffix}`,
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

    // SNS Topic for Pipeline Notifications
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        displayName: 'Pipeline Notifications',
      },
      { parent: this }
    );

    // SQS Queue for Build Events
    const sqsQueue = new aws.sqs.Queue(
      `build-events-${environmentSuffix}`,
      {
        name: `build-events-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300,
        messageRetentionSeconds: 345600, // 4 days
        receiveWaitTimeSeconds: 10,
      },
      { parent: this }
    );

    // DynamoDB Table for Pipeline State
    const dynamodbTable = new aws.dynamodb.Table(
      `pipeline-state-${environmentSuffix}`,
      {
        name: `pipeline-state-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'PipelineId',
        rangeKey: 'Timestamp',
        attributes: [
          { name: 'PipelineId', type: 'S' },
          { name: 'Timestamp', type: 'N' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
      },
      { parent: this }
    );

    // IAM Role for Lambda Function
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        name: `pipeline-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Lambda Role Policy
    new aws.iam.RolePolicy(
      `lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([dynamodbTable.arn, sqsQueue.arn, snsTopic.arn]).apply(([tableArn, queueArn, topicArn]) =>
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
                Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
                Resource: tableArn,
              },
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
                Resource: queueArn,
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
              {
                Effect: 'Allow',
                Action: ['codepipeline:PutJobSuccessResult', 'codepipeline:PutJobFailureResult'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda Function for Custom Pipeline Actions
    const lambdaFunction = new aws.lambda.Function(
      `pipeline-action-${environmentSuffix}`,
      {
        name: `pipeline-action-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 256,
        environment: {
          variables: {
            DYNAMODB_TABLE: dynamodbTable.name,
            SQS_QUEUE_URL: sqsQueue.url,
            SNS_TOPIC_ARN: snsTopic.arn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } = require('@aws-sdk/client-codepipeline');

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});
const codepipeline = new CodePipelineClient({});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const jobId = event['CodePipeline.job']?.id;

  try {
    // Log pipeline state to DynamoDB
    const timestamp = Date.now();
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PipelineId: { S: event['CodePipeline.job']?.data?.pipelineContext?.pipelineName || 'unknown' },
        Timestamp: { N: timestamp.toString() },
        Status: { S: 'processing' },
        Event: { S: JSON.stringify(event) }
      }
    }));

    // Send notification via SNS
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Pipeline Custom Action Executed',
      Message: \`Pipeline custom action executed at \${new Date(timestamp).toISOString()}\`
    }));

    // Report success to CodePipeline
    if (jobId) {
      await codepipeline.send(new PutJobSuccessResultCommand({ jobId }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Custom action completed successfully' })
    };
  } catch (error) {
    console.error('Error:', error);

    // Report failure to CodePipeline
    if (jobId) {
      await codepipeline.send(new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          message: error.message,
          type: 'JobFailed'
        }
      }));
    }

    throw error;
  }
};
          `),
        }),
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      },
      { parent: this }
    );

    // CodeBuild Role Policy
    new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactsBucket.arn, ecrRepository.arn, sqsQueue.arn])
          .apply(([bucketArn, repoArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: [`arn:aws:logs:${region}:*:log-group:/aws/codebuild/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: [`${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:CompleteLayerUpload',
                    'ecr:GetAuthorizationToken',
                    'ecr:InitiateLayerUpload',
                    'ecr:PutImage',
                    'ecr:UploadLayerPart',
                    'ecr:BatchGetImage',
                    'ecr:GetDownloadUrlForLayer',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Deny',
                  Action: '*',
                  Resource: '*',
                  Condition: {
                    StringNotEquals: {
                      'aws:RequestedRegion': region,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(
      `app-build-${environmentSuffix}`,
      {
        name: `app-build-${environmentSuffix}`,
        description: 'Build and test containerized application',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: ecrRepository.repositoryUrl.apply((url) => `${url}:latest`),
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
            },
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: environmentSuffix,
            },
            {
              name: 'SQS_QUEUE_URL',
              value: sqsQueue.url,
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
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=$\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Running unit tests...
      - npm install
      - npm test
      - echo Building Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing Docker image...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Sending build notification to SQS...
      - |
        aws sqs send-message --queue-url $SQS_QUEUE_URL --message-body "{\\"build\\":\\"completed\\",\\"image\\":\\"$ECR_REPOSITORY_URI:$IMAGE_TAG\\"}"
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
`,
        },
      },
      { parent: this }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        name: `codepipeline-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codepipeline.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      },
      { parent: this }
    );

    // CodePipeline Role Policy
    new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi.all([artifactsBucket.arn, codeBuildProject.arn, lambdaFunction.arn]).apply(([bucketArn, buildArn, functionArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
                Resource: [`${bucketArn}/*`],
              },
              {
                Effect: 'Allow',
                Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                Resource: bucketArn,
              },
              {
                Effect: 'Allow',
                Action: [
                  'codebuild:BatchGetBuilds',
                  'codebuild:StartBuild',
                  'codebuild:BatchGetBuildBatches',
                  'codebuild:StartBuildBatch',
                ],
                Resource: buildArn,
              },
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: functionArn,
              },
              {
                Effect: 'Deny',
                Action: '*',
                Resource: '*',
                Condition: {
                  StringNotEquals: {
                    'aws:RequestedRegion': region,
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `app-pipeline-${environmentSuffix}`,
      {
        name: `app-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStore: {
          location: artifactsBucket.bucket,
          type: 'S3',
        },
        stages: [
          {
            name: 'Source',
            actions: [
              {
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
                  OAuthToken: '{{resolve:secretsmanager:github-token}}',
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
            name: 'Approval',
            actions: [
              {
                name: 'ManualApproval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  NotificationArn: snsTopic.arn,
                  CustomData: 'Please approve this deployment to production',
                },
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // IAM Role for CloudWatch Events
    const eventsRole = new aws.iam.Role(
      `events-role-${environmentSuffix}`,
      {
        name: `pipeline-events-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'events.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Events Role Policy
    new aws.iam.RolePolicy(
      `events-policy-${environmentSuffix}`,
      {
        role: eventsRole.id,
        policy: pipeline.arn.apply((pipelineArn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'codepipeline:StartPipelineExecution',
                Resource: pipelineArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CloudWatch Events Rule for GitHub commits
    const eventRule = new aws.cloudwatch.EventRule(
      `pipeline-trigger-${environmentSuffix}`,
      {
        name: `pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on GitHub commits to main branch',
        eventPattern: JSON.stringify({
          source: ['aws.codecommit'],
          'detail-type': ['CodeCommit Repository State Change'],
          detail: {
            event: ['referenceCreated', 'referenceUpdated'],
            referenceType: ['branch'],
            referenceName: ['main'],
          },
        }),
      },
      { parent: this }
    );

    // CloudWatch Events Target
    new aws.cloudwatch.EventTarget(
      `pipeline-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        targetId: 'CodePipeline',
        arn: pipeline.arn,
        roleArn: eventsRole.arn,
      },
      { parent: this }
    );

    // Outputs
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${region}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.bucketName = artifactsBucket.bucket;
    this.snsTopicArn = snsTopic.arn;
    this.sqsQueueUrl = sqsQueue.url;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.dynamodbTableName = dynamodbTable.name;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      bucketName: this.bucketName,
      snsTopicArn: this.snsTopicArn,
      sqsQueueUrl: this.sqsQueueUrl,
      lambdaFunctionArn: this.lambdaFunctionArn,
      dynamodbTableName: this.dynamodbTableName,
    });
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, ECR, and supporting services.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning and 30-day lifecycle policy
- **ECR Repository**: Stores Docker images with image scanning and lifecycle policy to keep last 10 images
- **CodeBuild Project**: Builds Docker images, runs tests, and pushes to ECR
- **CodePipeline**: Three-stage pipeline (Source, Build, Manual Approval)
- **SNS Topic**: Notifications for pipeline events and manual approvals
- **SQS Queue**: Message queue for build events
- **Lambda Function**: Custom pipeline actions with DynamoDB logging
- **DynamoDB Table**: Pipeline state tracking
- **CloudWatch Events**: Automated pipeline triggering on commits

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 16+ and npm
- Docker (for building images)
- GitHub repository with OAuth token stored in AWS Secrets Manager

## Deployment

1. Set environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

2. Configure GitHub OAuth token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-oauth-token" \
  --region us-east-1
```

3. Deploy the infrastructure:

```bash
pulumi up --yes
```

## Configuration

The infrastructure can be customized by setting environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: AWS region for deployment (default: us-east-1)

## Outputs

After deployment, the following outputs are available:

- `pipelineUrl`: AWS Console URL for the CodePipeline
- `ecrRepositoryUri`: ECR repository URI for Docker images
- `bucketName`: S3 bucket name for artifacts
- `snsTopicArn`: SNS topic ARN for notifications
- `sqsQueueUrl`: SQS queue URL for build events
- `lambdaFunctionArn`: Lambda function ARN for custom actions
- `dynamodbTableName`: DynamoDB table name for pipeline state

## Resource Naming

All resources include the `environmentSuffix` in their names:

- S3 Bucket: `pipeline-artifacts-{environmentSuffix}`
- ECR Repository: `app-images-{environmentSuffix}`
- CodeBuild Project: `app-build-{environmentSuffix}`
- CodePipeline: `app-pipeline-{environmentSuffix}`
- CloudWatch Rule: `pipeline-trigger-{environmentSuffix}`

## Security

- All S3 buckets use SSE-S3 encryption
- IAM roles follow least privilege principle
- ECR images are scanned on push
- Explicit deny policies prevent cross-region access

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

All resources are configured with `forceDestroy: true` to ensure complete cleanup.

## Testing

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```
```
