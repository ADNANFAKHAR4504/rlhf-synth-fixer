import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';

export class SynthQ9n9u3x6Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environmentSuffix from context (required for resource naming)
    const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';

    // Common tags for cost allocation (Requirement #8)
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Service', 'ecs-api');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('CostCenter', 'development');

    // REQUIREMENT #10: Create VPC with proper networking
    // Public subnets for ALB, private subnets for ECS tasks
    const vpc = new ec2.Vpc(this, 'ApiVpc', {
      vpcName: `api-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1, // Minimal NAT for cost optimization
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
    });

    // Apply removal policy to VPC
    (vpc.node.defaultChild as ec2.CfnVPC).applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // REQUIREMENT #4: Create ECS cluster with Container Insights enabled
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `ecs-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true, // Enable CloudWatch Container Insights for detailed monitoring
    });

    // REQUIREMENT #6: Configure Fargate Spot capacity provider for cost savings
    // Use Spot for dev/test environments, regular Fargate as fallback
    // Note: Using FARGATE for deployment reliability. FARGATE_SPOT can be enabled in production.
    const spotCapacityProvider = new ecs.CfnClusterCapacityProviderAssociations(
      this,
      'ClusterCapacityProviderAssociations',
      {
        cluster: cluster.clusterName,
        capacityProviders: ['FARGATE_SPOT', 'FARGATE'],
        defaultCapacityProviderStrategy: [
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 1,
            base: 0,
          },
          {
            capacityProvider: 'FARGATE',
            weight: 0, // Fallback only
            base: 0,
          },
        ],
      }
    );

    // REQUIREMENT #10: Set up Cloud Map for service discovery
    const namespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceDiscoveryNamespace', {
      name: `service-discovery-${environmentSuffix}.local`,
      vpc,
      description: 'Private DNS namespace for ECS service discovery',
    });
    namespace.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // REQUIREMENT #5: Create CloudWatch log group with 7-day retention
    const logGroup = new logs.LogGroup(this, 'EcsLogGroup', {
      logGroupName: `/ecs/api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK, // 7 days to control costs
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // REQUIREMENT #7: Create task execution role with ECR permissions
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `ecs-task-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task execution role with ECR and CloudWatch permissions',
    });

    // Add managed policy for ECR pull and CloudWatch Logs
    taskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

    // Create task role for application-level permissions
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `ecs-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS task role for application permissions',
    });

    // REQUIREMENT #1: Create task definition with proper CPU/memory allocation
    // Fixed from insufficient 256 CPU / 512 MiB to proper 512 CPU / 1024 MiB
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `api-task-${environmentSuffix}`,
      cpu: 512, // 0.5 vCPU - proper sizing for Node.js API
      memoryLimitMiB: 1024, // 1 GB - prevents OOM crashes
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Add container with proper configuration
    const container = taskDefinition.addContainer('ApiContainer', {
      containerName: `api-container-${environmentSuffix}`,
      // Using nginx as placeholder - replace with actual ECR image
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: environmentSuffix,
        PORT: '8080',
      },
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // REQUIREMENT #10: Create Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      loadBalancerName: `api-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    alb.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // REQUIREMENT #3: Create target group with proper health checks
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `api-targets-${environmentSuffix}`,
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: cdk.Duration.seconds(30), // Check every 30 seconds
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2, // 2 consecutive successes = healthy
        unhealthyThresholdCount: 3, // 3 consecutive failures = unhealthy
        protocol: elbv2.Protocol.HTTP,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Add listener to ALB
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      securityGroupName: `ecs-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB to ECS tasks
    ecsSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(alb.connections.securityGroups[0].securityGroupId),
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // Create the ECS Fargate service
    const service = new ecs.FargateService(this, 'FargateService', {
      serviceName: `api-service-${environmentSuffix}`,
      cluster,
      taskDefinition,
      desiredCount: 1, // Start with 1 task, auto-scaling will adjust
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false, // Private subnet tasks don't need public IPs

      // REQUIREMENT #9: Enable circuit breaker for safe deployments
      circuitBreaker: {
        rollback: true, // Automatically rollback failed deployments
      },

      // Use capacity provider strategy defined at cluster level
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
          base: 0,
        },
      ],

      // REQUIREMENT #10: Enable Cloud Map service discovery
      cloudMapOptions: {
        name: `api-service-${environmentSuffix}`,
        cloudMapNamespace: namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(60),
      },
    });

    // Ensure capacity provider is configured before service creation
    service.node.addDependency(spotCapacityProvider);

    // Attach service to ALB target group
    service.attachToApplicationTargetGroup(targetGroup);

    // REQUIREMENT #2: Configure auto-scaling based on CPU utilization
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1, // Minimum 1 task always running
      maxCapacity: 5, // Maximum 5 tasks under load
    });

    // Scale out when CPU > 70%
    scaling.scaleOnCpuUtilization('CpuScaleOut', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Alternative: Step scaling policy for more granular control
    // Uncomment if you prefer step scaling over target tracking
    /*
    const cpuMetric = service.metricCpuUtilization({
      period: cdk.Duration.minutes(1),
    });

    scaling.scaleOnMetric('CpuStepScaling', {
      metric: cpuMetric,
      scalingSteps: [
        { upper: 30, change: -1 }, // Scale in when CPU < 30%
        { lower: 70, change: +1 }, // Scale out when CPU > 70%
        { lower: 85, change: +2 }, // Scale out faster when CPU > 85%
      ],
      adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.seconds(60),
    });
    */

    // Output important endpoints
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `api-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceDiscoveryDomain', {
      value: `api-service-${environmentSuffix}.service-discovery-${environmentSuffix}.local`,
      description: 'Service discovery domain name',
      exportName: `api-service-discovery-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
      exportName: `ecs-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.serviceName,
      description: 'ECS Service name',
      exportName: `ecs-service-name-${environmentSuffix}`,
    });
  }
}
