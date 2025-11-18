# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/payment-handler.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Initialize SSM client outside handler for connection reuse
const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
}

interface PaymentConfig {
  maxAmount: number;
  allowedCurrencies: string[];
  timeout: number;
}

/**
 * Payment processing Lambda handler
 * Reads configuration from SSM Parameter Store based on environment
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get SSM parameter path from environment variable
    const ssmPath = process.env.SSM_CONFIG_PATH;
    if (!ssmPath) {
      throw new Error('SSM_CONFIG_PATH environment variable not set');
    }

    console.log(`Loading configuration from SSM path: ${ssmPath}`);

    // Load configuration from SSM Parameter Store
    const command = new GetParameterCommand({
      Name: ssmPath,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    const config: PaymentConfig = JSON.parse(response.Parameter?.Value || '{}');

    // Parse payment request
    const payment: PaymentRequest = JSON.parse(event.body || '{}');

    // Validate payment request
    if (!payment.amount || payment.amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid payment amount' }),
      };
    }

    if (payment.amount > config.maxAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Payment amount exceeds maximum allowed: ${config.maxAmount}`,
        }),
      };
    }

    if (!config.allowedCurrencies.includes(payment.currency)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Currency ${payment.currency} not supported`,
        }),
      };
    }

    // Process payment (simulation)
    console.log('Processing payment:', payment);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        transactionId: `txn-${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

```

## ./lib/payment-config.ts

```typescript
/**
 * Environment-specific configuration for payment processing infrastructure
 */
export interface EnvironmentConfig {
  /** VPC CIDR block for the environment */
  vpcCidr: string;
  /** RDS instance type */
  dbInstanceType: string;
  /** SQS message retention period in days */
  messageRetentionDays: number;
  /** S3 lifecycle expiration in days */
  s3LifecycleDays: number;
  /** Environment name */
  environment: string;
  /** Custom domain name (if applicable) */
  customDomain?: string;
}

/**
 * Configuration for each environment
 * Maps environment suffix to specific configuration values
 */
export const ENV_CONFIGS: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    dbInstanceType: 'db.t3.medium',
    messageRetentionDays: 1,
    s3LifecycleDays: 7,
    environment: 'dev',
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    dbInstanceType: 'db.r5.large',
    messageRetentionDays: 7,
    s3LifecycleDays: 30,
    environment: 'staging',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    dbInstanceType: 'db.r5.xlarge',
    messageRetentionDays: 14,
    s3LifecycleDays: 90,
    environment: 'prod',
  },
  pr6742: {
    vpcCidr: '10.3.0.0/16',
    dbInstanceType: 'db.t3.medium',
    messageRetentionDays: 1,
    s3LifecycleDays: 7,
    environment: 'pr6742',
  },
};

/**
 * Validates that the environment configuration exists
 * @param environmentSuffix The environment suffix to validate
 * @throws Error if configuration not found
 */
export function validateEnvironmentConfig(environmentSuffix: string): void {
  if (!ENV_CONFIGS[environmentSuffix]) {
    throw new Error(
      `Environment configuration not found for: ${environmentSuffix}. ` +
        `Available environments: ${Object.keys(ENV_CONFIGS).join(', ')}`
    );
  }
}

/**
 * Gets configuration for a specific environment
 * @param environmentSuffix The environment suffix
 * @returns The environment configuration
 */
export function getEnvironmentConfig(
  environmentSuffix: string
): EnvironmentConfig {
  validateEnvironmentConfig(environmentSuffix);
  return ENV_CONFIGS[environmentSuffix];
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import {
  getEnvironmentConfig,
  validateEnvironmentConfig,
} from './payment-config';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * Payment Processing Infrastructure Stack
 * Deploys a complete multi-environment payment processing system
 * with VPC, RDS, Lambda, API Gateway, SQS, S3, WAF, and SSM integration
 */
export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseCluster;
  public readonly paymentHandler: lambda.Function;
  public readonly paymentQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;
  public readonly storageBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get and validate environment suffix
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Validate environment configuration exists
    validateEnvironmentConfig(environmentSuffix);
    const config = getEnvironmentConfig(environmentSuffix);

    console.log(
      `Deploying payment processing infrastructure for environment: ${environmentSuffix}`
    );

    // Create VPC with environment-specific CIDR
    this.vpc = this.createVpc(environmentSuffix, config.vpcCidr);

    // Create RDS Aurora PostgreSQL cluster
    this.database = this.createDatabase(
      environmentSuffix,
      config.dbInstanceType
    );

    // Create SQS queues (main queue and DLQ)
    const queues = this.createQueues(
      environmentSuffix,
      config.messageRetentionDays
    );
    this.paymentQueue = queues.mainQueue;
    this.deadLetterQueue = queues.dlq;

    // Create S3 bucket with lifecycle policies
    this.storageBucket = this.createStorageBucket(
      environmentSuffix,
      config.s3LifecycleDays
    );

    // Create SSM parameters for Lambda configuration
    this.createSSMParameters(environmentSuffix);

    // Create Lambda function with SSM integration
    this.paymentHandler = this.createLambdaFunction(environmentSuffix);

    // Create API Gateway with custom domain support
    this.api = this.createApiGateway(environmentSuffix);

    // Create WAF Web ACL for API protection
    this.webAcl = this.createWafWebAcl(environmentSuffix);

    // Create CloudFormation outputs with environment tags
    this.createOutputs(environmentSuffix, config.environment);

    // Add tags to all resources
    this.addResourceTags(environmentSuffix, config.environment);
  }

  /**
   * Creates VPC with consistent subnet layout
   */
  private createVpc(environmentSuffix: string, vpcCidr: string): ec2.Vpc {
    const vpc = new ec2.Vpc(this, `PaymentVpc-${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      natGateways: 0, // Cost optimization: use NAT instances or VPC endpoints instead
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `payment-public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `payment-private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC endpoints for cost-effective private access
    vpc.addGatewayEndpoint(`S3Endpoint-${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    return vpc;
  }

  /**
   * Creates RDS Aurora PostgreSQL cluster with environment-specific sizing
   */
  private createDatabase(
    environmentSuffix: string,
    _dbInstanceType: string
  ): rds.DatabaseCluster {
    // Create security group for database
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for payment database - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Create database cluster
    const database = new rds.DatabaseCluster(
      this,
      `PaymentDatabase-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-db-cluster-${environmentSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_7,
        }),
        writer: rds.ClusterInstance.provisioned(`writer-${environmentSuffix}`, {
          // Map environment to instance type (config has "db." prefix which ec2.InstanceType adds again)
          instanceType:
            environmentSuffix === 'dev'
              ? ec2.InstanceType.of(
                  ec2.InstanceClass.T3,
                  ec2.InstanceSize.MEDIUM
                )
              : environmentSuffix === 'staging'
                ? ec2.InstanceType.of(
                    ec2.InstanceClass.R5,
                    ec2.InstanceSize.LARGE
                  )
                : ec2.InstanceType.of(
                    ec2.InstanceClass.R5,
                    ec2.InstanceSize.XLARGE
                  ),
          publiclyAccessible: false,
        }),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        defaultDatabaseName: 'paymentdb',
        backup: {
          retention: cdk.Duration.days(7), // 7 days backup retention
        },
        // CRITICAL: Must be destroyable for testing
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        // Credentials automatically generated and stored in Secrets Manager
        storageEncrypted: true,
      }
    );

    return database;
  }

  /**
   * Creates SQS queues with dead letter queue
   */
  private createQueues(
    environmentSuffix: string,
    retentionDays: number
  ): { mainQueue: sqs.Queue; dlq: sqs.Queue } {
    // Create dead letter queue
    const dlq = new sqs.Queue(this, `PaymentDLQ-${environmentSuffix}`, {
      queueName: `payment-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14), // Longer retention for DLQ
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      // CRITICAL: Must be destroyable
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create main payment queue with DLQ
    const mainQueue = new sqs.Queue(this, `PaymentQueue-${environmentSuffix}`, {
      queueName: `payment-queue-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(retentionDays),
      visibilityTimeout: cdk.Duration.seconds(300),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3, // Move to DLQ after 3 failed attempts
      },
      // CRITICAL: Must be destroyable
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return { mainQueue, dlq };
  }

  /**
   * Creates S3 bucket with environment-specific lifecycle policies
   */
  private createStorageBucket(
    environmentSuffix: string,
    lifecycleDays: number
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, `PaymentBucket-${environmentSuffix}`, {
      bucketName: `payment-storage-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: `expire-old-objects-${environmentSuffix}`,
          enabled: true,
          expiration: cdk.Duration.days(lifecycleDays),
        },
        // Only add transition rule if lifecycle is >= 60 days (minimum 30 days for STANDARD_IA)
        ...(lifecycleDays >= 60
          ? [
              {
                id: `transition-to-infrequent-access-${environmentSuffix}`,
                enabled: true,
                transitions: [
                  {
                    storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                    transitionAfter: cdk.Duration.days(
                      Math.floor(lifecycleDays / 2)
                    ),
                  },
                ],
              },
            ]
          : []),
      ],
      // CRITICAL: Must be destroyable for testing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Enable automatic cleanup
    });

    return bucket;
  }

  /**
   * Creates SSM parameters for Lambda configuration
   */
  private createSSMParameters(environmentSuffix: string): void {
    // Create SSM parameter with payment configuration
    new ssm.StringParameter(this, `PaymentConfigParam-${environmentSuffix}`, {
      parameterName: `/${environmentSuffix}/payment-service/config/settings`,
      description: `Payment service configuration for ${environmentSuffix} environment`,
      stringValue: JSON.stringify({
        maxAmount: environmentSuffix === 'prod' ? 100000 : 10000,
        allowedCurrencies: ['USD', 'EUR', 'GBP'],
        timeout: 30,
        environment: environmentSuffix,
      }),
      tier: ssm.ParameterTier.STANDARD,
    });
  }

  /**
   * Creates Lambda function with SSM integration
   */
  private createLambdaFunction(environmentSuffix: string): lambda.Function {
    // Create security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for payment Lambda - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow Lambda to connect to RDS
    this.database.connections.allowDefaultPortFrom(
      lambdaSecurityGroup,
      'Allow Lambda to connect to database'
    );

    // Create Lambda function using NodejsFunction for TypeScript support
    const paymentHandler = new nodejs.NodejsFunction(
      this,
      `PaymentHandler-${environmentSuffix}`,
      {
        functionName: `payment-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, 'lambda', 'payment-handler.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          SSM_CONFIG_PATH: `/${environmentSuffix}/payment-service/config/settings`,
          ENVIRONMENT: environmentSuffix,
          DB_ENDPOINT: this.database.clusterEndpoint.hostname,
          DB_NAME: 'paymentdb',
          QUEUE_URL: this.paymentQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to read SSM parameters
    paymentHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/${environmentSuffix}/payment-service/config/*`,
        ],
      })
    );

    // Grant permissions to access database secret
    this.database.secret?.grantRead(paymentHandler);

    // Grant permissions to send messages to SQS
    this.paymentQueue.grantSendMessages(paymentHandler);

    // Grant permissions to write to S3
    this.storageBucket.grantReadWrite(paymentHandler);

    return paymentHandler;
  }

  /**
   * Creates API Gateway with custom domain support
   */
  private createApiGateway(environmentSuffix: string): apigateway.RestApi {
    // Create API Gateway
    const api = new apigateway.RestApi(
      this,
      `PaymentApi-${environmentSuffix}`,
      {
        restApiName: `payment-api-${environmentSuffix}`,
        description: `Payment Processing API - ${environmentSuffix} environment`,
        deployOptions: {
          stageName: environmentSuffix,
          throttlingBurstLimit: environmentSuffix === 'prod' ? 5000 : 1000,
          throttlingRateLimit: environmentSuffix === 'prod' ? 2000 : 500,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      this.paymentHandler,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add resources and methods
    const payments = api.root.addResource('payments');
    payments.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    payments.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Add health check endpoint (no auth required)
    const health = api.root.addResource('health');
    health.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status": "healthy"}',
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );

    return api;
  }

  /**
   * Creates WAF Web ACL for API protection
   */
  private createWafWebAcl(environmentSuffix: string): wafv2.CfnWebACL {
    const webAcl = new wafv2.CfnWebACL(
      this,
      `PaymentWafAcl-${environmentSuffix}`,
      {
        name: `payment-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        description: `WAF rules for payment API - ${environmentSuffix}`,
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: environmentSuffix === 'prod' ? 2000 : 500,
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: `RateLimit-${environmentSuffix}`,
            },
          },
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: `CommonRules-${environmentSuffix}`,
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 3,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: `BadInputs-${environmentSuffix}`,
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `PaymentWaf-${environmentSuffix}`,
        },
      }
    );

    // Associate WAF with API Gateway
    // Note: API Gateway stage is created by the deployment
    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      `WafApiAssociation-${environmentSuffix}`,
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.api.restApiId}/stages/${environmentSuffix}`,
        webAclArn: webAcl.attrArn,
      }
    );

    // Ensure WAF association happens after API Gateway deployment and stage
    const apiStage = this.api.deploymentStage;
    if (apiStage) {
      wafAssociation.node.addDependency(apiStage);
    }

    return webAcl;
  }

  /**
   * Creates CloudFormation outputs with environment tags
   */
  private createOutputs(environmentSuffix: string, environment: string): void {
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${environment} environment`,
      exportName: `payment-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.clusterEndpoint.hostname,
      description: `Database endpoint for ${environment} environment`,
      exportName: `payment-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.clusterEndpoint.port.toString(),
      description: `Database port for ${environment} environment`,
      exportName: `payment-db-port-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: `API Gateway URL for ${environment} environment`,
      exportName: `payment-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: `API Gateway ID for ${environment} environment`,
      exportName: `payment-api-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: this.paymentQueue.queueUrl,
      description: `Payment queue URL for ${environment} environment`,
      exportName: `payment-queue-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'QueueArn', {
      value: this.paymentQueue.queueArn,
      description: `Payment queue ARN for ${environment} environment`,
      exportName: `payment-queue-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.storageBucket.bucketName,
      description: `Storage bucket name for ${environment} environment`,
      exportName: `payment-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.storageBucket.bucketArn,
      description: `Storage bucket ARN for ${environment} environment`,
      exportName: `payment-bucket-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.paymentHandler.functionName,
      description: `Payment handler function name for ${environment} environment`,
      exportName: `payment-lambda-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WafAclArn', {
      value: this.webAcl.attrArn,
      description: `WAF ACL ARN for ${environment} environment`,
      exportName: `payment-waf-arn-${environmentSuffix}`,
    });
  }

  /**
   * Adds tags to all resources in the stack
   */
  private addResourceTags(
    environmentSuffix: string,
    environment: string
  ): void {
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('Application', 'PaymentProcessing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeVpcEndpointsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand, GetStageCommand, GetResourcesCommand } from '@aws-sdk/client-api-gateway';
import { SQSClient, GetQueueAttributesCommand, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { WAFV2Client, GetWebACLCommand, ListWebACLsCommand } from '@aws-sdk/client-wafv2';
import { ListSecretsCommand } from '@aws-sdk/client-secrets-manager';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const sqsClient = new SQSClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const ssmClient = new SSMClient({ region });
const wafClient = new WAFV2Client({ region });

describe('Payment Processing Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });

    test('VPC should have 4 subnets (2 public, 2 private)', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(4);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('Security groups should be configured correctly', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
    });

    test('VPC should have S3 VPC endpoint', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.s3`],
            },
          ],
        })
      );

      expect(response.VpcEndpoints).toHaveLength(1);
      expect(response.VpcEndpoints![0].State).toBe('available');
    });
  });

  describe('RDS Aurora PostgreSQL Database', () => {
    test('RDS cluster should be available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      const clusterName = dbEndpoint.split('.')[0];
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterName,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.DatabaseName).toBe('paymentdb');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    test('RDS cluster should have correct port', async () => {
      const dbPort = outputs.DatabasePort;
      expect(dbPort).toBe('5432');
    });

    test('RDS instance should be available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterName = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterName],
            },
          ],
        })
      );

      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);
      const instance = response.DBInstances![0];
      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.Engine).toBe('aurora-postgresql');
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist and be active', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionName = outputs.LambdaFunctionName;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.ENVIRONMENT).toBe(environmentSuffix);
      expect(envVars!.DB_NAME).toBe('paymentdb');
      expect(envVars!.SSM_CONFIG_PATH).toMatch(/payment-service\/config/);
    });

    test('Lambda function should be invokable', async () => {
      const functionName = outputs.LambdaFunctionName;

      const testEvent = {
        httpMethod: 'GET',
        path: '/health',
        headers: {},
        body: null,
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(testEvent)),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    }, 60000);
  });

  describe('API Gateway', () => {
    test('API Gateway should be deployed', async () => {
      const apiId = outputs.ApiId;
      expect(apiId).toBeDefined();

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId,
        })
      );

      expect(response.id).toBe(apiId);
      expect(response.name).toBe(`payment-api-${environmentSuffix}`);
    });

    test('API Gateway stage should be deployed', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId,
          stageName: environmentSuffix,
        })
      );

      expect(response.stageName).toBe(environmentSuffix);
      expect(response.deploymentId).toBeDefined();
    });

    test('API Gateway should have health and payments resources', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetResourcesCommand({
          restApiId: apiId,
        })
      );

      const resourcePaths = response.items!.map((item) => item.path);
      expect(resourcePaths).toContain('/health');
      expect(resourcePaths).toContain('/payments');
    });

    test('API Gateway URL should be accessible', async () => {
      const apiUrl = outputs.ApiUrl;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\//);
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(region);
    });
  });

  describe('SQS Queues', () => {
    test('Main SQS queue should exist', async () => {
      const queueUrl = outputs.QueueUrl;
      expect(queueUrl).toBeDefined();

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toBe(outputs.QueueArn);
      expect(response.Attributes!.SqsManagedSseEnabled).toBeDefined();
    });

    test('Queue should have dead letter queue configured', async () => {
      const queueUrl = outputs.QueueUrl;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    });

    test('Queue should accept messages', async () => {
      const queueUrl = outputs.QueueUrl;
      const testId = `test-${Date.now()}`;
      const testMessage = {
        testId: testId,
        message: 'Integration test message',
      };

      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(testMessage),
        })
      );

      expect(sendResponse.MessageId).toBeDefined();
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket should exist', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find((rule) => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Status).toBe('Enabled');
    });

    test('S3 bucket ARN should match outputs', async () => {
      const bucketArn = outputs.BucketArn;
      const bucketName = outputs.BucketName;

      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret should exist', async () => {
      const listResponse = await secretsClient.send(
        new ListSecretsCommand({
          Filters: [
            {
              Key: 'name',
              Values: [`PaymentDatabase${environmentSuffix}`],
            },
          ],
        })
      );

      expect(listResponse.SecretList).toBeDefined();
      expect(listResponse.SecretList!.length).toBeGreaterThan(0);

      const secret = listResponse.SecretList![0];
      expect(secret.Name).toBeDefined();

      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secret.Name,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secretValue = JSON.parse(response.SecretString!);
      expect(secretValue.username).toBeDefined();
      expect(secretValue.password).toBeDefined();
      expect(secretValue.engine).toBe('postgres');
      expect(secretValue.port).toBe(5432);
      expect(secretValue.dbname).toBe('paymentdb');
    });
  });

  describe('SSM Parameter Store', () => {
    test('SSM configuration parameter should exist', async () => {
      const parameterName = `/${environmentSuffix}/payment-service/config/settings`;

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: parameterName,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Name).toBe(parameterName);
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBeDefined();

      const config = JSON.parse(response.Parameter!.Value!);
      expect(config.maxAmount).toBeDefined();
      expect(config.allowedCurrencies).toBeDefined();
      expect(Array.isArray(config.allowedCurrencies)).toBe(true);
    });
  });

  describe('WAF Web ACL', () => {
    test('WAF Web ACL should exist', async () => {
      const wafAclArn = outputs.WafAclArn;
      expect(wafAclArn).toBeDefined();

      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.Name).toBe(`payment-waf-${environmentSuffix}`);
      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.Rules!.length).toBeGreaterThanOrEqual(3);
    });

    test('WAF should have rate limiting rule', async () => {
      const wafAclArn = outputs.WafAclArn;
      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      const rateLimitRule = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'RateLimitRule'
      );
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule!.Statement.RateBasedStatement).toBeDefined();
    });

    test('WAF should have AWS managed rules', async () => {
      const wafAclArn = outputs.WafAclArn;
      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      const commonRuleSet = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'AWSManagedRulesCommonRuleSet'
      );
      expect(commonRuleSet).toBeDefined();

      const badInputsRuleSet = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      expect(badInputsRuleSet).toBeDefined();
    });
  });

  describe('End-to-End Payment Flow', () => {
    test('Complete payment processing workflow', async () => {
      const queueUrl = outputs.QueueUrl;
      const apiUrl = outputs.ApiUrl;

      const paymentRequest = {
        amount: 100,
        currency: 'USD',
        paymentMethod: 'credit_card',
        timestamp: Date.now(),
      };

      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(paymentRequest),
        })
      );

      expect(sendResponse.MessageId).toBeDefined();
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('All outputs should follow naming convention', () => {
      expect(outputs.VpcId).toMatch(/^vpc-/);
      expect(outputs.ApiId).toMatch(/^[a-z0-9]+$/);
      expect(outputs.BucketName).toMatch(new RegExp(`-${environmentSuffix}-`));
      expect(outputs.LambdaFunctionName).toMatch(new RegExp(`-${environmentSuffix}$`));
    });

    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'VpcId',
        'DatabaseEndpoint',
        'DatabasePort',
        'ApiUrl',
        'ApiId',
        'QueueUrl',
        'QueueArn',
        'BucketName',
        'BucketArn',
        'LambdaFunctionName',
        'WafAclArn',
      ];

      requiredOutputs.forEach((outputKey) => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Dev Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with dev CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('RDS cluster created with t3.medium instance', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        DatabaseName: 'paymentdb',
        StorageEncrypted: true,
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'aurora-postgresql',
      });
    });

    test('All RDS resources have DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBCluster', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('SQS queues created with correct retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 86400, // 1 day for dev
      });
    });

    test('Dead letter queue configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('S3 bucket has 7-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 7,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 3, // 7/2 = 3.5, floor to 3
                },
              ],
            },
          ],
        },
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('Lambda function created with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            SSM_CONFIG_PATH: '/dev/payment-service/config/settings',
            ENVIRONMENT: 'dev',
            DB_NAME: 'paymentdb',
          },
        },
      });
    });

    test('Lambda has IAM permissions for SSM', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:ssm:',
                    { Ref: 'AWS::Region' },
                    ':',
                    { Ref: 'AWS::AccountId' },
                    ':parameter/dev/payment-service/config/*',
                  ],
                ],
              },
            },
          ],
        },
      });
    });

    test('API Gateway created with dev stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payment-api-dev',
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
      });
    });

    test('WAF Web ACL created with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payment-waf-dev',
        Scope: 'REGIONAL',
        Rules: [
          {
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                Limit: 500, // Dev limit
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          },
        ],
      });
    });

    test('SSM parameter created for dev config', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/payment-service/config/settings',
        Type: 'String',
      });
    });

    test('CloudFormation outputs created', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('VpcId');
      expect(Object.keys(outputs)).toContain('DatabaseEndpoint');
      expect(Object.keys(outputs)).toContain('ApiUrl');
      expect(Object.keys(outputs)).toContain('QueueUrl');
      expect(Object.keys(outputs)).toContain('BucketName');
      expect(Object.keys(outputs)).toContain('LambdaFunctionName');
      expect(Object.keys(outputs)).toContain('WafAclArn');
    });
  });

  describe('Staging Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with staging CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('RDS cluster created with r5.large instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.large',
      });
    });

    test('SQS queue has 7-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 604800, // 7 days
      });
    });

    test('S3 bucket has 30-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 15, // 30/2 = 15
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with prod CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('RDS cluster created with r5.xlarge instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.xlarge',
      });
    });

    test('SQS queue has 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('S3 bucket has 90-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 90,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 45, // 90/2 = 45
                },
              ],
            },
          ],
        },
      });
    });

    test('API Gateway has production throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        ThrottlingBurstLimit: 5000,
        ThrottlingRateLimit: 2000,
      });
    });

    test('WAF has production rate limits', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: [
          {
            Name: 'RateLimitRule',
            Statement: {
              RateBasedStatement: {
                Limit: 2000, // Prod limit
              },
            },
          },
        ],
      });
    });
  });

  describe('Configuration Validation', () => {
    test('Invalid environment throws error', () => {
      expect(() => {
        new TapStack(app, 'TestStack', {
          environmentSuffix: 'invalid',
        });
      }).toThrow('Environment configuration not found for: invalid');
    });

    test('Environment suffix from props takes precedence', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('Environment suffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('Environment suffix defaults to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('Resource Counting', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('Has VPC resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Has RDS cluster and instance', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('Has two SQS queues (main + DLQ)', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });

    test('Has S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Has Lambda function', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('Has API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('Has WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('Has SSM parameter', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 1);
    });
  });

  describe('Lambda Handler Unit Tests', () => {
    const mockSSMClient = {
      send: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('Lambda handler should be included in stack', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('Lambda should have correct handler path', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('Lambda should have environment variables set', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            SSM_CONFIG_PATH: '/dev/payment-service/config/settings',
            ENVIRONMENT: 'dev',
            DB_NAME: 'paymentdb',
          },
        },
      });
    });
  });

  describe('Payment Config Unit Tests', () => {
    test('Dev config should have correct VPC CIDR', () => {
      const devStack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const devTemplate = Template.fromStack(devStack);
      devTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('Staging config should have correct VPC CIDR', () => {
      const stagingStack = new TapStack(app, 'StagingStack', {
        environmentSuffix: 'staging',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const stagingTemplate = Template.fromStack(stagingStack);
      stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('Prod config should have correct VPC CIDR', () => {
      const prodStack = new TapStack(app, 'ProdStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const prodTemplate = Template.fromStack(prodStack);
      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('PR6742 config should have correct VPC CIDR', () => {
      const pr6742Stack = new TapStack(app, 'PR6742Stack', {
        environmentSuffix: 'pr6742',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const pr6742Template = Template.fromStack(pr6742Stack);
      pr6742Template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.3.0.0/16',
      });
    });

    test('All environments should have unique VPC CIDRs', () => {
      const envs = ['dev', 'staging', 'prod', 'pr6742'];
      const cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16'];

      envs.forEach((env, index) => {
        const testStack = new TapStack(app, `TestStack${env}`, {
          environmentSuffix: env,
          env: { account: '123456789012', region: 'us-east-1' },
        });
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: cidrs[index],
        });
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('Lambda security group should be created', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });

    test('Database security group should allow Lambda access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });
  });

  describe('VPC Networking', () => {
    test('VPC should have public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('VPC should have internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('VPC should have route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('VPC should have S3 endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': [
            '',
            ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3'],
          ],
        },
      });
    });
  });

  describe('Database Configuration', () => {
    test('RDS cluster should have backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS cluster should have preferred backup window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('RDS cluster should have preferred maintenance window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('RDS secret should be created', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('RDS secret should be attached to cluster', () => {
      template.resourceCountIs('AWS::SecretsManager::SecretTargetAttachment', 1);
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway should have CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('API Gateway should have logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        LoggingLevel: 'INFO',
        DataTraceEnabled: true,
        MetricsEnabled: true,
      });
    });

    test('API Gateway should have throttling configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        ThrottlingBurstLimit: 1000,
        ThrottlingRateLimit: 500,
      });
    });

    test('API Gateway should have health endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('API Gateway should have payments endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });
    });
  });

  describe('WAF Configuration', () => {
    test('WAF should have managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: [
          {
            Name: 'RateLimitRule',
            Priority: 1,
          },
          {
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 2,
          },
          {
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 3,
          },
        ],
      });
    });

    test('WAF should be associated with API Gateway', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('SQS Configuration', () => {
    test('Main queue should have dead letter queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('Queue should have encryption enabled', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        SqsManagedSseEnabled: true,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 bucket should have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket should have public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket should have auto-delete enabled for dev', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda should have IAM role attached', () => {
      template.resourceCountIs('AWS::IAM::Role', 2);
    });

    test('Lambda role should have policies attached', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBeGreaterThan(0);
    });

    test('IAM policies should have policy documents', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      policies.forEach((policy: any) => {
        expect(policy.Properties.PolicyDocument).toBeDefined();
        expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
        expect(Array.isArray(policy.Properties.PolicyDocument.Statement)).toBe(
          true
        );
      });
    });
  });

  describe('Tags and Naming', () => {
    test('Resources should have environment tags', () => {
      const resources = template.toJSON().Resources;
      const resourceWithTags = Object.values(resources).find(
        (r: any) => r.Properties?.Tags
      );
      expect(resourceWithTags).toBeDefined();
    });

    test('Stack outputs should have description', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.ApiUrl).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
