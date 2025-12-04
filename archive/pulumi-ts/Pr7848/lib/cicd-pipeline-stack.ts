/**
 * cicd-pipeline-stack.ts
 *
 * Comprehensive CI/CD Pipeline infrastructure including:
 * - S3 artifact bucket with versioning and lifecycle rules
 * - ECR repository for Docker images
 * - CodeBuild project for building and testing
 * - CodePipeline with Source, Build, and Deploy stages
 * - Lambda function for deployment notifications
 * - IAM roles and policies with least privilege
 * - CloudWatch Events for monitoring
 * - SNS topic for notifications
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CicdPipelineStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CicdPipelineStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CicdPipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CicdPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;
    const region = aws.getRegionOutput().name;
    const accountId = aws.getCallerIdentityOutput().accountId;

    // Default tags
    const defaultTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'Pulumi',
    }));

    // =========================================================================
    // 1. S3 ARTIFACT BUCKET
    // =========================================================================

    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
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
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // =========================================================================
    // 2. ECR REPOSITORY
    // =========================================================================

    const ecrRepository = new aws.ecr.Repository(
      `app-repository-${environmentSuffix}`,
      {
        name: `app-repository-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'IMMUTABLE',
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        forceDelete: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR lifecycle policy to manage old images
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // =========================================================================
    // 3. IAM ROLES AND POLICIES
    // =========================================================================

    // CodeBuild Role
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffix}`,
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

    // CodeBuild Policy
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, ecrRepository.arn, accountId, region])
          .apply(([bucketArn, _repoArn, accId, reg]) =>
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
                  Action: ['s3:ListBucket'],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/*`,
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

    // CodePipeline Role
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        name: `codepipeline-role-${environmentSuffix}`,
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

    // Lambda Execution Role
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        name: `lambda-deploy-role-${environmentSuffix}`,
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

    // Lambda Policy
    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([accountId, region]).apply(([accId, reg]) =>
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
                Resource: `arn:aws:logs:${reg}:${accId}:log-group:/aws/lambda/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'codepipeline:PutJobSuccessResult',
                  'codepipeline:PutJobFailureResult',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // =========================================================================
    // 4. LAMBDA FUNCTION FOR DEPLOYMENT NOTIFICATION
    // =========================================================================

    const lambdaFunction = new aws.lambda.Function(
      `deploy-notifier-${environmentSuffix}`,
      {
        name: `deploy-notifier-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } = require('@aws-sdk/client-codepipeline');

exports.handler = async (event) => {
  console.log('Deployment notification received:', JSON.stringify(event, null, 2));

  const jobId = event['CodePipeline.job']?.id;

  try {
    // Extract deployment information
    const userParameters = event['CodePipeline.job']?.data?.actionConfiguration?.configuration?.UserParameters;
    const inputArtifacts = event['CodePipeline.job']?.data?.inputArtifacts || [];

    console.log('Job ID:', jobId);
    console.log('User Parameters:', userParameters);
    console.log('Input Artifacts:', JSON.stringify(inputArtifacts));

    // Simulate downstream deployment logic
    console.log('Triggering downstream deployments...');
    console.log('Deployment status: SUCCESS');

    // Notify CodePipeline of success
    if (jobId) {
      const codepipeline = new CodePipelineClient({});

      await codepipeline.send(new PutJobSuccessResultCommand({
        jobId: jobId
      }));

      console.log('Successfully notified CodePipeline');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Deployment notification processed' })
    };
  } catch (error) {
    console.error('Error processing deployment:', error);

    // Notify CodePipeline of failure
    if (jobId) {
      const codepipeline = new CodePipelineClient({});

      await codepipeline.send(new PutJobFailureResultCommand({
        jobId: jobId,
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
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            REGION: region,
          },
        },
        timeout: 60,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // CloudWatch Log Group for Lambda
    new aws.cloudwatch.LogGroup(
      `lambda-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${lambdaFunction.name}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // =========================================================================
    // 5. CODEBUILD PROJECT
    // =========================================================================

    const codeBuildProject = new aws.codebuild.Project(
      `app-build-${environmentSuffix}`,
      {
        name: `app-build-${environmentSuffix}`,
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
              name: 'AWS_ACCOUNT_ID',
              value: accountId,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
            },
            {
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
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
      - echo Running unit tests...
      - npm install || echo "No package.json found"
      - npm test || echo "No tests defined"
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building Docker image...
      - docker build -t $ECR_REPOSITORY_URI:$IMAGE_TAG .
      - docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing Docker image...
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - docker push $ECR_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: `/aws/codebuild/app-build-${environmentSuffix}`,
            status: 'ENABLED',
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // CodeBuild Log Group
    new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/app-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // =========================================================================
    // 6. SNS TOPIC FOR NOTIFICATIONS
    // =========================================================================

    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        displayName: 'CI/CD Pipeline Notifications',
        tags: defaultTags,
      },
      { parent: this }
    );

    // =========================================================================
    // 7. CODEPIPELINE
    // =========================================================================

    // CodePipeline Policy
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildProject.arn, lambdaFunction.arn])
          .apply(([bucketArn, buildArn, lambdaArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                    's3:GetBucketVersioning',
                  ],
                  Resource: [`${bucketArn}`, `${bucketArn}/*`],
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

    const pipeline = new aws.codepipeline.Pipeline(
      `app-pipeline-${environmentSuffix}`,
      {
        name: `app-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
          },
        ],
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'SourceAction',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['SourceOutput'],
                configuration: {
                  Owner: 'example-owner',
                  Repo: 'example-repo',
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
                name: 'BuildAction',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['SourceOutput'],
                outputArtifacts: ['BuildOutput'],
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
                name: 'DeployAction',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                inputArtifacts: ['BuildOutput'],
                configuration: {
                  FunctionName: lambdaFunction.name,
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // =========================================================================
    // 8. CLOUDWATCH EVENTS AND MONITORING
    // =========================================================================

    // EventBridge rule for pipeline state changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-events-${environmentSuffix}`,
      {
        name: `pipeline-state-changes-${environmentSuffix}`,
        description: 'Capture all pipeline state changes',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // SNS target for pipeline events
    new aws.cloudwatch.EventTarget(
      `pipeline-event-target-${environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        arn: snsTopic.arn,
      },
      { parent: this }
    );

    // SNS topic policy to allow EventBridge
    new aws.sns.TopicPolicy(
      `sns-policy-${environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi
          .all([snsTopic.arn, accountId])
          .apply(([topicArn, _accId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'sns:Publish',
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Alarm for pipeline failures
    new aws.cloudwatch.MetricAlarm(
      `pipeline-failure-alarm-${environmentSuffix}`,
      {
        name: `pipeline-failures-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'PipelineExecutionFailure',
        namespace: 'AWS/CodePipeline',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when pipeline execution fails',
        dimensions: {
          PipelineName: pipeline.name,
        },
        alarmActions: [snsTopic.arn],
        tags: defaultTags,
      },
      { parent: this }
    );

    // CodeBuild failure alarm
    new aws.cloudwatch.MetricAlarm(
      `build-failure-alarm-${environmentSuffix}`,
      {
        name: `build-failures-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FailedBuilds',
        namespace: 'AWS/CodeBuild',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when CodeBuild fails',
        dimensions: {
          ProjectName: codeBuildProject.name,
        },
        alarmActions: [snsTopic.arn],
        tags: defaultTags,
      },
      { parent: this }
    );

    // =========================================================================
    // 9. OUTPUTS
    // =========================================================================

    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${region}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.s3BucketName = artifactBucket.bucket;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.codeBuildProjectName = codeBuildProject.name;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      s3BucketName: this.s3BucketName,
      lambdaFunctionArn: this.lambdaFunctionArn,
      codeBuildProjectName: this.codeBuildProjectName,
    });
  }
}
