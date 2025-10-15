import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface OrdersApiConstructProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  namespace: servicediscovery.PrivateDnsNamespace;
  alb: elbv2.ApplicationLoadBalancer;
  httpListener: elbv2.ApplicationListener;
  environmentSuffix: string;
}

export class OrdersApiConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: OrdersApiConstructProps) {
    super(scope, id);

    // Create a security group for the Orders API service
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `OrdersApiSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for the Orders API service',
        allowAllOutbound: true,
      }
    );

    // Allow inbound traffic from the ALB
    this.securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(
        props.alb.connections.securityGroups[0].securityGroupId
      ),
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Create a task definition for the Orders API
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `OrdersApiTaskDef-${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add the Orders API container to the task definition
    taskDefinition.addContainer('OrdersApiContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'orders-api' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
          name: 'http',
          appProtocol: ecs.AppProtocol.http,
        },
      ],
      environment: {
        SERVICE_NAME: 'orders-api',
      },
    });

    // Create the ECS Service
    this.service = new ecs.FargateService(
      this,
      `OrdersApiService-${props.environmentSuffix}`,
      {
        cluster: props.cluster,
        taskDefinition,
        desiredCount: 2,
        securityGroups: [this.securityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        assignPublicIp: false,
        enableExecuteCommand: true,
        serviceConnectConfiguration: {
          namespace: props.namespace.namespaceName,
          services: [
            {
              portMappingName: 'http',
              discoveryName: `orders-api-${props.environmentSuffix}`,
              dnsName: `orders-api-${props.environmentSuffix}`,
              port: 80,
            },
          ],
        },
      }
    );

    // Ensure the namespace is created before the service
    this.service.node.addDependency(props.namespace);

    // Add IAM permissions for ECS Exec
    taskDefinition.taskRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMManagedInstanceCore'
      )
    );

    // Add a target group for the Orders API to the ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `OrdersApiTargetGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(60),
          timeout: cdk.Duration.seconds(5),
        },
      }
    );

    // Register the service with the target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Add a rule to the listener to route traffic to the Orders API
    props.httpListener.addTargetGroups('OrdersApiRoute', {
      targetGroups: [targetGroup],
      conditions: [elbv2.ListenerCondition.pathPatterns(['/orders*'])],
      priority: 10,
    });

    // Output the service name
    new cdk.CfnOutput(this, 'OrdersApiServiceName', {
      value: this.service.serviceName,
      description: 'The name of the Orders API service',
      exportName: `OrdersApiServiceName-${props.environmentSuffix}`,
    });
  }
}
