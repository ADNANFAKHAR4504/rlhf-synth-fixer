### Reasoning Trace
---

This is a comprehensive request for a production-ready CI/CD pipeline using AWS CDK v2 with TypeScript. Let me break down the key requirements:

1. **Multi-stage CodePipeline** with source, build, test, and deploy stages
2. **CodeBuild projects** for:
   - Unit testing
   - Integration testing
   - OWASP dependency scanning
3. **ECS Fargate** with blue-green deployments via CodeDeploy
4. **Application Load Balancer** with blue/green target groups
5. **S3 bucket** for artifacts with 30-day retention
6. **SNS notifications** for pipeline failures
7. **Manual approval** before production
8. **SSM Parameter Store** for deployment configuration
9. **Least-privilege IAM roles**
10. **CloudWatch Logs** for all services
11. **Consistent tagging** (Environment, Team, CostCenter)

Let me create a complete CDK application with two files:
- `main.ts`: Entry point
- `tapstack.ts`: Complete infrastructure stack

I'll structure the stack with clear sections for each component and ensure all wiring is correct for a working CI/CD pipeline.
### Answer 
---

```typescript
// main.ts
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

// Deploy stack to us-east-1
new TapStack(app, 'MicroservicesCicdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Multi-stage CI/CD pipeline for ECS Fargate microservices with blue-green deployments',
  tags: {
    Environment: 'production',
    Team: 'platform-engineering',
    CostCenter: 'engineering-001',
  },
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Environment: 'production',
      Team: 'platform-engineering',
      CostCenter: 'engineering-001',
    };

    // 🔹 VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'MicroservicesVpc', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    cdk.Tags.of(vpc).add('Name', 'microservices-vpc');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // 🔹 S3 Artifact Bucket with versioning and lifecycle policy
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `pipeline-artifacts-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(artifactBucket).add(key, value);
    });

    // 🔹 ECR Repository for microservice images
    const ecrRepository = new ecr.Repository(this, 'MicroserviceRepo', {
      repositoryName: 'microservice-app',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 most recent images',
        },
      ],
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(ecrRepository).add(key, value);
    });

    // 🔹 ECS Cluster
    const cluster = new ecs.Cluster(this, 'MicroservicesCluster', {
      clusterName: 'microservices-cluster',
      vpc,
      containerInsights: true,
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(cluster).add(key, value);
    });

    // 🔹 CloudWatch Log Groups
    const taskLogGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      logGroupName: '/ecs/microservice-app',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 IAM Roles for ECS
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
    taskExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken', 'ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'],
      resources: ['*'],
    }));

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/microservice/*`],
    }));

    // 🔹 ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: 'microservice-app',
      memoryLimitMiB: 1024,
      cpu: 512,
      executionRole: taskExecutionRole,
      taskRole,
    });

    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      containerName: 'microservice-app',
      memoryLimitMiB: 1024,
      cpu: 512,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'app',
        logGroup: taskLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ServiceALB', {
      loadBalancerName: 'microservices-alb',
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(alb).add(key, value);
    });

    // Blue and Green Target Groups for CodeDeploy
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      targetGroupName: 'microservices-blue-tg',
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      targetGroupName: 'microservices-green-tg',
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // HTTP Listener
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [blueTargetGroup],
    });

    // 🔹 ECS Service
    const service = new ecs.FargateService(this, 'MicroserviceService', {
      serviceName: 'microservice-app',
      cluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
    });
    service.attachToApplicationTargetGroup(blueTargetGroup);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(service).add(key, value);
    });

    // 🔹 CodeDeploy Application and Deployment Group
    const codeDeployApp = new codedeploy.EcsApplication(this, 'CodeDeployApp', {
      applicationName: 'microservice-ecs-app',
    });

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS'),
      ],
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'DeploymentGroup', {
      application: codeDeployApp,
      deploymentGroupName: 'microservice-dg',
      service,
      blueGreenDeploymentConfig: {
        blueTargetGroup,
        greenTargetGroup,
        listener: httpListener,
        terminationWaitTime: cdk.Duration.minutes(5),
        deploymentApprovalWaitTime: cdk.Duration.minutes(0),
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE_TRAFFIC_SHIFT,
      role: codeDeployRole,
    });

    // 🔹 CodeCommit Repository (or placeholder)
    const sourceRepo = new codecommit.Repository(this, 'SourceRepo', {
      repositoryName: 'microservice-source',
      description: 'Source repository for microservice application',
    });

    // 🔹 SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: 'microservice-pipeline-notifications',
      displayName: 'Microservice Pipeline Notifications',
    });
    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('devops-team@example.com')
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(notificationTopic).add(key, value);
    });

    // 🔹 SSM Parameters for deployment configuration
    new ssm.StringParameter(this, 'ImageTagParam', {
      parameterName: '/microservice/image-tag',
      stringValue: 'latest',
      description: 'Current image tag for deployment',
    });

    new ssm.StringParameter(this, 'EnvVarsParam', {
      parameterName: '/microservice/env-vars',
      stringValue: JSON.stringify({ NODE_ENV: 'production', LOG_LEVEL: 'info' }),
      description: 'Environment variables for the application',
    });

    new ssm.StringParameter(this, 'EndpointUrlParam', {
      parameterName: '/microservice/endpoint-url',
      stringValue: `http://${alb.loadBalancerDnsName}`,
      description: 'ALB endpoint URL',
    });

    // 🔹 IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`],
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
      ],
      resources: [`${artifactBucket.bucketArn}/*`],
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:PutImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
      ],
      resources: ['*'],
    }));

    codeBuildRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/microservice/*`],
    }));

    // 🔹 CodeBuild Projects
    
    // Docker Build Project
    const dockerBuildProject = new codebuild.PipelineProject(this, 'DockerBuildProject', {
      projectName: 'microservice-docker-build',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      environmentVariables: {
        AWS_DEFAULT_REGION: { value: this.region },
        AWS_ACCOUNT_ID: { value: this.account },
        IMAGE_REPO_NAME: { value: ecrRepository.repositoryName },
        IMAGE_TAG: { value: 'latest' },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              'printf \'[{"name":"microservice-app","imageUri":"%s"}]\' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json', 'appspec.yaml', 'taskdef.json'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'DockerBuildLogGroup', {
            logGroupName: '/aws/codebuild/microservice-docker-build',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(dockerBuildProject).add(key, value);
    });

    // Unit Test Project
    const unitTestProject = new codebuild.PipelineProject(this, 'UnitTestProject', {
      projectName: 'microservice-unit-tests',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Running linting...',
              'npm run lint',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit -- --coverage',
            ],
          },
        },
        reports: {
          coverage: {
            files: ['coverage/clover.xml'],
            'file-format': 'CLOVERXML',
          },
          test_results: {
            files: ['test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
        artifacts: {
          files: ['coverage/**/*', 'test-results.xml'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
            logGroupName: '/aws/codebuild/microservice-unit-tests',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(unitTestProject).add(key, value);
    });

    // Security Scan Project (OWASP Dependency Check)
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      projectName: 'microservice-security-scan',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing OWASP Dependency Check...',
              'wget https://github.com/jeremylong/DependencyCheck/releases/download/v7.4.4/dependency-check-7.4.4-release.zip',
              'unzip dependency-check-7.4.4-release.zip',
            ],
          },
          pre_build: {
            commands: [
              'echo Downloading NVD database...',
              './dependency-check/bin/dependency-check.sh --updateonly',
            ],
          },
          build: {
            commands: [
              'echo Running OWASP Dependency Check...',
              './dependency-check/bin/dependency-check.sh --scan . --format HTML --format JSON --out ./dependency-check-report --suppression suppression.xml || true',
              'echo Checking for critical vulnerabilities...',
              'if grep -q "CRITICAL\\|HIGH" dependency-check-report/dependency-check-report.json; then echo "Critical/High vulnerabilities found!"; exit 1; fi',
            ],
          },
        },
        artifacts: {
          files: ['dependency-check-report/**/*'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'SecurityScanLogGroup', {
            logGroupName: '/aws/codebuild/microservice-security-scan',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(securityScanProject).add(key, value);
    });

    // Integration Test Project
    const integrationTestProject = new codebuild.PipelineProject(this, 'IntegrationTestProject', {
      projectName: 'microservice-integration-tests',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      environmentVariables: {
        ENDPOINT_URL_PARAM: { value: '/microservice/endpoint-url' },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing test dependencies...',
              'npm ci',
              'apt-get update && apt-get install -y jq curl',
            ],
          },
          pre_build: {
            commands: [
              'echo Fetching endpoint URL from Parameter Store...',
              'export ENDPOINT_URL=$(aws ssm get-parameter --name $ENDPOINT_URL_PARAM --query "Parameter.Value" --output text)',
              'echo "Testing endpoint: $ENDPOINT_URL"',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
              'echo Testing health endpoint...',
              'curl -f $ENDPOINT_URL/health || exit 1',
            ],
          },
        },
        reports: {
          integration_tests: {
            files: ['integration-test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
        artifacts: {
          files: ['integration-test-results.xml'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
            logGroupName: '/aws/codebuild/microservice-integration-tests',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(integrationTestProject).add(key, value);
    });

    // 🔹 CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:GetBucketLocation',
        's3:ListBucket',
      ],
      resources: [
        artifactBucket.bucketArn,
        `${artifactBucket.bucketArn}/*`,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'codecommit:GetBranch',
        'codecommit:GetCommit',
        'codecommit:UploadArchive',
        'codecommit:GetUploadArchiveStatus',
        'codecommit:CancelUploadArchive',
      ],
      resources: [sourceRepo.repositoryArn],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [
        dockerBuildProject.projectArn,
        unitTestProject.projectArn,
        securityScanProject.projectArn,
        integrationTestProject.projectArn,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecs:DescribeServices',
        'ecs:DescribeTaskDefinition',
        'ecs:DescribeTasks',
        'ecs:ListTasks',
        'ecs:RegisterTaskDefinition',
        'ecs:UpdateService',
      ],
      resources: ['*'],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'codedeploy:CreateDeployment',
        'codedeploy:GetApplication',
        'codedeploy:GetApplicationRevision',
        'codedeploy:GetDeployment',
        'codedeploy:GetDeploymentConfig',
        'codedeploy:RegisterApplicationRevision',
      ],
      resources: [
        codeDeployApp.applicationArn,
        deploymentGroup.deploymentGroupArn,
        `arn:aws:codedeploy:${this.region}:${this.account}:deploymentconfig:*`,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [
        taskExecutionRole.roleArn,
        taskRole.roleArn,
        codeDeployRole.roleArn,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [notificationTopic.topicArn],
    }));

    const pipeline = new codepipeline.Pipeline(this, 'MicroservicePipeline', {
      pipelineName: 'microservice-cicd-pipeline',
      role: pipelineRole,
      artifactBucket,
      restartExecutionOnUpdate: false,
    });

    // Source artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const unitTestOutput = new codepipeline.Artifact('UnitTestOutput');
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');

    // Stage 1: Source
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: sourceRepo,
          branch: 'main',
          output: sourceOutput,
        }),
      ],
    });

    // Stage 2: Build Docker Image
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Docker_Build',
          project: dockerBuildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Stage 3: Unit Tests
    pipeline.addStage({
      stageName: 'UnitTests',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Run_Unit_Tests',
          project: unitTestProject,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

    // Stage 4: Security Scan
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'OWASP_Dependency_Check',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
        }),
      ],
    });

    // Stage 5: Deploy to Staging
    pipeline.addStage({
      stageName: 'DeployToStaging',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_ECS_Staging',
          service: service,
          input: buildOutput,
        }),
      ],
    });

    // Stage 6: Integration Tests
    pipeline.addStage({
      stageName: 'IntegrationTests',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Run_Integration_Tests',
          project: integrationTestProject,
          input: sourceOutput,
        }),
      ],
    });

    // Stage 7: Manual Approval
    pipeline.addStage({
      stageName: 'ManualApproval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approve_Production_Deployment',
          notificationTopic,
          additionalInformation: 'Please review staging deployment and approve for production',
        }),
      ],
    });

    // Stage 8: Deploy to Production (Blue-Green via CodeDeploy)
    pipeline.addStage({
      stageName: 'DeployToProduction',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'BlueGreen_Production_Deploy',
          deploymentGroup,
          taskDefinitionTemplateInput: buildOutput,
          appSpecTemplateInput: buildOutput,
          containerImageInputs: [
            {
              input: buildOutput,
            },
          ],
        }),
      ],
    });

    // Pipeline failure notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      eventPattern: {
        detail: {
          state: ['FAILED'],
        },
      },
    });

    // Apply tags to pipeline
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(pipeline).add(key, value);
    });

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CI/CD Pipeline',
    });

    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer Endpoint',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS Topic ARN for pipeline notifications',
    });
  }
}
```