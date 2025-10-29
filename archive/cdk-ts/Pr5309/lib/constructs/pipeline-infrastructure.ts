import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { getRemovalPolicy, PipelineConfig } from '../config/pipeline-config';

export interface PipelineInfrastructureProps {
  config: PipelineConfig;
  kmsKey: kms.Key;
  notificationTopic: sns.Topic;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  alarmTopic: sns.Topic;
}

export class PipelineInfrastructure extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly sourceBucket: s3.Bucket;
  public readonly artifactsBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: PipelineInfrastructureProps
  ) {
    super(scope, id);

    const { config, kmsKey, notificationTopic, lambdaFunction } = props;

    const removalPolicy = getRemovalPolicy(config.environmentSuffix);
    const isProduction = config.environmentSuffix
      .toLowerCase()
      .includes('prod');

    // Source artifacts bucket
    this.sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `${config.prefix}-source-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: !isProduction,
    });

    // Enforce encryption at rest with bucket policy
    this.sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.sourceBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    this.sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.sourceBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.keyId,
          },
        },
      })
    );

    // Pipeline artifacts bucket
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `${config.prefix}-artifacts-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(config.retentionDays),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: !isProduction,
    });

    // Enforce encryption at rest with bucket policy
    this.artifactsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.artifactsBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    this.artifactsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.artifactsBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.keyId,
          },
        },
      })
    );

    // Test reports bucket
    const testReportsBucket = new s3.Bucket(this, 'TestReportsBucket', {
      bucketName: `${config.prefix}-test-reports`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(config.retentionDays),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: !isProduction,
    });

    // Build project role
    const buildRole = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: `CodeBuild role for ${config.prefix}`,
    });

    kmsKey.grantEncryptDecrypt(buildRole);
    testReportsBucket.grantReadWrite(buildRole);

    // Build log group
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/${config.prefix}-build`,
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy,
    });

    // Build project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${config.prefix}-build`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          NODE_VERSION: { value: '20' },
          TEST_COVERAGE_THRESHOLD: {
            value: config.testCoverageThreshold.toString(),
          },
        },
      },
      encryptionKey: kmsKey,
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 20,
            },
            commands: ['echo Installing dependencies...', 'npm ci'],
          },
          pre_build: {
            commands: ['echo Running linting...', 'npm run lint || true'],
          },
          build: {
            commands: [
              'echo Building application...',
              'npm run build',
              'echo Bundling Lambda function...',
              'npm run bundle',
            ],
          },
          post_build: {
            commands: [
              'echo Running tests...',
              'npm test -- --coverage',
              'echo Checking coverage threshold...',
              'npx jest --coverage --coverageThreshold=\'{"global":{"branches":$TEST_COVERAGE_THRESHOLD,"functions":$TEST_COVERAGE_THRESHOLD,"lines":$TEST_COVERAGE_THRESHOLD,"statements":$TEST_COVERAGE_THRESHOLD}}\'',
              'echo Uploading test reports...',
              `aws s3 cp coverage/ s3://${testReportsBucket.bucketName}/$CODEBUILD_BUILD_ID/ --recursive`,
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'BuildOutput',
        },
        reports: {
          'test-reports': {
            files: ['coverage/**/*'],
            'file-format': 'JUNITXML',
          },
        },
        cache: {
          paths: ['/root/.npm/**/*'],
        },
      }),
    });

    // Test project
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `${config.prefix}-test`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      encryptionKey: kmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 20,
            },
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
              'echo Running e2e tests...',
              'npm run test:e2e',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
    });

    // Deploy project role
    const deployRole = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: `Deployment role for ${config.prefix}`,
    });

    // Grant specific CloudFormation permissions for this stack only (least privilege)
    const stackName = cdk.Stack.of(this).stackName;
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResource',
          'cloudformation:DescribeStackResources',
          'cloudformation:GetTemplate',
          'cloudformation:ListStackResources',
          'cloudformation:UpdateStack',
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:ValidateTemplate',
        ],
        resources: [
          `arn:aws:cloudformation:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:stack/${stackName}/*`,
        ],
      })
    );

    // Grant S3 access for CloudFormation templates (if needed)
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          'arn:aws:s3:::cdk-*',
          'arn:aws:s3:::cdk-*/*',
          this.artifactsBucket.bucketArn,
          `${this.artifactsBucket.bucketArn}/*`,
        ],
      })
    );

    lambdaFunction.grantInvokeUrl(deployRole);
    kmsKey.grantEncryptDecrypt(deployRole);

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'lambda:UpdateFunctionCode',
          'lambda:UpdateFunctionConfiguration',
          'lambda:PublishVersion',
          'lambda:CreateAlias',
          'lambda:UpdateAlias',
          'lambda:GetFunction',
          'lambda:GetFunctionConfiguration',
        ],
        resources: [
          lambdaFunction.functionArn,
          `${lambdaFunction.functionArn}:*`,
        ],
      })
    );

    // Deploy project
    const deployProject = new codebuild.PipelineProject(this, 'DeployProject', {
      projectName: `${config.prefix}-deploy`,
      role: deployRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          LAMBDA_FUNCTION_NAME: { value: lambdaFunction.functionName },
          LAMBDA_FUNCTION_ARN: { value: lambdaFunction.functionArn },
        },
      },
      encryptionKey: kmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 20,
            },
            commands: ['npm install -g aws-cdk'],
          },
          build: {
            commands: [
              'echo Deploying Lambda function...',
              'cd dist',
              'zip -r function.zip .',
              'aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://function.zip',
              'echo Publishing Lambda version...',
              'VERSION=$(aws lambda publish-version --function-name $LAMBDA_FUNCTION_NAME --query Version --output text)',
              'echo Updating alias to new version...',
              'aws lambda update-alias --function-name $LAMBDA_FUNCTION_NAME --name live --function-version $VERSION',
              'echo Deployment completed successfully',
            ],
          },
        },
      }),
    });

    // Pipeline role
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: `Pipeline role for ${config.prefix}`,
    });

    // Source output artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${config.prefix}-pipeline`,
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: false,
      stages: [
        // Source stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: this.sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS,
            }),
          ],
        },
        // Build stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildAndUnitTest',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              runOrder: 1,
            }),
          ],
        },
        // Test stage
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'IntegrationTest',
              project: testProject,
              input: buildOutput,
              outputs: [testOutput],
              runOrder: 1,
            }),
          ],
        },
        // Deploy stage
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployToLambda',
              project: deployProject,
              input: testOutput,
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // Pipeline notifications
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      description: 'Pipeline state change notifications',
    });

    // Grant necessary permissions
    this.sourceBucket.grantRead(pipelineRole);
    this.artifactsBucket.grantReadWrite(pipelineRole);
    kmsKey.grantEncryptDecrypt(pipelineRole);
  }
}
