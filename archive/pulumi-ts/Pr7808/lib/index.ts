import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * CI/CD Pipeline Integration Stack
 * Creates a comprehensive CI/CD pipeline for multi-service application deployment
 */
export class CiCdPipelineStack {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly deploymentTableName: pulumi.Output<string>;

  constructor(environmentSuffix: string) {
    // Get current AWS account
    const current = aws.getCallerIdentity({});

    // 1. Create ECR Repository for container images
    const ecrRepository = new aws.ecr.Repository(
      `ecr-cicd-${environmentSuffix}`,
      {
        name: `cicd-app-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        tags: {
          Name: `ecr-cicd-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // ECR Lifecycle Policy - retain only last 10 images
    new aws.ecr.LifecyclePolicy(`ecr-lifecycle-${environmentSuffix}`, {
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
    });

    // 2. Create S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.BucketV2(
      `s3-pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        tags: {
          Name: `s3-pipeline-artifacts-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(`s3-versioning-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `s3-encryption-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Lifecycle rule to delete old artifacts after 30 days
    new aws.s3.BucketLifecycleConfigurationV2(
      `s3-lifecycle-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [
          {
            id: 'delete-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      }
    );

    // 3. Create S3 bucket for Docker build cache
    const cacheBucket = new aws.s3.BucketV2(
      `s3-build-cache-${environmentSuffix}`,
      {
        bucket: `build-cache-${environmentSuffix}`,
        tags: {
          Name: `s3-build-cache-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Enable encryption for cache bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `s3-cache-encryption-${environmentSuffix}`,
      {
        bucket: cacheBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // 4. Create DynamoDB table for deployment history
    const deploymentTable = new aws.dynamodb.Table(
      `dynamodb-deployments-${environmentSuffix}`,
      {
        name: `deployment-history-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'deploymentId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'deploymentId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Name: `dynamodb-deployments-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 5. Create SNS topic for deployment notifications
    const notificationTopic = new aws.sns.Topic(
      `sns-deployments-${environmentSuffix}`,
      {
        name: `deployment-notifications-${environmentSuffix}`,
        tags: {
          Name: `sns-deployments-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 6. Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(`iam-lambda-${environmentSuffix}`, {
      name: `lambda-cicd-role-${environmentSuffix}`,
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
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
      tags: {
        Name: `iam-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'Pulumi',
      },
    });

    // Attach policy for DynamoDB access
    new aws.iam.RolePolicyAttachment(
      `iam-lambda-dynamodb-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
      }
    );

    // Attach policy for ECR access
    new aws.iam.RolePolicyAttachment(`iam-lambda-ecr-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    });

    // 7. Create Lambda function (placeholder - will be updated by pipeline)
    const lambdaFunction = new aws.lambda.Function(
      `lambda-api-${environmentSuffix}`,
      {
        name: `api-processor-${environmentSuffix}`,
        role: lambdaRole.arn,
        packageType: 'Image',
        imageUri: pulumi.interpolate`${ecrRepository.repositoryUrl}:latest`,
        memorySize: 1024,
        timeout: 30,
        reservedConcurrentExecutions: 50,
        environment: {
          variables: {
            DEPLOYMENT_TABLE: deploymentTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        tags: {
          Name: `lambda-api-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      },
      {
        ignoreChanges: ['imageUri'],
      }
    );

    // 8. Create CloudWatch alarm for Lambda errors
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `cw-lambda-errors-${environmentSuffix}`,
      {
        name: `lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription:
          'Alarm when Lambda function has more than 5 errors in 5 minutes',
        alarmActions: [notificationTopic.arn],
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        tags: {
          Name: `cw-lambda-errors-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 9. Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `iam-codebuild-${environmentSuffix}`,
      {
        name: `codebuild-cicd-role-${environmentSuffix}`,
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
        tags: {
          Name: `iam-codebuild-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Attach managed policies for CodeBuild
    new aws.iam.RolePolicyAttachment(
      `iam-codebuild-cloudwatch-${environmentSuffix}`,
      {
        role: codeBuildRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
      }
    );

    new aws.iam.RolePolicyAttachment(`iam-codebuild-s3-${environmentSuffix}`, {
      role: codeBuildRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
    });

    new aws.iam.RolePolicyAttachment(`iam-codebuild-ecr-${environmentSuffix}`, {
      role: codeBuildRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser',
    });

    // 10. Create CodeBuild project for Docker builds
    const buildProject = new aws.codebuild.Project(
      `codebuild-docker-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_MEDIUM',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: 'us-east-1',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: pulumi.output(current).apply(c => c.accountId),
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
artifacts:
  files:
    - '**/*'`,
        },
        cache: {
          type: 'S3',
          location: pulumi.interpolate`${cacheBucket.bucket}/docker-cache`,
        },
        tags: {
          Name: `codebuild-docker-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 11. Create CodeBuild project for tests
    const testProject = new aws.codebuild.Project(
      `codebuild-test-${environmentSuffix}`,
      {
        name: `integration-test-${environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  install:
    commands:
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Running tests...
      - npm test
artifacts:
  files:
    - '**/*'`,
        },
        tags: {
          Name: `codebuild-test-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 12. Create IAM role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `iam-codepipeline-${environmentSuffix}`,
      {
        name: `codepipeline-cicd-role-${environmentSuffix}`,
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
        tags: {
          Name: `iam-codepipeline-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Attach managed policies for CodePipeline
    new aws.iam.RolePolicyAttachment(
      `iam-codepipeline-s3-${environmentSuffix}`,
      {
        role: codePipelineRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
      }
    );

    new aws.iam.RolePolicyAttachment(
      `iam-codepipeline-codebuild-${environmentSuffix}`,
      {
        role: codePipelineRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess',
      }
    );

    new aws.iam.RolePolicyAttachment(
      `iam-codepipeline-lambda-${environmentSuffix}`,
      {
        role: codePipelineRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
      }
    );

    // Create inline policy for CodeStar connections
    new aws.iam.RolePolicy(`iam-codepipeline-codestar-${environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['codestar-connections:UseConnection'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: notificationTopic.arn,
          },
        ],
      }),
    });

    // 13. Create CodeStar connection for GitHub (needs manual activation)
    const githubConnection = new aws.codestarconnections.Connection(
      `codestar-github-${environmentSuffix}`,
      {
        name: `github-connection-${environmentSuffix}`,
        providerType: 'GitHub',
        tags: {
          Name: `codestar-github-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 14. Create CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `codepipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
            region: 'us-east-1',
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
                provider: 'CodeStarSourceConnection',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  ConnectionArn: githubConnection.arn,
                  FullRepositoryId: 'example-org/example-repo',
                  BranchName: 'main',
                  OutputArtifactFormat: 'CODE_ZIP',
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
                  ProjectName: buildProject.name,
                },
              },
            ],
          },
          {
            name: 'Test',
            actions: [
              {
                name: 'Test',
                category: 'Test',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['build_output'],
                outputArtifacts: ['test_output'],
                configuration: {
                  ProjectName: testProject.name,
                },
              },
            ],
          },
          {
            name: 'Manual-Approval',
            actions: [
              {
                name: 'Approval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  NotificationArn: notificationTopic.arn,
                  CustomData:
                    'Please review and approve deployment to production',
                },
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'Deploy',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                inputArtifacts: ['test_output'],
                configuration: {
                  FunctionName: lambdaFunction.name,
                },
              },
            ],
          },
        ],
        tags: {
          Name: `codepipeline-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 15. Create CloudWatch alarm for pipeline failures
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pipelineFailureAlarm = new aws.cloudwatch.MetricAlarm(
      `cw-pipeline-failures-${environmentSuffix}`,
      {
        name: `pipeline-failures-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'PipelineExecutionFailure',
        namespace: 'AWS/CodePipeline',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alarm when pipeline execution fails',
        alarmActions: [notificationTopic.arn],
        dimensions: {
          PipelineName: pipeline.name,
        },
        tags: {
          Name: `cw-pipeline-failures-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // 16. Create IAM role for cross-account deployment
    const crossAccountRole = new aws.iam.Role(
      `iam-cross-account-${environmentSuffix}`,
      {
        name: `cross-account-deploy-${environmentSuffix}`,
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
        tags: {
          Name: `iam-cross-account-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Attach policies for cross-account deployment
    new aws.iam.RolePolicyAttachment(
      `iam-cross-account-lambda-${environmentSuffix}`,
      {
        role: crossAccountRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSLambda_FullAccess',
      }
    );

    new aws.iam.RolePolicyAttachment(
      `iam-cross-account-ecr-${environmentSuffix}`,
      {
        role: crossAccountRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      }
    );

    // 17. Create EventBridge rule for automated pipeline triggers
    const pipelineTriggerRule = new aws.cloudwatch.EventRule(
      `eventbridge-trigger-${environmentSuffix}`,
      {
        name: `pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on GitHub push to main branch',
        eventPattern: JSON.stringify({
          source: ['aws.codecommit'],
          'detail-type': ['CodeCommit Repository State Change'],
          detail: {
            event: ['referenceCreated', 'referenceUpdated'],
            referenceType: ['branch'],
            referenceName: ['main'],
          },
        }),
        tags: {
          Name: `eventbridge-trigger-${environmentSuffix}`,
          Environment: environmentSuffix,
          ManagedBy: 'Pulumi',
        },
      }
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(`eventbridge-target-${environmentSuffix}`, {
      rule: pipelineTriggerRule.name,
      arn: pipeline.arn,
      roleArn: codePipelineRole.arn,
    });

    // Export outputs
    this.pipelineArn = pipeline.arn;
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=us-east-1`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.deploymentTableName = deploymentTable.name;
  }
}

// Create stack instance
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new CiCdPipelineStack(environmentSuffix);

// Export stack outputs
export const pipelineArn = stack.pipelineArn;
export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const deploymentTableName = stack.deploymentTableName;
