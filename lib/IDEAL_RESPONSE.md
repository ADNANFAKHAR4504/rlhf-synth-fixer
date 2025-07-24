To create an infrastructure that will be deployed across two distinct environments: development and production, both hosted on AWS. Each environment will need its own VPC, ECS cluster, and supporting AWS resources, ensuring complete isolation and the ability to test changes independently before pushing to production.

1. **Set up your AWS CDK project**:
   Ensure you have AWS CDK installed and initialized. If not, you can install it using npm:
   ```bash
   npm install -g aws-cdk
   cdk init app --language typescript
   ```

2. **Next, install the necessary AWS CDK libraries:**:
```bash
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-ecs @aws-cdk/aws-ecs-patterns @aws-cdk/aws-elasticloadbalancingv2 @aws-cdk/aws-route53 @aws-cdk/aws-ssm @aws-cdk/aws-cloudwatch @aws-cdk/aws-applicationautoscaling @aws-cdk-lib @aws-cdk-lib/aws-kms @aws-secretsmanager @aws-route53-targets constructs
```


import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
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
  constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, `${config.envName}Vpc`, {
      // cidr: config.vpcCidr,
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



    const configSecret = new secretsmanager.Secret(this, `${config.envName}ConfigSecret`, {
      secretName: `/${config.envName}/config`,
      encryptionKey: kmsKey,
      secretObjectValue: {
        environment: cdk.SecretValue.unsafePlainText(config.envName),
      },
    });


    // Create a Fargate service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${config.envName}FargateService`, {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        secrets: {
          CONFIG_PARAMETER: ecs.Secret.fromSecretsManager(configSecret, 'environment') //secret.parameterName,
        },
      },
      desiredCount: 2,
      publicLoadBalancer: true,
      minHealthyPercent: 100,
      maxHealthyPercent: 200
    });

    // Enable ECS Container Insights
    cluster.addDefaultCloudMapNamespace({
      name: fargateService.service.serviceName,
    });

    const scalableTarget = fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    const hostedZone = new route53.PublicHostedZone(this, `${config.envName}Zone`, {
      zoneName: config.domainName,
    });


    new route53.ARecord(this, `${config.envName}AliasRecord`, {
      recordName: config.domainName,
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(fargateService.loadBalancer)),
      zone: hostedZone,
    });

    // Setup CloudWatch monitoring
    new cloudwatch.Alarm(this, `${config.envName}HighCpuAlarm`, {
      metric: fargateService.service.metricCpuUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
    });
  }
}