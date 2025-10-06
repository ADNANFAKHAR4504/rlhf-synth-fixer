import * as cdk from 'aws-cdk-lib';
import {
  ArnFormat,
  CfnOutput,
  CfnParameter,
  Duration,
  RemovalPolicy,
  StackProps,
  Tags,
} from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'node:path';

export interface TapStackProps extends StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    Tags.of(this).add('iac-rlhf-amazon', 'true');

    const digitWords = [
      'zero',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];
    const sanitizeTagValue = (value: string, maxLength = 256): string => {
      const digitExpanded = value.replace(
        /[0-9]/g,
        digit => digitWords[Number(digit)]
      );
      const sanitized = digitExpanded
        .replace(/[^a-zA-Z+\-=._:/]/g, '_')
        .slice(0, maxLength);
      return sanitized.length > 0 ? sanitized : 'unknown';
    };
    const sanitizeStageName = (value: string): string =>
      value.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 128) || 'stage';

    const appNameParam = new CfnParameter(this, 'AppName', {
      type: 'String',
      default: 'nova',
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Application name prefix used in resource naming (lowercase, hyphen separated).',
    });

    const environmentParam = new CfnParameter(this, 'EnvironmentName', {
      type: 'String',
      default: 'staging',
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Deployment environment name used in resource naming (e.g., staging, prod).',
    });

    const suffixParam = new CfnParameter(this, 'UniqueSuffix', {
      type: 'String',
      default: props?.environmentSuffix ?? 'dev',
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Unique, lowercase suffix appended to resource names to guarantee uniqueness across accounts.',
    });

    const appName = appNameParam.valueAsString.toLowerCase();
    const environmentName = environmentParam.valueAsString.toLowerCase();
    const stringSuffix = suffixParam.valueAsString.toLowerCase();

    const resourceName = (purpose: string): string =>
      `${appName}-${purpose}-${environmentName}-${stringSuffix}`.replace(
        /[^a-z0-9-]/g,
        ''
      );

    Tags.of(this).add('Application', sanitizeTagValue(appName));
    Tags.of(this).add('Environment', sanitizeTagValue(environmentName));

    const encryptionKey = new kms.Key(this, 'DataProtectionKey', {
      alias: `alias/${resourceName('kms')}`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      description:
        'KMS key securing secrets, logs, and data for the Nova serverless platform.',
    });

    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogsUse',
        principals: [
          new iam.ServicePrincipal(`logs.${cdk.Aws.REGION}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*`,
          },
        },
      })
    );

    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: resourceName('notifications'),
      masterKey: encryptionKey,
      displayName: 'Serverless platform notifications',
    });

    const apiSecret = new secretsmanager.Secret(this, 'ApiCredentialSecret', {
      secretName: resourceName('api-credentials'),
      encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ service: appName }),
        generateStringKey: 'apiKey',
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    const staticAssetBucket = new s3.Bucket(this, 'StaticAssetBucket', {
      bucketName: resourceName('assets'),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const userTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: resourceName('users'),
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const productTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: resourceName('products'),
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const orderTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: resourceName('orders'),
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const apiAccessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
      encryptionKey,
      logGroupName: `/aws/apigateway/${resourceName('api-access')}`,
    });

    const createServiceFunction = (
      id: string,
      purpose: string,
      options: {
        entry: string;
        description: string;
        environment: Record<string, string>;
      }
    ): NodejsFunction => {
      const functionName = resourceName(purpose).slice(0, 64);

      const logsRootArn = cdk.Arn.format(
        {
          service: 'logs',
          resource: '*',
          arnFormat: ArnFormat.NO_RESOURCE_NAME,
        },
        this
      );

      const logGroupArn = cdk.Arn.format(
        {
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${functionName}`,
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        },
        this
      );

      const logStreamArn = `${logGroupArn}:*`;

      const executionRole = new iam.Role(this, `${id}ExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: `Execution role for the ${purpose} microservice Lambda function.`,
      });

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogGroup'],
          resources: [logsRootArn],
        })
      );

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [logGroupArn, logStreamArn],
        })
      );

      executionRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
          resources: ['*'],
        })
      );

      return new NodejsFunction(this, id, {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: options.entry,
        handler: 'handler',
        memorySize: 256,
        timeout: Duration.seconds(30),
        description: options.description,
        environment: options.environment,
        role: executionRole,
        functionName,
        bundling: {
          minify: true,
          target: 'node18',
          format: OutputFormat.CJS,
          sourcesContent: false,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
      });
    };

    const userServiceFunction = createServiceFunction(
      'UserServiceFunction',
      'user-service',
      {
        entry: path.join(__dirname, 'runtime', 'user-service.ts'),
        description: 'Manages customer profiles and lifecycle notifications.',
        environment: {
          USER_TABLE_NAME: userTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
          API_SECRET_ARN: apiSecret.secretArn,
        },
      }
    );

    const productServiceFunction = createServiceFunction(
      'ProductServiceFunction',
      'product-service',
      {
        entry: path.join(__dirname, 'runtime', 'product-service.ts'),
        description:
          'Handles product catalog CRUD operations and stock updates.',
        environment: {
          PRODUCT_TABLE_NAME: productTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
        },
      }
    );

    const orderServiceFunction = createServiceFunction(
      'OrderServiceFunction',
      'order-service',
      {
        entry: path.join(__dirname, 'runtime', 'order-service.ts'),
        description:
          'Validates orders, reserves inventory, and broadcasts order events.',
        environment: {
          ORDER_TABLE_NAME: orderTable.tableName,
          PRODUCT_TABLE_NAME: productTable.tableName,
          USER_TABLE_NAME: userTable.tableName,
          NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
        },
      }
    );

    apiSecret.grantRead(userServiceFunction);

    userTable.grantReadWriteData(userServiceFunction);
    notificationTopic.grantPublish(userServiceFunction);

    productTable.grantReadWriteData(productServiceFunction);
    notificationTopic.grantPublish(productServiceFunction);

    orderTable.grantReadWriteData(orderServiceFunction);
    productTable.grantReadWriteData(orderServiceFunction);
    userTable.grantReadData(orderServiceFunction);
    notificationTopic.grantPublish(orderServiceFunction);

    const sanitizedStage = sanitizeStageName(environmentName);
    const apiStageName = sanitizedStage.includes('token_token')
      ? 'stage'
      : sanitizedStage;

    const api = new apigateway.RestApi(this, 'NovaRestApi', {
      restApiName: resourceName('api'),
      description: 'Serverless API for the Nova microservices platform.',
      deployOptions: {
        stageName: apiStageName,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiAccessLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      defaultCorsPreflightOptions: {
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const addLambdaRoutes = (
      basePath: string,
      serviceLambda: lambda.IFunction,
      pathParamName: string
    ): void => {
      const baseResource = api.root.addResource(basePath);
      baseResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      baseResource.addMethod(
        'POST',
        new apigateway.LambdaIntegration(serviceLambda)
      );

      const entityResource = baseResource.addResource(`{${pathParamName}}`);
      entityResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      entityResource.addMethod(
        'PUT',
        new apigateway.LambdaIntegration(serviceLambda)
      );
      entityResource.addMethod(
        'DELETE',
        new apigateway.LambdaIntegration(serviceLambda)
      );
    };

    addLambdaRoutes('users', userServiceFunction, 'userId');
    addLambdaRoutes('products', productServiceFunction, 'productId');

    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );
    ordersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );

    const orderEntity = ordersResource.addResource('{orderId}');
    orderEntity.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );
    orderEntity.addMethod(
      'PATCH',
      new apigateway.LambdaIntegration(orderServiceFunction)
    );

    const connectApiGateway = (fn: NodejsFunction): void => {
      fn.addPermission(`InvokePermission${fn.node.id}`, {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: api.arnForExecuteApi(),
      });
    };

    connectApiGateway(userServiceFunction);
    connectApiGateway(productServiceFunction);
    connectApiGateway(orderServiceFunction);

    const createInvocationAlarm = (
      id: string,
      fn: NodejsFunction,
      purpose: string
    ): void => {
      const alarm = new cloudwatch.Alarm(this, id, {
        alarmName: resourceName(purpose),
        metric: fn.metricInvocations({
          period: Duration.hours(1),
          statistic: 'Sum',
        }),
        threshold: 1000,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription:
          'Notifies when invocation volume exceeds hourly baseline.',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      alarm.addAlarmAction(new SnsAction(notificationTopic));
    };

    createInvocationAlarm(
      'UserServiceInvocationAlarm',
      userServiceFunction,
      'user-invocations-alarm'
    );
    createInvocationAlarm(
      'ProductServiceInvocationAlarm',
      productServiceFunction,
      'product-invocations-alarm'
    );
    createInvocationAlarm(
      'OrderServiceInvocationAlarm',
      orderServiceFunction,
      'order-invocations-alarm'
    );

    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Base URL for invoking the Nova REST API.',
    });

    new CfnOutput(this, 'StaticAssetBucketName', {
      value: staticAssetBucket.bucketName,
      description: 'S3 bucket storing static frontend assets.',
    });

    new CfnOutput(this, 'UserTableName', {
      value: userTable.tableName,
      description: 'Primary DynamoDB table for user records.',
    });

    new CfnOutput(this, 'ProductTableName', {
      value: productTable.tableName,
      description: 'Primary DynamoDB table for product catalog data.',
    });

    new CfnOutput(this, 'OrderTableName', {
      value: orderTable.tableName,
      description: 'Primary DynamoDB table for order records.',
    });

    new CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic receiving operational alerts.',
    });

    new CfnOutput(this, 'ApiSecretArn', {
      value: apiSecret.secretArn,
      description: 'Secrets Manager ARN for external API credentials.',
    });
  }
}
