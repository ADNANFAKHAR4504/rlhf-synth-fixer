import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { StackConfig } from '../interfaces/config-interfaces';
import { NamingUtil } from '../utils/naming';

interface ServerlessConstructProps extends StackConfig {
  vpc: ec2.Vpc;
}

export class ServerlessConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;
  public readonly lambdaArn: string;
  public readonly bucketName: string;
  public readonly errorTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ServerlessConstructProps) {
    super(scope, id);

    const { config, vpc } = props;

    // Create S3 bucket with all security requirements
    this.bucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: NamingUtil.generateBucketName(config, 'data'),
      versioned: true, // Requirement: versioning enabled
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Requirement: block public access
      enforceSSL: true, // Requirement: HTTPS-only access
      lifecycleRules: [
        {
          id: 'cost-optimization',
          enabled: true,
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
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.bucketName = this.bucket.bucketName;

    // Create DynamoDB table for storing processing results
    const processingTable = new dynamodb.Table(this, 'ProcessingTable', {
      tableName: NamingUtil.generateResourceName(
        config,
        'processing-results',
        false
      ),
      partitionKey: { name: 'objectKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: config.environment === 'prod',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SNS topic for error notifications
    this.errorTopic = new sns.Topic(this, 'ErrorTopic', {
      topicName: NamingUtil.generateResourceName(config, 'errors', false),
      displayName: `Error notifications for ${config.environment}`,
    });

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: NamingUtil.generateRoleName(config, 'lambda-processor'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant Lambda permissions to read from S3
    this.bucket.grantRead(lambdaRole);

    // Grant Lambda permissions to write to DynamoDB
    processingTable.grantWriteData(lambdaRole);

    // Grant Lambda permissions to publish to SNS
    this.errorTopic.grantPublish(lambdaRole);

    // Grant CloudWatch logs permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Create Lambda function with real-world use case: log file analysis
    this.lambdaFunction = new lambda.Function(this, 'LogAnalyzerFunction', {
      functionName: NamingUtil.generateResourceName(
        config,
        'log-analyzer',
        false
      ),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));
  
  const results = [];
  
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
      
      console.log(\`Processing object: s3://\${bucket}/\${key}\`);
      
      // Real-world use case: Analyze log files
      if (key.endsWith('.log') || key.endsWith('.txt')) {
        const result = await analyzeLogFile(bucket, key);
        results.push(result);
        
        // Store analysis results in DynamoDB
        await storageProcessingResult(key, result);
      } else {
        console.log(\`Skipping non-log file: \${key}\`);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing completed successfully',
        processedFiles: results.length,
        results: results
      })
    };
    
  } catch (error) {
    console.error('Error processing S3 event:', error);
    
    // Send error notification
    await sns.publish({
      TopicArn: process.env.ERROR_TOPIC_ARN,
      Subject: 'Lambda Log Analyzer Error',
      Message: JSON.stringify({
        error: error.message,
        stack: error.stack,
        event: event,
        timestamp: new Date().toISOString(),
        environment: process.env.ENVIRONMENT
      }, null, 2)
    }).promise();
    
    throw error;
  }
};

async function analyzeLogFile(bucket, key) {
  try {
    // Get object from S3
    const response = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).promise();
    
    const content = response.Body.toString('utf-8');
    const lines = content.split('\\n');
    
    // Analyze log content
    const analysis = {
      totalLines: lines.length,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      uniqueIPs: new Set(),
      timestamp: new Date().toISOString()
    };
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('error')) {
        analysis.errorCount++;
      } else if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')) {
        analysis.warningCount++;
      } else if (line.toLowerCase().includes('info')) {
        analysis.infoCount++;
      }
      
      // Extract IP addresses (simple regex)
      const ipMatch = line.match(/\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b/);
      if (ipMatch) {
        analysis.uniqueIPs.add(ipMatch[0]);
      }
    });
    
    analysis.uniqueIPCount = analysis.uniqueIPs.size;
    delete analysis.uniqueIPs; // Remove Set object for JSON serialization
    
    console.log(\`Analysis complete for \${key}:\`, analysis);
    return analysis;
    
  } catch (error) {
    console.error(\`Error analyzing file \${key}:\`, error);
    throw error;
  }
}

async function storageProcessingResult(objectKey, analysis) {
  try {
    await dynamodb.put({
      TableName: process.env.PROCESSING_TABLE_NAME,
      Item: {
        objectKey: objectKey,
        timestamp: new Date().toISOString(),
        analysis: analysis,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
      }
    }).promise();
    
    console.log(\`Stored analysis result for \${objectKey}\`);
  } catch (error) {
    console.error(\`Error storing analysis result for \${objectKey}:\`, error);
    throw error;
  }
}
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      environment: {
        ERROR_TOPIC_ARN: this.errorTopic.topicArn,
        PROCESSING_TABLE_NAME: processingTable.tableName,
        ENVIRONMENT: config.environment,
        REGION: config.region,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      // COMMENTED OUT: Reserved concurrency causes account limit issues in demo environments
      // reservedConcurrentExecutions: config.environment === 'prod' ? 10 : 5,
      description:
        'Analyzes log files uploaded to S3 and stores results in DynamoDB',
    });

    this.lambdaArn = this.lambdaFunction.functionArn;

    // Add S3 event trigger to Lambda for log files only
    this.lambdaFunction.addEventSource(
      new lambdaEventSources.S3EventSource(this.bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ suffix: '.log' }],
      })
    );

    // Add S3 event trigger for txt files
    this.lambdaFunction.addEventSource(
      new lambdaEventSources.S3EventSource(this.bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ suffix: '.txt' }],
      })
    );

    // Apply tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
  }
}
