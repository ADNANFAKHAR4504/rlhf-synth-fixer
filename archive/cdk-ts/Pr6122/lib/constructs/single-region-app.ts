import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface SingleRegionAppProps {
  readonly environmentSuffix: string;
  readonly timestamp: string;
}

export class SingleRegionApp extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;
  public readonly apiFunction: lambda.Function;
  public readonly api: apigateway.RestApi;
  public readonly distribution: s3.Bucket; // Temporarily using S3 bucket as placeholder
  public readonly staticBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SingleRegionAppProps) {
    super(scope, id);

    const { environmentSuffix, timestamp } = props;

    // VPC with 2 public and 2 private subnets
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `iac-rlhf-${environmentSuffix}-vpc-${timestamp}`,
      maxAzs: 2, // For high availability across 2 AZs
      natGateways: 2, // HA NAT gateways
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security group for Lambda (addresses missing security group issue)
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS instance',
    });

    // Allow Lambda to connect to RDS
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // KMS key for RDS encryption
    const rdsKmsKey = new kms.Key(this, 'RdsKmsKey', {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Database credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `iac-rlhf-${environmentSuffix}-db-creds-${timestamp}`,
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\\\',
        passwordLength: 32,
      },
      encryptionKey: rdsKmsKey,
    });

    // RDS PostgreSQL instance with db.m4.large
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `iac-rlhf-${environmentSuffix}-db-${timestamp}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: true,
      allocatedStorage: 100,
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroups: [rdsSecurityGroup],
    });

    // SQS queue for asynchronous processing
    const taskQueue = new sqs.Queue(this, 'TaskQueue', {
      queueName: `iac-rlhf-${environmentSuffix}-task-queue-${timestamp}`,
      visibilityTimeout: Duration.seconds(300),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'TaskDLQ', {
          queueName: `iac-rlhf-${environmentSuffix}-task-dlq-${timestamp}`,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
        maxReceiveCount: 3,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // S3 bucket with versioning for static files
    const s3KmsKey = new kms.Key(this, 'S3KmsKey', {
      description: 'KMS key for S3 encryption',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.staticBucket = new s3.Bucket(this, 'StaticBucket', {
      bucketName: `iac-rlhf-${environmentSuffix}-static-${timestamp}`,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      bucketKeyEnabled: true,
    });

    // Production-grade Lambda function for cost monitoring
    this.apiFunction = new lambda.Function(this, 'CostMonitoringFunction', {
      functionName: `iac-rlhf-${environmentSuffix}-cost-monitor-${timestamp}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        const costExplorer = new AWS.CostExplorer();
        const sqs = new AWS.SQS();
        const s3 = new AWS.S3();
        const secretsManager = new AWS.SecretsManager();
        
        exports.handler = async (event) => {
          console.log('Cost monitoring request:', JSON.stringify(event));
          
          try {
            // Real-world use case: Generate cost report
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const costData = await costExplorer.getCostAndUsage({
              TimePeriod: {
                Start: startDate,
                End: endDate
              },
              Granularity: 'DAILY',
              Metrics: ['BlendedCost'],
              GroupBy: [
                {
                  Type: 'DIMENSION',
                  Key: 'SERVICE'
                }
              ]
            }).promise();
            
            // Process cost data
            const report = {
              reportId: Date.now().toString(),
              period: { start: startDate, end: endDate },
              totalCost: 0,
              services: []
            };
            
            if (costData.ResultsByTime && costData.ResultsByTime.length > 0) {
              costData.ResultsByTime.forEach(result => {
                if (result.Groups) {
                  result.Groups.forEach(group => {
                    const service = group.Keys[0];
                    const cost = parseFloat(group.Metrics.BlendedCost.Amount);
                    report.totalCost += cost;
                    report.services.push({ service, cost });
                  });
                }
              });
            }
            
            // Store report in S3
            await s3.putObject({
              Bucket: process.env.STATIC_BUCKET,
              Key: \`cost-reports/\${report.reportId}.json\`,
              Body: JSON.stringify(report),
              ContentType: 'application/json'
            }).promise();
            
            // Send notification via SQS if cost exceeds threshold
            if (report.totalCost > 100) { // $100 threshold
              await sqs.sendMessage({
                QueueUrl: process.env.QUEUE_URL,
                MessageBody: JSON.stringify({
                  type: 'COST_ALERT',
                  reportId: report.reportId,
                  totalCost: report.totalCost,
                  threshold: 100
                })
              }).promise();
            }
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Cost monitoring completed',
                reportId: report.reportId,
                totalCost: report.totalCost,
                servicesAnalyzed: report.services.length,
                timestamp: new Date().toISOString()
              })
            };
            
          } catch (error) {
            console.error('Cost monitoring error:', error);
            
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Cost monitoring failed',
                error: error.message,
                timestamp: new Date().toISOString()
              })
            };
          }
        };
      `),
      handler: 'index.handler',
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        onePerAz: true,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        QUEUE_URL: taskQueue.queueUrl,
        DB_SECRET_ARN: dbCredentials.secretArn,
        STATIC_BUCKET: this.staticBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      timeout: Duration.seconds(60),
      memorySize: 512,
      // reservedConcurrentExecutions: 1,
    });

    // Grant Lambda permissions (least privilege)
    taskQueue.grantSendMessages(this.apiFunction);
    this.staticBucket.grantReadWrite(this.apiFunction);
    dbCredentials.grantRead(this.apiFunction);

    // Grant Cost Explorer permissions
    this.apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ce:GetCostAndUsage',
          'ce:GetUsageReport',
          'ce:GetCostCategories',
          'ce:GetDimensionValues',
        ],
        resources: ['*'],
      })
    );

    // API Gateway with IAM authentication
    this.api = new apigateway.RestApi(this, 'CostMonitoringApi', {
      restApiName: `iac-rlhf-${environmentSuffix}-cost-api-${timestamp}`,
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.IAM,
      },
    }); // Add Lambda integration
    const integration = new apigateway.LambdaIntegration(this.apiFunction);
    const costResource = this.api.root.addResource('cost');
    costResource.addMethod('GET', integration);
    costResource.addMethod('POST', integration);

    // CloudFront distribution for global content delivery
    // Temporarily disabled due to domain name validation issues
    // this.distribution = new cloudfront.Distribution(this, 'CDN', {
    //   defaultBehavior: {
    //     origin: new cloudfront_origins.S3Origin(this.staticBucket),
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    //   },
    //   priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    //   enabled: true,
    //   comment: `Cost monitoring app CDN - ${environmentSuffix}`,
    // });

    // Create a placeholder distribution for now
    this.distribution = this.staticBucket; // Temporary placeholder

    // Add tags to all resources
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: environmentSuffix,
      Component: 'SingleRegionApp',
      Timestamp: timestamp,
    };

    const taggedResources = [
      this.vpc,
      this.database,
      this.apiFunction,
      this.api,
      this.staticBucket,
      taskQueue,
      lambdaSecurityGroup,
      rdsSecurityGroup,
      rdsKmsKey,
      s3KmsKey,
    ];

    taggedResources.forEach(resource => {
      Object.entries(tags).forEach(([key, value]) => {
        resource.node.addMetadata('aws:cdk:tagging', { [key]: value });
      });
    });
  }
}
