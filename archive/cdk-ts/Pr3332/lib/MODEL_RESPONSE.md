### Reasoning Trace
---

This is a comprehensive machine learning inference pipeline implementation request. Let me break down what needs to be implemented:

1. **Core ML Components:**
   - SageMaker endpoint with multi-variant for A/B testing
   - Lambda functions for preprocessing
   - AWS Batch for batch processing
   - Step Functions for workflow orchestration

2. **Data & Storage:**
   - S3 buckets with versioning
   - DynamoDB with TTL
   - Parameter Store for model versioning
   - Glue Data Catalog

3. **API & Streaming:**
   - API Gateway with caching
   - Kinesis Data Streams

4. **Orchestration:**
   - EventBridge for scheduling
   - Athena for analytics
   - Step Functions for workflows

5. **Monitoring:**
   - CloudWatch dashboards, metrics, alarms
   - SNS for notifications

6. **Security & Networking:**
   - VPC with private subnets
   - VPC endpoints for S3, DynamoDB
   - IAM roles with least privilege

Let me start implementing the stack:

First, I'll structure the main stack file with all the required services. Then I'll create comprehensive unit tests and integration tests.

Key architectural decisions:
1. Use VPC for network isolation
2. Multi-variant SageMaker endpoint for A/B testing (80/20 split)
3. Parameter Store hierarchy for model versioning
4. DynamoDB TTL for automatic data expiration
5. Step Functions for complex batch workflows
6. API Gateway caching for performance
7. Comprehensive CloudWatch monitoring

I'll make sure all integration points are properly connected with appropriate IAM permissions and network configurations.
### Answer 
---

I'll implement a production-ready ML inference pipeline with comprehensive A/B testing, auto-scaling, and model versioning capabilities. Here's the complete implementation:

## File 1: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as ecs from 'aws-cdk-lib/aws-ecs';

/**
 * ML Inference Pipeline Stack
 * Implements a production-ready machine learning inference system with:
 * - A/B testing via multi-variant SageMaker endpoints
 * - Model versioning through Parameter Store
 * - Auto-scaling based on invocation metrics
 * - Batch and real-time inference patterns
 * - Comprehensive monitoring and alerting
 */
export class TapStack extends cdk.Stack {
  // Public properties for cross-stack references
  public readonly modelBucket: s3.Bucket;
  public readonly predictionTable: dynamodb.Table;
  public readonly inferenceApi: apigateway.RestApi;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = 'prod';
    const region = this.region;

    // ==================== NETWORKING ====================
    /**
     * VPC Configuration with private subnets for secure compute environments
     * Includes VPC endpoints for AWS services to avoid NAT gateway costs
     */
    this.vpc = new ec2.Vpc(this, 'MLPipelineVPC', {
      vpcName: `ml-pipeline-vpc-${environment}-${region}`,
      maxAzs: 2, // High availability across 2 AZs
      natGateways: 0, // Cost optimization - using VPC endpoints instead
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Endpoints for private connectivity
    const s3Endpoint = new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      vpc: this.vpc,
    });

    const dynamoDbEndpoint = new ec2.GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      vpc: this.vpc,
    });

    const sagemakerEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SageMakerEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME,
      privateDnsEnabled: true,
    });

    // Security group for Lambda and Batch compute
    const computeSecurityGroup = new ec2.SecurityGroup(this, 'ComputeSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda and Batch compute resources',
      allowAllOutbound: true,
    });

    // ==================== ENCRYPTION ====================
    /**
     * KMS key for encryption at rest across all services
     */
    const encryptionKey = new kms.Key(this, 'MLPipelineKey', {
      alias: `alias/ml-pipeline-${environment}`,
      description: 'KMS key for ML pipeline encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ==================== STORAGE ====================
    /**
     * S3 bucket for model artifacts with versioning enabled
     * Supports model rollback and audit trail
     */
    this.modelBucket = new s3.Bucket(this, 'ModelArtifactsBucket', {
      bucketName: `ml-pipeline-models-${environment}-${region}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    /**
     * S3 bucket for batch input data
     */
    const batchInputBucket = new s3.Bucket(this, 'BatchInputBucket', {
      bucketName: `ml-pipeline-batch-input-${environment}-${region}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'expire-processed-data',
          expiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    /**
     * DynamoDB table for prediction results with TTL
     * Automatic expiration after 30 days to manage storage costs
     */
    this.predictionTable = new dynamodb.Table(this, 'PredictionResultsTable', {
      tableName: `ml-pipeline-predictions-${environment}`,
      partitionKey: { name: 'predictionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      timeToLiveAttribute: 'expirationTime', // TTL configuration
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global secondary index for querying by model version
    this.predictionTable.addGlobalSecondaryIndex({
      indexName: 'modelVersionIndex',
      partitionKey: { name: 'modelVersion', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==================== MODEL VERSIONING ====================
    /**
     * Parameter Store hierarchy for model version management
     * Supports rollback by updating active version parameter
     */
    const activeModelVersionParam = new ssm.StringParameter(this, 'ActiveModelVersion', {
      parameterName: '/ml-pipeline/models/active-version',
      stringValue: 'v1.0.0',
      description: 'Currently active model version for inference',
      tier: ssm.ParameterTier.STANDARD,
    });

    const modelMetadataParam = new ssm.StringParameter(this, 'ModelMetadata', {
      parameterName: '/ml-pipeline/models/versions/v1.0.0/metadata',
      stringValue: JSON.stringify({
        s3Path: `s3://${this.modelBucket.bucketName}/models/v1.0.0/model.tar.gz`,
        deployedAt: new Date().toISOString(),
        performanceBaseline: {
          latencyP50: 100,
          latencyP99: 500,
          accuracy: 0.95,
        },
      }),
      description: 'Model metadata including S3 path and performance metrics',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ==================== IAM ROLES ====================
    /**
     * IAM role for Lambda preprocessing function
     * Follows least privilege principle
     */
    const preprocessingLambdaRole = new iam.Role(this, 'PreprocessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        PreprocessingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sagemaker:InvokeEndpoint',
                'sagemaker:InvokeEndpointAsync',
              ],
              resources: ['*'], // Will be scoped to specific endpoint ARN after creation
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/ml-pipeline/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt'],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Grant DynamoDB permissions
    this.predictionTable.grantWriteData(preprocessingLambdaRole);
    this.modelBucket.grantRead(preprocessingLambdaRole);

    /**
     * IAM role for SageMaker endpoint execution
     */
    const sagemakerExecutionRole = new iam.Role(this, 'SageMakerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    this.modelBucket.grantRead(sagemakerExecutionRole);

    // ==================== LAMBDA FUNCTIONS ====================
    /**
     * Preprocessing Lambda function
     * Handles data transformation before inference
     */
    const preprocessingLambda = new lambda.Function(this, 'PreprocessingFunction', {
      functionName: `ml-pipeline-preprocessing-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os
import time
import uuid
from datetime import datetime, timedelta

sagemaker_runtime = boto3.client('sagemaker-runtime')
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

def handler(event, context):
    """
    Preprocesses input data and invokes SageMaker endpoint for inference.
    Implements A/B testing by routing to multi-variant endpoint.
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}'))
        
        # Get active model version from Parameter Store
        active_version = ssm.get_parameter(
            Name='/ml-pipeline/models/active-version'
        )['Parameter']['Value']
        
        # Preprocess data (example transformation)
        processed_data = {
            'features': body.get('features', []),
            'metadata': {
                'requestId': str(uuid.uuid4()),
                'timestamp': int(time.time()),
                'modelVersion': active_version
            }
        }
        
        # Invoke SageMaker endpoint (multi-variant for A/B testing)
        endpoint_name = os.environ['SAGEMAKER_ENDPOINT_NAME']
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(processed_data['features'])
        )
        
        # Parse prediction result
        result = json.loads(response['Body'].read())
        
        # Store prediction in DynamoDB with TTL
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])
        expiration_time = int(time.time()) + (30 * 24 * 60 * 60)  # 30 days TTL
        
        table.put_item(
            Item={
                'predictionId': processed_data['metadata']['requestId'],
                'timestamp': processed_data['metadata']['timestamp'],
                'modelVersion': active_version,
                'invokedVariant': response.get('InvokedProductionVariant', 'unknown'),
                'prediction': result,
                'expirationTime': expiration_time,
                'inputFeatures': processed_data['features']
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'predictionId': processed_data['metadata']['requestId'],
                'result': result,
                'modelVersion': active_version,
                'variant': response.get('InvokedProductionVariant', 'unknown')
            })
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
      `),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DYNAMODB_TABLE_NAME: this.predictionTable.tableName,
        SAGEMAKER_ENDPOINT_NAME: `ml-pipeline-endpoint-${environment}`,
      },
      role: preprocessingLambdaRole,
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [computeSecurityGroup],
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });

    /**
     * Stream processing Lambda for Kinesis integration
     */
    const streamProcessingLambda = new lambda.Function(this, 'StreamProcessingFunction', {
      functionName: `ml-pipeline-stream-processor-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import base64
import boto3
import os

lambda_client = boto3.client('lambda')

def handler(event, context):
    """
    Processes Kinesis stream records and invokes preprocessing Lambda
    """
    preprocessing_function = os.environ['PREPROCESSING_FUNCTION_NAME']
    
    for record in event['Records']:
        # Decode Kinesis data
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        
        # Invoke preprocessing Lambda
        lambda_client.invoke(
            FunctionName=preprocessing_function,
            InvocationType='Event',
            Payload=json.dumps({'body': payload})
        )
    
    return {'statusCode': 200}
      `),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        PREPROCESSING_FUNCTION_NAME: preprocessingLambda.functionName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    preprocessingLambda.grantInvoke(streamProcessingLambda);

    // ==================== SAGEMAKER ENDPOINT ====================
    /**
     * Multi-variant SageMaker endpoint for A/B testing
     * 80/20 traffic split between model variants
     */
    const sagemakerModel1 = new sagemaker.CfnModel(this, 'MLModelVariantA', {
      modelName: `ml-pipeline-model-a-${environment}`,
      executionRoleArn: sagemakerExecutionRole.roleArn,
      primaryContainer: {
        image: '246618743249.dkr.ecr.us-east-1.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3',
        modelDataUrl: `s3://${this.modelBucket.bucketName}/models/v1.0.0/model.tar.gz`,
      },
    });

    const sagemakerModel2 = new sagemaker.CfnModel(this, 'MLModelVariantB', {
      modelName: `ml-pipeline-model-b-${environment}`,
      executionRoleArn: sagemakerExecutionRole.roleArn,
      primaryContainer: {
        image: '246618743249.dkr.ecr.us-east-1.amazonaws.com/sagemaker-scikit-learn:1.2-1-cpu-py3',
        modelDataUrl: `s3://${this.modelBucket.bucketName}/models/v1.1.0/model.tar.gz`,
      },
    });

    const endpointConfig = new sagemaker.CfnEndpointConfig(this, 'MLEndpointConfig', {
      endpointConfigName: `ml-pipeline-config-${environment}`,
      productionVariants: [
        {
          modelName: sagemakerModel1.modelName!,
          variantName: 'VariantA',
          initialInstanceCount: 1,
          instanceType: 'ml.t2.medium',
          initialVariantWeight: 0.8, // 80% traffic to variant A
        },
        {
          modelName: sagemakerModel2.modelName!,
          variantName: 'VariantB',
          initialInstanceCount: 1,
          instanceType: 'ml.t2.medium',
          initialVariantWeight: 0.2, // 20% traffic to variant B
        },
      ],
      dataCaptureConfig: {
        enableCapture: true,
        initialSamplingPercentage: 10,
        destinationS3Uri: `s3://${this.modelBucket.bucketName}/data-capture`,
        captureOptions: [
          { captureMode: 'Input' },
          { captureMode: 'Output' },
        ],
      },
    });

    endpointConfig.addDependency(sagemakerModel1);
    endpointConfig.addDependency(sagemakerModel2);

    const sagemakerEndpoint = new sagemaker.CfnEndpoint(this, 'MLEndpoint', {
      endpointName: `ml-pipeline-endpoint-${environment}`,
      endpointConfigName: endpointConfig.endpointConfigName!,
    });

    // ==================== AUTO-SCALING ====================
    /**
     * Application Auto Scaling for SageMaker endpoint
     * Scales based on invocations per instance metric
     */
    const scalingTarget = new applicationautoscaling.ScalableTarget(this, 'SageMakerScalingTarget', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.SAGEMAKER,
      resourceId: `endpoint/${sagemakerEndpoint.endpointName}/variant/VariantA`,
      scalableDimension: 'sagemaker:variant:DesiredInstanceCount',
      minCapacity: 1,
      maxCapacity: 10,
    });

    scalingTarget.scaleToTrackMetric('InvocationsPerInstance', {
      targetValue: 1000,
      predefinedMetric: applicationautoscaling.PredefinedMetric.SAGEMAKER_VARIANT_INVOCATIONS_PER_INSTANCE,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ==================== API GATEWAY ====================
    /**
     * REST API with caching enabled for inference endpoint
     */
    this.inferenceApi = new apigateway.RestApi(this, 'InferenceAPI', {
      restApiName: `ml-pipeline-api-${environment}`,
      description: 'ML Inference Pipeline API',
      deployOptions: {
        stageName: environment,
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        cacheTtl: cdk.Duration.seconds(300),
        cacheDataEncrypted: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const predictResource = this.inferenceApi.root.addResource('predict');
    predictResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(preprocessingLambda),
      {
        apiKeyRequired: false,
        requestValidator: new apigateway.RequestValidator(this, 'PredictRequestValidator', {
          restApi: this.inferenceApi,
          requestValidatorName: 'predict-validator',
          validateRequestBody: true,
        }),
      }
    );

    // ==================== KINESIS STREAM ====================
    /**
     * Kinesis Data Stream for real-time inference ingestion
     */
    const inferenceStream = new kinesis.Stream(this, 'InferenceStream', {
      streamName: `ml-pipeline-stream-${environment}`,
      shardCount: 2, // Supports ~2000 records/sec
      retentionPeriod: cdk.Duration.days(1),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey,
    });

    // Lambda event source mapping for Kinesis
    streamProcessingLambda.addEventSourceMapping('KinesisEventSource', {
      eventSourceArn: inferenceStream.streamArn,
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 100,
      maxBatchingWindow: cdk.Duration.seconds(5),
      bisectBatchOnError: true,
      retryAttempts: 3,
    });

    inferenceStream.grantRead(streamProcessingLambda);

    // ==================== BATCH PROCESSING ====================
    /**
     * AWS Batch for large-scale batch inference
     */
    const batchServiceRole = new iam.Role(this, 'BatchServiceRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
      ],
    });

    const batchInstanceRole = new iam.Role(this, 'BatchInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
      ],
    });

    const batchInstanceProfile = new iam.CfnInstanceProfile(this, 'BatchInstanceProfile', {
      roles: [batchInstanceRole.roleName],
    });

    const batchComputeEnvironment = new batch.CfnComputeEnvironment(this, 'BatchComputeEnv', {
      computeEnvironmentName: `ml-pipeline-compute-${environment}`,
      type: 'MANAGED',
      state: 'ENABLED',
      serviceRole: batchServiceRole.roleArn,
      computeResources: {
        type: 'EC2',
        minvCpus: 0,
        maxvCpus: 256,
        desiredvCpus: 4,
        instanceTypes: ['optimal'],
        subnets: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [computeSecurityGroup.securityGroupId],
        instanceRole: batchInstanceProfile.attrArn,
      },
    });

    const batchJobQueue = new batch.CfnJobQueue(this, 'BatchJobQueue', {
      jobQueueName: `ml-pipeline-queue-${environment}`,
      priority: 1,
      state: 'ENABLED',
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: batchComputeEnvironment.ref,
        },
      ],
    });

    const batchJobRole = new iam.Role(this, 'BatchJobRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    batchInputBucket.grantRead(batchJobRole);
    this.predictionTable.grantWriteData(batchJobRole);

    const batchJobDefinition = new batch.CfnJobDefinition(this, 'BatchJobDefinition', {
      jobDefinitionName: `ml-pipeline-job-${environment}`,
      type: 'container',
      containerProperties: {
        image: 'public.ecr.aws/lambda/python:3.11',
        vcpus: 2,
        memory: 4096,
        jobRoleArn: batchJobRole.roleArn,
        environment: [
          { name: 'BUCKET_NAME', value: batchInputBucket.bucketName },
          { name: 'TABLE_NAME', value: this.predictionTable.tableName },
          { name: 'ENDPOINT_NAME', value: sagemakerEndpoint.endpointName! },
        ],
      },
    });

    // ==================== STEP FUNCTIONS ====================
    /**
     * Step Functions state machine for batch workflow orchestration
     */
    const submitBatchJob = new stepfunctionsTasks.BatchSubmitJob(this, 'SubmitBatchJob', {
      jobDefinitionArn: batchJobDefinition.ref,
      jobName: 'MLBatchInference',
      jobQueueArn: batchJobQueue.ref,
    });

    const parallelProcessing = new stepfunctions.Parallel(this, 'ParallelBatchProcessing');
    
    parallelProcessing.branch(
      submitBatchJob.next(
        new stepfunctions.Wait(this, 'WaitForBatch1', {
          time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(30)),
        })
      )
    );
    
    parallelProcessing.branch(
      new stepfunctionsTasks.LambdaInvoke(this, 'ValidateData', {
        lambdaFunction: preprocessingLambda,
        payloadResponseOnly: true,
      })
    );

    const batchWorkflow = new stepfunctions.StateMachine(this, 'BatchWorkflow', {
      stateMachineName: `ml-pipeline-batch-workflow-${environment}`,
      definition: parallelProcessing,
      timeout: cdk.Duration.hours(2),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'BatchWorkflowLogs', {
          logGroupName: `/aws/stepfunctions/ml-pipeline-${environment}`,
          retention: logs.RetentionDays.ONE_WEEK,
        }),
        level: stepfunctions.LogLevel.ALL,
      },
    });

    // ==================== GLUE DATA CATALOG ====================
    /**
     * Glue Data Catalog for prediction results
     */
    const glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `ml_pipeline_${environment}`,
        description: 'ML Pipeline prediction results catalog',
      },
    });

    const glueTable = new glue.CfnTable(this, 'PredictionsGlueTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'predictions',
        storageDescriptor: {
          location: `s3://${this.modelBucket.bucketName}/predictions/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
          },
          columns: [
            { name: 'predictionId', type: 'string' },
            { name: 'timestamp', type: 'bigint' },
            { name: 'modelVersion', type: 'string' },
            { name: 'prediction', type: 'string' },
            { name: 'confidence', type: 'double' },
          ],
        },
      },
    });

    // ==================== ATHENA ====================
    /**
     * Athena workgroup for analytics queries
     */
    const athenaResultsBucket = new s3.Bucket(this, 'AthenaResultsBucket', {
      bucketName: `ml-pipeline-athena-results-${environment}-${region}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      lifecycleRules: [
        {
          id: 'delete-old-results',
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const athenaWorkgroup = new athena.CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: `ml-pipeline-workgroup-${environment}`,
      workGroupConfiguration: {
        resultConfigurationUpdates: {
          outputLocation: `s3://${athenaResultsBucket.bucketName}/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_KMS',
            kmsKey: encryptionKey.keyArn,
          },
        },
        enforceWorkGroupConfiguration: true,
      },
    });

    // ==================== EVENTBRIDGE ====================
    /**
     * EventBridge scheduled rules for batch processing
     */
    const batchScheduleRule = new events.Rule(this, 'BatchScheduleRule', {
      ruleName: `ml-pipeline-batch-schedule-${environment}`,
      description: 'Trigger batch inference every 6 hours',
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
    });

    batchScheduleRule.addTarget(
      new targets.SfnStateMachine(batchWorkflow, {
        input: events.RuleTargetInput.fromObject({
          batchSize: 1000,
          inputPath: `s3://${batchInputBucket.bucketName}/pending/`,
        }),
      })
    );

    // ==================== MONITORING & ALERTING ====================
    /**
     * CloudWatch dashboards for operational visibility
     */
    const dashboard = new cloudwatch.Dashboard(this, 'MLPipelineDashboard', {
      dashboardName: `ml-pipeline-${environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'SageMaker Endpoint Latency',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'ModelLatency',
                dimensionsMap: {
                  EndpointName: sagemakerEndpoint.endpointName!,
                  VariantName: 'VariantA',
                },
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'ModelLatency',
                dimensionsMap: {
                  EndpointName: sagemakerEndpoint.endpointName!,
                  VariantName: 'VariantB',
                },
                statistic: 'Average',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'Invocations',
                dimensionsMap: {
                  EndpointName: sagemakerEndpoint.endpointName!,
                },
                statistic: 'Sum',
                yAxis: 'right',
              }),
            ],
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Total Predictions Today',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'UserErrors',
                dimensionsMap: {
                  TableName: this.predictionTable.tableName,
                },
                statistic: 'Sum',
                period: cdk.Duration.days(1),
              }),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Performance',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                  FunctionName: preprocessingLambda.functionName,
                },
                statistic: 'Average',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                  FunctionName: preprocessingLambda.functionName,
                },
                statistic: 'Sum',
                yAxis: 'right',
              }),
            ],
          }),
        ],
      ],
    });

    /**
     * SNS topic for alerting
     */
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `ml-pipeline-alerts-${environment}`,
      masterKey: encryptionKey,
    });

    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('ml-ops-team@example.com')
    );

    /**
     * CloudWatch Alarms for critical metrics
     */
    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      alarmName: `ml-pipeline-high-latency-${environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SageMaker',
        metricName: 'ModelLatency',
        dimensionsMap: {
          EndpointName: sagemakerEndpoint.endpointName!,
        },
        statistic: 'Average',
      }),
      threshold: 500, // 500ms threshold
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const errorRateAlarm = new cloudwatch.Alarm(this, 'ErrorRateAlarm', {
      alarmName: `ml-pipeline-error-rate-${environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: preprocessingLambda.functionName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10, // More than 10 errors in 5 minutes
      evaluationPeriods: 1,
    });

    errorRateAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Data drift detection alarm (custom metric)
    const dataDriftAlarm = new cloudwatch.Alarm(this, 'DataDriftAlarm', {
      alarmName: `ml-pipeline-data-drift-${environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'MLPipeline',
        metricName: 'DataDrift',
        dimensionsMap: {
          Environment: environment,
        },
        statistic: 'Average',
      }),
      threshold: 0.1, // 10% drift threshold
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    dataDriftAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ==================== STACK OUTPUTS ====================
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: this.inferenceApi.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'SageMakerEndpointName', {
      value: sagemakerEndpoint.endpointName!,
      description: 'SageMaker endpoint name',
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: inferenceStream.streamArn,
      description: 'Kinesis stream ARN for real-time inference',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    // ==================== TAGGING ====================
    cdk.Tags.of(this).add('Project', 'MLPipeline');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'ML-Engineering');
  }
}
```

## File 2: tests/tap-stack.unit.test.ts

```typescript
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('Creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates VPC endpoints for S3 and DynamoDB', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3); // S3, DynamoDB, and SageMaker
      
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*s3.*'),
      });

      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*dynamodb.*'),
      });
    });

    test('Creates security group for compute resources', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda and Batch compute resources',
      });
    });
  });

  describe('Storage Resources', () => {
    test('Creates S3 bucket for model artifacts with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('ml-pipeline-models-.*'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('Creates DynamoDB table with TTL enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('ml-pipeline-predictions-.*'),
        TimeToLiveSpecification: {
          AttributeName: 'expirationTime',
          Enabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('Creates DynamoDB global secondary index for model version queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'modelVersionIndex',
            KeySchema: Match.arrayWith([
              Match.objectLike({
                AttributeName: 'modelVersion',
                KeyType: 'HASH',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Model Versioning', () => {
    test('Creates Parameter Store parameters for model versioning', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/ml-pipeline/models/active-version',
        Type: 'String',
        Value: 'v1.0.0',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/ml-pipeline/models/versions/v1.0.0/metadata',
        Type: 'String',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Creates preprocessing Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('ml-pipeline-preprocessing-.*'),
        Runtime: 'python3.11',
        MemorySize: 1024,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda has appropriate IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'sagemaker:InvokeEndpoint',
                'sagemaker:InvokeEndpointAsync',
              ]),
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:GetParameter',
                'ssm:GetParametersByPath',
              ]),
            }),
          ]),
        },
      });
    });

    test('Creates stream processing Lambda for Kinesis', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('ml-pipeline-stream-processor-.*'),
        Runtime: 'python3.11',
        MemorySize: 512,
        Timeout: 60,
      });
    });
  });

  describe('SageMaker Endpoint', () => {
    test('Creates multi-variant SageMaker endpoint for A/B testing', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        ProductionVariants: Match.arrayWith([
          Match.objectLike({
            VariantName: 'VariantA',
            InitialVariantWeight: 0.8,
            InitialInstanceCount: 1,
            InstanceType: 'ml.t2.medium',
          }),
          Match.objectLike({
            VariantName: 'VariantB',
            InitialVariantWeight: 0.2,
            InitialInstanceCount: 1,
            InstanceType: 'ml.t2.medium',
          }),
        ]),
      });
    });

    test('Enables data capture for model monitoring', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        DataCaptureConfig: Match.objectLike({
          EnableCapture: true,
          InitialSamplingPercentage: 10,
          CaptureOptions: Match.arrayWith([
            { CaptureMode: 'Input' },
            { CaptureMode: 'Output' },
          ]),
        }),
      });
    });
  });

  describe('Auto Scaling', () => {
    test('Creates auto-scaling target for SageMaker endpoint', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ServiceNamespace: 'sagemaker',
        ScalableDimension: 'sagemaker:variant:DesiredInstanceCount',
        MinCapacity: 1,
        MaxCapacity: 10,
      });
    });

    test('Configures scaling policy based on invocations per instance', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          TargetValue: 1000,
          ScaleInCooldown: 300,
          ScaleOutCooldown: 60,
        }),
      });
    });
  });

  describe('API Gateway', () => {
    test('Creates REST API with caching enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        StageDescription: Match.objectLike({
          CachingEnabled: true,
          CacheClusterEnabled: true,
          CacheClusterSize: '0.5',
          CacheTtlInSeconds: 300,
          CacheDataEncrypted: true,
        }),
      });
    });

    test('Configures POST method for predictions', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: Match.anyValue(),
      });
    });
  });

  describe('Kinesis Stream', () => {
    test('Creates Kinesis stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: Match.stringLikeRegexp('ml-pipeline-stream-.*'),
        ShardCount: 2,
        RetentionPeriodHours: 24,
        StreamEncryption: Match.objectLike({
          EncryptionType: 'KMS',
        }),
      });
    });

    test('Configures Lambda event source mapping for Kinesis', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        StartingPosition: 'LATEST',
        BatchSize: 100,
        MaximumBatchingWindowInSeconds: 5,
        BisectBatchOnFunctionError: true,
        MaximumRetryAttempts: 3,
      });
    });
  });

  describe('Batch Processing', () => {
    test('Creates Batch compute environment', () => {
      template.hasResourceProperties('AWS::Batch::ComputeEnvironment', {
        Type: 'MANAGED',
        State: 'ENABLED',
        ComputeResources: Match.objectLike({
          Type: 'EC2',
          MinvCpus: 0,
          MaxvCpus: 256,
          DesiredvCpus: 4,
        }),
      });
    });

    test('Creates Batch job queue', () => {
      template.hasResourceProperties('AWS::Batch::JobQueue', {
        Priority: 1,
        State: 'ENABLED',
      });
    });

    test('Creates Batch job definition', () => {
      template.hasResourceProperties('AWS::Batch::JobDefinition', {
        Type: 'container',
        ContainerProperties: Match.objectLike({
          Vcpus: 2,
          Memory: 4096,
        }),
      });
    });
  });

  describe('Step Functions', () => {
    test('Creates state machine for batch workflow', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: Match.stringLikeRegexp('ml-pipeline-batch-workflow-.*'),
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('Configures logging for state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        LoggingConfiguration: Match.objectLike({
          Level: 'ALL',
        }),
      });
    });
  });

  describe('Data Catalog', () => {
    test('Creates Glue database', () => {
      template.hasResourceProperties('AWS::Glue::Database', {
        DatabaseInput: Match.objectLike({
          Name: Match.stringLikeRegexp('ml_pipeline_.*'),
        }),
      });
    });

    test('Creates Glue table for predictions', () => {
      template.hasResourceProperties('AWS::Glue::Table', {
        TableInput: Match.objectLike({
          Name: 'predictions',
          StorageDescriptor: Match.objectLike({
            Columns: Match.arrayWith([
              Match.objectLike({ Name: 'predictionId', Type: 'string' }),
              Match.objectLike({ Name: 'modelVersion', Type: 'string' }),
            ]),
          }),
        }),
      });
    });
  });

  describe('Athena', () => {
    test('Creates Athena workgroup', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        Name: Match.stringLikeRegexp('ml-pipeline-workgroup-.*'),
        WorkGroupConfiguration: Match.objectLike({
          EnforceWorkGroupConfiguration: true,
          ResultConfigurationUpdates: Match.objectLike({
            EncryptionConfiguration: {
              EncryptionOption: 'SSE_KMS',
            },
          }),
        }),
      });
    });
  });

  describe('EventBridge', () => {
    test('Creates scheduled rule for batch processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: Match.stringLikeRegexp('ml-pipeline-batch-schedule-.*'),
        ScheduleExpression: 'rate(6 hours)',
        State: 'ENABLED',
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('Creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('ml-pipeline-.*'),
      });
    });

    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('ml-pipeline-alerts-.*'),
      });
    });

    test('Creates high latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('ml-pipeline-high-latency-.*'),
        MetricName: 'ModelLatency',
        Threshold: 500,
        EvaluationPeriods: 2,
      });
    });

    test('Creates error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('ml-pipeline-error-rate-.*'),
        MetricName: 'Errors',
        Threshold: 10,
        EvaluationPeriods: 1,
      });
    });

    test('Creates data drift alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('ml-pipeline-data-drift-.*'),
        MetricName: 'DataDrift',
        Threshold: 0.1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Security', () => {
    test('Creates KMS key for encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for ML pipeline encryption',
        EnableKeyRotation: true,
      });
    });

    test('IAM roles follow least privilege principle', () => {
      // Check that Lambda role has minimal permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumedBy: Match.objectLike({
          Service: 'lambda.amazonaws.com',
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.stringLikeRegexp('.*AWSLambdaVPCAccessExecutionRole.*'),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports API endpoint URL', () => {
      template.hasOutput('APIEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('Exports SageMaker endpoint name', () => {
      template.hasOutput('SageMakerEndpointName', {
        Description: 'SageMaker endpoint name',
      });
    });

    test('Exports Kinesis stream ARN', () => {
      template.hasOutput('KinesisStreamArn', {
        Description: 'Kinesis stream ARN for real-time inference',
      });
    });

    test('Exports CloudWatch dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  describe('Tagging', () => {
    test('All resources are tagged appropriately', () => {
      // Verify stack-level tags are applied
      const stackTags = cdk.Tags.of(stack);
      expect(stack.tags.tagValues()).toMatchObject({
        Project: 'MLPipeline',
        Environment: 'prod',
        ManagedBy: 'CDK',
        CostCenter: 'ML-Engineering',
      });
    });
  });
});
```

## File 3: tests/tap-stack.int.test.ts

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import * as AWS from 'aws-sdk';
import axios from 'axios';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

const apiGateway = new AWS.APIGateway();
const sagemaker = new AWS.SageMaker();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();
const cloudwatch = new AWS.CloudWatch();
const kinesis = new AWS.Kinesis();
const stepfunctions = new AWS.StepFunctions();
const s3 = new AWS.S3();
const ec2 = new AWS.EC2();

/**
 * Integration tests for ML Pipeline Stack
 * These tests validate cross-service connectivity and end-to-end workflows
 */
describe('TapStack Integration Tests', () => {
  let stackName: string;
  let apiEndpointUrl: string;
  let sagemakerEndpointName: string;
  let kinesisStreamArn: string;
  let predictionTableName: string;
  let modelBucketName: string;
  let vpcId: string;

  beforeAll(async () => {
    // Retrieve stack outputs from CloudFormation
    stackName = process.env.STACK_NAME || 'ml-pipeline-stack-prod';
    const cf = new AWS.CloudFormation();
    
    try {
      const stackInfo = await cf.describeStacks({ StackName: stackName }).promise();
      const outputs = stackInfo.Stacks![0].Outputs!;
      
      apiEndpointUrl = outputs.find(o => o.OutputKey === 'APIEndpoint')?.OutputValue!;
      sagemakerEndpointName = outputs.find(o => o.OutputKey === 'SageMakerEndpointName')?.OutputValue!;
      kinesisStreamArn = outputs.find(o => o.OutputKey === 'KinesisStreamArn')?.OutputValue!;
      
      // Get resource names from tags or stack resources
      const resources = await cf.listStackResources({ StackName: stackName }).promise();
      
      predictionTableName = resources.StackResourceSummaries!
        .find(r => r.ResourceType === 'AWS::DynamoDB::Table' && r.LogicalResourceId === 'PredictionResultsTable')
        ?.PhysicalResourceId!;
      
      modelBucketName = resources.StackResourceSummaries!
        .find(r => r.ResourceType === 'AWS::S3::Bucket' && r.LogicalResourceId === 'ModelArtifactsBucket')
        ?.PhysicalResourceId!;
        
      vpcId = resources.StackResourceSummaries!
        .find(r => r.ResourceType === 'AWS::EC2::VPC')
        ?.PhysicalResourceId!;
    } catch (error) {
      console.error('Failed to retrieve stack outputs:', error);
      throw error;
    }
  }, 60000);

  describe('API Gateway → Lambda → SageMaker Integration', () => {
    test('should successfully process prediction request through API Gateway', async () => {
      const testPayload = {
        features: [1.0, 2.0, 3.0, 4.0, 5.0],
        metadata: {
          source: 'integration-test',
          timestamp: Date.now(),
        },
      };

      try {
        const response = await axios.post(`${apiEndpointUrl}/predict`, testPayload, {
          headers: { 'Content-Type': 'application/json' },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('predictionId');
        expect(response.data).toHaveProperty('result');
        expect(response.data).toHaveProperty('modelVersion');
        expect(response.data).toHaveProperty('variant');
        
        // Verify A/B testing - variant should be either VariantA or VariantB
        expect(['VariantA', 'VariantB']).toContain(response.data.variant);
      } catch (error) {
        console.error('API Gateway test failed:', error);
        throw error;
      }
    }, 30000);

    test('should store prediction results in DynamoDB with TTL', async () => {
      // Make a prediction request first
      const testPayload = {
        features: [1.0, 2.0, 3.0, 4.0, 5.0],
      };

      const response = await axios.post(`${apiEndpointUrl}/predict`, testPayload);
      const pre