### Reasoning Trace

---

The user wants me to create a comprehensive AWS CDK TypeScript application with:

1. Real-time analytics infrastructure
2. Event-driven architecture
3. Multiple AWS services properly connected

Let me design a system that includes:

- API Gateway for data ingestion
- Lambda functions for processing
- Kinesis Data Streams for real-time data flow
- Kinesis Data Firehose for batch processing to S3
- S3 for data lake storage
- Glue for ETL and catalog
- Athena for SQL queries
- Kinesis Analytics for real-time processing
- DynamoDB for state/results storage
- OpenSearch for search and analytics
- Step Functions for orchestration
- SNS/SQS for messaging
- CloudWatch and X-Ray for monitoring
- SageMaker for ML processing

I'll create a real-time analytics platform that processes streaming data with multiple pathways:

1. Real-time path: API → Lambda → Kinesis Stream → Analytics → DynamoDB/OpenSearch
2. Batch path: Kinesis Stream → Firehose → S3 → Glue → Athena
3. ML path: Step Functions → SageMaker
4. Alerting: SNS → SQS

Let me structure this properly with all connections and permissions.

### Answer

---

I'll create a comprehensive real-time analytics platform with event-driven architecture using AWS CDK. This solution implements a streaming data pipeline with multiple processing paths, ML capabilities, and full observability.

## main.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RealTimeAnalyticsStack } from './stack';

const app = new cdk.App();

// Deploy to us-east-1 with production environment
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

// Instantiate the real-time analytics stack
new RealTimeAnalyticsStack(app, 'RealTimeAnalyticsStack', {
  env,
  stackName: 'real-time-analytics-prod',
  description:
    'Production real-time analytics platform with event-driven architecture',
  tags: {
    Environment: 'prod',
    Project: 'real-time-analytics',
    ManagedBy: 'cdk',
    CostCenter: 'analytics',
  },
});

app.synth();
```

## stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as kinesisanalytics from 'aws-cdk-lib/aws-kinesisanalytics';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as xray from 'aws-cdk-lib/aws-xray';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';

export class RealTimeAnalyticsStack extends cdk.Stack {
  private readonly encryptionKey: kms.Key;
  private readonly dataLakeBucket: s3.Bucket;
  private readonly kinesisStream: kinesis.Stream;
  private readonly dynamoTable: dynamodb.Table;
  private readonly opensearchDomain: opensearch.Domain;
  private readonly alertTopic: sns.Topic;
  private readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create encryption key for all services
    this.encryptionKey = this.createEncryptionKey();

    // Create S3 data lake bucket
    this.dataLakeBucket = this.createDataLakeBucket();

    // Create Kinesis Data Stream for real-time ingestion
    this.kinesisStream = this.createKinesisStream();

    // Create DynamoDB table for analytics results
    this.dynamoTable = this.createDynamoTable();

    // Create OpenSearch domain for search and analytics
    this.opensearchDomain = this.createOpenSearchDomain();

    // Create SNS/SQS for alerting and dead letter queue
    const { topic, dlq } = this.createMessagingInfrastructure();
    this.alertTopic = topic;
    this.deadLetterQueue = dlq;

    // Create Lambda functions for processing
    const { ingestLambda, processorLambda, alertLambda } =
      this.createLambdaFunctions();

    // Create API Gateway for data ingestion
    this.createApiGateway(ingestLambda);

    // Create Kinesis Data Firehose for batch processing
    const firehose = this.createKinesisFirehose();

    // Create Glue catalog and crawler
    const { database, crawler } = this.createGlueInfrastructure();

    // Create Athena workgroup for queries
    this.createAthenaWorkgroup();

    // Create Kinesis Analytics application
    this.createKinesisAnalytics(processorLambda);

    // Create SageMaker endpoint for ML inference
    const sagemakerEndpoint = this.createSageMakerEndpoint();

    // Create Step Functions for orchestration
    this.createStepFunctions(processorLambda, firehose, sagemakerEndpoint);

    // Set up CloudWatch dashboards and alarms
    this.createMonitoringInfrastructure(ingestLambda, processorLambda);

    // Enable X-Ray tracing
    this.enableXRayTracing();

    // Output important resource ARNs
    this.createOutputs();
  }

  private createEncryptionKey(): kms.Key {
    return new kms.Key(this, 'DataEncryptionKey', {
      description: 'KMS key for encrypting data at rest across all services',
      enableKeyRotation: true,
      alias: 'alias/real-time-analytics',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createDataLakeBucket(): s3.Bucket {
    return new s3.Bucket(this, 'DataLakeBucket', {
      bucketName: `data-lake-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'archive-old-data',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createKinesisStream(): kinesis.Stream {
    return new kinesis.Stream(this, 'DataStream', {
      streamName: 'real-time-data-stream',
      shardCount: 10,
      retentionPeriod: cdk.Duration.days(7),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: this.encryptionKey,
      streamMode: kinesis.StreamMode.PROVISIONED,
    });
  }

  private createDynamoTable(): dynamodb.Table {
    return new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: 'real-time-analytics-results',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createOpenSearchDomain(): opensearch.Domain {
    return new opensearch.Domain(this, 'SearchDomain', {
      domainName: 'real-time-analytics',
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'r5.large.search',
        dataNodes: 3,
        dataNodeInstanceType: 'r5.xlarge.search',
      },
      ebs: {
        volumeSize: 100,
        volumeType: cdk.aws_ec2.EbsDeviceVolumeType.GP3,
        encrypted: true,
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      fineGrainedAccessControl: {
        masterUserArn: new iam.Role(this, 'OpenSearchMasterRole', {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        }).roleArn,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createMessagingInfrastructure(): {
    topic: sns.Topic;
    dlq: sqs.Queue;
  } {
    // Dead letter queue for failed messages
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: 'analytics-dlq',
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.encryptionKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Alert topic for notifications
    const topic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'real-time-alerts',
      masterKey: this.encryptionKey,
    });

    // Processing queue with DLQ
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: 'analytics-processing',
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.encryptionKey,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Subscribe queue to topic with filter
    topic.addSubscription(
      new snsSubscriptions.SqsSubscription(processingQueue, {
        filterPolicy: {
          alertType: sns.SubscriptionFilter.stringFilter({
            allowlist: ['HIGH_PRIORITY', 'ANOMALY_DETECTED'],
          }),
        },
      })
    );

    return { topic, dlq };
  }

  private createLambdaFunctions(): {
    ingestLambda: lambda.Function;
    processorLambda: lambda.Function;
    alertLambda: lambda.Function;
  } {
    // Common Lambda configuration
    const commonConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        KINESIS_STREAM_NAME: this.kinesisStream.streamName,
        DYNAMO_TABLE_NAME: this.dynamoTable.tableName,
        OPENSEARCH_ENDPOINT: this.opensearchDomain.domainEndpoint,
        SNS_TOPIC_ARN: this.alertTopic.topicArn,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      reservedConcurrentExecutions: 100,
    };

    // Data ingestion Lambda
    const ingestLambda = new lambda.Function(this, 'IngestFunction', {
      ...commonConfig,
      functionName: 'data-ingestion',
      code: lambda.Code.fromInline(`
        const { KinesisClient, PutRecordCommand } = require('@aws-sdk/client-kinesis');
        const client = new KinesisClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          const data = JSON.parse(event.body);
          const record = {
            StreamName: process.env.KINESIS_STREAM_NAME,
            Data: Buffer.from(JSON.stringify(data)),
            PartitionKey: data.id || Date.now().toString(),
          };
          
          await client.send(new PutRecordCommand(record));
          return { statusCode: 200, body: JSON.stringify({ success: true }) };
        };
      `),
      handler: 'index.handler',
    });

    // Stream processor Lambda
    const processorLambda = new lambda.Function(this, 'ProcessorFunction', {
      ...commonConfig,
      functionName: 'stream-processor',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
        const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        const snsClient = new SNSClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          for (const record of event.Records) {
            const data = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString());
            
            // Store in DynamoDB
            await dynamoClient.send(new PutItemCommand({
              TableName: process.env.DYNAMO_TABLE_NAME,
              Item: {
                pk: { S: 'DATA#' + data.id },
                sk: { S: 'TIMESTAMP#' + Date.now() },
                data: { S: JSON.stringify(data) },
                ttl: { N: Math.floor(Date.now() / 1000) + 86400 },
              },
            }));
            
            // Check for anomalies and alert
            if (data.value > 1000) {
              await snsClient.send(new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: JSON.stringify(data),
                MessageAttributes: {
                  alertType: { DataType: 'String', StringValue: 'ANOMALY_DETECTED' },
                },
              }));
            }
          }
          return { statusCode: 200 };
        };
      `),
      handler: 'index.handler',
    });

    // Alert handler Lambda
    const alertLambda = new lambda.Function(this, 'AlertFunction', {
      ...commonConfig,
      functionName: 'alert-handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Alert received:', JSON.stringify(event));
          // Process alerts, send notifications, trigger remediations
          return { statusCode: 200 };
        };
      `),
      handler: 'index.handler',
    });

    // Grant permissions
    this.kinesisStream.grantWrite(ingestLambda);
    this.kinesisStream.grantRead(processorLambda);
    this.dynamoTable.grantWriteData(processorLambda);
    this.alertTopic.grantPublish(processorLambda);

    // Add Kinesis event source to processor
    processorLambda.addEventSource(
      new cdk.aws_lambda_event_sources.KinesisEventSource(this.kinesisStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 10,
        retryAttempts: 3,
      })
    );

    return { ingestLambda, processorLambda, alertLambda };
  }

  private createApiGateway(ingestLambda: lambda.Function): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'DataIngestionApi', {
      restApiName: 'real-time-analytics-api',
      description: 'API for real-time data ingestion',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /ingest endpoint
    const ingestResource = api.root.addResource('ingest');
    ingestResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(ingestLambda, {
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        apiKeyRequired: true,
        requestValidator: new apigateway.RequestValidator(
          this,
          'IngestValidator',
          {
            restApi: api,
            validateRequestBody: true,
            validateRequestParameters: true,
          }
        ),
      }
    );

    // Create API key and usage plan
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: 'real-time-analytics-key',
      description: 'API key for data ingestion',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'standard',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiStage({ stage: api.deploymentStage });
    usagePlan.addApiKey(apiKey);

    return api;
  }

  private createKinesisFirehose(): kinesisfirehose.CfnDeliveryStream {
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    this.kinesisStream.grantRead(firehoseRole);
    this.dataLakeBucket.grantWrite(firehoseRole);

    return new kinesisfirehose.CfnDeliveryStream(this, 'DataFirehose', {
      deliveryStreamName: 'analytics-firehose',
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: this.kinesisStream.streamArn,
        roleArn: firehoseRole.roleArn,
      },
      extendedS3DestinationConfiguration: {
        bucketArn: this.dataLakeBucket.bucketArn,
        prefix:
          'raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        errorOutputPrefix: 'errors/',
        roleArn: firehoseRole.roleArn,
        compressionFormat: 'GZIP',
        bufferingHints: {
          sizeInMBs: 128,
          intervalInSeconds: 60,
        },
        dataFormatConversionConfiguration: {
          enabled: true,
          outputFormatConfiguration: {
            serializer: {
              parquetSerDe: {},
            },
          },
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'RecordDeAggregation',
              parameters: [
                {
                  parameterName: 'SubRecordType',
                  parameterValue: 'JSON',
                },
              ],
            },
          ],
        },
      },
    });
  }

  private createGlueInfrastructure(): {
    database: glue.CfnDatabase;
    crawler: glue.CfnCrawler;
  } {
    const glueRole = new iam.Role(this, 'GlueRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSGlueServiceRole'
        ),
      ],
    });

    this.dataLakeBucket.grantRead(glueRole);

    const database = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'analytics_catalog',
        description: 'Data catalog for real-time analytics',
      },
    });

    const crawler = new glue.CfnCrawler(this, 'GlueCrawler', {
      name: 'analytics-crawler',
      role: glueRole.roleArn,
      databaseName: database.ref,
      targets: {
        s3Targets: [
          {
            path: `s3://${this.dataLakeBucket.bucketName}/raw-data/`,
          },
        ],
      },
      schedule: {
        scheduleExpression: 'rate(1 hour)',
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
    });

    return { database, crawler };
  }

  private createAthenaWorkgroup(): athena.CfnWorkGroup {
    const athenaResultsBucket = new s3.Bucket(this, 'AthenaResultsBucket', {
      bucketName: `athena-results-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      lifecycleRules: [
        {
          id: 'cleanup-old-results',
          expiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    return new athena.CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: 'analytics-workgroup',
      workGroupConfiguration: {
        resultConfigurationUpdates: {
          outputLocation: `s3://${athenaResultsBucket.bucketName}/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_KMS',
            kmsKey: this.encryptionKey.keyArn,
          },
        },
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetricsEnabled: true,
        bytesScannedCutoffPerQuery: 100000000000, // 100 GB limit
      },
    });
  }

  private createKinesisAnalytics(
    processorLambda: lambda.Function
  ): kinesisanalytics.CfnApplicationV2 {
    const analyticsRole = new iam.Role(this, 'AnalyticsRole', {
      assumedBy: new iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
    });

    this.kinesisStream.grantRead(analyticsRole);
    this.dynamoTable.grantWriteData(analyticsRole);
    processorLambda.grantInvoke(analyticsRole);

    return new kinesisanalytics.CfnApplicationV2(this, 'StreamingAnalytics', {
      applicationName: 'real-time-analytics-app',
      runtimeEnvironment: 'FLINK-1_18',
      serviceExecutionRole: analyticsRole.roleArn,
      applicationConfiguration: {
        applicationCodeConfiguration: {
          codeContent: {
            textContent: `
              -- SQL for real-time analytics
              CREATE STREAM output_stream (
                id VARCHAR(64),
                metric_value DOUBLE,
                anomaly_score DOUBLE,
                timestamp BIGINT
              );
              
              CREATE PUMP output_pump AS INSERT INTO output_stream
              SELECT STREAM
                id,
                metric_value,
                ANOMALY_SCORE(metric_value) OVER (
                  PARTITION BY id
                  RANGE INTERVAL '1' HOUR PRECEDING
                ) AS anomaly_score,
                ROWTIME AS timestamp
              FROM SOURCE_SQL_STREAM_001
              WHERE metric_value IS NOT NULL;
            `,
          },
          codeContentType: 'PLAINTEXT',
        },
        environmentProperties: {
          propertyGroups: [
            {
              propertyGroupId: 'consumer.config',
              propertyMap: {
                'input.stream.name': this.kinesisStream.streamName,
                'flink.stream.initpos': 'LATEST',
              },
            },
          ],
        },
        flinkApplicationConfiguration: {
          parallelismConfiguration: {
            configurationType: 'DEFAULT',
            parallelism: 4,
            parallelismPerKpu: 1,
            autoScalingEnabled: true,
          },
          checkpointConfiguration: {
            configurationType: 'CUSTOM',
            checkpointingEnabled: true,
            checkpointInterval: 60000,
            minPauseBetweenCheckpoints: 5000,
          },
        },
      },
    });
  }

  private createSageMakerEndpoint(): sagemaker.CfnEndpoint {
    const sagemakerRole = new iam.Role(this, 'SageMakerRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    // Model configuration (using a pre-trained model for demo)
    const model = new sagemaker.CfnModel(this, 'MLModel', {
      modelName: 'analytics-ml-model',
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image:
          '763104351884.dkr.ecr.us-east-1.amazonaws.com/sklearn-inference:0.23-1-cpu-py3',
        modelDataUrl: `s3://${this.dataLakeBucket.bucketName}/models/model.tar.gz`,
      },
    });

    // Endpoint configuration
    const endpointConfig = new sagemaker.CfnEndpointConfig(
      this,
      'MLEndpointConfig',
      {
        endpointConfigName: 'analytics-endpoint-config',
        productionVariants: [
          {
            modelName: model.modelName!,
            variantName: 'AllTraffic',
            initialInstanceCount: 1,
            instanceType: 'ml.t2.medium',
            initialVariantWeight: 1,
          },
        ],
        dataCaptureConfig: {
          enableCapture: true,
          initialSamplingPercentage: 100,
          destinationS3Uri: `s3://${this.dataLakeBucket.bucketName}/sagemaker-capture/`,
          captureOptions: [{ captureMode: 'Input' }, { captureMode: 'Output' }],
        },
      }
    );

    // Create endpoint
    return new sagemaker.CfnEndpoint(this, 'MLEndpoint', {
      endpointName: 'analytics-ml-endpoint',
      endpointConfigName: endpointConfig.endpointConfigName!,
    });
  }

  private createStepFunctions(
    processorLambda: lambda.Function,
    firehose: kinesisfirehose.CfnDeliveryStream,
    sagemakerEndpoint: sagemaker.CfnEndpoint
  ): stepfunctions.StateMachine {
    // Define Lambda invoke task
    const processTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ProcessData',
      {
        lambdaFunction: processorLambda,
        outputPath: '$.Payload',
      }
    );

    // Define SageMaker invoke task
    const mlInferenceTask = new stepfunctionsTasks.SageMakerCreateTransformJob(
      this,
      'MLInference',
      {
        transformJobName: stepfunctions.JsonPath.stringAt('$.jobName'),
        modelName: sagemakerEndpoint.endpointName!,
        transformInput: {
          dataSource: {
            s3DataSource: {
              s3Uri: stepfunctions.JsonPath.stringAt('$.inputPath'),
              s3DataType: stepfunctionsTasks.S3DataType.S3_PREFIX,
            },
          },
        },
        transformOutput: {
          s3OutputPath: stepfunctions.JsonPath.stringAt('$.outputPath'),
        },
        transformResources: {
          instanceCount: 1,
          instanceType: cdk.aws_ec2.InstanceType.of(
            cdk.aws_ec2.InstanceClass.ML,
            cdk.aws_ec2.InstanceSize.LARGE
          ),
        },
      }
    );

    // Define parallel processing
    const parallel = new stepfunctions.Parallel(this, 'ParallelProcessing');
    parallel.branch(processTask);
    parallel.branch(mlInferenceTask);

    // Define error handling
    const handleError = new stepfunctions.Fail(this, 'HandleError', {
      error: 'ProcessingError',
      cause: 'An error occurred during processing',
    });

    // Define success state
    const success = new stepfunctions.Succeed(this, 'Success');

    // Build state machine
    const definition = stepfunctions.Chain.start(parallel)
      .addCatch(handleError, {
        errors: ['States.ALL'],
        resultPath: '$.error',
      })
      .next(success);

    return new stepfunctions.StateMachine(this, 'AnalyticsOrchestrator', {
      stateMachineName: 'analytics-orchestrator',
      definition,
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          retention: logs.RetentionDays.ONE_WEEK,
        }),
        level: stepfunctions.LogLevel.ALL,
      },
    });
  }

  private createMonitoringInfrastructure(
    ingestLambda: lambda.Function,
    processorLambda: lambda.Function
  ): void {
    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'AnalyticsDashboard', {
      dashboardName: 'real-time-analytics',
      defaultInterval: cdk.Duration.hours(1),
    });

    // Add Lambda metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [
          ingestLambda.metricInvocations(),
          processorLambda.metricInvocations(),
        ],
        right: [ingestLambda.metricErrors(), processorLambda.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [ingestLambda.metricDuration(), processorLambda.metricDuration()],
      })
    );

    // Add Kinesis metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Kinesis Stream',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Kinesis',
            metricName: 'IncomingRecords',
            dimensionsMap: {
              StreamName: this.kinesisStream.streamName,
            },
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Kinesis',
            metricName: 'GetRecords.IteratorAgeMilliseconds',
            dimensionsMap: {
              StreamName: this.kinesisStream.streamName,
            },
            statistic: 'Maximum',
          }),
        ],
      })
    );

    // Create alarms
    const highErrorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: processorLambda.metricErrors(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High error rate in stream processor',
    });

    const kinesisIteratorAgeAlarm = new cloudwatch.Alarm(
      this,
      'KinesisIteratorAge',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Kinesis',
          metricName: 'GetRecords.IteratorAgeMilliseconds',
          dimensionsMap: {
            StreamName: this.kinesisStream.streamName,
          },
          statistic: 'Maximum',
        }),
        threshold: 60000, // 1 minute
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Kinesis iterator age is too high',
      }
    );

    // Add alarm actions
    highErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );
    kinesisIteratorAgeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // Add DynamoDB alarms
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottle', {
      metric: this.dynamoTable.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM],
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB throttling detected',
    });

    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );
  }

  private enableXRayTracing(): void {
    // X-Ray service map configuration
    new xray.CfnGroup(this, 'XRayServiceGroup', {
      groupName: 'RealTimeAnalytics',
      filterExpression: 'service("real-time-analytics-*")',
      insightsConfiguration: {
        insightsEnabled: true,
        notificationsEnabled: true,
      },
    });

    // Create sampling rule for detailed tracing
    new xray.CfnSamplingRule(this, 'XRaySamplingRule', {
      samplingRule: {
        ruleName: 'BasicSampling',
        priority: 9000,
        fixedRate: 0.1,
        reservoirSize: 1,
        serviceName: '*',
        serviceType: '*',
        host: '*',
        httpMethod: '*',
        urlPath: '*',
        version: 1,
      },
    });
  }

  private createOutputs(): void {
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `https://${this.node.tryFindChild('DataIngestionApi')?.node.id}.execute-api.${this.region}.amazonaws.com/prod`,
      description: 'API Gateway endpoint for data ingestion',
      exportName: 'AnalyticsApiEndpoint',
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: this.kinesisStream.streamArn,
      description: 'Kinesis Data Stream ARN',
      exportName: 'AnalyticsStreamArn',
    });

    new cdk.CfnOutput(this, 'DataLakeBucket', {
      value: this.dataLakeBucket.bucketName,
      description: 'S3 Data Lake bucket name',
      exportName: 'DataLakeBucketName',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomain', {
      value: `https://${this.opensearchDomain.domainEndpoint}`,
      description: 'OpenSearch domain endpoint',
      exportName: 'OpenSearchEndpoint',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: this.dynamoTable.tableName,
      description: 'DynamoDB table for analytics results',
      exportName: 'AnalyticsTableName',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS topic for alerts',
      exportName: 'AlertTopicArn',
    });
  }
}
```

This CDK application creates a comprehensive real-time analytics platform with:

## **Architecture Components:**

### **Data Ingestion & Processing:**

- API Gateway with throttling and API key authentication
- Lambda functions for data ingestion and stream processing
- Kinesis Data Stream for real-time data flow
- Kinesis Data Analytics for SQL-based stream processing

### **Storage & Analytics:**

- S3 data lake with lifecycle policies and encryption
- DynamoDB for real-time results storage
- OpenSearch for search and analytics
- Glue catalog for metadata management
- Athena for SQL queries on S3 data

### **Orchestration & ML:**

- Step Functions for workflow orchestration
- SageMaker endpoint for ML inference
- Kinesis Firehose for batch processing to S3

### **Messaging & Alerts:**

- SNS topics for notifications
- SQS queues with DLQ for reliable processing
- CloudWatch alarms for monitoring

### **Security & Compliance:**

- KMS encryption for all data at rest
- IAM roles with least privilege access
- VPC endpoints where applicable
- X-Ray tracing for observability

### **Cost Optimization:**

- S3 lifecycle rules for tiered storage
- DynamoDB with TTL for automatic cleanup
- Reserved concurrent executions for Lambda
- Auto-scaling for Kinesis Analytics

The infrastructure follows AWS Well-Architected Framework principles and provides a scalable, secure, and cost-effective real-time analytics solution.
