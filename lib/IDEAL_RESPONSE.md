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
    }

    // Alarms
    new cloudwatch.Alarm(this, `${config.envName} HighCpuAlarm`, {
      metric: fargateService.metricCpuUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `${config.envName} HighMemoryAlarm`, {
      metric: fargateService.metricMemoryUtilization(),
      evaluationPeriods: 2,
      threshold: 80,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    //Output
    new cdk.CfnOutput(this, 'LoadBalanceDNS', {
      value: lb.loadBalancerDnsName,
      description: 'Load balancer dns name',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'domain name',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
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

```

Finally, create a `README.md` file to document the setup and usage:
```markdown
# Multi-Environment ECS Infrastructure

This project provisions a production-grade AWS ECS Fargate deployment using AWS CDK (TypeScript). It supports multiple isolated environments (e.g., `dev`, `prod`) with key components like:

- **VPC, ECS Cluster, and Fargate Service**
- **Application Load Balancer (HTTPS)**
- **Route 53 DNS Record**
- **SSM Parameter Store with optional SecureString support**
- **CloudWatch Alarms for CPU and Memory**
- **Auto Scaling based on metrics**
- **Tagged Resources for Cost and Environment Management**

## Prerequisites

- AWS CLI configured with appropriate permissions
- AWS CDK installed
- Node.js v22.17.0
- AWS CLI configured with `aws configure`
- CDK CLI v2 installed:
  ```bash
  npm install -g aws-cdk

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Bootstrap the CDK environment (if not already done):

```bash
cdk bootstrap
```

3. Deploy the development environment:

```bash
cdk deploy DevStack
```

4. Deploy the production environment:

```bash
cdk deploy ProdStack
```

5. Deploy an environment
    ```bash
    cdk deploy MyStack-dev \
    --context envName=dev \
    --context domainName=myapp.example.com \
    --context hostedZoneId=Z3P5QSUBK4POTI \
    --context hostedZoneName=example.com \
    --context certificateArn=arn:aws:acm:us-east-1:123456789012:certificate/abc123

## Infrastructure

- **VPC**: Separate VPCs for development and production.
- **ECS Cluster**: ECS clusters running on Fargate.
- **SSM Parameter Store**: Environment-specific configurations encrypted with AWS KMS.
- **Application Load Balancer**: Distributes incoming traffic.
- **Route 53**: Manages DNS records.
- **CloudWatch**: Monitoring and alarms for CPU utilization.
- **Auto Scaling**: Scales based on CPU utilization.

## Usage

Access the application using the domain names configured in Route 53:

- Development: `http://dev.example.com`
- Production: `http://prod.example.com`

## Cleanup

To destroy the deployed stacks:

```bash
cdk destroy DevStack
cdk destroy ProdStack
```