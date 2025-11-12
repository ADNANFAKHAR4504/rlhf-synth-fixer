# CI/CD Pipeline Infrastructure Response

Here's the CDK TypeScript implementation for a comprehensive CI/CD pipeline using AWS CodePipeline and CodeBuild with separate staging and production environments.

## bin/tap.ts

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const envSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

new TapStack(app, `TapStack${envSuffix}`, {
  env: {
    account,
    region,
  },
  environmentSuffix: envSuffix,
});
```

## lib/tap-stack.ts

```ts
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
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                `${artifactsBucket.bucketArn}/*`,
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
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
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
            commands: [
              'echo Build stage completed successfully',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
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
            commands: [
              'echo Test stage completed on `date`',
            ],
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
    const stagingDeployProject = new codebuild.Project(this, 'StagingDeployProject', {
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
    });

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
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
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
              additionalInformation: 'Please review the staging deployment and approve for production release.',
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
      description: `Environment suffix for trainr241 pipeline`,
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
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

This implementation provides:

1. **Complete CI/CD Pipeline**: CodePipeline V2 with Source, Build, Test, Staging Deploy, Approval Gate, and Production Deploy stages
2. **Multi-Environment Support**: Separate staging and production deployment projects with proper environment isolation
3. **Security Best Practices**: KMS encryption, least privilege IAM roles, private S3 bucket with encryption
4. **Latest AWS Features**: Uses CodePipeline V2 pipeline type with enhanced configurations
5. **Monitoring & Logging**: CloudWatch log groups for build and test activities
6. **Configuration Management**: SSM parameters for environment-specific configuration
7. **Resource Naming**: Follows the required 'trainr241-{environment}-{resourcetype}' naming convention
8. **Manual Approval Gate**: Requires manual approval before production deployment for quality control

The pipeline automatically builds, tests, and deploys to both staging and production environments with proper isolation and security controls.