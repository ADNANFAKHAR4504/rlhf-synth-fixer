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
            sid: 'Allow Secrets Manager Service',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
            ],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Add tags to KMS key
    cdk.Tags.of(kmsKey).add('Environment', props?.environmentSuffix || 'dev');
    cdk.Tags.of(kmsKey).add('Purpose', 'encryption');
    cdk.Tags.of(kmsKey).add('Compliance', 'encryption-at-rest');

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'TapAppKMSKeyAlias', {
      aliasName: 'alias/tap-app-key',
      targetKey: kmsKey,
    });

    // Secrets Manager for application secrets
    const appSecrets = new secretsmanager.Secret(this, 'TapAppSecrets', {
      secretName: 'tap-app/secrets',
      description: 'Application secrets for TAP serverless app',
      encryptionKey: kmsKey, // Enable KMS encryption for compliance
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
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity for cost optimization
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Add tags to DynamoDB table
    cdk.Tags.of(itemsTable).add(
      'Environment',
      props?.environmentSuffix || 'dev'
    );
    cdk.Tags.of(itemsTable).add('Purpose', 'data-storage');
    cdk.Tags.of(itemsTable).add('Compliance', 'encryption-at-rest');

    // Separate S3 bucket for access logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `tap-logs-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90), // Logs expire after 90 days
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // S3 Bucket for file uploads
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `tap-files-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: logsBucket, // Use separate bucket for logs
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: false, // Disabled for testing compatibility
    });

    // Add tags to S3 bucket
    cdk.Tags.of(filesBucket).add(
      'Environment',
      props?.environmentSuffix || 'dev'
    );
    cdk.Tags.of(filesBucket).add('Purpose', 'file-storage');
    cdk.Tags.of(filesBucket).add('Compliance', 'encryption-at-rest');

    // CloudWatch Log Groups for Lambda functions
    // Using AWS default encryption
    const createItemLogGroup = new logs.LogGroup(this, 'CreateItemLogGroup', {
      logGroupName: '/aws/lambda/tap-create-item',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const getItemsLogGroup = new logs.LogGroup(this, 'GetItemsLogGroup', {
      logGroupName: '/aws/lambda/tap-get-items',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const uploadFileLogGroup = new logs.LogGroup(this, 'UploadFileLogGroup', {
      logGroupName: '/aws/lambda/tap-upload-file',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda functions
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
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [itemsTable.tableArn],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                },
              },
            }),
            // Item-level access control
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [`${itemsTable.tableArn}/index/*`],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                },
              },
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${filesBucket.bucketArn}/*`],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                },
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [filesBucket.bucketArn],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                },
              },
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                },
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
            // Encryption operations policy
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Encrypt'],
              resources: [kmsKey.keyArn],
              conditions: {
                StringEquals: {
                  'aws:RequestTag/Environment':
                    props?.environmentSuffix || 'dev',
                  'aws:RequestTag/Operation': 'encryption',
                },
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
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
      code: lambda.Code.fromAsset('lib/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // 30 second timeout for optimal performance
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
      code: lambda.Code.fromAsset('lib/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // 30 second timeout for optimal performance
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
      code: lambda.Code.fromAsset('lib/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30), // 30 second timeout for optimal performance
      environment: {
        BUCKET_NAME: filesBucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
        SECRET_ARN: appSecrets.secretArn,
      },
      logGroup: uploadFileLogGroup,
    });

    // API Gateway with CORS configuration
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'TAP Serverless API',
      description: 'Secure serverless web application API',
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
      defaultCorsPreflightOptions: {
        allowOrigins: [
          // Production domains
          'https://yourdomain.com',
          'https://www.yourdomain.com',
          // Development domains
          ...(props?.environmentSuffix === 'dev'
            ? ['http://localhost:3000', 'http://localhost:8080']
            : []),
        ],
        allowMethods: ['GET', 'POST', 'OPTIONS'], // Required HTTP methods
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.seconds(3600), // Cache preflight response
      },
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Request validator for API
    const actualRequestValidator = new apigateway.RequestValidator(
      this,
      'ActualRequestValidator',
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Request validation models
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
        apiKeyRequired: props?.environmentSuffix !== 'dev', // API key required in production
      }
    );

    // GET /items - Get all items with request validation
    itemsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getItemsFunction),
      {
        requestValidator: actualRequestValidator,
        // Query parameter validation
        requestParameters: {
          'method.request.querystring.limit': false, // Optional limit
          'method.request.querystring.offset': false, // Optional offset
          'method.request.querystring.environment': false, // Optional environment filter
        },
        apiKeyRequired: props?.environmentSuffix !== 'dev', // API key required in production
      }
    );

    // Files resource for uploads
    const filesResource = api.root.addResource('files');

    // POST /files - Upload file
    filesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(uploadFileFunction),
      {
        requestValidator: actualRequestValidator,
        apiKeyRequired: props?.environmentSuffix !== 'dev', // API key required in production
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

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket name for access logs',
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
