To create an infrastructure that will be deployed across two distinct environments: development and production, both hosted on AWS. Each environment will need its own VPC, ECS cluster, and supporting AWS resources, ensuring complete isolation and the ability to test changes independently before pushing to production.

1. **Set up your AWS CDK project**:
   Ensure you have AWS CDK installed and initialized. If not, you can install it using npm:
   ```bash
   npm install -g aws-cdk
   cdk init app --language typescript
   ```

2. **Next, install the necessary AWS CDK libraries:**:
```bash
npm install @aws-cdk-lib  constructs 
```


```bash

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName: string;
  domainName: string;
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
        secretObjectValue: {
          environment: cdk.SecretValue.unsafePlainText(config.envName),
        },
      }
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      portMappings: [{ containerPort: 80 }],
      secrets: {
        CONFIG_PARAMETER: ecs.Secret.fromSecretsManager(
          configSecret,
          'environment'
        ),
      },
    });

    const fargateService = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      desiredCount: 2,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('ECS', {
      port: 80,
      targets: [fargateService],
    });

    // Enable ECS Container Insights
    cluster.addDefaultCloudMapNamespace({
      name: fargateService.serviceName,
    });

    const scalableTarget = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    const hostedZone = new route53.PublicHostedZone(
      this,
      `${config.envName}Zone`,
      {
        zoneName: config.domainName,
      }
    );

    new route53.ARecord(this, `${config.envName}AliasRecord`, {
      recordName: config.domainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(lb)
      ),
      zone: hostedZone,
    });

    // Setup CloudWatch monitoring
    new cloudwatch.Alarm(this, `${config.envName}HighCpuAlarm`, {
      metric: fargateService.metricCpuUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
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
```