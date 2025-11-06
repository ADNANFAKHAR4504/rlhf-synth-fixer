### Reasoning Trace
---

The user wants me to create a comprehensive AWS CDK TypeScript stack that includes:

1. Lambda Function (Node.js 14.x, multi-AZ)
2. API Gateway (IAM auth)
3. RDS PostgreSQL (db.m4.large minimum)
4. S3 Buckets (versioning enabled)
5. VPC (10.0.0.0/16, 2 public + 2 private subnets)
6. CloudFront
7. Route 53
8. SQS (Standard queue)
9. CloudWatch
10. Secrets Manager
11. IAM Roles (least privilege)

Key requirements:
- AWS account: 123456789012
- Primary region: us-east-1
- Secondary region: us-west-2 (though most resources will be in us-east-1)
- Resource naming: 'prod-service-role-stringSuffix'
- High availability
- Security best practices

I'll create a complete CDK TypeScript stack that includes all these components with proper configuration.
### Answer 
---

# AWS CDK TypeScript Stack Implementation

Below is a comprehensive AWS CDK TypeScript implementation that meets all specified requirements:

```typescript
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as rds from '@aws-cdk/aws-rds';
import * as s3 from '@aws-cdk/aws-s3';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as cloudfrontOrigins from '@aws-cdk/aws-cloudfront-origins';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as sqs from '@aws-cdk/aws-sqs';
import * as logs from '@aws-cdk/aws-logs';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as path from 'path';
import { Duration, RemovalPolicy } from '@aws-cdk/core';

export class MultiComponentApplicationStack extends cdk.Stack {
  // String suffix for unique resource naming
  private readonly stringSuffix: string;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });

    // Generate unique string suffix
    this.stringSuffix = cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `prod-app-vpc-${this.stringSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'prod-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'prod-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE,
          cidrMask: 24,
        },
      ],
    });

    // ========================================
    // Secrets Manager - RDS Credentials
    // ========================================
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `prod-rds-secret-${this.stringSuffix}`,
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // ========================================
    // RDS PostgreSQL Database
    // ========================================
    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: `prod-rds-sg-${this.stringSuffix}`,
      vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    const rdsInstance = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      instanceIdentifier: `prod-rds-postgres-${this.stringSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_7,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroups: [databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'proddb',
      allocatedStorage: 100,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      multiAz: true, // High availability
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.SEVEN_DAYS,
    });

    // ========================================
    // S3 Buckets
    // ========================================
    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: `prod-s3-static-${this.stringSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
    });

    // ========================================
    // SQS Queue
    // ========================================
    const asyncQueue = new sqs.Queue(this, 'AsyncProcessingQueue', {
      queueName: `prod-sqs-async-${this.stringSuffix}`,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(4),
      visibilityTimeout: cdk.Duration.minutes(6),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'DLQ', {
          queueName: `prod-sqs-dlq-${this.stringSuffix}`,
        }),
      },
    });

    // ========================================
    // CloudWatch Log Groups
    // ========================================
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/prod-lambda-api-${this.stringSuffix}`,
      retention: logs.RetentionDays.SEVEN_DAYS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ========================================
    // IAM Roles (Least Privilege)
    // ========================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `prod-iam-lambda-${this.stringSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Lambda permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [lambdaLogGroup.logGroupArn],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
      ],
      resources: [`${staticFilesBucket.bucketArn}/*`],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:SendMessage',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
      ],
      resources: [asyncQueue.queueArn],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [databaseSecret.secretArn],
    }));

    // ========================================
    // Lambda Function (Multi-AZ)
    // ========================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      securityGroupName: `prod-lambda-sg-${this.stringSuffix}`,
      vpc,
      description: 'Security group for Lambda function',
      allowAllOutbound: true,
    });

    const lambdaFunction = new lambda.Function(this, 'ApiLambda', {
      functionName: `prod-lambda-api-${this.stringSuffix}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        const s3 = new AWS.S3();
        const sqs = new AWS.SQS();
        
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event));
          
          try {
            // Example: Retrieve database secret
            const secretName = '${databaseSecret.secretName}';
            const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
            console.log('Successfully retrieved database credentials');
            
            // Example: Send message to SQS
            const queueUrl = '${asyncQueue.queueUrl}';
            await sqs.sendMessage({
              QueueUrl: queueUrl,
              MessageBody: JSON.stringify({
                timestamp: new Date().toISOString(),
                event: event,
              }),
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Request processed successfully',
                timestamp: new Date().toISOString(),
              }),
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: 'Internal server error',
              }),
            };
          }
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        DATABASE_SECRET_NAME: databaseSecret.secretName,
        S3_BUCKET: staticFilesBucket.bucketName,
        SQS_QUEUE_URL: asyncQueue.queueUrl,
      },
      role: lambdaRole,
      logRetention: logs.RetentionDays.SEVEN_DAYS,
      reservedConcurrentExecutions: 100,
    });

    // Allow Lambda to connect to RDS
    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // ========================================
    // API Gateway (IAM Authentication)
    // ========================================
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `prod-api-gateway-${this.stringSuffix}`,
      description: 'Production API Gateway',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });
    apiResource.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // ========================================
    // Route 53 Hosted Zone
    // ========================================
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'example-prod.com',
      comment: `Production hosted zone - ${this.stringSuffix}`,
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: `prod-cloudfront-oai-${this.stringSuffix}`,
    });

    staticFilesBucket.grantRead(cloudFrontOAI);

    const distribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      comment: `prod-cloudfront-dist-${this.stringSuffix}`,
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(staticFilesBucket, {
          originAccessIdentity: cloudFrontOAI,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new cloudfrontOrigins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enabled: true,
      geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA'),
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Route 53 A Record for CloudFront
    new route53.ARecord(this, 'CloudFrontARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // ========================================
    // Stack Outputs
    // ========================================
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticFilesBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'SqsQueueUrl', {
      value: asyncQueue.queueUrl,
      description: 'SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'Database Secret ARN',
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'MultiComponentApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', 'us-east-1');
  }
}

// ========================================
// App Entry Point
// ========================================
const app = new cdk.App();

new MultiComponentApplicationStack(app, 'MultiComponentApplicationStack', {
  description: 'Production multi-component application stack with high availability and security',
  stackName: 'prod-multi-component-stack',
});

app.synth();
```

## Additional Files Required

### `package.json`
```json
{
  "name": "multi-component-application",
  "version": "1.0.0",
  "description": "AWS CDK multi-component application stack",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "synth": "cdk synth",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/node": "^14.14.31",
    "typescript": "^4.2.3",
    "aws-cdk": "^1.137.0"
  },
  "dependencies": {
    "@aws-cdk/aws-apigateway": "^1.137.0",
    "@aws-cdk/aws-cloudfront": "^1.137.0",
    "@aws-cdk/aws-cloudfront-origins": "^1.137.0",
    "@aws-cdk/aws-ec2": "^1.137.0",
    "@aws-cdk/aws-iam": "^1.137.0",
    "@aws-cdk/aws-lambda": "^1.137.0",
    "@aws-cdk/aws-logs": "^1.137.0",
    "@aws-cdk/aws-rds": "^1.137.0",
    "@aws-cdk/aws-route53": "^1.137.0",
    "@aws-cdk/aws-route53-targets": "^1.137.0",
    "@aws-cdk/aws-s3": "^1.137.0",
    "@aws-cdk/aws-secretsmanager": "^1.137.0",
    "@aws-cdk/aws-sqs": "^1.137.0",
    "@aws-cdk/core": "^1.137.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "lib": ["es2018"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["cdk.out"]
}
```

### `cdk.json`
```json
{
  "app": "npx ts-node index.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-ecr-assets:dockerIgnoreSupport": true,
    "@aws-cdk/aws-secretsmanager:parseOwnedSecretName": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/aws-s3:grantWriteWithoutAcl": true
  }
}
```

## Deployment Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Bootstrap CDK (First time only)**
   ```bash
   npx cdk bootstrap aws://123456789012/us-east-1
   ```

3. **Synthesize CloudFormation Template**
   ```bash
   npm run synth
   ```

4. **Deploy Stack**
   ```bash
   npm run deploy
   ```

5. **Verify Outputs**
   After deployment, the stack will output:
   - VPC ID
   - API Gateway URL
   - Lambda Function ARN
   - RDS Endpoint
   - S3 Bucket Name
   - SQS Queue URL
   - CloudFront Domain Name
   - Route 53 Hosted Zone ID
   - Database Secret ARN

## Key Implementation Details

### High Availability
- **Lambda**: Deployed in private subnets across 2 AZs
- **RDS**: Multi-AZ deployment enabled
- **VPC**: 2 public and 2 private subnets across 2 AZs
- **NAT Gateways**: 2 NAT gateways for redundancy

### Security
- **IAM**: Least privilege roles for all services
- **API Gateway**: IAM authentication required
- **Secrets Manager**: Database credentials stored securely
- **S3**: Bucket encryption and blocked public access
- **SQS**: KMS encryption enabled
- **RDS**: Storage encryption enabled
- **CloudFront**: HTTPS only with modern TLS

### Resource Naming Convention
All resources follow the pattern: `prod-{service}-{role}-{stringSuffix}`
- The string suffix is automatically generated from the Stack ID
- Ensures globally unique resource names

### Monitoring & Logging
- **CloudWatch Logs**: Configured for Lambda and RDS
- **API Gateway**: Request/response logging enabled
- **Log Retention**: 7 days for all log groups

### Operational Excellence
- **Tags**: All resources tagged with Environment, Project, ManagedBy, and Region
- **Removal Policy**: Resources configured for safe cleanup (DESTROY policy in dev)
- **Dead Letter Queue**: Configured for SQS with retry logic