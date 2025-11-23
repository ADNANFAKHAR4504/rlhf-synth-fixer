# Three-Tier Web Application Infrastructure with AWS CDK

I'll help you create a complete three-tier web application infrastructure using AWS CDK with TypeScript. This solution includes VPC, RDS PostgreSQL, ECS Fargate, ALB, S3, and CloudFront.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'CustomerPortal');

    // VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `vpc-${environmentSuffix}`, {
      vpcName: `customer-portal-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Database credentials in Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, `db-secret-${environmentSuffix}`, {
      secretName: `customer-portal-db-credentials-${environmentSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, `db-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    // RDS PostgreSQL Multi-AZ with encryption
    const database = new rds.DatabaseInstance(this, `database-${environmentSuffix}`, {
      instanceIdentifier: `customer-portal-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      multiAz: true,
      allocatedStorage: 20,
      storageEncrypted: true,
      credentials: rds.Credentials.fromSecret(dbSecret),
      securityGroups: [dbSecurityGroup],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `ecs-cluster-${environmentSuffix}`, {
      clusterName: `customer-portal-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });

    // CloudWatch log group for ECS
    const logGroup = new logs.LogGroup(this, `ecs-logs-${environmentSuffix}`, {
      logGroupName: `/ecs/customer-portal-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(this, `task-execution-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task role with permissions to access Secrets Manager and Parameter Store
    const taskRole = new iam.Role(this, `task-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    dbSecret.grantRead(taskRole);

    // Parameter Store for application config
    const apiConfigParameter = new ssm.StringParameter(this, `api-config-${environmentSuffix}`, {
      parameterName: `/customer-portal/${environmentSuffix}/api-config`,
      stringValue: JSON.stringify({
        apiPort: 3000,
        nodeEnv: environmentSuffix === 'prod' ? 'production' : 'development',
      }),
      description: 'API configuration parameters',
    });

    apiConfigParameter.grantRead(taskRole);

    // Task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, `task-def-${environmentSuffix}`, {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container definition with placeholder image
    const container = taskDefinition.addContainer(`api-container-${environmentSuffix}`, {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:18-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: logGroup,
      }),
      environment: {
        ENVIRONMENT: environmentSuffix,
        PARAMETER_PATH: apiConfigParameter.parameterName,
      },
      secrets: {
        DB_SECRET_ARN: ecs.Secret.fromSecretsManager(dbSecret),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, `ecs-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for ECS tasks',
    });

    // Allow ECS tasks to connect to RDS
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS tasks to connect to RDS'
    );

    // Fargate service with auto-scaling
    const service = new ecs.FargateService(this, `fargate-service-${environmentSuffix}`, {
      cluster,
      taskDefinition,
      desiredCount: 2,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Auto-scaling configuration
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization(`cpu-scaling-${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `alb-${environmentSuffix}`, {
      loadBalancerName: `customer-portal-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ALB security group
    const albSecurityGroup = new ec2.SecurityGroup(this, `alb-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for ALB',
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    alb.addSecurityGroup(albSecurityGroup);

    // Allow ALB to connect to ECS tasks
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow ALB to connect to ECS tasks'
    );

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `target-group-${environmentSuffix}`, {
      targetGroupName: `api-targets-${environmentSuffix}`,
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    service.attachToApplicationTargetGroup(targetGroup);

    // Listener
    const listener = alb.addListener(`listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    listener.addTargetGroups(`api-targets-${environmentSuffix}`, {
      targetGroups: [targetGroup],
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
    });

    // S3 bucket for frontend
    const frontendBucket = new s3.Bucket(this, `frontend-bucket-${environmentSuffix}`, {
      bucketName: `customer-portal-frontend-${environmentSuffix}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CloudFront Origin Access Control
    const oac = new cloudfront.CfnOriginAccessControl(this, `oac-${environmentSuffix}`, {
      originAccessControlConfig: {
        name: `customer-portal-oac-${environmentSuffix}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, `distribution-${environmentSuffix}`, {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(alb, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: 'index.html',
    });

    // Update bucket policy to allow CloudFront OAC
    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [frontendBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS name',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Frontend S3 bucket name',
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ca-central-1',
  },
});
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

4. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=dev
```

5. Upload frontend files to S3:
```bash
aws s3 sync ./frontend/build s3://customer-portal-frontend-dev-<account-id>/
```

6. Access the application:
- Frontend: Use the CloudFront URL from outputs
- API: Access through CloudFront at /api/* path

## Clean Up

To destroy all resources:
```bash
cdk destroy --context environmentSuffix=dev
```
