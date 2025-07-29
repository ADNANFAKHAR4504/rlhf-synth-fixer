import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.Table;
  public readonly lambdaFunction: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    // Explicitly set the region to us-west-2 as required by the prompt
    const stackProps = { 
      ...props, 
      env: { 
        ...props?.env, 
        region: 'us-west-2' 
      } 
    };
    
    super(scope, id, stackProps);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create S3 bucket for IoT data uploads
    this.s3Bucket = new s3.Bucket(this, 'IoTDataBucket', {
      bucketName: `iot-data-bucket-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create DynamoDB table for storing processed data
    this.dynamoTable = new dynamodb.Table(this, 'IoTProcessedData', {
      tableName: `iot-processed-data-${environmentSuffix}`,
      partitionKey: {
        name: 'deviceId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.ON_DEMAND, // For high, unpredictable traffic
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CloudWatch Log Group with exact name as required
    this.logGroup = new logs.LogGroup(this, 'IoTDataProcessorLogGroup', {
      logGroupName: '/aws/lambda/IoTDataProcessor',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda with least privilege access
    const lambdaRole = new iam.Role(this, 'IoTDataProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3ReadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [this.s3Bucket.arnForObjects('*')],
            }),
          ],
        }),
        DynamoDBWritePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ],
              resources: [this.dynamoTable.tableArn],
            }),
          ],
        }),
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [this.logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Lambda function code
    const lambdaCode = `
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const s3Client = new S3Client({ region: 'us-west-2' });

exports.handler = async (event) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  
  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;
      
      console.log('Processing file:', objectKey, 'from bucket:', bucketName);
      
      // Get object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      });
      
      const s3Response = await s3Client.send(getObjectCommand);
      const data = await s3Response.Body.transformToString();
      
      console.log('File content:', data);
      
      // Parse IoT data (assuming JSON format)
      let iotData;
      try {
        iotData = JSON.parse(data);
      } catch (parseError) {
        console.error('Failed to parse JSON data:', parseError);
        throw new Error('Invalid JSON format in IoT data file');
      }
      
      // Process and store data in DynamoDB
      const processedData = {
        deviceId: { S: iotData.deviceId || 'unknown' },
        timestamp: { S: new Date().toISOString() },
        originalData: { S: JSON.stringify(iotData) },
        processedAt: { S: new Date().toISOString() },
        fileName: { S: objectKey },
        status: { S: 'processed' }
      };
      
      const putCommand = new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: processedData
      });
      
      await dynamoClient.send(putCommand);
      console.log('Successfully processed and stored data for device:', iotData.deviceId);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully processed IoT data files' })
    };
    
  } catch (error) {
    console.error('Error processing IoT data:', error);
    throw error;
  }
};
    `;

    // Create Lambda function for IoT data processing
    this.lambdaFunction = new lambda.Function(this, 'IoTDataProcessor', {
      functionName: 'IoTDataProcessor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(lambdaCode),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      reservedConcurrentExecutions: 500, // Support 500 concurrent requests as required
      logGroup: this.logGroup,
      environment: {
        DYNAMODB_TABLE_NAME: this.dynamoTable.tableName,
        AWS_REGION: 'us-west-2',
      },
    });

    // Add S3 event notification to trigger Lambda
    this.s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.lambdaFunction)
    );

    // Output important values
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'Name of the S3 bucket for IoT data uploads',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.dynamoTable.tableName,
      description: 'Name of the DynamoDB table for processed IoT data',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Name of the Lambda function for IoT data processing',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'Name of the CloudWatch Log Group',
    });
  }
}