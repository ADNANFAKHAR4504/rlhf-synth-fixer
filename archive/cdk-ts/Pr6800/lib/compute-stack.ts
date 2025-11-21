import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  rawDataBucket: s3.Bucket;
  processedDataBucket: s3.Bucket;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Dead Letter Queue for failed Lambda invocations
    const dlq = new sqs.Queue(this, 'DataProcessorDLQ', {
      queueName: `data-processor-dlq-${props.environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda execution role with least privilege
    const executionRole = new iam.Role(this, 'DataProcessorRole', {
      roleName: `data-processor-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant specific permissions
    props.rawDataBucket.grantRead(executionRole);
    props.processedDataBucket.grantWrite(executionRole);
    props.kmsKey.grantEncryptDecrypt(executionRole);
    dlq.grantSendMessages(executionRole);

    // Restrict to us-east-1 region only
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DenyOtherRegions',
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:RequestedRegion': cdk.Stack.of(this).region,
          },
        },
      })
    );

    // CloudWatch log group for Lambda function
    const lambdaLogGroup = new logs.LogGroup(this, 'DataProcessorLogs', {
      logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for data processing using Graviton2 (ARM64)
    this.dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: `data-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64, // Graviton2 processor
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Processing data event:', JSON.stringify(event, null, 2));

  // Extract S3 bucket and key from event
  const record = event.Records?.[0];
  if (!record) {
    return { statusCode: 400, body: 'No records found' };
  }

  const bucket = record.s3?.bucket?.name;
  const key = record.s3?.object?.key;

  console.log(\`Processing file: s3://\${bucket}/\${key}\`);

  // Placeholder for data processing logic
  // In production, this would:
  // 1. Read from rawDataBucket
  // 2. Process/analyze the data
  // 3. Write results to processedDataBucket

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processed successfully',
      bucket,
      key,
    }),
  };
};
        `),
        role: executionRole,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        environment: {
          RAW_DATA_BUCKET: props.rawDataBucket.bucketName,
          PROCESSED_DATA_BUCKET: props.processedDataBucket.bucketName,
          ENVIRONMENT: props.environmentSuffix,
        },
        environmentEncryption: props.kmsKey,
        deadLetterQueue: dlq,
        logGroup: lambdaLogGroup,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Trigger Lambda on S3 uploads to raw data bucket
    this.dataProcessorFunction.addEventSource(
      new eventsources.S3EventSource(props.rawDataBucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: 'ingest/' }],
      })
    );
  }
}
