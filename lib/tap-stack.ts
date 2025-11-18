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
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
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
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      // CRITICAL: Must be destroyable
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create main payment queue with DLQ
    const mainQueue = new sqs.Queue(this, `PaymentQueue-${environmentSuffix}`, {
      queueName: `payment-queue-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(retentionDays),
      visibilityTimeout: cdk.Duration.seconds(300),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
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
        // Only add transition rule if lifecycle is >= 30 days (minimum 30 days for STANDARD_IA)
        ...(lifecycleDays >= 30
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
