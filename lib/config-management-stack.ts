import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface ConfigManagementStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ConfigManagementStack extends cdk.Stack {
  public readonly configTable: dynamodb.Table;
  public readonly backupBucket: s3.Bucket;
  public readonly configValidatorFunction: lambda.Function;
  public readonly mobileAppRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props?: ConfigManagementStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket for Configuration Backups
    this.backupBucket = new s3.Bucket(this, 'ConfigBackupBucket', {
      bucketName: `mobile-app-config-backup-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-backups',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table for Configuration History
    this.configTable = new dynamodb.Table(this, 'ConfigHistoryTable', {
      tableName: `MobileAppConfigHistory-${environmentSuffix}`,
      partitionKey: { name: 'configId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for timestamp queries
    this.configTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'configType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // IAM Role for Mobile Application
    this.mobileAppRole = new iam.Role(this, 'MobileAppRole', {
      roleName: `MobileAppConfigAccess-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for mobile application to access configurations',
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `ConfigLambdaExecution-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions to Lambda role
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
        resources: [
          this.configTable.tableArn,
          `${this.configTable.tableArn}/index/*`,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${this.backupBucket.bucketArn}/*`],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'appconfig:GetConfiguration',
          'appconfig:StartConfigurationSession',
        ],
        resources: ['*'],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/mobile-app/config/*`,
        ],
      })
    );

    // Configuration Validator Lambda with X-Ray tracing
    this.configValidatorFunction = new lambda.Function(
      this,
      'ConfigValidator',
      {
        functionName: `config-validator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Validating configuration:', JSON.stringify(event));

  try {
    // Parse and validate JSON configuration
    const config = JSON.parse(event.configuration);

    // Check required fields
    if (!config.version || !config.features) {
      throw new Error('Invalid configuration: missing required fields');
    }

    // Validate feature flags structure
    if (!Array.isArray(config.features)) {
      throw new Error('Invalid configuration: features must be an array');
    }

    // Log to DynamoDB
    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        configId: event.configId || 'validation',
        timestamp: Date.now(),
        configType: 'validation',
        status: 'success',
        configuration: config,
      }
    }).promise();

    return {
      statusCode: 200,
      valid: true,
      message: 'Configuration is valid'
    };
  } catch (error) {
    console.error('Validation failed:', error);

    // Log failure to DynamoDB
    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        configId: event.configId || 'validation',
        timestamp: Date.now(),
        configType: 'validation',
        status: 'failed',
        error: error.message,
      }
    }).promise();

    return {
      statusCode: 400,
      valid: false,
      message: error.message
    };
  }
};
      `),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: this.configTable.tableName,
          BUCKET_NAME: this.backupBucket.bucketName,
        },
      }
    );

    // CloudWatch Log Group for Lambda (managed automatically by Lambda)

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ConfigValidationFailureAlarm', {
      alarmName: `config-validation-failures-${environmentSuffix}`,
      metric: this.configValidatorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'ConfigManagementDashboard',
      {
        dashboardName: `MobileAppConfig-${environmentSuffix}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Configuration Validation Success Rate',
        left: [this.configValidatorFunction.metricInvocations()],
        right: [this.configValidatorFunction.metricErrors()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [this.configValidatorFunction.metricDuration()],
        width: 12,
      })
    );

    // Backup Lambda Function with X-Ray tracing
    const backupFunction = new lambda.Function(this, 'ConfigBackupFunction', {
      functionName: `config-backup-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const s3 = new AWS.S3();
const ssm = new AWS.SSM();
const appconfig = new AWS.AppConfig();

exports.handler = async (event) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();

  try {
    // Get all parameters
    const parameters = await ssm.getParametersByPath({
      Path: '/mobile-app/config/',
      Recursive: true,
      WithDecryption: true
    }).promise();

    // Backup to S3
    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: \`backups/\${date}/config-\${timestamp}.json\`,
      Body: JSON.stringify({
        timestamp,
        date,
        parameters: parameters.Parameters,
        metadata: {
          count: parameters.Parameters.length,
          region: process.env.AWS_REGION
        }
      }),
      ServerSideEncryption: 'AES256'
    }).promise();

    console.log(\`Backup completed: \${parameters.Parameters.length} parameters\`);

    return {
      statusCode: 200,
      message: 'Backup completed successfully',
      parametersCount: parameters.Parameters.length
    };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
};
      `),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        BUCKET_NAME: this.backupBucket.bucketName,
      },
    });

    // Schedule daily backups
    const backupRule = new events.Rule(this, 'DailyBackupRule', {
      ruleName: `config-daily-backup-${environmentSuffix}`,
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
    });

    backupRule.addTarget(new targets.LambdaFunction(backupFunction));

    // Grant backup permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParametersByPath', 'ssm:DescribeParameters'],
        resources: ['*'],
      })
    );

    // Grant X-Ray permissions to Lambda functions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Stack outputs
    new cdk.CfnOutput(this, 'ConfigHistoryTableName', {
      value: this.configTable.tableName,
      description: 'DynamoDB table for configuration history',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket for configuration backups',
    });

    new cdk.CfnOutput(this, 'MobileAppRoleArn', {
      value: this.mobileAppRole.roleArn,
      description: 'IAM role for mobile application access',
    });

    new cdk.CfnOutput(this, 'ValidatorFunctionArn', {
      value: this.configValidatorFunction.functionArn,
      description: 'Configuration validator Lambda function ARN',
    });
  }
}
