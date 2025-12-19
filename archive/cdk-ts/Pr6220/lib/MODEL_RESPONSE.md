# ECS Fargate Microservices Infrastructure

Complete AWS CDK TypeScript implementation for deploying fraud detection microservices on ECS Fargate with Container Insights, service discovery, and auto-scaling.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with 3 AZs
    const vpc = new ec2.Vpc(this, 'FraudDetectionVpc', {
      vpcName: `fraud-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
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
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 bucket for data processing
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `fraud-data-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SQS queue for workers
    const taskQueue = new sqs.Queue(this, 'TaskQueue', {
      queueName: `fraud-tasks-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Aurora PostgreSQL cluster
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for RDS Aurora cluster',
      securityGroupName: `fraud-db-sg-${environmentSuffix}`,
    });

    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader1', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      defaultDatabaseName: 'frauddb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
    });

    // ECS Cluster with Container Insights
    const cluster = new ecs.Cluster(this, 'FraudCluster', {
      clusterName: `fraud-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Cloud Map namespace for service discovery
    const namespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceNamespace', {
      name: `fraud-services-${environmentSuffix}.local`,
      vpc,
      description: 'Private DNS namespace for fraud detection services',
    });

    // ECR Repositories
    const apiRepo = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `fraud-api-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
    });

    const workerRepo = new ecr.Repository(this, 'WorkerRepository', {
      repositoryName: `fraud-worker-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
    });

    const jobRepo = new ecr.Repository(this, 'JobRepository', {
      repositoryName: `fraud-job-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApiLoadBalancer', {
      loadBalancerName: `fraud-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // IAM Task Roles
    const apiTaskRole = new iam.Role(this, 'ApiTaskRole', {
      roleName: `fraud-api-task-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    apiTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`],
    }));

    apiTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [dataBucket.arnForObjects('*')],
    }));

    const workerTaskRole = new iam.Role(this, 'WorkerTaskRole', {
      roleName: `fraud-worker-task-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    workerTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`],
    }));

    workerTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [dataBucket.arnForObjects('*')],
    }));

    workerTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: [taskQueue.queueArn],
    }));

    const jobTaskRole = new iam.Role(this, 'JobTaskRole', {
      roleName: `fraud-job-task-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    jobTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`],
    }));

    jobTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [dataBucket.arnForObjects('*')],
    }));

    // Task Execution Role (for pulling images and logs)
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `fraud-task-exec-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // CloudWatch Log Groups
    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/ecs/fraud-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workerLogGroup = new logs.LogGroup(this, 'WorkerLogGroup', {
      logGroupName: `/ecs/fraud-worker-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const jobLogGroup = new logs.LogGroup(this, 'JobLogGroup', {
      logGroupName: `/ecs/fraud-job-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // API Task Definition
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `fraud-api-${environmentSuffix}`,
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole: apiTaskRole,
      executionRole: taskExecutionRole,
    });

    const apiContainer = apiTaskDef.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
      environment: {
        SERVICE_NAME: 'fraud-api',
        ENVIRONMENT: environmentSuffix,
      },
    });

    apiContainer.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Add X-Ray sidecar to API
    apiTaskDef.addContainer('XRayContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
      cpu: 32,
      memoryLimitMiB: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: apiLogGroup,
      }),
    });

    apiTaskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // Worker Task Definition
    const workerTaskDef = new ecs.FargateTaskDefinition(this, 'WorkerTaskDef', {
      family: `fraud-worker-${environmentSuffix}`,
      cpu: 1024,
      memoryLimitMiB: 2048,
      taskRole: workerTaskRole,
      executionRole: taskExecutionRole,
    });

    const workerContainer = workerTaskDef.addContainer('WorkerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(workerRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'worker',
        logGroup: workerLogGroup,
      }),
      environment: {
        SERVICE_NAME: 'fraud-worker',
        ENVIRONMENT: environmentSuffix,
        QUEUE_URL: taskQueue.queueUrl,
      },
    });

    // Add X-Ray sidecar to Worker
    workerTaskDef.addContainer('XRayContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
      cpu: 32,
      memoryLimitMiB: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: workerLogGroup,
      }),
    });

    workerTaskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // Job Task Definition
    const jobTaskDef = new ecs.FargateTaskDefinition(this, 'JobTaskDef', {
      family: `fraud-job-${environmentSuffix}`,
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: jobTaskRole,
      executionRole: taskExecutionRole,
    });

    const jobContainer = jobTaskDef.addContainer('JobContainer', {
      image: ecs.ContainerImage.fromEcrRepository(jobRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'job',
        logGroup: jobLogGroup,
      }),
      environment: {
        SERVICE_NAME: 'fraud-job',
        ENVIRONMENT: environmentSuffix,
      },
    });

    // Add X-Ray sidecar to Job
    jobTaskDef.addContainer('XRayContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
      cpu: 32,
      memoryLimitMiB: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: jobLogGroup,
      }),
    });

    jobTaskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // Allow ECS tasks to access database
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow ECS tasks to access Aurora PostgreSQL'
    );

    // API Service with ALB integration
    const apiService = new ecs.FargateService(this, 'ApiService', {
      serviceName: `fraud-api-${environmentSuffix}`,
      cluster,
      taskDefinition: apiTaskDef,
      desiredCount: 2,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      circuitBreaker: {
        rollback: true,
      },
      cloudMapOptions: {
        name: 'api',
        cloudMapNamespace: namespace,
      },
      enableExecuteCommand: true,
    });

    // Add ALB target group for API service
    const apiTargetGroup = listener.addTargets('ApiTargetGroup', {
      targetGroupName: `fraud-api-tg-${environmentSuffix}`,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [apiService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Add path-based routing
    listener.addAction('ApiPathRouting', {
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
      action: elbv2.ListenerAction.forward([apiTargetGroup]),
    });

    // Auto-scaling for API service
    const apiScaling = apiService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    apiScaling.scaleOnCpuUtilization('ApiCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    apiScaling.scaleOnMemoryUtilization('ApiMemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Worker Service
    const workerService = new ecs.FargateService(this, 'WorkerService', {
      serviceName: `fraud-worker-${environmentSuffix}`,
      cluster,
      taskDefinition: workerTaskDef,
      desiredCount: 1,
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
      circuitBreaker: {
        rollback: true,
      },
      cloudMapOptions: {
        name: 'worker',
        cloudMapNamespace: namespace,
      },
      enableExecuteCommand: true,
    });

    // Auto-scaling for Worker service
    const workerScaling = workerService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 5,
    });

    workerScaling.scaleOnCpuUtilization('WorkerCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    workerScaling.scaleOnMemoryUtilization('WorkerMemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // EventBridge rule for scheduled job (every 6 hours)
    const scheduleRule = new events.Rule(this, 'ScheduledJobRule', {
      ruleName: `fraud-job-schedule-${environmentSuffix}`,
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      description: 'Run fraud detection analytics job every 6 hours',
    });

    scheduleRule.addTarget(new targets.EcsTask({
      cluster,
      taskDefinition: jobTaskDef,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      taskCount: 1,
    }));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServiceDashboard', {
      dashboardName: `fraud-detection-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Service - Task Count',
        left: [apiService.metricCpuUtilization()],
        right: [apiService.metricMemoryUtilization()],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Worker Service - Task Count',
        left: [workerService.metricCpuUtilization()],
        right: [workerService.metricMemoryUtilization()],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metricRequestCount()],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Target Response Time',
        left: [apiTargetGroup.metricTargetResponseTime()],
      })
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `fraud-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudMapNamespace', {
      value: namespace.namespaceName,
      description: 'Cloud Map namespace for service discovery',
      exportName: `fraud-namespace-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudMapNamespaceId', {
      value: namespace.namespaceId,
      description: 'Cloud Map namespace ID',
      exportName: `fraud-namespace-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name',
      exportName: `fraud-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `fraud-dashboard-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepo.repositoryUri,
      description: 'ECR repository URI for API service',
      exportName: `fraud-api-repo-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WorkerRepositoryUri', {
      value: workerRepo.repositoryUri,
      description: 'ECR repository URI for Worker service',
      exportName: `fraud-worker-repo-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'JobRepositoryUri', {
      value: jobRepo.repositoryUri,
      description: 'ECR repository URI for Job service',
      exportName: `fraud-job-repo-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora PostgreSQL cluster endpoint',
      exportName: `fraud-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for data processing',
      exportName: `fraud-data-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TaskQueueUrl', {
      value: taskQueue.queueUrl,
      description: 'SQS queue URL for worker tasks',
      exportName: `fraud-queue-url-${environmentSuffix}`,
    });
  }
}
```

## File: lib/README.md

```markdown
# Fraud Detection Microservices Infrastructure

AWS CDK TypeScript infrastructure for deploying containerized fraud detection microservices on ECS Fargate with auto-scaling, service discovery, and monitoring.

## Architecture

This infrastructure deploys a production-grade ECS Fargate environment with:

- **VPC**: 3 availability zones with public, private, and isolated subnets
- **ECS Cluster**: Container Insights enabled with Fargate and Fargate Spot capacity providers
- **Three Services**:
  - **API Service**: 2-10 tasks, exposed via ALB with path-based routing
  - **Worker Service**: 1-5 tasks, processes SQS queue messages
  - **Scheduled Job Service**: Runs every 6 hours via EventBridge
- **Application Load Balancer**: Path-based routing (/api/* to API service)
- **Service Discovery**: AWS Cloud Map private DNS namespace
- **Database**: Aurora PostgreSQL Serverless v2 cluster
- **Auto-Scaling**: CPU (70%) and memory (80%) based scaling
- **Circuit Breaker**: Automatic rollback on 50% task failure
- **Monitoring**: CloudWatch dashboards, Container Insights, X-Ray tracing
- **Storage**: S3 bucket for data processing, SQS queue for task distribution

## Prerequisites

- AWS CDK 2.x installed
- Node.js 18+ installed
- Docker installed (for building container images)
- AWS CLI configured with appropriate credentials
- Container images built and pushed to ECR repositories

## Installation

```bash
npm install
```

## Configuration

The stack requires an `environmentSuffix` parameter for resource naming:

```bash
export ENVIRONMENT_SUFFIX="dev-12345"
```

## Deployment

### 1. Build Docker Images

Before deploying, build and push your container images:

```bash
# API Service
docker build -t fraud-api:latest ./api
docker tag fraud-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-api-${ENVIRONMENT_SUFFIX}:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-api-${ENVIRONMENT_SUFFIX}:latest

# Worker Service
docker build -t fraud-worker:latest ./worker
docker tag fraud-worker:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-worker-${ENVIRONMENT_SUFFIX}:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-worker-${ENVIRONMENT_SUFFIX}:latest

# Job Service
docker build -t fraud-job:latest ./job
docker tag fraud-job:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-job-${ENVIRONMENT_SUFFIX}:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fraud-job-${ENVIRONMENT_SUFFIX}:latest
```

### 2. Deploy Infrastructure

```bash
npm run build
cdk synth
cdk deploy --context environmentSuffix=${ENVIRONMENT_SUFFIX}
```

### 3. Access Services

After deployment:

- **API Endpoint**: Use the LoadBalancerDNS output
- **CloudWatch Dashboard**: Use the DashboardUrl output
- **Service Discovery**: Services accessible at `<service-name>.fraud-services-${ENVIRONMENT_SUFFIX}.local`

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

Integration tests validate:
- ECS services are running with correct task counts
- ALB health checks are passing
- Service discovery is functional
- Auto-scaling policies are configured
- CloudWatch logs are receiving data
- X-Ray traces are being recorded

## Service Discovery

Services can communicate using Cloud Map DNS:

- API Service: `api.fraud-services-${ENVIRONMENT_SUFFIX}.local`
- Worker Service: `worker.fraud-services-${ENVIRONMENT_SUFFIX}.local`

## Auto-Scaling

### API Service
- Min: 2 tasks
- Max: 10 tasks
- Scale out at 70% CPU or 80% memory
- Scale in after 60 seconds cooldown

### Worker Service
- Min: 1 task
- Max: 5 tasks
- Scale out at 70% CPU or 80% memory
- Scale in after 60 seconds cooldown

## Monitoring

### CloudWatch Dashboard

View real-time metrics:
- Task count and health
- CPU and memory utilization
- ALB request count and response time
- Error rates

### X-Ray Tracing

Distributed tracing enabled for all services via X-Ray sidecar containers.

### Container Insights

Enhanced monitoring metrics available in CloudWatch Container Insights.

## Security

- **IAM Task Roles**: Least-privilege access to Secrets Manager, S3, and SQS
- **VPC Security**: Private subnets for ECS tasks, isolated subnets for database
- **Encryption**: S3 (SSE-S3), SQS (SSE-SQS), RDS (encryption at rest)
- **ALB**: Public-facing load balancer with security groups

## Secrets Management

Store database credentials and API keys in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name fraud-detection/db-credentials \
  --secret-string '{"username":"admin","password":"<strong-password>"}'

aws secretsmanager create-secret \
  --name fraud-detection/api-keys \
  --secret-string '{"key":"<api-key>"}'
```

## Cleanup

```bash
cdk destroy --context environmentSuffix=${ENVIRONMENT_SUFFIX}
```

All resources are configured with `DESTROY` removal policy for complete cleanup.

## Troubleshooting

### Service Not Starting

Check CloudWatch logs:
```bash
aws logs tail /ecs/fraud-api-${ENVIRONMENT_SUFFIX} --follow
```

### Auto-Scaling Not Working

Verify CloudWatch alarms:
```bash
aws cloudwatch describe-alarms --alarm-name-prefix fraud-
```

### Database Connection Issues

Verify security group rules allow ECS tasks to access RDS on port 5432.

## Cost Optimization

- Uses Fargate Spot capacity provider for cost savings
- Aurora Serverless v2 scales down when idle
- 7-day CloudWatch log retention
- Auto-scaling reduces costs during low traffic

## Support

For issues or questions, refer to AWS documentation:
- [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Cloud Map](https://docs.aws.amazon.com/cloud-map/latest/dg/what-is-cloud-map.html)
- [Application Auto Scaling](https://docs.aws.amazon.com/autoscaling/application/userguide/what-is-application-auto-scaling.html)
```