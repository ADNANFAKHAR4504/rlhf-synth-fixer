import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName?: string;
  hostedZone?: route53.IHostedZone;
  domainName: string;
  imageName: string;
  imageTag: string;
  port: number;
  cpu: number;
  memoryLimit: number;
}

export class MultiEnvEcsStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);
    cdk.Tags.of(this).add('envName', config.envName);

    // Create a VPC
    const vpc = new ec2.Vpc(this, `${config.envName}Vpc`, {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 3,
      natGateways: 1,
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, `${config.envName}EcsCluster`, {
      vpc,
      clusterName: `${config.envName}Tap`,
    });

    // Enable ECS Container Insights
    cluster.addDefaultCloudMapNamespace({
      name: `${config.envName}.local`,
    });

    new ssm.StringParameter(this, `${config.envName}ConfigParameter`, {
      parameterName: `/${config.envName}/config`,
      stringValue: config.envName,
      tier: ssm.ParameterTier.ADVANCED,
      description: 'Environment config',
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${config.envName}TaskDef`,
      {
        cpu: config.cpu,
        memoryLimitMiB: config.memoryLimit,
      }
    );

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(
        `${config.imageName}:${config.imageTag}`
      ),
      portMappings: [{ containerPort: config.port }],
      secrets: {
        CONFIG_PARAMETER: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromSecureStringParameterAttributes(
            this,
            `${config.envName}ConfigParam`,
            {
              parameterName: `/${config.envName}/config`,
              version: 1,
            }
          )
        ),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          `curl -f http://localhost:${config.port} || exit 1`,
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(10),
      },
    });

    const fargateService = new ecs.FargateService(
      this,
      `${config.envName}Service`,
      {
        cluster,
        taskDefinition,
        maxHealthyPercent: 200,
        minHealthyPercent: 100,
        desiredCount: 2,
        serviceName: `${config.envName}-svc`,
        cloudMapOptions: {
          name: 'app',
        },
      }
    );

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    /** DNS Certificate*/

    const certArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/app/certArn'
    );
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      `${config.envName}`,
      certArn
    );
    const listener = lb.addListener(`${config.envName}HttpsListener`, {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    listener.addTargets('ECS', {
      port: config.port,
      targets: [fargateService],
      healthCheck: {
        path: '/',
        port: `${config.port}`,
        protocol: elbv2.Protocol.HTTP,
        healthyHttpCodes: '200-299',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    const scalableTarget = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization(`${config.envName} CpuScaling`, {
      targetUtilizationPercent: 50,
    });

    scalableTarget.scaleOnMemoryUtilization(`${config.envName} MemoryScaling`, {
      targetUtilizationPercent: 60,
    });

    // --- Route 53 Record (if using Route53) ---
    if (config.hostedZoneName) {
      const zone =
        process.env.NODE_ENV === 'test'
          ? route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
              hostedZoneId: 'Z111111QQQQQQQ',
              zoneName: config.hostedZoneName!,
            })
          : route53.HostedZone.fromLookup(this, `${config.envName} Zone`, {
              domainName: config.hostedZoneName!,
            });

      new route53.ARecord(this, `${config.envName} AliasRecord`, {
        recordName: config.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.LoadBalancerTarget(lb)
        ),
        zone,
      });
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: zone.hostedZoneId,
        description: 'Route53 Hosted Zone ID',
      });
    }

    // Alarms
    new cloudwatch.Alarm(this, `${config.envName}:HighCpuAlarm`, {
      metric: fargateService.metricCpuUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: `${config.envName}:HighCpuAlarm`,
    });

    new cloudwatch.Alarm(this, `${config.envName}:HighMemoryAlarm`, {
      metric: fargateService.metricMemoryUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: `${config.envName}:HighMemoryAlarm`,
    });

    //Output
    // --- Outputs ---
    new cdk.CfnOutput(this, 'LoadBalanceDNS', {
      value: lb.loadBalancerDnsName,
      description: 'Load balancer dns name',
    });
    new cdk.CfnOutput(this, 'envName', {
      value: config.envName,
      description: 'Environment name',
    });
    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'Application domain name',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      description: 'ECS Cluster ARN',
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: taskDefinition.taskDefinitionArn,
      description: 'Task Definition ARN',
    });

    new cdk.CfnOutput(this, 'FargateServiceName', {
      value: fargateService.serviceName,
      description: 'Fargate Service Name',
    });

    new cdk.CfnOutput(this, 'ListenerArn', {
      value: listener.listenerArn,
      description: 'Load Balancer Listener ARN',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: lb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'LoadBalancerSecurityGroupId', {
      value: lb.connections.securityGroups
        .map(sg => sg.securityGroupId)
        .join(','),
      description: 'Security Group of the ALB',
    });

    new cdk.CfnOutput(this, 'SSMConfigParameterName', {
      value: `/${config.envName}/config`,
      description: 'SSM Parameter Name',
    });

    new cdk.CfnOutput(this, 'SSLCertificateArn', {
      value: certificate.certificateArn,
      description: 'SSL Certificate ARN',
    });

    // Cloud Map Namespace output
    new cdk.CfnOutput(this, 'Namespace', {
      value: `${config.envName}.local`,
      description: 'ECS Cloud Map namespace name',
    });

    // Route 53 Outputs
    if (config.hostedZoneName) {
      new cdk.CfnOutput(this, 'HostedZoneName', {
        value: config.hostedZoneName,
        description: 'Route53 Hosted Zone Name',
      });

      new cdk.CfnOutput(this, 'DomainARecord', {
        value: config.domainName,
        description: 'Route53 A Record for service',
      });
    }
  }
}
