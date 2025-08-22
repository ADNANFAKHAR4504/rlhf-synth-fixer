import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class ServerlessAppStack extends cdk.NestedStack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create S3 bucket for file storage
    this.fileStorageBucket = new s3.Bucket(this, 'ServerlessAppFileStorage', {
      bucketName: `serverless-app-files-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environments
      autoDeleteObjects: true,
    });

    // Create Secrets Manager secret for application configuration
    this.appSecrets = new secretsmanager.Secret(this, 'ServerlessAppSecrets', {
      secretName: `ServerlessApp/config/${environmentSuffix}`,
      description: 'Configuration secrets for ServerlessApp',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: '',
          databaseUrl: '',
        }),
        generateStringKey: 'tempPassword',
        excludeCharacters: '"@/\\',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'ServerlessAppLambdaLogs', {
      logGroupName: `/aws/lambda/ServerlessApp-FileProcessor-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'ServerlessAppLambdaRole', {
      roleName: `ServerlessApp-Lambda-Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Lambda permissions to read from S3 bucket
    this.fileStorageBucket.grantRead(lambdaRole);

    // Grant Lambda permissions to read secrets
    this.appSecrets.grantRead(lambdaRole);

    // Grant Lambda permissions to write to CloudWatch Logs
    logGroup.grantWrite(lambdaRole);

    // Create Lambda layer for AWS Parameters and Secrets Lambda Extension
    // Note: Layer version may vary by region - using version 12 for us-west-2
    const secretsExtensionLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'SecretsExtensionLayer',
      `arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12`
    );

    // Create Lambda function for file processing
    this.fileProcessorFunction = new lambda.Function(this, 'ServerlessAppFileProcessor', {
      functionName: `ServerlessApp-FileProcessor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    
    try {
        // Process S3 event records
        for (const record of event.Records) {
            if (record.eventSource === 'aws:s3') {
                const bucketName = record.s3.bucket.name;
                const objectKey = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
                
                console.log(\`Processing file: \${objectKey} from bucket: \${bucketName}\`);
                
                // Get secrets using the extension (cached for performance)
                const secretCommand = new GetSecretValueCommand({
                    SecretId: process.env.SECRET_ARN
                });
                
                const secretResponse = await secretsClient.send(secretCommand);
                const secrets = JSON.parse(secretResponse.SecretString);
                
                console.log('Successfully retrieved secrets');
                
                // Get object metadata from S3
                const getObjectCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: objectKey
                });
                
                const s3Response = await s3Client.send(getObjectCommand);
                console.log(\`File size: \${s3Response.ContentLength} bytes\`);
                
                // Simulate file processing
                await new Promise(resolve => setTimeout(resolve, 100));
                
                console.log(\`Successfully processed file: \${objectKey}\`);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Files processed successfully',
                processedCount: event.Records.length
            })
        };
        
    } catch (error) {
        console.error('Error processing files:', error);
        throw error;
    }
};
      `),
      environment: {
        SECRET_ARN: this.appSecrets.secretArn,
        BUCKET_NAME: this.fileStorageBucket.bucketName,
        PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED: 'true',
        PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE: '1000',
        PARAMETERS_SECRETS_EXTENSION_TTL_SECONDS: '300',
      },
      layers: [secretsExtensionLayer],
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
    });

    // Add S3 event notification to trigger Lambda
    this.fileStorageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.fileProcessorFunction),
      {
        prefix: 'uploads/',
        suffix: '.json',
      }
    );

    // Create CloudWatch Dashboard for monitoring
    this.dashboard = new cloudwatch.Dashboard(this, 'ServerlessAppDashboard', {
      dashboardName: `ServerlessApp-Monitoring-${environmentSuffix}`,
    });

    // Add Lambda metrics to dashboard
    const invocationMetric = this.fileProcessorFunction.metricInvocations({
      period: cdk.Duration.minutes(5),
    });

    const errorMetric = this.fileProcessorFunction.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const durationMetric = this.fileProcessorFunction.metricDuration({
      period: cdk.Duration.minutes(5),
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [invocationMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [errorMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [durationMetric],
        width: 24,
        height: 6,
      })
    );

    // Create CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'ServerlessAppErrorAlarm', {
      alarmName: `ServerlessApp-Lambda-Errors-${environmentSuffix}`,
      metric: errorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const durationAlarm = new cloudwatch.Alarm(this, 'ServerlessAppDurationAlarm', {
      alarmName: `ServerlessApp-Lambda-Duration-${environmentSuffix}`,
      metric: durationMetric,
      threshold: 10000, // 10 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Output important resource information
    new cdk.CfnOutput(this, 'FileStorageBucketName', {
      value: this.fileStorageBucket.bucketName,
      description: 'Name of the S3 bucket for file storage',
      exportName: `ServerlessApp-BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.fileProcessorFunction.functionArn,
      description: 'ARN of the file processor Lambda function',
      exportName: `ServerlessApp-LambdaArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: this.appSecrets.secretArn,
      description: 'ARN of the Secrets Manager secret',
      exportName: `ServerlessApp-SecretsArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'URL to the CloudWatch dashboard',
    });
  }
}