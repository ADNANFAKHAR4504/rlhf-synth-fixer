import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';

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

    // 🔹 VPC Configuration
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
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

    // 🔹 ECS Cluster Configuration
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `tap-cluster-${environmentSuffix}`,
      vpc: vpc,
      enableFargateCapacityProviders: true,
    });

    // Enable Container Insights via cluster settings
    const cfnCluster = cluster.node.defaultChild as ecs.CfnCluster;
    cfnCluster.clusterSettings = [
      {
        name: 'containerInsights',
        value: 'enabled',
      },
    ];

    // 🔹 ECR Repository Configuration
    const ecrRepository = new ecr.Repository(this, 'EcrRepo', {
      repositoryName: `tap-repo-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          rulePriority: 1,
          maxImageCount: 10,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/tap-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `tap-task-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // 🔹 Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `tap-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // 🔹 Task Definition Configuration
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `tap-task-${environmentSuffix}`,
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    const container = taskDefinition.addContainer('Container', {
      // NOTE: This references 'latest' tag. Before scaling up the service,
      // ensure you have pushed a Docker image to the ECR repository:
      // 1. Build: docker build -t tap-repo-${environmentSuffix} .
      // 2. Tag: docker tag tap-repo-${environmentSuffix}:latest <ecr-uri>:latest
      // 3. Push: docker push <ecr-uri>:latest
      // For production, consider using a specific tag (e.g., 'v1') instead of 'latest'
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: logGroup,
        streamPrefix: 'ecs',
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 2,
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // 🔹 Application Load Balancer Configuration
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpc,
      securityGroupName: `tap-alb-sg-${environmentSuffix}`,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `tap-alb-${environmentSuffix}`,
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // 🔹 Target Groups for Blue/Green
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        targetGroupName: `tap-blue-tg-${environmentSuffix}`,
        vpc: vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
        },
      }
    );

    const greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'GreenTargetGroup',
      {
        targetGroupName: `tap-green-tg-${environmentSuffix}`,
        vpc: vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
        },
      }
    );

    const listener = alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [blueTargetGroup],
    });

    // 🔹 ECS Service Configuration
    // IMPORTANT: Service starts with desiredCount: 0 to allow stack deployment
    // even when ECR image doesn't exist yet. After pushing an image to ECR:
    // 1. Verify image exists: aws ecr list-images --repository-name tap-repo-${environmentSuffix}
    // 2. Scale up service: aws ecs update-service --cluster tap-cluster-${environmentSuffix} --service tap-service-${environmentSuffix} --desired-count 2
    // Or use CodeDeploy for blue/green deployment once image is available
    const service = new ecs.FargateService(this, 'Service', {
      serviceName: `tap-service-${environmentSuffix}`,
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 0, // Start with 0 - prevents deployment failure when ECR image is missing
      minHealthyPercent: 0, // Allow 0% during initial deployment
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(300), // Extended grace period for container startup
    });

    service.attachToApplicationTargetGroup(blueTargetGroup);

    // Security group for tasks
    const taskSecurityGroup = new ec2.SecurityGroup(this, 'TaskSecurityGroup', {
      vpc: vpc,
      securityGroupName: `tap-task-sg-${environmentSuffix}`,
      allowAllOutbound: true,
    });

    taskSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    service.connections.addSecurityGroup(taskSecurityGroup);

    // 🔹 CodeDeploy Configuration
    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      roleName: `tap-codedeploy-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS'),
      ],
    });

    const codeDeployApp = new codedeploy.EcsApplication(this, 'CodeDeployApp', {
      applicationName: `tap-codedeploy-app-${environmentSuffix}`,
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        deploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        application: codeDeployApp,
        service: service,
        blueGreenDeploymentConfig: {
          listener: listener,
          blueTargetGroup: blueTargetGroup,
          greenTargetGroup: greenTargetGroup,
          terminationWaitTime: cdk.Duration.minutes(5),
        },
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
        role: codeDeployRole,
      }
    );

    // 🔹 Auto Scaling Configuration
    const scalingTarget = service.autoScaleTaskCount({
      minCapacity: 0, // Start with 0, can be increased after image is pushed
      maxCapacity: 10,
    });

    scalingTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // 🔹 Monitoring and Alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `tap-alarms-${environmentSuffix}`,
    });
    alarmTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    const unhealthyTaskAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTaskAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'HealthyTaskCount',
          dimensionsMap: {
            ServiceName: service.serviceName,
            ClusterName: cluster.clusterName,
          },
        }),
        threshold: 2,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      }
    );
    unhealthyTaskAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    const deploymentFailureAlarm = new cloudwatch.Alarm(
      this,
      'DeploymentFailureAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodeDeploy',
          metricName: 'Deployments',
          dimensionsMap: {
            ApplicationName: codeDeployApp.applicationName,
            DeploymentGroupName: deploymentGroup.deploymentGroupName,
            Status: 'Failed',
          },
          statistic: 'Sum',
        }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    deploymentFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: ecrRepository.repositoryUri,
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApp.applicationName,
    });
  }
}
