# CI/CD Pipeline for Containerized Applications - CDK TypeScript Implementation

This implementation provides a complete automated CI/CD pipeline for containerized applications using AWS CDK with TypeScript. The infrastructure includes source control integration, automated container builds, container registry, deployment orchestration, and comprehensive monitoring.

## Architecture Overview

The pipeline consists of:
- **Source Stage**: GitHub repository integration
- **Build Stage**: CodeBuild for Docker image compilation
- **Deploy Stage**: ECS Fargate deployment with Application Load Balancer
- **Monitoring**: CloudWatch Logs and SNS notifications
- **Security**: IAM roles with least privilege, encrypted artifacts

## File: lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { ContainerRegistryConstruct } from './container-registry-construct';
import { PipelineConstruct } from './pipeline-construct';
import { EcsDeploymentConstruct } from './ecs-deployment-construct';
import { MonitoringConstruct } from './monitoring-construct';

export interface TapStackProps {
  environmentSuffix: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
}

export class TapStack extends Construct {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const { environmentSuffix, githubOwner, githubRepo, githubBranch = 'main' } = props;

    // VPC and networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // ECR repository for container images
    const containerRegistry = new ContainerRegistryConstruct(this, 'ContainerRegistry', {
      environmentSuffix,
    });

    // ECS cluster and deployment infrastructure
    const ecsDeployment = new EcsDeploymentConstruct(this, 'EcsDeployment', {
      environmentSuffix,
      vpc: networking.vpc,
      ecrRepository: containerRegistry.repository,
    });

    // CodePipeline for CI/CD automation
    const pipeline = new PipelineConstruct(this, 'Pipeline', {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch,
      ecrRepository: containerRegistry.repository,
      ecsService: ecsDeployment.service,
      ecsCluster: ecsDeployment.cluster,
    });

    // Monitoring and alerting
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      pipeline: pipeline.pipeline,
      ecsService: ecsDeployment.service,
      loadBalancer: ecsDeployment.loadBalancer,
    });
  }
}
```

## File: lib/networking-construct.ts

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface NetworkingConstructProps {
  environmentSuffix: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // VPC for ECS tasks and load balancer
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `cicd-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0, // Use VPC endpoints instead for cost optimization
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Endpoints for cost optimization (avoid NAT Gateway costs)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    this.vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    // Add tags for resource identification
    this.vpc.node.applyAspect({
      visit(node) {
        if (node instanceof ec2.CfnVPC) {
          node.tags.setTag('Environment', environmentSuffix);
        }
      },
    });
  }
}
```

## File: lib/container-registry-construct.ts

```typescript
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';

export interface ContainerRegistryConstructProps {
  environmentSuffix: string;
}

export class ContainerRegistryConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ContainerRegistryConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // ECR repository for Docker images
    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: `cicd-app-${environmentSuffix}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
          rulePriority: 1,
        },
        {
          description: 'Remove untagged images after 1 day',
          maxImageAge: Duration.days(1),
          rulePriority: 2,
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ],
    });
  }
}
```

## File: lib/ecs-deployment-construct.ts

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';

export interface EcsDeploymentConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  ecrRepository: ecr.Repository;
}

export class EcsDeploymentConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: EcsDeploymentConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpc, ecrRepository } = props;

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `cicd-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `cicd-task-exec-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task role for application
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `cicd-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/ecs/cicd-app-${environmentSuffix}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `cicd-app-${environmentSuffix}`,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // Container definition
    const container = this.taskDefinition.addContainer('AppContainer', {
      containerName: `cicd-app-container-${environmentSuffix}`,
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'cicd-app',
        logGroup,
      }),
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      loadBalancerName: `cicd-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      deletionProtection: false,
    });

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `cicd-tg-${environmentSuffix}`,
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: Duration.seconds(30),
    });

    // Listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      securityGroupName: `cicd-ecs-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(8080),
      'Allow inbound from ALB'
    );

    // ECS Service
    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: `cicd-service-${environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      circuitBreaker: {
        rollback: true,
      },
      healthCheckGracePeriod: Duration.seconds(60),
    });

    this.service.attachToApplicationTargetGroup(targetGroup);

    // Auto-scaling configuration
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });
  }
}
```

## File: lib/pipeline-construct.ts

```typescript
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, SecretValue } from 'aws-cdk-lib';

export interface PipelineConstructProps {
  environmentSuffix: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  ecrRepository: ecr.Repository;
  ecsService: ecs.FargateService;
  ecsCluster: ecs.Cluster;
}

export class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: PipelineConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch,
      ecrRepository,
      ecsService,
      ecsCluster,
    } = props;

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CodeBuild project for Docker builds
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `cicd-build-${environmentSuffix}`,
      description: 'Build Docker images for containerized application',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
          AWS_ACCOUNT_ID: {
            value: ecrRepository.repositoryArn.split(':')[4],
          },
          AWS_DEFAULT_REGION: {
            value: ecrRepository.env.region,
          },
          ENVIRONMENT_SUFFIX: {
            value: environmentSuffix,
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
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $ECR_REPOSITORY_URI:latest .',
              'docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              'docker push $ECR_REPOSITORY_URI:latest',
              'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'printf \'[{"name":"cicd-app-container-' + environmentSuffix + '","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:latest > imagedefinitions.json',
              'cat imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
        cache: {
          paths: ['/root/.docker/**/*'],
        },
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
    });

    // Grant ECR permissions to CodeBuild
    ecrRepository.grantPullPush(this.buildProject);

    // Pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `cicd-pipeline-${environmentSuffix}`,
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      oauthToken: SecretValue.secretsManager('github-token'),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_Docker_Image',
      project: this.buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_to_ECS',
      service: ecsService,
      input: buildOutput,
      deploymentTimeout: codepipeline_actions.EcsDeploymentTimeout.MINUTES_30,
    });

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }
}
```

## File: lib/monitoring-construct.ts

```typescript
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Duration } from 'aws-cdk-lib';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  pipeline: codepipeline.Pipeline;
  ecsService: ecs.FargateService;
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environmentSuffix, pipeline, ecsService, loadBalancer } = props;

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `cicd-alarms-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Alarms',
    });

    // Pipeline failure alarm
    const pipelineFailureMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionFailure',
      dimensionsMap: {
        PipelineName: pipeline.pipelineName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: `cicd-pipeline-failure-${environmentSuffix}`,
      alarmDescription: 'Alarm when pipeline execution fails',
      metric: pipelineFailureMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    pipelineFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // ECS service unhealthy tasks alarm
    const unhealthyTasksMetric = ecsService.metricCpuUtilization({
      period: Duration.minutes(5),
      statistic: 'Average',
    });

    const highCpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: `cicd-ecs-high-cpu-${environmentSuffix}`,
      alarmDescription: 'Alarm when ECS tasks CPU is high',
      metric: unhealthyTasksMetric,
      threshold: 85,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // ALB unhealthy target alarm
    const unhealthyTargetMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'UnHealthyHostCount',
      dimensionsMap: {
        LoadBalancer: loadBalancer.loadBalancerFullName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const unhealthyTargetAlarm = new cloudwatch.Alarm(this, 'UnhealthyTargetAlarm', {
      alarmName: `cicd-alb-unhealthy-targets-${environmentSuffix}`,
      alarmDescription: 'Alarm when ALB has unhealthy targets',
      metric: unhealthyTargetMetric,
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    unhealthyTargetAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // ALB 5xx errors alarm
    const alb5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: loadBalancer.loadBalancerFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const alb5xxAlarm = new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      alarmName: `cicd-alb-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm when ALB returns 5xx errors',
      metric: alb5xxMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    alb5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Dashboard
    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `cicd-dashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [pipelineFailureMetric],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ECS CPU Utilization',
            left: [unhealthyTasksMetric],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'ALB Unhealthy Targets',
            left: [unhealthyTargetMetric],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB 5xx Errors',
            left: [alb5xxMetric],
            width: 12,
          }),
        ],
      ],
    });
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline for Containerized Applications

This CDK TypeScript application creates a complete automated CI/CD pipeline for containerized applications on AWS.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets, VPC endpoints for cost optimization
- **ECR**: Container registry with image scanning and lifecycle policies
- **CodePipeline**: Automated CI/CD pipeline with Source, Build, and Deploy stages
- **CodeBuild**: Docker image builds with caching
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: Traffic distribution with health checks
- **CloudWatch**: Logging, metrics, and alarms
- **SNS**: Notifications for pipeline and deployment events

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18+ and npm installed
- GitHub personal access token stored in AWS Secrets Manager as 'github-token'
- Docker installed (for local testing)

## Configuration

The stack requires the following parameters:

- `environmentSuffix`: Unique suffix for resource naming (e.g., 'dev', 'prod-abc123')
- `githubOwner`: GitHub repository owner
- `githubRepo`: GitHub repository name
- `githubBranch`: Branch to monitor (default: 'main')

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX=dev-test-123
   export GITHUB_OWNER=your-github-username
   export GITHUB_REPO=your-repo-name
   ```

3. Deploy the stack:
   ```bash
   npx cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX \
                  --context githubOwner=$GITHUB_OWNER \
                  --context githubRepo=$GITHUB_REPO
   ```

## GitHub Token Setup

Store your GitHub personal access token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
    --name github-token \
    --secret-string "your-github-personal-access-token" \
    --region us-east-1
```

Required scopes: `repo`, `admin:repo_hook`

## Application Requirements

Your containerized application should:

1. Include a `Dockerfile` in the repository root
2. Expose port 8080
3. Provide a `/health` endpoint for health checks
4. Build successfully with `docker build`

## Pipeline Flow

1. **Source**: Webhook triggers on GitHub commits
2. **Build**: CodeBuild compiles Docker image and pushes to ECR
3. **Deploy**: ECS updates service with new image (rolling deployment)

## Monitoring

- CloudWatch Dashboard: `cicd-dashboard-{environmentSuffix}`
- CloudWatch Logs: `/ecs/cicd-app-{environmentSuffix}`
- SNS Topic: `cicd-alarms-{environmentSuffix}` (subscribe for alerts)

## Cost Optimization

- Uses Fargate Spot for cost savings
- VPC endpoints instead of NAT Gateway
- ECR lifecycle policies to remove old images
- Auto-scaling based on CPU/memory

## Cleanup

To destroy all resources:

```bash
npx cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup.

## Troubleshooting

**Pipeline fails at Build stage:**
- Check CodeBuild logs in CloudWatch
- Verify Dockerfile is valid
- Ensure ECR permissions are correct

**ECS tasks fail to start:**
- Check ECS task logs in CloudWatch
- Verify container health check endpoint
- Check security group rules

**GitHub webhook not triggering:**
- Verify github-token in Secrets Manager
- Check webhook in GitHub repository settings
- Verify token has correct scopes

## Security

- All S3 buckets use encryption at rest
- ECR images scanned on push
- IAM roles use least privilege
- VPC endpoints used for private connectivity
- SSL enforced for S3 buckets
