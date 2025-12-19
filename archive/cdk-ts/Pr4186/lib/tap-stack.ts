import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // 1. S3 BUCKET SETUP
    // ========================================

    // Create S3 bucket for access logging
    const logBucket = new s3.Bucket(this, 'AccessLogBucket', {
      bucketName: `prod-data-bucket-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          id: 'delete-old-logs',
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create main S3 bucket with required configuration
    const dataBucket = new s3.Bucket(this, 'ProdDataBucket', {
      bucketName: `prod-data-bucket-${environmentSuffix}`,

      // Enable server-side encryption
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Turn on object versioning
      versioned: true,

      // Enable CloudWatch access logging
      serverAccessLogsPrefix: 'access-logs/',
      serverAccessLogsBucket: logBucket,

      // Security best practices
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,

      // Lifecycle management for versioned objects
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
          id: 'delete-old-versions',
        },
      ],

      // Set removal policy to RETAIN for production
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add tags to buckets
    cdk.Tags.of(dataBucket).add('Environment', 'Production');
    cdk.Tags.of(dataBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(logBucket).add('Environment', 'Production');
    cdk.Tags.of(logBucket).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 2. IAM ROLE CONFIGURATION
    // ========================================

    // Create IAM role with read-only access to S3 bucket
    const s3ReadOnlyRole = new iam.Role(this, 'S3ReadOnlyRole', {
      roleName: `prod-data-bucket-readonly-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Read-only access role for prod-data-bucket',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant minimal read permissions following least privilege principle
    dataBucket.grantRead(s3ReadOnlyRole);

    // Add specific permissions for listing bucket contents
    s3ReadOnlyRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ListBucket',
          's3:GetBucketLocation',
          's3:GetBucketVersioning',
          's3:ListBucketVersions',
        ],
        resources: [dataBucket.bucketArn],
      })
    );

    // Add tags to role
    cdk.Tags.of(s3ReadOnlyRole).add('Environment', 'Production');
    cdk.Tags.of(s3ReadOnlyRole).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 3. CLOUDWATCH LOGGING
    // ========================================

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new logs.LogGroup(this, 'ObjectLoggerLogGroup', {
      logGroupName: `/aws/lambda/prod-object-logger-${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add tags to log group
    cdk.Tags.of(logGroup).add('Environment', 'Production');
    cdk.Tags.of(logGroup).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 4. LAMBDA FUNCTION
    // ========================================

    // Create Lambda function for object logging
    const objectLoggerFunction = new lambda.Function(this, 'ProdObjectLogger', {
      functionName: `prod-object-logger-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, 'lambda/prod-object-logger')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        BUCKET_NAME: dataBucket.bucketName,
      },
      logGroup: logGroup,
      description: 'Logs details about new objects added to prod-data-bucket',
      retryAttempts: 2,
      deadLetterQueueEnabled: false,
    });

    // Grant Lambda function read access to the S3 bucket
    dataBucket.grantRead(objectLoggerFunction);

    // Add S3 event notification to trigger Lambda
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(objectLoggerFunction)
    );

    // Add tags to Lambda function
    cdk.Tags.of(objectLoggerFunction).add('Environment', 'Production');
    cdk.Tags.of(objectLoggerFunction).add('iac-rlhf-amazon', 'true');

    // ========================================
    // 5. STACK OUTPUTS
    // ========================================

    // Output important resource information
    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'Name of the production data bucket',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: dataBucket.bucketArn,
      description: 'ARN of the production data bucket',
    });

    new cdk.CfnOutput(this, 'ReadOnlyRoleArn', {
      value: s3ReadOnlyRole.roleArn,
      description: 'ARN of the S3 read-only role',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: objectLoggerFunction.functionArn,
      description: 'ARN of the object logger Lambda function',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda function',
    });

    // Add global tags to entire stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
  }
}
