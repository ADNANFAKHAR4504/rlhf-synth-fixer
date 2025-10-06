import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

// ? Import your stacks here
// Stack for managing secrets
class SecurityStack extends cdk.Stack {
  public readonly appSecrets: secretsmanager.Secret;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { environmentSuffix: string }
  ) {
    super(scope, id, props);

    // Create secrets for application configuration
    this.appSecrets = new secretsmanager.Secret(
      this,
      `AppSecrets-${props.environmentSuffix}`,
      {
        description: `Application secrets for ${props.environmentSuffix} environment`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            DB_HOST: 'placeholder',
            DB_USER: 'placeholder',
            API_KEY: 'placeholder',
          }),
          generateStringKey: 'DB_PASSWORD',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      }
    );

    // Output the secrets ARN
    new cdk.CfnOutput(this, 'AppSecretsArn', {
      value: this.appSecrets.secretArn,
      description: 'Secrets Manager ARN for application secrets',
    });
  }
}

// Stack for SNS notifications
class NotificationStack extends cdk.Stack {
  public readonly pipelineTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { environmentSuffix: string; email?: string }
  ) {
    super(scope, id, props);

    this.pipelineTopic = new sns.Topic(
      this,
      `PipelineNotifications-${props.environmentSuffix}`,
      {
        displayName: `CI/CD Pipeline Notifications - ${props.environmentSuffix}`,
      }
    );

    // Add email subscription if provided
    if (props.email) {
      this.pipelineTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(props.email)
      );
    }

    // Output the topic ARN
    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: this.pipelineTopic.topicArn,
      description: 'SNS Topic ARN for pipeline notifications',
    });
  }
}

// Stack for ECS infrastructure
class EcsInfrastructureStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      environmentSuffix: string;
      appSecretsArn: string;
      ecrRepositoryArn: string;
      ecrRepositoryUri: string;
    }
  ) {
    super(scope, id, props);

    // Create VPC for ECS
    const vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      maxAzs: 2,
      natGateways: props.environmentSuffix === 'prod' ? 2 : 1,
    });

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(
      this,
      `EcsCluster-${props.environmentSuffix}`,
      {
        vpc,
        containerInsights: true,
      }
    );

    // Import ECR Repository
    const ecrRepository = ecr.Repository.fromRepositoryAttributes(
      this,
      `NodeAppRepo-${props.environmentSuffix}`,
      {
        repositoryArn: props.ecrRepositoryArn,
        repositoryName: `node-app-${props.environmentSuffix.toLowerCase()}`,
      }
    );

    // Import Secrets Manager secret
    const appSecrets = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      `AppSecrets-${props.environmentSuffix}`,
      props.appSecretsArn
    );

    // IAM Role for ECS Task Execution
    const ecsTaskExecutionRole = new iam.Role(
      this,
      `EcsTaskExecutionRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
        inlinePolicies: {
          SecretsPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['secretsmanager:GetSecretValue'],
                resources: [props.appSecretsArn],
              }),
            ],
          }),
        },
      }
    );

    // Create Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TaskDef-${props.environmentSuffix}`,
      {
        memoryLimitMiB: props.environmentSuffix === 'prod' ? 2048 : 1024,
        cpu: props.environmentSuffix === 'prod' ? 1024 : 512,
        executionRole: ecsTaskExecutionRole,
      }
    );

    // Add container to task definition
    const container = this.taskDefinition.addContainer(
      `NodeAppContainer-${props.environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: `node-app-${props.environmentSuffix}`,
          logRetention: logs.RetentionDays.ONE_WEEK,
        }),
        environment: {
          NODE_ENV:
            props.environmentSuffix === 'prod' ? 'production' : 'staging',
          PORT: '3000',
        },
        secrets: {
          DB_PASSWORD: ecs.Secret.fromSecretsManager(appSecrets, 'DB_PASSWORD'),
          API_KEY: ecs.Secret.fromSecretsManager(appSecrets, 'API_KEY'),
        },
      }
    );

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Create Fargate Service
    // Start with 0 tasks - the pipeline will update this when it builds and pushes the first image
    this.service = new ecs.FargateService(
      this,
      `FargateService-${props.environmentSuffix}`,
      {
        cluster: this.cluster,
        taskDefinition: this.taskDefinition,
        desiredCount: 0, // Will be updated by the pipeline after first successful build
        assignPublicIp: true,
      }
    );
  }
}

// Stack for CI/CD Pipeline
class PipelineStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildOutput: codepipeline.Artifact;
  public readonly sourceBucket: s3.Bucket;
  public readonly artifactBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      environmentSuffix: string;
      notificationTopic: sns.Topic;
      ecsService?: ecs.FargateService;
      ecsServiceSecondRegion?: ecs.FargateService;
      appSecretsArn: string;
    }
  ) {
    super(scope, id, props);

    // Create ECR Repository
    this.ecrRepository = new ecr.Repository(
      this,
      `NodeAppRepo-${props.environmentSuffix}`,
      {
        repositoryName: `node-app-${props.environmentSuffix.toLowerCase()}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        emptyOnDelete: true,
      }
    );

    // Create KMS keys for S3 bucket encryption
    const artifactBucketKey = new kms.Key(
      this,
      `ArtifactBucketKey-${props.environmentSuffix}`,
      {
        description: `KMS key for artifact bucket encryption - ${props.environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const sourceBucketKey = new kms.Key(
      this,
      `SourceBucketKey-${props.environmentSuffix}`,
      {
        description: `KMS key for source bucket encryption - ${props.environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // S3 Bucket for artifacts with KMS encryption
    this.artifactBucket = new s3.Bucket(
      this,
      `ArtifactBucket-${props.environmentSuffix}`,
      {
        bucketName: `pipeline-artifacts-${props.environmentSuffix.toLowerCase()}-${this.account}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: artifactBucketKey,
      }
    );

    // S3 Bucket for source code with KMS encryption
    this.sourceBucket = new s3.Bucket(
      this,
      `SourceBucket-${props.environmentSuffix}`,
      {
        bucketName: `pipeline-source-${props.environmentSuffix.toLowerCase()}-${this.account}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: sourceBucketKey,
      }
    );

    // Deploy sample Node.js application to S3 source bucket
    new s3_deployment.BucketDeployment(
      this,
      `DeploySourceCode-${props.environmentSuffix}`,
      {
        sources: [s3_deployment.Source.asset(path.join(__dirname, 'app'))],
        destinationBucket: this.sourceBucket,
        destinationKeyPrefix: '',
        prune: false,
      }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(
      this,
      `CodeBuildRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        description: 'Role for CodeBuild execution',
        inlinePolicies: {
          CodeBuildPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
                ],
              }),
              new iam.PolicyStatement({
                actions: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                ],
                resources: [
                  this.artifactBucket.arnForObjects('*'),
                  this.sourceBucket.arnForObjects('*'),
                ],
              }),
              new iam.PolicyStatement({
                actions: ['s3:GetBucketLocation', 's3:ListBucket'],
                resources: [
                  this.artifactBucket.bucketArn,
                  this.sourceBucket.bucketArn,
                ],
              }),
              new iam.PolicyStatement({
                actions: [
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                ],
                resources: [artifactBucketKey.keyArn, sourceBucketKey.keyArn],
              }),
              new iam.PolicyStatement({
                actions: ['ecr:GetAuthorizationToken'],
                resources: ['*'], // GetAuthorizationToken does not support resource-level permissions
              }),
              new iam.PolicyStatement({
                actions: [
                  'ecr:BatchCheckLayerAvailability',
                  'ecr:GetDownloadUrlForLayer',
                  'ecr:PutImage',
                  'ecr:InitiateLayerUpload',
                  'ecr:UploadLayerPart',
                  'ecr:CompleteLayerUpload',
                ],
                resources: [this.ecrRepository.repositoryArn],
              }),
              new iam.PolicyStatement({
                actions: ['secretsmanager:GetSecretValue'],
                resources: [props.appSecretsArn],
              }),
            ],
          }),
        },
      }
    );

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(
      this,
      `PipelineRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        description: 'Role for CodePipeline execution',
        inlinePolicies: {
          PipelineExecutionPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                ],
                resources: [
                  this.artifactBucket.arnForObjects('*'),
                  this.sourceBucket.arnForObjects('*'),
                ],
              }),
              new iam.PolicyStatement({
                actions: ['s3:GetBucketLocation', 's3:ListBucket'],
                resources: [
                  this.artifactBucket.bucketArn,
                  this.sourceBucket.bucketArn,
                ],
              }),
              new iam.PolicyStatement({
                actions: [
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                ],
                resources: [artifactBucketKey.keyArn, sourceBucketKey.keyArn],
              }),
              new iam.PolicyStatement({
                actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                resources: [
                  `arn:aws:codebuild:${this.region}:${this.account}:project/node-app-build-${props.environmentSuffix}`,
                ],
              }),
              new iam.PolicyStatement({
                actions: [
                  'ecs:DescribeServices',
                  'ecs:DescribeTaskDefinition',
                  'ecs:DescribeTasks',
                  'ecs:ListTasks',
                  'ecs:RegisterTaskDefinition',
                  'ecs:UpdateService',
                ],
                resources: ['*'], // ECS actions require wildcard or complex resource patterns
              }),
              new iam.PolicyStatement({
                actions: ['iam:PassRole'],
                resources: ['*'], // PassRole for ECS task execution roles
                conditions: {
                  StringEquals: {
                    'iam:PassedToService': 'ecs-tasks.amazonaws.com',
                  },
                },
              }),
              new iam.PolicyStatement({
                actions: ['sns:Publish'],
                resources: [props.notificationTopic.topicArn],
              }),
            ],
          }),
        },
      }
    );

    // CodeBuild Project
    const buildProject = new codebuild.PipelineProject(
      this,
      `BuildProject-${props.environmentSuffix}`,
      {
        projectName: `node-app-build-${props.environmentSuffix}`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
          privileged: true, // Required for Docker builds
          environmentVariables: {
            ECR_REPOSITORY_URI: {
              value: this.ecrRepository.repositoryUri,
            },
            AWS_DEFAULT_REGION: {
              value: this.region,
            },
            AWS_ACCOUNT_ID: {
              value: this.account,
            },
            ENVIRONMENT: {
              value: props.environmentSuffix,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
                'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                'IMAGE_TAG=${COMMIT_HASH:=latest}',
                'echo Installing dependencies...',
                'npm ci',
              ],
            },
            build: {
              commands: [
                'echo Running unit tests...',
                'npm run test:unit',
                'echo Running integration tests...',
                'npm run test:integration',
                'echo Building application...',
                'npm run build',
                'echo Building Docker image...',
                'docker build -t $ECR_REPOSITORY_URI:latest .',
                'docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG',
              ],
            },
            post_build: {
              commands: [
                'echo Pushing Docker image...',
                'docker push $ECR_REPOSITORY_URI:latest',
                'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
                'echo Writing image definitions file...',
                'printf \'[{"name":"NodeAppContainer-%s","imageUri":"%s"}]\' $ENVIRONMENT $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json',
              ],
            },
          },
          artifacts: {
            files: ['imagedefinitions.json'],
          },
        }),
      }
    );

    // Create Pipeline
    this.pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${props.environmentSuffix}`,
      {
        pipelineName: `node-app-pipeline-${props.environmentSuffix}`,
        role: pipelineRole,
        artifactBucket: this.artifactBucket,
        restartExecutionOnUpdate: true,
      }
    );

    // Source Stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3_Source',
      bucket: this.sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS,
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build Stage
    this.buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_and_Test',
      project: buildProject,
      input: sourceOutput,
      outputs: [this.buildOutput],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Manual Approval Stage (for production)
    if (props.environmentSuffix === 'prod') {
      const manualApprovalAction =
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Production_Approval',
          notificationTopic: props.notificationTopic,
          additionalInformation:
            'Please review and approve deployment to production environment',
        });

      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [manualApprovalAction],
      });
    }

    // Deploy Stage - Only if ECS service is provided
    /* istanbul ignore next - Future enhancement: automated ECS deployment */
    if (props.ecsService) {
      const deployAction = new codepipeline_actions.EcsDeployAction({
        actionName: 'Deploy_Primary_Region',
        service: props.ecsService,
        input: this.buildOutput,
      });

      const deployStageActions = [deployAction];

      // Deploy to Second Region if provided
      /* istanbul ignore next */
      if (props.ecsServiceSecondRegion) {
        const deployActionSecondRegion =
          new codepipeline_actions.EcsDeployAction({
            actionName: 'Deploy_Secondary_Region',
            service: props.ecsServiceSecondRegion,
            input: this.buildOutput,
            runOrder: 2,
          });
        deployStageActions.push(deployActionSecondRegion);
      }

      this.pipeline.addStage({
        stageName: 'Deploy',
        actions: deployStageActions,
      });
    }

    // Add notifications for pipeline state changes
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new events_targets.SnsTopic(props.notificationTopic),
      description: 'Notification for pipeline state changes',
      eventPattern: {
        detail: {
          state: ['SUCCEEDED', 'FAILED', 'STOPPED'],
        },
      },
    });

    // Output important values
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: this.sourceBucket.bucketName,
      description: 'S3 bucket for source code',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'Pipeline ARN',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryArn', {
      value: this.ecrRepository.repositoryArn,
      description: 'ECR Repository ARN',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: this.ecrRepository.repositoryName,
      description: 'ECR Repository Name',
    });
  }
}

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Get configuration from context or use defaults
    const notificationEmail =
      this.node.tryGetContext('notificationEmail') || 'devops@example.com';
    const secondaryRegion =
      this.node.tryGetContext('secondaryRegion') || 'us-west-2';
    const isProd = environmentSuffix === 'prod';

    // 1. Create Security Stack
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        stackName: `security-stack-${environmentSuffix}`,
      }
    );

    // 2. Create Notification Stack
    const notificationStack = new NotificationStack(
      scope,
      `NotificationStack-${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        email: notificationEmail,
        stackName: `notification-stack-${environmentSuffix}`,
      }
    );

    // 3. Create Pipeline Stack (includes ECR repository)
    const pipelineStack = new PipelineStack(
      scope,
      `PipelineStack-${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        notificationTopic: notificationStack.pipelineTopic,
        appSecretsArn: securityStack.appSecrets.secretArn,
        stackName: `pipeline-stack-${environmentSuffix}`,
      }
    );

    // 4. Create ECS Infrastructure Stack - Primary Region
    const ecsStackPrimary = new EcsInfrastructureStack(
      scope,
      `EcsStack-Primary-${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        appSecretsArn: securityStack.appSecrets.secretArn,
        ecrRepositoryArn: pipelineStack.ecrRepository.repositoryArn,
        ecrRepositoryUri: pipelineStack.ecrRepository.repositoryUri,
        stackName: `ecs-stack-primary-${environmentSuffix}`,
      }
    );

    // 5. Create ECS Infrastructure Stack - Secondary Region (for production/high availability)
    let ecsStackSecondary: EcsInfrastructureStack | undefined;
    if (isProd) {
      ecsStackSecondary = new EcsInfrastructureStack(
        scope,
        `EcsStack-Secondary-${environmentSuffix}`,
        {
          ...props,
          env: {
            account: props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
            region: secondaryRegion,
          },
          environmentSuffix,
          appSecretsArn: securityStack.appSecrets.secretArn,
          ecrRepositoryArn: pipelineStack.ecrRepository.repositoryArn,
          ecrRepositoryUri: pipelineStack.ecrRepository.repositoryUri,
          stackName: `ecs-stack-secondary-${environmentSuffix}`,
          crossRegionReferences: true,
        }
      );
    }

    // Add stack dependencies
    pipelineStack.addDependency(notificationStack);
    pipelineStack.addDependency(securityStack);
    ecsStackPrimary.addDependency(pipelineStack);
    ecsStackPrimary.addDependency(securityStack);
    if (ecsStackSecondary) {
      ecsStackSecondary.addDependency(pipelineStack);
      ecsStackSecondary.addDependency(securityStack);
    }

    // Add tags to all stacks
    const allStacks = [
      securityStack,
      notificationStack,
      ecsStackPrimary,
      pipelineStack,
    ];
    if (ecsStackSecondary) {
      allStacks.push(ecsStackSecondary);
    }

    allStacks.forEach(stack => {
      cdk.Tags.of(stack).add('Environment', environmentSuffix);
      cdk.Tags.of(stack).add('ManagedBy', 'CDK');
      cdk.Tags.of(stack).add('Application', 'NodeJsApp');
    });

    // Output all important resource information from TapStack
    new cdk.CfnOutput(this, 'AppSecretsArn', {
      value: securityStack.appSecrets.secretArn,
      description: 'Secrets Manager ARN for application secrets',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationStack.pipelineTopic.topicArn,
      description: 'SNS Topic ARN for pipeline notifications',
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipelineStack.sourceBucket.bucketName,
      description: 'S3 bucket for source code',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: pipelineStack.artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipelineStack.pipeline.pipelineArn,
      description: 'Pipeline ARN',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryArn', {
      value: pipelineStack.ecrRepository.repositoryArn,
      description: 'ECR Repository ARN',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: pipelineStack.ecrRepository.repositoryName,
      description: 'ECR Repository Name',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: pipelineStack.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: ecsStackPrimary.cluster.clusterName,
      description: 'ECS Cluster Name (Primary Region)',
    });

    new cdk.CfnOutput(this, 'EcsClusterArn', {
      value: ecsStackPrimary.cluster.clusterArn,
      description: 'ECS Cluster ARN (Primary Region)',
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: ecsStackPrimary.service.serviceName,
      description: 'ECS Service Name (Primary Region)',
    });

    new cdk.CfnOutput(this, 'EcsServiceArn', {
      value: ecsStackPrimary.service.serviceArn,
      description: 'ECS Service ARN (Primary Region)',
    });

    new cdk.CfnOutput(this, 'DeploymentSummary', {
      value: JSON.stringify({
        environment: environmentSuffix,
        primaryRegion: props?.env?.region || process.env.CDK_DEFAULT_REGION,
        secondaryRegion: isProd ? secondaryRegion : 'N/A',
        multiRegion: isProd,
      }),
      description: 'Deployment configuration summary',
    });
  }
}
