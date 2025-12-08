import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix: string;
  environment?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:resource:TapStack', name, {}, opts);

    const envSuffix = props.environmentSuffix;
    const env = props.environment || 'dev';

    // VPC and Networking
    const vpc = new aws.ec2.Vpc(
      `vpc-${envSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${envSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Public Subnets
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-1-${envSuffix}`,
          Environment: env,
          Type: 'public',
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-2-${envSuffix}`,
          Environment: env,
          Type: 'public',
        },
      },
      { parent: this }
    );

    // Private Subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: 'us-east-1a',
        tags: {
          Name: `private-subnet-1-${envSuffix}`,
          Environment: env,
          Type: 'private',
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: 'us-east-1b',
        tags: {
          Name: `private-subnet-2-${envSuffix}`,
          Environment: env,
          Type: 'private',
        },
      },
      { parent: this }
    );

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${envSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `public-route-${envSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${envSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${envSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `alb-sg-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `ecs-sg-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${envSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${envSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `tg-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // ALB Listener
    new aws.lb.Listener(
      `alb-listener-${envSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // ECR Repository
    const ecrRepository = new aws.ecr.Repository(
      `ecr-repo-${envSuffix}`,
      {
        name: `ecs-app-${envSuffix}`,
        forceDelete: true,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: {
          Name: `ecr-repo-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this }
    );

    // ECR Lifecycle Policy (baseline: keep 10 images)
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${envSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep last 10 images',
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
      },
      { parent: this }
    );

    // ECS Cluster with Container Insights
    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${envSuffix}`,
      {
        name: `ecs-cluster-${envSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${envSuffix}`,
      {
        name: `/ecs/app-${envSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-log-group-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // IAM Role for ECS Task Execution
    const taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${envSuffix}`,
      {
        name: `ecs-task-execution-role-${envSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-task-execution-role-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Attach managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${envSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Custom policy for ECR access
    const ecrAccessPolicy = new aws.iam.Policy(
      `ecr-access-policy-${envSuffix}`,
      {
        name: `ecr-access-policy-${envSuffix}`,
        description: 'Policy for ECR repository access',
        policy: pulumi.all([ecrRepository.arn]).apply(() =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ecr:GetAuthorizationToken',
                  'ecr:BatchCheckLayerAvailability',
                  'ecr:GetDownloadUrlForLayer',
                  'ecr:BatchGetImage',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          Name: `ecr-access-policy-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecr-access-attachment-${envSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn: ecrAccessPolicy.arn,
      },
      { parent: this }
    );

    // IAM Role for ECS Task
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${envSuffix}`,
      {
        name: `ecs-task-role-${envSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-task-role-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Task role policy for CloudWatch logs
    const taskRolePolicy = new aws.iam.Policy(
      `ecs-task-role-policy-${envSuffix}`,
      {
        name: `ecs-task-role-policy-${envSuffix}`,
        description: 'Policy for ECS task permissions',
        policy: pulumi.all([logGroup.arn]).apply(([logArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: `${logArn}:*`,
              },
            ],
          })
        ),
        tags: {
          Name: `ecs-task-role-policy-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `task-role-attachment-${envSuffix}`,
      {
        role: taskRole.name,
        policyArn: taskRolePolicy.arn,
      },
      { parent: this }
    );

    // Determine CPU and memory based on environment
    const cpu = env === 'prod' ? '1024' : '512';
    const memory = env === 'prod' ? '2048' : '1024';

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${envSuffix}`,
      {
        family: `app-task-${envSuffix}`,
        cpu: cpu,
        memory: memory,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([logGroup.name])
          .apply(([logGroupName]) =>
            JSON.stringify([
              {
                name: `app-container-${envSuffix}`,
                image: 'nginx:latest',
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    protocol: 'tcp',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          Name: `task-def-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this }
    );

    // ECS Service
    const ecsService = new aws.ecs.Service(
      `ecs-service-${envSuffix}`,
      {
        name: `ecs-service-${envSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3, // Baseline: 3 tasks
        launchType: 'FARGATE',
        platformVersion: 'LATEST',
        healthCheckGracePeriodSeconds: 300,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true,
        },
        networkConfiguration: {
          subnets: [privateSubnet1.id, privateSubnet2.id],
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: `app-container-${envSuffix}`,
            containerPort: 80,
          },
        ],
        tags: {
          Name: `ecs-service-${envSuffix}`,
          Environment: env,
          CostCenter: 'ecs-optimization',
        },
      },
      { parent: this, dependsOn: [alb] }
    );

    // Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `ecs-scaling-target-${envSuffix}`,
      {
        maxCapacity: 6,
        minCapacity: 2, // Baseline: min 2 tasks
        resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Auto Scaling Policy - CPU
    new aws.appautoscaling.Policy(
      `ecs-cpu-scaling-policy-${envSuffix}`,
      {
        name: `ecs-cpu-scaling-${envSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Auto Scaling Policy - Memory
    new aws.appautoscaling.Policy(
      `ecs-memory-scaling-policy-${envSuffix}`,
      {
        name: `ecs-memory-scaling-${envSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 80.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - High CPU
    new aws.cloudwatch.MetricAlarm(
      `ecs-cpu-alarm-${envSuffix}`,
      {
        name: `ecs-cpu-high-${envSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 85.0,
        alarmDescription: 'Alert when ECS CPU exceeds 85%',
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        tags: {
          Name: `ecs-cpu-alarm-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - High Memory
    new aws.cloudwatch.MetricAlarm(
      `ecs-memory-alarm-${envSuffix}`,
      {
        name: `ecs-memory-high-${envSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 90.0,
        alarmDescription: 'Alert when ECS memory exceeds 90%',
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        tags: {
          Name: `ecs-memory-alarm-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - Unhealthy Task Count
    new aws.cloudwatch.MetricAlarm(
      `ecs-unhealthy-tasks-alarm-${envSuffix}`,
      {
        name: `ecs-unhealthy-tasks-${envSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0.0,
        alarmDescription: 'Alert when unhealthy task count is greater than 0',
        treatMissingData: 'notBreaching',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          Name: `ecs-unhealthy-tasks-alarm-${envSuffix}`,
          Environment: env,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.vpcId = vpc.id;
    this.ecsClusterName = ecsCluster.name;
    this.ecsServiceName = ecsService.name;
    this.loadBalancerDns = alb.dnsName;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;

    this.registerOutputs({
      vpcId: this.vpcId,
      ecsClusterName: this.ecsClusterName,
      ecsServiceName: this.ecsServiceName,
      loadBalancerDns: this.loadBalancerDns,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
    });
  }
}
