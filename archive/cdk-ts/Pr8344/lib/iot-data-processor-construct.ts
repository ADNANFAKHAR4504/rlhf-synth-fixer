import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface IoTDataProcessorConstructProps {
  environmentSuffix: string;
}

export class IoTDataProcessorConstruct extends Construct {
  public readonly s3Bucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.Table;
  public readonly lambdaFunction: lambda.Function;
  public readonly lambdaRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(
    scope: Construct,
    id: string,
    props: IoTDataProcessorConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for IoT data uploads
    this.s3Bucket = new s3.Bucket(this, 'IoTDataBucket', {
      bucketName: `iot-data-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create DynamoDB table for processed data with high-traffic configuration
    this.dynamoTable = new dynamodb.Table(this, 'IoTProcessedDataTable', {
      tableName: `iot-processed-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      partitionKey: {
        name: 'deviceId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Better for unpredictable traffic
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Create CloudWatch Log Group - let CDK generate unique name to avoid conflicts
    this.logGroup = new logs.LogGroup(this, 'IoTDataProcessorLogGroup', {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda with least privilege access
    this.lambdaRole = new iam.Role(this, 'IoTDataProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions to the role
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion'],
        resources: [this.s3Bucket.arnForObjects('*')],
      })
    );

    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:GetItem',
        ],
        resources: [this.dynamoTable.tableArn],
      })
    );

    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      })
    );

    // Create Lambda function for IoT data processing
    this.lambdaFunction = new lambda.Function(this, 'IoTDataProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: this.lambdaRole,
      code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// LocalStack endpoint configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const clientConfig = {
  region: 'us-east-1',
  ...(isLocalStack && process.env.AWS_ENDPOINT_URL ? { endpoint: process.env.AWS_ENDPOINT_URL } : {})
};

const s3Config = {
  ...clientConfig,
  forcePathStyle: true  // Required for LocalStack S3
};

const dynamodb = new DynamoDBClient(clientConfig);
const s3 = new S3Client(s3Config);

exports.handler = async (event) => {
    console.log('Processing IoT data upload event:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;
            
            console.log(\`Processing file: \${objectKey} from bucket: \${bucketName}\`);
            
            // Get object from S3
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
            });
            
            const s3Response = await s3.send(getObjectCommand);
            const fileContent = await s3Response.Body.transformToString();
            
            console.log('File content retrieved, length:', fileContent.length);
            
            // Parse and process the data (assuming JSON format)
            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                // For non-JSON files, create a basic structure
                data = {
                    deviceId: objectKey.split('/')[0] || 'unknown',
                    rawData: fileContent,
                    processedAt: new Date().toISOString(),
                };
            }
            
            // Ensure required fields exist
            if (!data.deviceId) {
                data.deviceId = objectKey.split('/')[0] || 'unknown';
            }
            
            const timestamp = data.timestamp || new Date().toISOString();
            const processedData = {
                ...data,
                processedAt: new Date().toISOString(),
                sourceFile: objectKey,
                sourceBucket: bucketName,
            };
            
            // Store processed data in DynamoDB
            const putItemCommand = new PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                    deviceId: { S: data.deviceId },
                    timestamp: { S: timestamp },
                    processedData: { S: JSON.stringify(processedData) },
                    processedAt: { S: processedData.processedAt },
                    sourceFile: { S: objectKey },
                    sourceBucket: { S: bucketName },
                },
            });
            
            await dynamodb.send(putItemCommand);
            console.log(\`Successfully processed and stored data for device: \${data.deviceId}\`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully processed IoT data',
                processedRecords: event.Records.length,
            }),
        };
        
    } catch (error) {
        console.error('Error processing IoT data:', error);
        throw error;
    }
};
      `),
      environment: {
        DYNAMODB_TABLE_NAME: this.dynamoTable.tableName,
        LOG_GROUP_NAME: this.logGroup.logGroupName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      // Remove reserved concurrency to avoid account limits - Lambda will auto-scale as needed
      // reservedConcurrentExecutions: 500, // Commented out to avoid account concurrency limits
      logGroup: this.logGroup,
    });

    // Add S3 bucket notification to trigger Lambda
    this.s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.lambdaFunction)
    );
  }
}
