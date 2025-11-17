import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  dynamoTable: dynamodb.ITable;
  alarmTopic: sns.ITopic;
}

export class ComputeStack extends cdk.Stack {
  public readonly albDnsName: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc, dynamoTable, alarmTopic } = props;

    const cluster = new ecs.Cluster(this, `Cluster-${environmentSuffix}`, {
      clusterName: `dr-cluster-${environmentSuffix}-${this.region}`,
      vpc,
      containerInsights: true,
    });

    const logGroup = new logs.LogGroup(
      this,
      `ServiceLogs-${environmentSuffix}`,
      {
        logGroupName: `/ecs/dr-service-${environmentSuffix}-${this.region}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const executionRole = new iam.Role(
      this,
      `ExecutionRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
      }
    );

    const taskRole = new iam.Role(this, `TaskRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    dynamoTable.grantReadWriteData(taskRole);

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:RequestedRegion': [this.region],
          },
        },
      })
    );

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TaskDef-${environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole,
        taskRole,
      }
    );

    taskDefinition.addContainer(`Container-${environmentSuffix}`, {
      containerName: `dr-app-${environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'dr',
        logGroup,
      }),
      portMappings: [{ containerPort: 80 }],
      environment: {
        REGION: this.region,
        ENVIRONMENT: environmentSuffix,
      },
    });

    const albSg = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'ALB security group',
        securityGroupName: `dr-alb-sg-${environmentSuffix}-${this.region}`,
      }
    );

    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        loadBalancerName: `dr-alb-${environmentSuffix}-${this.region}`,
        securityGroup: albSg,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      }
    );

    this.albDnsName = alb.loadBalancerDnsName;

    // Export ALB DNS via SSM
    new ssm.StringParameter(this, `AlbDnsParameter-${environmentSuffix}`, {
      parameterName: `/dr/${environmentSuffix}/alb-dns`,
      stringValue: this.albDnsName,
      description: `ALB DNS name for ${environmentSuffix}`,
      simpleName: false,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        targetGroupName: `dr-tg-${environmentSuffix}`,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    alb.addListener(`HTTPListener-${environmentSuffix}`, {
      port: 80,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    const serviceSg = new ec2.SecurityGroup(
      this,
      `ServiceSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'ECS service security group',
        securityGroupName: `dr-service-sg-${environmentSuffix}-${this.region}`,
      }
    );

    serviceSg.addIngressRule(albSg, ec2.Port.tcp(80), 'From ALB');

    const service = new ecs.FargateService(
      this,
      `Service-${environmentSuffix}`,
      {
        cluster,
        taskDefinition,
        serviceName: `dr-service-${environmentSuffix}-${this.region}`,
        desiredCount: 2,
        assignPublicIp: true,
        securityGroups: [serviceSg],
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        healthCheckGracePeriod: cdk.Duration.seconds(60),
      }
    );

    service.attachToApplicationTargetGroup(targetGroup);

    const unhealthyAlarm = new cloudwatch.Alarm(
      this,
      `UnhealthyHosts-${environmentSuffix}`,
      {
        metric: targetGroup.metricUnhealthyHostCount({
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        alarmName: `dr-unhealthy-${environmentSuffix}-${this.region}`,
      }
    );

    unhealthyAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    cdk.Tags.of(cluster).add('Environment', environmentSuffix);
    cdk.Tags.of(alb).add('Environment', environmentSuffix);
  }
}
