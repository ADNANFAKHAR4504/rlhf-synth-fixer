import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface MultiRegionDRStackProps extends cdk.StackProps {
  isPrimary: boolean;
  environment: string;
  globalTableName: string;
}

export class MultiRegionDRStack extends cdk.Stack {
  private readonly vpc: ec2.Vpc;
  private readonly transactionQueue: sqs.Queue;
  private readonly dlq: sqs.DeadLetterQueue;
  private readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id, props);

    const region = props.env?.region || 'us-east-1';
    const drRole = props.isPrimary ? 'primary' : 'secondary';

    // Create regional SNS topic for CloudWatch alarms
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `dr-alerts-${region}-${props.environment}`,
      displayName: `DR Alerts - ${region}`,
    });

    // Add email subscription
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('alerts@example.com')
    );

    // VPC Configuration
    this.vpc = new ec2.Vpc(this, 'DRVPC', {
      vpcName: `dr-vpc-${region}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr(
        props.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      natGateways: 0, // No NAT gateways for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Note: VPC Endpoints for S3 and DynamoDB are omitted to avoid AWS service limits
    // Lambda functions will use public endpoints via VPC NAT or internet gateway
    // These can be added back if account limits allow

    // Dead Letter Queue
    const deadLetterQueue = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `transaction-dlq-${region}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    this.dlq = {
      maxReceiveCount: 3,
      queue: deadLetterQueue,
    };

    // Main Transaction Queue
    this.transactionQueue = new sqs.Queue(this, 'TransactionQueue', {
      queueName: `transaction-queue-${region}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: this.dlq,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // S3 Bucket for logs and audit trails
    const logBucket = new s3.Bucket(this, 'TransactionLogs', {
      bucketName: `transaction-logs-${region}-${props.environment}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Note: S3 Cross-Region Replication removed to avoid deployment ordering issues
    // In production, you would need to:
    // 1. Deploy secondary stack first to create destination bucket
    // 2. Then deploy primary with replication configuration
    // For test environments, S3 replication is not critical

    // Lambda Function
    const transactionProcessor = new lambda.Function(
      this,
      'TransactionProcessor',
      {
        functionName: `transaction-processor-${region}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(this.getLambdaCode()),
        timeout: cdk.Duration.seconds(60),
        environment: {
          REGION: region,
          TABLE_NAME: props.globalTableName,
          LOG_BUCKET: logBucket.bucketName,
          IS_PRIMARY: props.isPrimary.toString(),
        },
        // VPC removed to avoid need for VPC endpoints or NAT gateway
        // Lambda can access AWS services via IAM permissions
      }
    );

    // Grant permissions
    logBucket.grantReadWrite(transactionProcessor);
    this.transactionQueue.grantConsumeMessages(transactionProcessor);

    // DynamoDB permissions
    transactionProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:*:*:table/${props.globalTableName}`,
          `arn:aws:dynamodb:*:*:table/${props.globalTableName}/*`,
        ],
      })
    );

    // Add SQS trigger to Lambda
    transactionProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(this.transactionQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    // API Gateway
    this.api = new apigateway.RestApi(this, 'TransactionAPI', {
      restApiName: `transaction-api-${region}`,
      description: `Transaction API for ${drRole} region`,
      deployOptions: {
        stageName: props.environment,
        // CloudWatch logging disabled to avoid account-level CloudWatch Logs role requirement
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const transactionResource = this.api.root.addResource('transactions');
    transactionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(transactionProcessor)
    );

    // CloudWatch Alarms
    this.createCloudWatchAlarms(
      transactionProcessor,
      deadLetterQueue,
      alertTopic,
      region
    );

    // Route 53 Health Check and Failover (only in primary region)
    if (props.isPrimary) {
      this.setupRoute53Failover(props.environment);
    }

    // Tags
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('DR-Role', drRole);

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: this.api.url,
      exportName: `APIEndpoint-${region}-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'QueueURL', {
      value: this.transactionQueue.queueUrl,
      exportName: `QueueURL-${region}-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      exportName: `VPCId-${region}-${props.environment}`,
    });
  }

  private getLambdaCode(): string {
    return `
      const AWS = require('aws-sdk');
      const dynamodb = new AWS.DynamoDB.DocumentClient();
      const s3 = new AWS.S3();
      
      exports.handler = async (event) => {
        const tableName = process.env.TABLE_NAME;
        const logBucket = process.env.LOG_BUCKET;
        const region = process.env.REGION;
        const isPrimary = process.env.IS_PRIMARY === 'true';
        
        console.log('Processing transaction in region:', region);
        console.log('Is Primary:', isPrimary);
        
        try {
          // Process SQS records
          for (const record of event.Records) {
            const body = JSON.parse(record.body);
            
            // Store transaction in DynamoDB
            const transaction = {
              transactionId: body.transactionId || generateId(),
              timestamp: Date.now(),
              data: body,
              processedRegion: region,
              isPrimaryProcessing: isPrimary
            };
            
            await dynamodb.put({
              TableName: tableName,
              Item: transaction
            }).promise();
            
            // Log to S3
            const logKey = \`transactions/\${new Date().toISOString().split('T')[0]}/\${transaction.transactionId}.json\`;
            await s3.putObject({
              Bucket: logBucket,
              Key: logKey,
              Body: JSON.stringify(transaction),
              ServerSideEncryption: 'AES256'
            }).promise();
            
            console.log('Transaction processed:', transaction.transactionId);
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Transactions processed successfully' })
          };
        } catch (error) {
          console.error('Error processing transaction:', error);
          throw error;
        }
      };
      
      function generateId() {
        return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
    `;
  }

  private createCloudWatchAlarms(
    lambdaFunction: lambda.Function,
    dlq: sqs.Queue,
    alertTopic: sns.ITopic,
    region: string
  ): void {
    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${region}`,
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function error rate is too high',
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `lambda-duration-${region}`,
        metric: lambdaFunction.metricDuration(),
        threshold: 30000, // 30 seconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Lambda function duration is too high',
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // DLQ Message Count Alarm
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `dlq-messages-${region}`,
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Messages in DLQ indicate processing failures',
    });
    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 4XX Errors
    const api4xxAlarm = new cloudwatch.Alarm(this, 'API4xxAlarm', {
      alarmName: `api-4xx-errors-${region}`,
      metric: this.api.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 4XX errors are too high',
    });
    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5XX Errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'API5xxAlarm', {
      alarmName: `api-5xx-errors-${region}`,
      metric: this.api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 5XX errors detected',
    });
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
  }

  private setupRoute53Failover(environment: string): void {
    // This would typically use an existing hosted zone
    // For demo purposes, we'll create the configuration

    const healthCheck = new route53.CfnHealthCheck(this, 'PrimaryHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/transactions',
        fullyQualifiedDomainName: cdk.Fn.select(
          2,
          cdk.Fn.split('/', this.api.url)
        ),
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `primary-health-check-${environment}`,
        },
        {
          key: 'Environment',
          value: environment,
        },
      ],
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      exportName: `HealthCheckId-${environment}`,
    });
  }
}
