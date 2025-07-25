import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
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

    // Create a VPC
    const vpc = new ec2.Vpc(this, `${config.envName}Vpc`, {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 3,
      natGateways: 1,
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, `${config.envName}EcsCluster`, {
      vpc,
    });

    // Create KMS Key for SSM Parameter Store
    const kmsKey = new kms.Key(this, `${config.envName}KmsKey`, {
      enableKeyRotation: true,
    });

    const configSecret = new secretsmanager.Secret(
      this,
      `${config.envName}ConfigSecret`,
      {
        secretName: `/${config.envName}/config`,
        encryptionKey: kmsKey,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            environment: config.envName,
            domain: config.domainName,
          }),
          generateStringKey: 'placeholder',
        },
      }
    );

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
        CONFIG_PARAMETER: ecs.Secret.fromSecretsManager(
          configSecret,
          'environment'
        ),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          `curl -f http://localhost:${config.port}/health || exit 1`,
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
      }
    );

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    /** DNS Certificate*/
    const certificate = new acm.Certificate(
      this,
      `${config.envName}Certificate`,
      {
        domainName: config.domainName,
        validation: acm.CertificateValidation.fromDns(),
      }
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
        path: '/health',
        port: `${config.port}`,
        protocol: elbv2.Protocol.HTTP,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    // Enable ECS Container Insights
    cluster.addDefaultCloudMapNamespace({
      name: fargateService.serviceName,
    });

    const scalableTarget = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization(`${config.envName}CpuScaling`, {
      targetUtilizationPercent: 50,
    });

    scalableTarget.scaleOnMemoryUtilization(`${config.envName}MemoryScaling`, {
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
          : route53.HostedZone.fromLookup(this, `${config.envName}Zone`, {
              domainName: config.hostedZoneName!,
            });

      new route53.ARecord(this, `${config.envName}AliasRecord`, {
        recordName: config.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.LoadBalancerTarget(lb)
        ),
        zone,
      });
    }

    // Alarms
    new cloudwatch.Alarm(this, `${config.envName}HighCpuAlarm`, {
      metric: fargateService.metricCpuUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `${config.envName}HighMemoryAlarm`, {
      metric: fargateService.metricMemoryUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cdk.CfnOutput(this, 'LB-DNS', {
      value: lb.loadBalancerDnsName,
      description: 'Load balancer dns name',
    });
    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'domain name',
    });
  }
}
