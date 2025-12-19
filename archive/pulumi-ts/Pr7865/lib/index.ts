import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Get configuration values
const config = new pulumi.Config();
const environment = config.get('environment') || 'dev';
const team = config.get('team') || 'data-engineering';
const costCenter = config.get('costCenter') || 'analytics';
const ingestionBucket = config.get('ingestionBucket') || 'etl-ingestion-bucket';
const outputBucket = config.get('outputBucket') || 'etl-output-bucket';

// Common tags for all resources
const commonTags = {
  Environment: environment,
  Team: team,
  CostCenter: costCenter,
  ManagedBy: 'pulumi',
  Project: 'lambda-etl-optimization',
};

// IAM role for Lambda functions
const lambdaRole = new aws.iam.Role('etl-lambda-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
  tags: commonTags,
});

// Attach basic Lambda execution policy
const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
  'lambda-basic-execution',
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write policy
const xrayPolicy = new aws.iam.RolePolicyAttachment('lambda-xray-policy', {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
});

// Custom policy for S3 access
const s3Policy = new aws.iam.RolePolicy('lambda-s3-policy', {
  role: lambdaRole.id,
  policy: pulumi
    .all([ingestionBucket, outputBucket])
    .apply(([ingestion, output]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            Resource: [
              `arn:aws:s3:::${ingestion}/*`,
              `arn:aws:s3:::${ingestion}`,
              `arn:aws:s3:::${output}/*`,
              `arn:aws:s3:::${output}`,
            ],
          },
        ],
      })
    ),
});

// Create Lambda layer for shared dependencies
const sharedLayerPath = path.join(__dirname, 'lambda', 'layer');

// Create Lambda layer
const sharedLayer = new aws.lambda.LayerVersion(
  'etl-shared-layer',
  {
    layerName: 'etl-shared-dependencies',
    code: new pulumi.asset.FileArchive(sharedLayerPath),
    compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
    compatibleArchitectures: ['arm64'],
    description: 'Shared dependencies for ETL Lambda functions',
  },
  { dependsOn: [lambdaRole] }
);

// SNS topic for CloudWatch alarms
const alarmTopic = new aws.sns.Topic('etl-lambda-alarms', {
  name: 'etl-lambda-error-alarms',
  tags: commonTags,
});

// Lambda function: Data Ingestion
const dataIngestionLambda = new aws.lambda.Function(
  'data-ingestion',
  {
    name: 'etl-data-ingestion',
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const AWSXRay = require('aws-xray-sdk-core');
    const xrayAWS = AWSXRay.captureAWS(AWS);

    const s3 = new xrayAWS.S3();
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('data-ingestion-processing');

    try {
        console.log('Starting data ingestion process');
        console.log('Environment:', process.env.ENVIRONMENT);
        console.log('Ingestion bucket:', process.env.INGESTION_BUCKET);

        // Simulate data ingestion
        const data = {
            timestamp: new Date().toISOString(),
            records: Math.floor(Math.random() * 1000),
            status: 'success'
        };

        // Store raw data in S3
        await s3.putObject({
            Bucket: process.env.INGESTION_BUCKET,
            Key: \`raw-data/\${Date.now()}.json\`,
            Body: JSON.stringify(data),
            ContentType: 'application/json'
        }).promise();

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data ingestion completed',
                recordsProcessed: data.records
            })
        };
    } catch (error) {
        console.error('Error in data ingestion:', error);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
};
        `),
    }),
    timeout: 60,
    memorySize: 512, // Optimized from 3008MB
    architectures: ['arm64'], // Graviton2
    layers: [sharedLayer.arn],
    environment: {
      variables: {
        ENVIRONMENT: environment,
        INGESTION_BUCKET: ingestionBucket,
        OUTPUT_BUCKET: outputBucket,
        TEAM: team,
      },
    },
    tracingConfig: {
      mode: 'Active', // X-Ray tracing enabled
    },
    tags: commonTags,
  },
  { dependsOn: [lambdaBasicPolicy, xrayPolicy, s3Policy, sharedLayer] }
);

// Lambda function: Data Transform
const dataTransformLambda = new aws.lambda.Function(
  'data-transform',
  {
    name: 'etl-data-transform',
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const AWSXRay = require('aws-xray-sdk-core');
    const xrayAWS = AWSXRay.captureAWS(AWS);

    const s3 = new xrayAWS.S3();
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('data-transform-processing');

    try {
        console.log('Starting data transformation process');
        console.log('Environment:', process.env.ENVIRONMENT);

        // Simulate complex transformation logic
        const startTime = Date.now();

        // Simulate CPU-intensive transformation
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i);
        }

        const processingTime = Date.now() - startTime;

        const transformedData = {
            timestamp: new Date().toISOString(),
            recordsTransformed: Math.floor(Math.random() * 1000),
            processingTimeMs: processingTime,
            status: 'transformed'
        };

        subsegment.addAnnotation('processingTime', processingTime);
        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data transformation completed',
                recordsTransformed: transformedData.recordsTransformed,
                processingTimeMs: processingTime
            })
        };
    } catch (error) {
        console.error('Error in data transformation:', error);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
};
        `),
    }),
    timeout: 300,
    memorySize: 1024, // Optimized from 3008MB based on workload analysis
    architectures: ['arm64'], // Graviton2
    reservedConcurrentExecutions: 50, // Prevent throttling
    layers: [sharedLayer.arn],
    environment: {
      variables: {
        ENVIRONMENT: environment,
        INGESTION_BUCKET: ingestionBucket,
        OUTPUT_BUCKET: outputBucket,
        TEAM: team,
      },
    },
    tracingConfig: {
      mode: 'Active', // X-Ray tracing enabled
    },
    snapStart: {
      applyOn: 'PublishedVersions', // Enable SnapStart
    },
    tags: commonTags,
  },
  { dependsOn: [lambdaBasicPolicy, xrayPolicy, s3Policy, sharedLayer] }
);

// Lambda function: Data Output
const dataOutputLambda = new aws.lambda.Function(
  'data-output',
  {
    name: 'etl-data-output',
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const AWSXRay = require('aws-xray-sdk-core');
    const xrayAWS = AWSXRay.captureAWS(AWS);

    const s3 = new xrayAWS.S3();
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('data-output-processing');

    try {
        console.log('Starting data output process');
        console.log('Environment:', process.env.ENVIRONMENT);
        console.log('Output bucket:', process.env.OUTPUT_BUCKET);

        // Simulate data output
        const outputData = {
            timestamp: new Date().toISOString(),
            recordsWritten: Math.floor(Math.random() * 1000),
            status: 'completed'
        };

        // Write processed data to S3
        await s3.putObject({
            Bucket: process.env.OUTPUT_BUCKET,
            Key: \`processed-data/\${Date.now()}.json\`,
            Body: JSON.stringify(outputData),
            ContentType: 'application/json'
        }).promise();

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data output completed',
                recordsWritten: outputData.recordsWritten
            })
        };
    } catch (error) {
        console.error('Error in data output:', error);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
};
        `),
    }),
    timeout: 120,
    memorySize: 512, // Optimized from 3008MB
    architectures: ['arm64'], // Graviton2
    layers: [sharedLayer.arn],
    environment: {
      variables: {
        ENVIRONMENT: environment,
        INGESTION_BUCKET: ingestionBucket,
        OUTPUT_BUCKET: outputBucket,
        TEAM: team,
      },
    },
    tracingConfig: {
      mode: 'Active', // X-Ray tracing enabled
    },
    tags: commonTags,
  },
  { dependsOn: [lambdaBasicPolicy, xrayPolicy, s3Policy, sharedLayer] }
);

// CloudWatch alarm for data-ingestion errors
const ingestionErrorAlarm = new aws.cloudwatch.MetricAlarm(
  'data-ingestion-error-alarm',
  {
    name: 'etl-data-ingestion-errors',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 1, // More than 1% error rate (adjusted for absolute errors)
    alarmDescription:
      'Alert when data-ingestion Lambda errors exceed threshold',
    alarmActions: [alarmTopic.arn],
    dimensions: {
      FunctionName: dataIngestionLambda.name,
    },
    tags: commonTags,
  }
);

// CloudWatch alarm for data-transform errors
const transformErrorAlarm = new aws.cloudwatch.MetricAlarm(
  'data-transform-error-alarm',
  {
    name: 'etl-data-transform-errors',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 1,
    alarmDescription:
      'Alert when data-transform Lambda errors exceed threshold',
    alarmActions: [alarmTopic.arn],
    dimensions: {
      FunctionName: dataTransformLambda.name,
    },
    tags: commonTags,
  }
);

// CloudWatch alarm for data-output errors
const outputErrorAlarm = new aws.cloudwatch.MetricAlarm(
  'data-output-error-alarm',
  {
    name: 'etl-data-output-errors',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    period: 300,
    statistic: 'Sum',
    threshold: 1,
    alarmDescription: 'Alert when data-output Lambda errors exceed threshold',
    alarmActions: [alarmTopic.arn],
    dimensions: {
      FunctionName: dataOutputLambda.name,
    },
    tags: commonTags,
  }
);

// Exports
export const ingestionFunctionName = dataIngestionLambda.name;
export const ingestionFunctionArn = dataIngestionLambda.arn;
export const transformFunctionName = dataTransformLambda.name;
export const transformFunctionArn = dataTransformLambda.arn;
export const outputFunctionName = dataOutputLambda.name;
export const outputFunctionArn = dataOutputLambda.arn;
export const sharedLayerArn = sharedLayer.arn;
export const alarmTopicArn = alarmTopic.arn;
export const lambdaRoleArn = lambdaRole.arn;
export const ingestionAlarmArn = ingestionErrorAlarm.arn;
export const transformAlarmArn = transformErrorAlarm.arn;
export const outputAlarmArn = outputErrorAlarm.arn;
