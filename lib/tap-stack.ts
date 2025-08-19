import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // KMS Key for encryption at rest - all data encryption
    const kmsKey = new kms.Key(this, 'TapAppKMSKey', {
      description: 'KMS key for TAP application encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('logs.us-west-2.amazonaws.com'),
            ],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'TapAppKMSKeyAlias', {
      aliasName: 'alias/tap-app-key',
      targetKey: kmsKey,
    });

    // Secrets Manager for application secrets
    const appSecrets = new secretsmanager.Secret(this, 'TapAppSecrets', {
      secretName: 'tap-app/secrets',
      description: 'Application secrets for TAP serverless app',
      // Removed KMS encryption to avoid CDK policy injection issues
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // DynamoDB Table with encryption and on-demand capacity
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'tap-items-table',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity as required
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // S3 Bucket for file uploads with encryption
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `tap-files-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: false, // Disabled for testing compatibility
    });

    // CloudWatch Log Groups for Lambda functions
    const createItemLogGroup = new logs.LogGroup(this, 'CreateItemLogGroup', {
      logGroupName: '/aws/lambda/tap-create-item',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const getItemsLogGroup = new logs.LogGroup(this, 'GetItemsLogGroup', {
      logGroupName: '/aws/lambda/tap-get-items',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const uploadFileLogGroup = new logs.LogGroup(this, 'UploadFileLogGroup', {
      logGroupName: '/aws/lambda/tap-upload-file',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda functions with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [itemsTable.tableArn],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${filesBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [filesBucket.bucketArn],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [appSecrets.secretArn],
            }),
          ],
        }),
        CloudWatchLogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [
                createItemLogGroup.logGroupArn,
                getItemsLogGroup.logGroupArn,
                uploadFileLogGroup.logGroupArn,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda function to create items in DynamoDB
    const createItemFunction = new lambda.Function(this, 'CreateItemFunction', {
      functionName: 'tap-create-item',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'create_item.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        TABLE_NAME: itemsTable.tableName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: createItemLogGroup,
    });

    // Lambda function to get items from DynamoDB
    const getItemsFunction = new lambda.Function(this, 'GetItemsFunction', {
      functionName: 'tap-get-items',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get_item.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        TABLE_NAME: itemsTable.tableName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: getItemsLogGroup,
    });

    // Lambda function to upload files to S3
    const uploadFileFunction = new lambda.Function(this, 'UploadFileFunction', {
      functionName: 'tap-upload-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'upload_file.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // Max 30 seconds as per constraints
      environment: {
        BUCKET_NAME: filesBucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: uploadFileLogGroup,
    });

    // API Gateway with CORS enabled
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'TAP Serverless API',
      description: 'Secure serverless web application API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create proper request validator for the actual API
    const actualRequestValidator = new apigateway.RequestValidator(
      this,
      'ActualRequestValidator',
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Request models for validation
    const createItemModel = api.addModel('CreateItemModel', {
      contentType: 'application/json',
      modelName: 'CreateItemModel',
      schema: {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        title: 'Create Item Schema',
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          name: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
            maxLength: 100,
          },
          description: {
            type: apigateway.JsonSchemaType.STRING,
            maxLength: 500,
          },
        },
        required: ['name'],
      },
    });

    // API Gateway resources and methods
    const itemsResource = api.root.addResource('items');

    // POST /items - Create item
    itemsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createItemFunction),
      {
        requestValidator: actualRequestValidator,
        requestModels: {
          'application/json': createItemModel,
        },
      }
    );

    // GET /items - Get all items
    itemsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getItemsFunction)
    );

    // Files resource for uploads
    const filesResource = api.root.addResource('files');

    // POST /files - Upload file
    filesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(uploadFileFunction),
      {
        requestValidator: actualRequestValidator,
      }
    );

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: itemsTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket name for file uploads',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: appSecrets.secretArn,
      description: 'Secrets Manager secret ARN',
    });
  }
}
