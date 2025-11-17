import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface ContainerConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  privateSubnets: ec2.ISubnet[];
  alb: elbv2.ApplicationLoadBalancer;
}

export class ContainerConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ContainerConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(
      this,
      `EcsCluster-${props.environmentSuffix}`,
      {
        clusterName: `fintech-cluster-${props.environmentSuffix}`,
        vpc: props.vpc,
        containerInsights: true,
      }
    );

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TaskDef-${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `fintech-${props.environmentSuffix}`,
      }),
      environment: {
        REGION: props.region,
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    this.service = new ecs.FargateService(
      this,
      `FargateService-${props.environmentSuffix}`,
      {
        serviceName: `fintech-service-${props.environmentSuffix}`,
        cluster: this.cluster,
        taskDefinition,
        desiredCount: 2,
        vpcSubnets: {
          subnets: props.privateSubnets,
        },
        assignPublicIp: false,
      }
    );

    const listener = props.alb.addListener(
      `Listener-${props.environmentSuffix}`,
      {
        port: 80,
        open: true,
      }
    );

    listener.addTargets(`EcsTarget-${props.environmentSuffix}`, {
      port: 80,
      targets: [this.service],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    cdk.Tags.of(this.cluster).add('Region', props.region);
  }
}
