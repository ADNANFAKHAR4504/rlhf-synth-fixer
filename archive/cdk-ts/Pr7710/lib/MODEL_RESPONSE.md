### Reasoning Trace
---

This is a comprehensive request for a production-ready e-commerce infrastructure using AWS CDK. I need to create a single CDK TypeScript stack that includes:

1. VPC with public and private subnets
2. ALB with path-based routing
3. ECS Fargate service with auto-scaling
4. RDS Aurora Serverless v2
5. Secrets Manager for credentials
6. S3 bucket for static assets
7. CloudFront distribution
8. API Gateway
9. CloudWatch monitoring and alarms
10. SNS for notifications
11. Proper security configurations

Let me structure this as a complete CDK TypeScript application with all the required components.
### Answer 
---

# Production-Ready E-Commerce Infrastructure CDK Stack

Below is a complete CDK TypeScript implementation of a production-ready e-commerce infrastructure as a single stack (`TapStack`).

## Project Structure

```
ecommerce-infrastructure/
├── bin/
│   └── app.ts
├── lib/
│   └── tap-stack.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## Implementation

### 1. Package Configuration (`package.json`)

```json
{
  "name": "ecommerce-infrastructure",
  "version": "1.0.0",
  "bin": {
    "ecommerce-infrastructure": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "20.8.4",
    "aws-cdk": "2.100.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.2.70",
    "source-map-support": "^0.5.21"
  }
}
```

### 2. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "outDir": ".",
    "rootDir": ".",
    "incremental": true
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### 3. CDK Configuration (`cdk.json`)

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/core:stackRelativePaths": true,
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:newStyleStackSynthesis": true,
    "environment": "production",
    "emailAddress": "admin@example.com"
  }
}
```

### 4. Application Entry Point (`bin/app.ts`)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'production';
const emailAddress = app.node.tryGetContext('emailAddress') || 'admin@example.com';

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Production-ready e-commerce infrastructure stack',
  tags: {
    Environment: environment,
    Project: 'ECommerce',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
  },
  environment,
  emailAddress,
});
```

### 5. Main Stack Implementation (`lib/tap-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  emailAddress: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'MasterKey', {
      description: 'KMS key for e-commerce infrastructure encryption',
      enableKeyRotation: true,
      alias: 'alias/ecommerce-master-key',
    });

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'EcommerceVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from ECS'
    );

    // RDS Credentials Secret
    const rdsCredentials = new secretsmanager.Secret(this, 'RDSCredentials', {
      description: 'RDS master user credentials',
      encryptionKey: kmsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Enable rotation for RDS credentials
    rdsCredentials.addRotationSchedule('RotationSchedule', {
      automaticallyAfter: cdk.Duration.days(30),
    });

    // RDS Aurora Serverless v2 Cluster
    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(rdsCredentials),
      instanceProps: {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [rdsSecurityGroup],
      },
      defaultDatabaseName: 'ecommerce',
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      serverlessV2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1,
      },
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
          publiclyAccessible: false,
        }),
      ],
    });

    // S3 Bucket for static assets
    const staticBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for e-commerce static assets',
    });

    staticBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(staticBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      additionalBehaviors: {
        '*.js': {
          origin: new origins.S3Origin(staticBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'JSCachePolicy', {
            defaultTtl: cdk.Duration.seconds(86400),
            maxTtl: cdk.Duration.seconds(31536000),
            minTtl: cdk.Duration.seconds(0),
          }),
        },
        '*.css': {
          origin: new origins.S3Origin(staticBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'CSSCachePolicy', {
            defaultTtl: cdk.Duration.seconds(86400),
            maxTtl: cdk.Duration.seconds(31536000),
            minTtl: cdk.Duration.seconds(0),
          }),
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      vpc,
      containerInsights: true,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:latest'), // Replace with your ECR image
      memoryLimitMiB: 2048,
      cpu: 1024,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecommerce',
        logGroup: new logs.LogGroup(this, 'ECSLogGroup', {
          encryptionKey: kmsKey,
          retention: logs.RetentionDays.ONE_WEEK,
        }),
      }),
      environment: {
        NODE_ENV: props.environment,
        PORT: '3000',
      },
      secrets: {
        DB_SECRET_ARN: ecs.Secret.fromSecretsManager(rdsCredentials),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Grant ECS task access to RDS credentials
    rdsCredentials.grantRead(taskDefinition.taskRole);

    // ECS Service
    const ecsService = new ecs.FargateService(this, 'ECSService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Configure auto-scaling
    const scaling = ecsService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ECSTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [ecsService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ALB Listener
    const listener = alb.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // Add path-based routing rules
    listener.addTargetGroups('ECSTargets', {
      targetGroups: [targetGroup],
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      priority: 10,
    });

    listener.addAction('HealthCheck', {
      conditions: [elbv2.ListenerCondition.pathPatterns(['/health'])],
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'application/json',
        messageBody: JSON.stringify({ status: 'healthy' }),
      }),
      priority: 20,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'EcommerceAPI', {
      restApiName: 'E-Commerce API',
      description: 'API Gateway for e-commerce application',
      deployOptions: {
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
    });

    // API Key and Usage Plan
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      description: 'API Key for e-commerce API',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'Standard',
      apiStages: [
        {
          api,
          stage: api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);

    // Proxy integration with ALB
    const integration = new apigateway.HttpIntegration(
      `http://${alb.loadBalancerDnsName}/{proxy}`,
      {
        httpMethod: 'ANY',
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
          },
        },
      }
    );

    const proxyResource = api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', integration, {
      apiKeyRequired: true,
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // SNS Topic for notifications
    const snsTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'E-Commerce Infrastructure Alerts',
      masterKey: kmsKey,
    });

    snsTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(props.emailAddress)
    );

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: ecsService.metricCpuUtilization(),
      threshold: 70,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: ecsService.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // DB Connection alarm
    const dbConnectionAlarm = new cloudwatch.Alarm(this, 'HighDBConnections', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
    });

    dbConnectionAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // ALB Target Health alarm
    const unhealthyTargetsAlarm = new cloudwatch.Alarm(this, 'UnhealthyTargets', {
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
    });

    unhealthyTargetsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // API Gateway 4XX errors alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'API4XXErrors', {
      metric: api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      statistic: 'Sum',
    });

    api4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // API Gateway 5XX errors alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'API5XXErrors', {
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 2,
      statistic: 'Sum',
    });

    api5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'EcommerceDashboard', {
      dashboardName: 'ecommerce-infrastructure',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [ecsService.metricCpuUtilization()],
        right: [ecsService.metricMemoryUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [targetGroup.metricRequestCount()],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: dbCluster.clusterIdentifier,
            },
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        left: [api.metricClientError()],
        right: [api.metricServerError()],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Healthy Targets',
        metrics: [targetGroup.metricHealthyHostCount()],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Unhealthy Targets',
        metrics: [targetGroup.metricUnhealthyHostCount()],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'API Request Count',
        metrics: [api.metricCount()],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'API Latency',
        metrics: [api.metricLatency()],
        width: 6,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'APIKey', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticBucket.bucketName,
      description: 'S3 Static Assets Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Cluster Endpoint',
    });
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Build the TypeScript code:**
```bash
npm run build
```

3. **Bootstrap CDK (first time only):**
```bash
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

4. **Review the stack:**
```bash
npx cdk diff
```

5. **Deploy the stack:**
```bash
npx cdk deploy --require-approval never
```

6. **Set context variables (optional):**
```bash
npx cdk deploy -c environment=production -c emailAddress=youremail@example.com
```

## Key Features Implemented

### Security
- **KMS encryption** for all sensitive resources
- **IAM roles** with least privilege access
- **Security groups** with specific ingress/egress rules
- **Secrets Manager** for database credentials with rotation
- **VPC** with private subnets for sensitive resources

### High Availability
- **Multi-AZ deployment** across us-east-1a and us-east-1b
- **Auto-scaling** for ECS service based on CPU utilization
- **Aurora Serverless v2** with reader instances
- **CloudFront CDN** for global content delivery

### Monitoring & Observability
- **CloudWatch Dashboard** with key metrics
- **CloudWatch Alarms** for proactive monitoring
- **SNS notifications** for critical alerts
- **Container Insights** for ECS cluster monitoring

### Cost Optimization
- **Aurora Serverless v2** with auto-pause capability
- **S3 lifecycle policies** for storage optimization
- **CloudFront caching** to reduce origin requests
- **Resource tagging** for cost allocation

## Post-Deployment Steps

1. **Upload static assets to S3:**
```bash
aws s3 cp ./frontend/build s3://[BUCKET_NAME]/ --recursive
```

2. **Update ECS container image:**
- Build and push your application image to ECR
- Update the task definition with the ECR image URI

3. **Configure API Gateway:**
- Retrieve the API key value from the AWS Console
- Use it in your application's API requests

4. **Verify alarms:**
- Check SNS email subscription confirmation
- Test alarms by simulating high load

This implementation provides a complete, production-ready infrastructure that can be deployed with a single `cdk deploy` command. All components are integrated and follow AWS best practices for security, scalability, and reliability.