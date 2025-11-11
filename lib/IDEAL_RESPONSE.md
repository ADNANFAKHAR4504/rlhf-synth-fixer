### Reasoning Trace
---

The solution implements a complete three-stage CI/CD pipeline for containerized microservices using AWS CDK v2 with TypeScript. Key design decisions:

1. **Environment Suffix Support**: All resources include environment suffix for multi-environment deployments, following the existing tap.ts pattern
2. **Stack Deletability**: All resources use DESTROY removal policy with auto-delete for S3 to ensure easy cleanup in test environments
3. **Least Privilege IAM**: Cross-account roles only created when accounts differ, with specific permissions for ECS, CodeDeploy, and CloudFormation operations
4. **Pipeline Stages**: Source (CodeCommit), Build (unit tests + Docker), Test (integration + security), DeployToStaging, Approve, DeployToProduction
5. **Monitoring**: CloudWatch dashboard and alarms for pipeline, build, and test failures with SNS notifications
6. **Artifact Management**: S3 bucket with versioning, KMS encryption, 30-day lifecycle, and auto-delete for test environments

---

### Code Files

#### `bin/tap.ts`

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

#### `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const devAccountId =
      this.node.tryGetContext('devAccountId') ||
      process.env.DEV_ACCOUNT_ID ||
      this.account;
    const stagingAccountId =
      this.node.tryGetContext('stagingAccountId') ||
      process.env.STAGING_ACCOUNT_ID ||
      this.account;
    const prodAccountId =
      this.node.tryGetContext('prodAccountId') ||
      process.env.PROD_ACCOUNT_ID ||
      this.account;

    const repository = new codecommit.Repository(this, 'MicroserviceRepo', {
      repositoryName: `microservice-repository-${environmentSuffix}`,
      description: 'Repository for our containerized microservice',
    });

    const ecrRepository = new ecr.Repository(this, 'MicroserviceECR', {
      repositoryName: `microservice-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only the last 10 images',
        },
      ],
    });

    const artifactKey = new kms.Key(this, 'ArtifactKey', {
      enableKeyRotation: true,
      description: 'KMS key for encrypting the artifacts stored in S3',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `microservice-artifacts-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: artifactKey,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const approvalTopic = new sns.Topic(this, 'PipelineApprovalTopic', {
      displayName: 'Pipeline Approval Notifications',
    });

    const alarmTopic = new sns.Topic(this, 'PipelineAlarmTopic', {
      displayName: 'Pipeline Alarm Notifications',
    });

    const pipeline = new codepipeline.Pipeline(this, 'MicroservicePipeline', {
      pipelineName: `microservice-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      crossAccountKeys: true,
      restartExecutionOnUpdate: true,
    });

    const sourceOutput = new codepipeline.Artifact('SourceCode');
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      repository: repository,
      branch: 'main',
      output: sourceOutput,
      trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `microservice-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      environmentVariables: {
        REPOSITORY_URI: {
          value: ecrRepository.repositoryUri,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
              'echo Running unit tests...',
              'npm install',
              'npm run test',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:latest .',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing the Docker image...',
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing artifacts...',
              'echo "{\"ImageURI\":\"$REPOSITORY_URI:$IMAGE_TAG\"}" > imageDefinition.json',
              'echo Creating task definition and appspec files...',
              'cp task-definition-template.json taskdef.json',
              'sed -i "s|<IMAGE_URI>|$REPOSITORY_URI:$IMAGE_TAG|g" taskdef.json',
              'cp appspec-template.yaml appspec.yaml',
            ],
          },
        },
        artifacts: {
          files: [
            'imageDefinition.json',
            'appspec.yaml',
            'taskdef.json',
            'build-info.json',
          ],
        },
        reports: {
          UnitTestReports: {
            files: ['reports/test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      timeout: cdk.Duration.minutes(30),
    });

    ecrRepository.grantPullPush(buildProject.role!);
    artifactBucket.grantReadWrite(buildProject.role!);
    artifactKey.grantEncryptDecrypt(buildProject.role!);

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'BuildAndUnitTest',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    const testOutput = new codepipeline.Artifact('TestOutput');
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `microservice-test-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.LARGE,
        privileged: true,
      },
      environmentVariables: {
        REPOSITORY_URI: {
          value: ecrRepository.repositoryUri,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Installing dependencies...',
              'npm install',
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
              'echo Setting up security scanning tools...',
              'pip install safety bandit',
              'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
              'echo Running dependency security scan...',
              'safety check',
              'echo Running static code analysis...',
              'bandit -r ./src -f json -o security-reports/bandit-results.json || true',
              'echo Running container security scan...',
              'IMAGE_TAG=$(cat imageDefinition.json | jq -r .ImageURI | cut -d: -f2)',
              'trivy image --format json --output security-reports/container-scan.json "$REPOSITORY_URI:$IMAGE_TAG" || true',
            ],
          },
          post_build: {
            commands: [
              'echo Tests completed on `date`',
              'echo Creating test result summary...',
              'jq -s "." ./security-reports/*.json > security-reports/all-security-results.json || echo "No security reports generated"',
            ],
          },
        },
        artifacts: {
          files: ['test-reports/**/*', 'security-reports/**/*'],
          'base-directory': '.',
        },
        reports: {
          IntegrationTestReports: {
            files: ['test-reports/integration-results.xml'],
            'file-format': 'JUNITXML',
          },
          SecurityReports: {
            files: ['security-reports/all-security-results.json'],
            'file-format': 'JSON',
          },
        },
      }),
      timeout: cdk.Duration.minutes(30),
    });

    ecrRepository.grantPull(testProject.role!);
    artifactBucket.grantReadWrite(testProject.role!);
    artifactKey.grantEncryptDecrypt(testProject.role!);

    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'IntegrationAndSecurityTests',
      project: testProject,
      input: buildOutput,
      outputs: [testOutput],
    });

    pipeline.addStage({
      stageName: 'Test',
      actions: [testAction],
    });

    let stagingDeployRole: iam.Role | undefined;

    if (stagingAccountId !== this.account) {
      stagingDeployRole = new iam.Role(this, 'StagingDeployRole', {
        assumedBy: new iam.AccountPrincipal(stagingAccountId),
        description: 'Role for deploying to staging account',
        roleName: `CrossAccountStagingDeployRole-${environmentSuffix}`,
      });

      stagingDeployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecs:DescribeServices',
            'ecs:UpdateService',
            'ecs:RegisterTaskDefinition',
            'ecs:ListTaskDefinitions',
            'ecs:DescribeTaskDefinition',
            'cloudformation:DescribeChangeSet',
            'cloudformation:CreateChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:DescribeStacks',
            'codedeploy:CreateDeployment',
            'codedeploy:GetDeployment',
            'codedeploy:GetDeploymentConfig',
            'codedeploy:RegisterApplicationRevision',
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        })
      );
    }

    let prodDeployRole: iam.Role | undefined;

    if (prodAccountId !== this.account) {
      prodDeployRole = new iam.Role(this, 'ProdDeployRole', {
        assumedBy: new iam.AccountPrincipal(prodAccountId),
        description: 'Role for deploying to production account',
        roleName: `CrossAccountProdDeployRole-${environmentSuffix}`,
      });

      prodDeployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecs:DescribeServices',
            'ecs:UpdateService',
            'ecs:RegisterTaskDefinition',
            'ecs:ListTaskDefinitions',
            'ecs:DescribeTaskDefinition',
            'cloudformation:DescribeChangeSet',
            'cloudformation:CreateChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:DescribeStacks',
            'codedeploy:CreateDeployment',
            'codedeploy:GetDeployment',
            'codedeploy:GetDeploymentConfig',
            'codedeploy:RegisterApplicationRevision',
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        })
      );
    }

    const deployToStagingAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToStaging',
      service: ecs.FargateService.fromFargateServiceAttributes(
        this,
        'StagingService',
        {
          serviceArn: `arn:aws:ecs:${this.region}:${stagingAccountId}:service/StagingCluster/microservice-${environmentSuffix}`,
          cluster: ecs.Cluster.fromClusterAttributes(this, 'StagingCluster', {
            clusterName: 'StagingCluster',
            securityGroups: [],
            vpc: cdk.aws_ec2.Vpc.fromLookup(this, 'StagingVpc', {
              isDefault: true,
            }),
            clusterArn: `arn:aws:ecs:${this.region}:${stagingAccountId}:cluster/StagingCluster`,
          }),
        }
      ),
      imageFile: buildOutput.atPath('imageDefinition.json'),
      deploymentTimeout: cdk.Duration.minutes(60),
      role: stagingDeployRole,
    });

    pipeline.addStage({
      stageName: 'DeployToStaging',
      actions: [deployToStagingAction],
    });

    const manualApprovalAction =
      new codepipeline_actions.ManualApprovalAction({
        actionName: 'ApproveDeployment',
        notificationTopic: approvalTopic,
        additionalInformation:
          'Please review the staging deployment before approving deployment to production',
        externalEntityLink: `https://${this.region}.console.aws.amazon.com/ecs/home?region=${this.region}#/clusters/StagingCluster/services/microservice-${environmentSuffix}/details`,
      });

    pipeline.addStage({
      stageName: 'Approve',
      actions: [manualApprovalAction],
    });

    const deployToProdAction =
      new codepipeline_actions.CodeDeployEcsDeployAction({
        actionName: 'DeployToProduction',
        deploymentGroup:
          codedeploy.EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(
            this,
            'ProdDeploymentGroup',
            {
              deploymentGroupName: `ProdMicroserviceDeploymentGroup-${environmentSuffix}`,
              application: codedeploy.EcsApplication.fromEcsApplicationName(
                this,
                'ProdApplication',
                `ProdMicroserviceApplication-${environmentSuffix}`
              ),
            }
          ),
        taskDefinitionTemplateFile: buildOutput.atPath('taskdef.json'),
        appSpecTemplateFile: buildOutput.atPath('appspec.yaml'),
        containerImageInputs: [
          {
            input: buildOutput,
            taskDefinitionPlaceholder: 'IMAGE_NAME',
          },
        ],
        role: prodDeployRole,
      });

    pipeline.addStage({
      stageName: 'DeployToProduction',
      actions: [deployToProdAction],
    });

    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `MicroservicePipelineMonitoring-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Execution Time',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'ExecutionTime',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Pipeline Success/Failure',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SucceededPipeline',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'CodeBuild Project Success/Failure',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'SucceededBuilds',
            dimensionsMap: {
              ProjectName: buildProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'FailedBuilds',
            dimensionsMap: {
              ProjectName: buildProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'SucceededBuilds',
            dimensionsMap: {
              ProjectName: testProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'FailedBuilds',
            dimensionsMap: {
              ProjectName: testProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'FailedPipeline',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alarm when pipeline execution fails',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    const buildFailureAlarm = new cloudwatch.Alarm(this, 'BuildFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: buildProject.projectName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when build project fails',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    buildFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    const testFailureAlarm = new cloudwatch.Alarm(this, 'TestFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: testProject.projectName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when test project fails',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    testFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
      description: 'CodeCommit repository clone URL (HTTP)',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR repository URI',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
    });

    new cdk.CfnOutput(this, 'ApprovalTopicArn', {
      value: approvalTopic.topicArn,
      description: 'ARN of the SNS topic for deployment approvals',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarm notifications',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
    });
  }
}
```
