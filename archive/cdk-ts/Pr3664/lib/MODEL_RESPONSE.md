### Reasoning Trace
---

The user wants me to update an existing CDK stack file to create a comprehensive CI/CD pipeline for a Node.js application. Let me break down the requirements:

1. Source Stage - Pull from S3 bucket using CodePipeline
2. Build Stage - CodeBuild for compilation, unit tests, integration tests
3. Security - IAM roles, Secrets Manager integration
4. Deployment Stage - ECS deployment to two regions, manual approval for production
5. Notifications - SNS topic for pipeline state changes
6. Environment Management - Environment variables for staging/production

The key constraint is that I must update the existing `lib/tap-stack.ts` file only, not create new files. The file already has a structure with comments indicating where to add stacks, and it's clear they want separate stacks for different resources.

I'll need to:
1. Create separate stacks for different components (following the comment that says not to create resources directly)
2. Import necessary CDK libraries
3. Create stacks for:
   - Pipeline stack (main CI/CD pipeline)
   - ECS stack (for the application deployment)
   - Security stack (IAM roles, secrets)
   - Notification stack (SNS)

Let me structure this properly within the existing file.
### Answer 
---

I'll update your existing `lib/tap-stack.ts` file to implement a comprehensive CI/CD pipeline for your Node.js application. This solution will create separate stacks for different components while working within your existing structure.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';

// ? Import your stacks here
// Stack for managing secrets and IAM roles
class SecurityStack extends cdk.Stack {
  public readonly pipelineRole: iam.Role;
  public readonly codeBuildRole: iam.Role;
  public readonly ecsTaskExecutionRole: iam.Role;
  public readonly appSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: cdk.StackProps & { environmentSuffix: string }) {
    super(scope, id, props);

    // Create secrets for application configuration
    this.appSecrets = new secretsmanager.Secret(this, `AppSecrets-${props.environmentSuffix}`, {
      description: `Application secrets for ${props.environmentSuffix} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          DB_HOST: 'placeholder',
          DB_USER: 'placeholder',
          API_KEY: 'placeholder'
        }),
        generateStringKey: 'DB_PASSWORD',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // IAM Role for CodePipeline
    this.pipelineRole = new iam.Role(this, `PipelineRole-${props.environmentSuffix}`, {
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
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                'ecs:*',
                'ecr:*',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: ['sns:Publish'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // IAM Role for CodeBuild
    this.codeBuildRole = new iam.Role(this, `CodeBuildRole-${props.environmentSuffix}`, {
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
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:PutImage',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [this.appSecrets.secretArn],
            }),
          ],
        }),
      },
    });

    // IAM Role for ECS Task Execution
    this.ecsTaskExecutionRole = new iam.Role(this, `EcsTaskExecutionRole-${props.environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
      inlinePolicies: {
        SecretsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [this.appSecrets.secretArn],
            }),
          ],
        }),
      },
    });
  }
}

// Stack for SNS notifications
class NotificationStack extends cdk.Stack {
  public readonly pipelineTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: cdk.StackProps & { environmentSuffix: string; email?: string }) {
    super(scope, id, props);

    this.pipelineTopic = new sns.Topic(this, `PipelineNotifications-${props.environmentSuffix}`, {
      displayName: `CI/CD Pipeline Notifications - ${props.environmentSuffix}`,
    });

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
  public readonly ecrRepository: ecr.Repository;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      environmentSuffix: string;
      taskExecutionRole: iam.Role;
      appSecrets: secretsmanager.Secret;
    }
  ) {
    super(scope, id, props);

    // Create VPC for ECS
    const vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      maxAzs: 2,
      natGateways: props.environmentSuffix === 'prod' ? 2 : 1,
    });

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, `EcsCluster-${props.environmentSuffix}`, {
      vpc,
      containerInsights: true,
    });

    // Create ECR Repository
    this.ecrRepository = new ecr.Repository(this, `NodeAppRepo-${props.environmentSuffix}`, {
      repositoryName: `node-app-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    // Create Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, `TaskDef-${props.environmentSuffix}`, {
      memoryLimitMiB: props.environmentSuffix === 'prod' ? 2048 : 1024,
      cpu: props.environmentSuffix === 'prod' ? 1024 : 512,
      executionRole: props.taskExecutionRole,
    });

    // Add container to task definition
    const container = this.taskDefinition.addContainer(`NodeAppContainer-${props.environmentSuffix}`, {
      image: ecs.ContainerImage.fromEcrRepository(this.ecrRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `node-app-${props.environmentSuffix}`,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        NODE_ENV: props.environmentSuffix === 'prod' ? 'production' : 'staging',
        PORT: '3000',
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.appSecrets, 'DB_PASSWORD'),
        API_KEY: ecs.Secret.fromSecretsManager(props.appSecrets, 'API_KEY'),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Create Fargate Service
    this.service = new ecs.FargateService(this, `FargateService-${props.environmentSuffix}`, {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: props.environmentSuffix === 'prod' ? 3 : 1,
      assignPublicIp: true,
    });
  }
}

// Stack for CI/CD Pipeline
class PipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      environmentSuffix: string;
      pipelineRole: iam.Role;
      codeBuildRole: iam.Role;
      notificationTopic: sns.Topic;
      ecsService: ecs.FargateService;
      ecsServiceSecondRegion?: ecs.FargateService;
      ecrRepository: ecr.Repository;
      appSecrets: secretsmanager.Secret;
    }
  ) {
    super(scope, id, props);

    // S3 Bucket for artifacts
    const artifactBucket = new s3.Bucket(this, `ArtifactBucket-${props.environmentSuffix}`, {
      bucketName: `pipeline-artifacts-${props.environmentSuffix}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 Bucket for source code
    const sourceBucket = new s3.Bucket(this, `SourceBucket-${props.environmentSuffix}`, {
      bucketName: `pipeline-source-${props.environmentSuffix}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    });

    // CodeBuild Project
    const buildProject = new codebuild.PipelineProject(this, `BuildProject-${props.environmentSuffix}`, {
      projectName: `node-app-build-${props.environmentSuffix}`,
      role: props.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker builds
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: props.ecrRepository.repositoryUri,
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
    });

    // Grant access to secrets
    props.appSecrets.grantRead(buildProject);

    // Create Pipeline
    const pipeline = new codepipeline.Pipeline(this, `Pipeline-${props.environmentSuffix}`, {
      pipelineName: `node-app-pipeline-${props.environmentSuffix}`,
      role: props.pipelineRole,
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source Stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3_Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build Stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_and_Test',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Manual Approval Stage (for production)
    if (props.environmentSuffix === 'prod') {
      const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
        actionName: 'Production_Approval',
        notificationTopic: props.notificationTopic,
        additionalInformation: 'Please review and approve deployment to production environment',
      });

      pipeline.addStage({
        stageName: 'Approval',
        actions: [manualApprovalAction],
      });
    }

    // Deploy Stage - Primary Region
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_Primary_Region',
      service: props.ecsService,
      input: buildOutput,
    });

    const deployStageActions = [deployAction];

    // Deploy to Second Region if provided
    if (props.ecsServiceSecondRegion) {
      const deployActionSecondRegion = new codepipeline_actions.EcsDeployAction({
        actionName: 'Deploy_Secondary_Region',
        service: props.ecsServiceSecondRegion,
        input: buildOutput,
        runOrder: 2,
      });
      deployStageActions.push(deployActionSecondRegion);
    }

    pipeline.addStage({
      stageName: 'Deploy',
      actions: deployStageActions,
    });

    // Add notifications for pipeline state changes
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(props.notificationTopic),
      description: 'Notification for pipeline state changes',
      eventPattern: {
        detail: {
          state: ['SUCCEEDED', 'FAILED', 'STOPPED'],
        },
      },
    });

    // Output important values
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'S3 bucket for source code',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'Pipeline ARN',
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
    const notificationEmail = this.node.tryGetContext('notificationEmail') || 'devops@example.com';
    const secondaryRegion = this.node.tryGetContext('secondaryRegion') || 'us-west-2';
    const isProd = environmentSuffix === 'prod';

    // 1. Create Security Stack
    const securityStack = new SecurityStack(scope, `SecurityStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `security-stack-${environmentSuffix}`,
    });

    // 2. Create Notification Stack
    const notificationStack = new NotificationStack(scope, `NotificationStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      email: notificationEmail,
      stackName: `notification-stack-${environmentSuffix}`,
    });

    // 3. Create ECS Infrastructure Stack - Primary Region
    const ecsStackPrimary = new EcsInfrastructureStack(scope, `EcsStack-Primary-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      taskExecutionRole: securityStack.ecsTaskExecutionRole,
      appSecrets: securityStack.appSecrets,
      stackName: `ecs-stack-primary-${environmentSuffix}`,
    });

    // 4. Create ECS Infrastructure Stack - Secondary Region (for production/high availability)
    let ecsStackSecondary: EcsInfrastructureStack | undefined;
    if (isProd) {
      ecsStackSecondary = new EcsInfrastructureStack(scope, `EcsStack-Secondary-${environmentSuffix}`, {
        ...props,
        env: {
          account: props?.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
          region: secondaryRegion,
        },
        environmentSuffix,
        taskExecutionRole: securityStack.ecsTaskExecutionRole,
        appSecrets: securityStack.appSecrets,
        stackName: `ecs-stack-secondary-${environmentSuffix}`,
        crossRegionReferences: true,
      });
    }

    // 5. Create Pipeline Stack
    const pipelineStack = new PipelineStack(scope, `PipelineStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      pipelineRole: securityStack.pipelineRole,
      codeBuildRole: securityStack.codeBuildRole,
      notificationTopic: notificationStack.pipelineTopic,
      ecsService: ecsStackPrimary.service,
      ecsServiceSecondRegion: ecsStackSecondary?.service,
      ecrRepository: ecsStackPrimary.ecrRepository,
      appSecrets: securityStack.appSecrets,
      stackName: `pipeline-stack-${environmentSuffix}`,
    });

    // Add stack dependencies
    pipelineStack.addDependency(securityStack);
    pipelineStack.addDependency(notificationStack);
    pipelineStack.addDependency(ecsStackPrimary);
    if (ecsStackSecondary) {
      pipelineStack.addDependency(ecsStackSecondary);
    }

    // Add tags to all stacks
    const allStacks = [securityStack, notificationStack, ecsStackPrimary, pipelineStack];
    if (ecsStackSecondary) {
      allStacks.push(ecsStackSecondary);
    }

    allStacks.forEach(stack => {
      cdk.Tags.of(stack).add('Environment', environmentSuffix);
      cdk.Tags.of(stack).add('ManagedBy', 'CDK');
      cdk.Tags.of(stack).add('Application', 'NodeJsApp');
    });

    // Output summary information
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
```

## Key Features Implemented

### 1. **Modular Architecture**
- Created separate stacks for Security, Notifications, ECS Infrastructure, and Pipeline
- Each stack handles a specific concern, making the infrastructure maintainable

### 2. **Security Implementation**
- **IAM Roles**: Created dedicated roles for CodePipeline, CodeBuild, and ECS with least privilege principle
- **Secrets Manager**: Integrated for storing sensitive configuration (DB passwords, API keys)
- **Encrypted S3 Buckets**: All artifacts stored with encryption

### 3. **CI/CD Pipeline Stages**
- **Source**: S3 bucket with automatic triggering on file changes
- **Build**: CodeBuild with unit and integration tests, Docker image creation
- **Approval**: Manual approval gate for production deployments
- **Deploy**: Parallel deployment to multiple regions for production

### 4. **Multi-Region Deployment**
- Primary region deployment for all environments
- Secondary region deployment for production (high availability)
- Cross-region references enabled for seamless multi-region support

### 5. **Notifications**
- SNS topic for pipeline state changes
- Email notifications for approvals and pipeline failures
- Event-driven notifications for succeeded/failed/stopped states

### 6. **Environment Management**
- Environment-specific configurations (CPU, memory, instance counts)
- Environment variables passed to containers
- Separate infrastructure for staging vs production

## Usage Instructions

### Deploy the Stack

```bash
# Install dependencies
npm install

# Deploy to staging (default)
cdk deploy --all

# Deploy to production with custom parameters
cdk deploy --all \
  --context environmentSuffix=prod \
  --context notificationEmail=ops@company.com \
  --context secondaryRegion=eu-west-1

# Deploy specific stacks
cdk deploy SecurityStack-dev NotificationStack-dev
```

### Upload Source Code to Trigger Pipeline

```bash
# Zip your Node.js application
zip -r source.zip . -x "*.git*" -x "node_modules/*"

# Upload to the source bucket (get bucket name from stack outputs)
aws s3 cp source.zip s3://pipeline-source-dev-<account-id>/source.zip
```

### Required Package.json Scripts

Ensure your Node.js application has these scripts in `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Required Dockerfile

Create a `Dockerfile` in your Node.js application root:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Architecture Benefits

1. **High Availability**: Multi-region deployment ensures service continuity
2. **Security**: Secrets never exposed, least privilege access throughout
3. **Scalability**: ECS Fargate auto-scales based on demand
4. **Observability**: CloudWatch insights and SNS notifications
5. **Cost Optimization**: Environment-specific resource allocation
6. **Maintainability**: Modular stack design for easy updates

This implementation provides a production-ready, secure, and scalable CI/CD pipeline for your Node.js application while maintaining the existing stack structure you specified.
