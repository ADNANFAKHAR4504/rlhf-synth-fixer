To achieve the desired infrastructure using AWS CDK with TypeScript, follow the steps below. This script will create two distinct environments (development and production) with their own VPCs, ECS clusters, and other necessary AWS resources.

First, ensure you have the AWS CDK installed and initialized in your project:

```bash
npm install -g aws-cdk
cdk init app --language typescript
```

Next, install the necessary AWS CDK libraries:

```bash
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-ecs @aws-cdk/aws-ecs-patterns @aws-cdk/aws-elasticloadbalancingv2 @aws-cdk/aws-route53 @aws-cdk/aws-ssm @aws-cdk/aws-cloudwatch @aws-cdk/aws-applicationautoscaling
```

Now, replace the content of `lib/your-stack-name.ts` with the following TypeScript code:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as kms from 'aws-cdk-lib/aws-kms';

interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName: string;
  domainName: string;
}

class MultiEnvEcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, `${config.envName}Vpc`, {
      cidr: config.vpcCidr,
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

    // Store environment-specific configurations in SSM Parameter Store
    const ssmParameter = new ssm.StringParameter(this, `${config.envName}ConfigParameter`, {
      parameterName: `/${config.envName}/config`,
      stringValue: JSON.stringify({ environment: config.envName }),
      encryptionKey: kmsKey,
    });

    // Create a Fargate service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${config.envName}FargateService`, {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        environment: {
          CONFIG_PARAMETER: ssmParameter.parameterName,
        },
      },
      desiredCount: 2,
      publicLoadBalancer: true,
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

    // Configure DNS with Route 53
    const hostedZone = route53.HostedZone.fromLookup(this, `${config.envName}HostedZone`, {
      domainName: config.hostedZoneName,
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

const app = new cdk.App();

// Define configurations for each environment
const devConfig: EnvironmentConfig = {
  envName: 'dev',
  vpcCidr: '10.0.0.0/16',
  hostedZoneName: 'example.com',
  domainName: 'dev.example.com',
};

const prodConfig: EnvironmentConfig = {
  envName: 'prod',
  vpcCidr: '10.1.0.0/16',
  hostedZoneName: 'example.com',
  domainName: 'prod.example.com',
};

// Deploy stacks for each environment
new MultiEnvEcsStack(app, 'DevStack', devConfig, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION } });
new MultiEnvEcsStack(app, 'ProdStack', prodConfig, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION } });
```

Finally, create a `README.md` file to document the setup and usage:

```markdown
# Multi-Environment ECS Infrastructure

This project deploys a stateless, highly available application on AWS ECS using Fargate across two distinct environments: development and production.

## Prerequisites

- AWS CLI configured with appropriate permissions
- AWS CDK installed

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
```

This script and documentation provide a comprehensive solution to deploy and manage a multi-environment infrastructure on AWS using CDK with TypeScript. Make sure to replace placeholder values with actual values as needed.