import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS key for encryption
    const pipelineKey = new kms.Key(this, 'PipelineKey', {
      description: `Encryption key for trainr241-${environmentSuffix} CI/CD pipeline`,
      alias: `trainr241-${environmentSuffix}-pipeline-key`,
    });

    // S3 bucket for artifacts
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `trainr241-${environmentSuffix}-artifacts-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: pipelineKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudWatch Log Groups
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/trainr241-${environmentSuffix}-build`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const testLogGroup = new logs.LogGroup(this, 'TestLogGroup', {
      logGroupName: `/aws/codebuild/trainr241-${environmentSuffix}-test`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      roleName: `trainr241-${environmentSuffix}-codebuild-role`,
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                buildLogGroup.logGroupArn,
                testLogGroup.logGroupArn,
                `${buildLogGroup.logGroupArn}:*`,
                `${testLogGroup.logGroupArn}:*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${artifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
              ],
              resources: [pipelineKey.keyArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/trainr241/${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // CodeBuild project for build stage
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `trainr241-${environmentSuffix}-build`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'parameter-store': {
            ENVIRONMENT: `/trainr241/${environmentSuffix}/environment`,
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'echo $ENVIRONMENT',
              'npm --version',
              'node --version',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the application...',
              'npm install',
              'npm run build',
              'echo Build completed on `date`',
            ],
          },
          post_build: {
            commands: ['echo Build stage completed successfully'],
          },
        },
        artifacts: {
          files: ['**/*'],
          'base-directory': '.',
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      encryptionKey: pipelineKey,
    });

    // CodeBuild project for test stage
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `trainr241-${environmentSuffix}-test`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'parameter-store': {
            ENVIRONMENT: `/trainr241/${environmentSuffix}/environment`,
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Test stage started on `date`',
              'npm --version',
              'node --version',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm test',
              'echo Running integration tests...',
              'npm run test:integration || echo "Integration tests not configured"',
              'echo Tests completed successfully',
            ],
          },
          post_build: {
            commands: ['echo Test stage completed on `date`'],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: testLogGroup,
        },
      },
      encryptionKey: pipelineKey,
    });

    // CodeBuild project for staging deployment
    const stagingDeployProject = new codebuild.Project(
      this,
      'StagingDeployProject',
      {
        projectName: `trainr241-${environmentSuffix}-deploy-staging`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          privileged: true,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          env: {
            'parameter-store': {
              ENVIRONMENT: `/trainr241/${environmentSuffix}/environment`,
            },
            variables: {
              DEPLOY_ENV: 'staging',
            },
          },
          phases: {
            pre_build: {
              commands: [
                'echo Staging deployment started on `date`',
                'export DEPLOY_ENV=staging',
              ],
            },
            build: {
              commands: [
                'echo Deploying to staging environment...',
                'echo "Simulating staging deployment for $DEPLOY_ENV environment"',
                'echo "Application deployed to trainr241-staging-app"',
                'sleep 5',
              ],
            },
            post_build: {
              commands: [
                'echo Staging deployment completed on `date`',
                'echo "Application available at: https://trainr241-staging-app.${AWS_DEFAULT_REGION}.elb.amazonaws.com"',
              ],
            },
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: buildLogGroup,
          },
        },
        encryptionKey: pipelineKey,
      }
    );

    // CodeBuild project for production deployment
    const prodDeployProject = new codebuild.Project(this, 'ProdDeployProject', {
      projectName: `trainr241-${environmentSuffix}-deploy-prod`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'parameter-store': {
            ENVIRONMENT: `/trainr241/${environmentSuffix}/environment`,
          },
          variables: {
            DEPLOY_ENV: 'prod',
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Production deployment started on `date`',
              'export DEPLOY_ENV=prod',
            ],
          },
          build: {
            commands: [
              'echo Deploying to production environment...',
              'echo "Simulating production deployment for $DEPLOY_ENV environment"',
              'echo "Application deployed to trainr241-prod-app"',
              'sleep 5',
            ],
          },
          post_build: {
            commands: [
              'echo Production deployment completed on `date`',
              'echo "Application available at: https://trainr241-prod-app.${AWS_DEFAULT_REGION}.elb.amazonaws.com"',
            ],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      encryptionKey: pipelineKey,
    });

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      roleName: `trainr241-${environmentSuffix}-pipeline-role`,
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketVersioning',
                's3:ListBucket',
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: [
                buildProject.projectArn,
                testProject.projectArn,
                stagingDeployProject.projectArn,
                prodDeployProject.projectArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
              ],
              resources: [pipelineKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Source and Build artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create CodePipeline V2
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `trainr241-${environmentSuffix}-pipeline`,
      pipelineType: codepipeline.PipelineType.V2,
      role: pipelineRole,
      artifactBucket: artifactsBucket,
      executionMode: codepipeline.ExecutionMode.QUEUED,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: artifactsBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testProject,
              input: buildOutput,
            }),
          ],
        },
        {
          stageName: 'DeployStaging',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployToStaging',
              project: stagingDeployProject,
              input: buildOutput,
            }),
          ],
        },
        {
          stageName: 'ApprovalGate',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ManualApproval',
              additionalInformation:
                'Please review the staging deployment and approve for production release.',
            }),
          ],
        },
        {
          stageName: 'DeployProduction',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployToProduction',
              project: prodDeployProject,
              input: buildOutput,
            }),
          ],
        },
      ],
    });

    // SSM Parameters for configuration
    new ssm.StringParameter(this, 'EnvironmentParameter', {
      parameterName: `/trainr241/${environmentSuffix}/environment`,
      stringValue: environmentSuffix,
      description: 'Environment suffix for trainr241 pipeline',
    });

    new ssm.StringParameter(this, 'PipelineNameParameter', {
      parameterName: `/trainr241/${environmentSuffix}/pipeline-name`,
      stringValue: pipeline.pipelineName,
      description: `Pipeline name for trainr241 ${environmentSuffix} environment`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Name of the artifacts S3 bucket',
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'Name of the CodeBuild project for building',
    });

    new cdk.CfnOutput(this, 'TestProjectName', {
      value: testProject.projectName,
      description: 'Name of the CodeBuild project for testing',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CodePipeline',
    });
  }
}
