// lib/components/data.ts

/**
 * Data Processing Infrastructure Component
 * Creates Amazon Kinesis Data Stream, an AWS Lambda consumer, and an S3 bucket for processed data.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DataProcessingInfrastructureArgs {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  vpcEndpointSgId: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class DataProcessingInfrastructure extends pulumi.ComponentResource {
  public readonly kinesisStream: aws.kinesis.Stream;
  public readonly processedDataBucket: aws.s3.Bucket;
  public readonly kinesisProcessorRole: aws.iam.Role;
  public readonly kinesisProcessor: aws.lambda.Function;
  public readonly kinesisEventSourceMapping: aws.lambda.EventSourceMapping;

  constructor(
    name: string,
    args: DataProcessingInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:data_processing:Infrastructure', name, {}, opts);

    // Kinesis Data Stream
    this.kinesisStream = new aws.kinesis.Stream(
      `${name}-stream`,
      {
        name: `${name}-realtime-events`,
        shardCount: 1, // For demonstration; adjust for production scale
        retentionPeriod: 24, // 24 hours
        tags: args.tags,
      },
      { parent: this }
    );

    // S3 Bucket for processed data
    this.processedDataBucket = new aws.s3.Bucket(
      `${name}-processed-data`,
      {
        // Let AWS auto-generate a unique bucket name
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // IAM Role for Kinesis Processor Lambda
    this.kinesisProcessorRole = new aws.iam.Role(
      `${name}-processor-role`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach VPC execution role policy
    new aws.iam.RolePolicyAttachment(
      `${name}-processor-vpc-policy`,
      {
        role: this.kinesisProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for Kinesis processor
    const kinesisProcessorPolicy = pulumi
      .all([
        this.kinesisStream.arn,
        this.processedDataBucket.arn,
        args.snsTopicArn,
      ])
      .apply(([kinesisArn, bucketArn, snsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:DescribeStream',
                'kinesis:ListStreams',
              ],
              Resource: kinesisArn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:GetObject', // Added GetObject for potential read-back or validation
              ],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: snsArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        })
      );

    new aws.iam.RolePolicy(
      `${name}-processor-policy`,
      {
        role: this.kinesisProcessorRole.id,
        policy: kinesisProcessorPolicy,
      },
      { parent: this }
    );

    // Kinesis Processor Lambda Function
    const kinesisProcessorCode = this.getKinesisProcessorCode();

    this.kinesisProcessor = new aws.lambda.Function(
      `${name}-processor-function`,
      {
        name: `${name}-kinesis-processor`,
        runtime: 'nodejs18.x',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(kinesisProcessorCode),
        }),
        handler: 'index.handler',
        role: this.kinesisProcessorRole.arn,
        timeout: 60,
        memorySize: 256,
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.vpcEndpointSgId],
        },
        environment: {
          variables: {
            PROCESSED_DATA_BUCKET: this.processedDataBucket.id,
            SNS_TOPIC_ARN: args.snsTopicArn,
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Kinesis Event Source Mapping
    this.kinesisEventSourceMapping = new aws.lambda.EventSourceMapping(
      `${name}-kinesis-esm`,
      {
        eventSourceArn: this.kinesisStream.arn,
        functionName: this.kinesisProcessor.arn,
        startingPosition: 'LATEST',
        batchSize: 100,
      },
      { parent: this }
    );

    this.registerOutputs({
      kinesisStreamName: this.kinesisStream.name,
      processedDataBucketName: this.processedDataBucket.id,
      kinesisProcessorFunctionName: this.kinesisProcessor.name,
    });
  }

  private getKinesisProcessorCode(): string {
    return `
const AWS = require('aws-sdk');

const s3Client = new AWS.S3();
const snsClient = new AWS.SNS();
const processedDataBucket = process.env.PROCESSED_DATA_BUCKET;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received Kinesis event:', JSON.stringify(event));
    let recordsProcessed = 0;
    
    try {
        for (const record of event.Records) {
            // Kinesis data is base64 encoded
            const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
            const data = JSON.parse(payload);
            
            // Add processing timestamp
            data.processed_at = new Date().toISOString();
            
            // Define S3 key (e.g., year/month/day/hour/lambda_request_id_record_sequence_number.json)
            const currentTime = new Date();
            const year = currentTime.getFullYear();
            const month = String(currentTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentTime.getDate()).padStart(2, '0');
            const hour = String(currentTime.getHours()).padStart(2, '0');
            
            const s3Key = \`\${year}/\${month}/\${day}/\${hour}/\${context.awsRequestId}_\${record.kinesis.sequenceNumber}.json\`;
            
            await s3Client.putObject({
                Bucket: processedDataBucket,
                Key: s3Key,
                Body: JSON.stringify(data),
                ContentType: 'application/json'
            }).promise();
            
            console.log(\`Successfully processed record and saved to s3://\${processedDataBucket}/\${s3Key}\`);
            recordsProcessed++;
        }
    } catch (error) {
        console.error('Error processing Kinesis record:', error.message);
        
        // Publish an alert to SNS
        try {
            await snsClient.publish({
                TopicArn: snsTopicArn,
                Message: \`Error in Kinesis processor Lambda: \${error.message}\`,
                Subject: 'Kinesis Processor Error Alert'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        throw error; // Re-raise to indicate failure to Kinesis, allowing retries
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(\`Successfully processed \${recordsProcessed} records.\`)
    };
};
`;
  }
}
