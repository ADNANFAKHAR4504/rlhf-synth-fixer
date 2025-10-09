import * as cdk from 'aws-cdk-lib';
import {
  ArnFormat,
  CfnOutput,
  CfnParameter,
  Duration,
  RemovalPolicy,
  StackProps,
  Tags,
  Token,
} from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
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
    const sanitizeSuffix = (value: string): string =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32) || 'dev';

    const suffixSourceCandidates: (string | undefined)[] = [
      props?.environmentSuffix,
      this.node.tryGetContext('environmentSuffix') as string | undefined,
      cdk.Stack.of(this).stackName.replace(/^tapstack/i, ''),
    ];
    const resolvedSuffixSource =
      suffixSourceCandidates.find(value => value && value.trim().length > 0) ||
      'dev';
    const resolvedSuffix = sanitizeSuffix(resolvedSuffixSource);

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
      default: resolvedSuffix,
      allowedPattern: '^[a-z0-9-]+$',
      description:
        'Unique, lowercase suffix appended to resource names to guarantee uniqueness across accounts.',
    });

    const allowedCorsOriginsParam = new CfnParameter(
      this,
      'AllowedCorsOrigins',
      {
        type: 'String',
        default: 'https://localhost:3000',
        description:
          'Comma-separated list of HTTPS origins permitted to access public endpoints.',
      }
    );

    const billingAlarmThresholdParam = new CfnParameter(
      this,
      'MonthlyBillingThreshold',
      {
        type: 'Number',
        default: 500,
        minValue: 1,
        description:
          'USD amount that will trigger a billing alarm for the account.',
      }
    );

    const appName = appNameParam.valueAsString.toLowerCase();
    const environmentName = environmentParam.valueAsString.toLowerCase();
    const stringSuffix = sanitizeSuffix(suffixParam.valueAsString);
    const allowedOrigins = allowedCorsOriginsParam.valueAsString
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    const resolvedAllowedOrigins =
      allowedOrigins.length > 0 ? allowedOrigins : ['https://localhost'];
    const billingThreshold = billingAlarmThresholdParam.valueAsNumber;
    const sanitizedStageName =
      environmentName.replace(/[^A-Za-z0-9_]/g, '_') || 'stage';

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
      removalPolicy: RemovalPolicy.DESTROY,
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
    notificationTopic.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const apiSecret = new secretsmanager.Secret(this, 'ApiCredentialSecret', {
      secretName: resourceName('api-credentials'),
      encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ service: appName }),
        generateStringKey: 'apiKey',
        passwordLength: 32,
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const staticAssetBucket = new s3.Bucket(this, 'StaticAssetBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const userTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    userTable.addGlobalSecondaryIndex({
      indexName: 'byEntityType',
      partitionKey: {
        name: 'entityType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const productTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    productTable.addGlobalSecondaryIndex({
      indexName: 'byEntityType',
      partitionKey: {
        name: 'entityType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const orderTable = new dynamodb.Table(this, 'OrdersTable', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    orderTable.addGlobalSecondaryIndex({
      indexName: 'byEntityType',
      partitionKey: {
        name: 'entityType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
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
        reservedConcurrentExecutions: 50,
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
          ALLOWED_ORIGINS: resolvedAllowedOrigins.join(','),
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
          ALLOWED_ORIGINS: resolvedAllowedOrigins.join(','),
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
          ALLOWED_ORIGINS: resolvedAllowedOrigins.join(','),
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

    const createFunctionUrl = (fn: NodejsFunction) =>
      fn.addFunctionUrl({
        authType: FunctionUrlAuthType.AWS_IAM,
        cors: {
          allowedOrigins: resolvedAllowedOrigins,
          allowedMethods: [
            HttpMethod.GET,
            HttpMethod.POST,
            HttpMethod.PUT,
            HttpMethod.PATCH,
            HttpMethod.DELETE,
            HttpMethod.HEAD,
          ],
        },
      });

    const userFunctionUrl = createFunctionUrl(userServiceFunction);
    const productFunctionUrl = createFunctionUrl(productServiceFunction);
    const orderFunctionUrl = createFunctionUrl(orderServiceFunction);

    const api = new apigateway.RestApi(this, 'NovaRestApi', {
      restApiName: resourceName('api'),
      description: 'Serverless API for the Nova microservices platform.',
      deployOptions: {
        stageName: sanitizedStageName,
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
        allowMethods: [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'OPTIONS',
          'HEAD',
        ],
        allowOrigins: resolvedAllowedOrigins,
        allowHeaders: ['Authorization', 'Content-Type'],
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.IAM,
      },
    });

    const addLambdaRoutes = (
      basePath: string,
      serviceLambda: lambda.IFunction,
      pathParamName: string
    ): void => {
      const baseResource = api.root.addResource(basePath);
      const methodOptions: apigateway.MethodOptions = {
        apiKeyRequired: false,
        authorizationType: apigateway.AuthorizationType.IAM,
      };
      baseResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda),
        methodOptions
      );
      baseResource.addMethod(
        'POST',
        new apigateway.LambdaIntegration(serviceLambda),
        methodOptions
      );

      const entityResource = baseResource.addResource(`{${pathParamName}}`);
      entityResource.addMethod(
        'GET',
        new apigateway.LambdaIntegration(serviceLambda),
        methodOptions
      );
      entityResource.addMethod(
        'PUT',
        new apigateway.LambdaIntegration(serviceLambda),
        methodOptions
      );
      entityResource.addMethod(
        'DELETE',
        new apigateway.LambdaIntegration(serviceLambda),
        methodOptions
      );
    };

    addLambdaRoutes('users', userServiceFunction, 'userId');
    addLambdaRoutes('products', productServiceFunction, 'productId');

    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction),
      {
        apiKeyRequired: false,
        authorizationType: apigateway.AuthorizationType.IAM,
      }
    );
    ordersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(orderServiceFunction),
      {
        apiKeyRequired: false,
        authorizationType: apigateway.AuthorizationType.IAM,
      }
    );

    const orderEntity = ordersResource.addResource('{orderId}');
    orderEntity.addMethod(
      'GET',
      new apigateway.LambdaIntegration(orderServiceFunction),
      {
        apiKeyRequired: false,
        authorizationType: apigateway.AuthorizationType.IAM,
      }
    );
    orderEntity.addMethod(
      'PATCH',
      new apigateway.LambdaIntegration(orderServiceFunction),
      {
        apiKeyRequired: false,
        authorizationType: apigateway.AuthorizationType.IAM,
      }
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

    const lambdaMetrics: Array<{
      id: string;
      purpose: string;
      metricFactory: (fn: NodejsFunction) => cloudwatch.IMetric;
      props?: Partial<cloudwatch.AlarmProps>;
      fn: NodejsFunction;
    }> = [
      {
        id: 'UserServiceErrorAlarm',
        purpose: 'user-errors-alarm',
        metricFactory: fn =>
          fn.metricErrors({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: userServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the user service logs any Lambda errors within one minute.',
        },
      },
      {
        id: 'ProductServiceErrorAlarm',
        purpose: 'product-errors-alarm',
        metricFactory: fn =>
          fn.metricErrors({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: productServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the product service logs any Lambda errors within one minute.',
        },
      },
      {
        id: 'OrderServiceErrorAlarm',
        purpose: 'order-errors-alarm',
        metricFactory: fn =>
          fn.metricErrors({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: orderServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the order service logs any Lambda errors within one minute.',
        },
      },
      {
        id: 'UserServiceThrottleAlarm',
        purpose: 'user-throttle-alarm',
        metricFactory: fn =>
          fn.metricThrottles({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: userServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the user service experiences throttled Lambda invocations.',
        },
      },
      {
        id: 'UserServiceInvocationAlarm',
        purpose: 'user-invocations-alarm',
        metricFactory: fn =>
          fn.metricInvocations({
            period: Duration.hours(1),
            statistic: 'Sum',
          }),
        fn: userServiceFunction,
        props: {
          threshold: 1000,
          alarmDescription:
            'Notifies when user service invocation volume exceeds hourly baseline.',
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        },
      },
      {
        id: 'ProductServiceThrottleAlarm',
        purpose: 'product-throttle-alarm',
        metricFactory: fn =>
          fn.metricThrottles({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: productServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the product service experiences throttled Lambda invocations.',
        },
      },
      {
        id: 'ProductServiceInvocationAlarm',
        purpose: 'product-invocations-alarm',
        metricFactory: fn =>
          fn.metricInvocations({
            period: Duration.hours(1),
            statistic: 'Sum',
          }),
        fn: productServiceFunction,
        props: {
          threshold: 1000,
          alarmDescription:
            'Notifies when product service invocation volume exceeds hourly baseline.',
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        },
      },
      {
        id: 'OrderServiceThrottleAlarm',
        purpose: 'order-throttle-alarm',
        metricFactory: fn =>
          fn.metricThrottles({
            period: Duration.minutes(1),
            statistic: 'Sum',
          }),
        fn: orderServiceFunction,
        props: {
          threshold: 1,
          alarmDescription:
            'Alerts when the order service experiences throttled Lambda invocations.',
        },
      },
      {
        id: 'OrderServiceInvocationAlarm',
        purpose: 'order-invocations-alarm',
        metricFactory: fn =>
          fn.metricInvocations({
            period: Duration.hours(1),
            statistic: 'Sum',
          }),
        fn: orderServiceFunction,
        props: {
          threshold: 1000,
          alarmDescription:
            'Notifies when order service invocation volume exceeds hourly baseline.',
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        },
      },
    ];

    lambdaMetrics.forEach(({ id, purpose, metricFactory, props, fn }) => {
      const alarm = new cloudwatch.Alarm(this, id, {
        alarmName: resourceName(purpose),
        metric: metricFactory(fn),
        threshold: props?.threshold ?? 1,
        evaluationPeriods: props?.evaluationPeriods ?? 1,
        datapointsToAlarm: props?.datapointsToAlarm,
        comparisonOperator:
          props?.comparisonOperator ??
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription:
          props?.alarmDescription ??
          `Alerts on metric ${purpose} for Lambda function.`,
        treatMissingData:
          props?.treatMissingData ?? cloudwatch.TreatMissingData.BREACHING,
      });
      alarm.addAlarmAction(new SnsAction(notificationTopic));
    });

    const apiServerErrorAlarm = new cloudwatch.Alarm(
      this,
      'ApiGatewayServerErrorAlarm',
      {
        alarmName: resourceName('api-5xx-alarm'),
        metric: api.deploymentStage.metricServerError({
          period: Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription:
          'Alerts when API Gateway returns 5XX responses within a 5-minute window.',
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );
    apiServerErrorAlarm.addAlarmAction(new SnsAction(notificationTopic));

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: resourceName('api-latency-alarm'),
      metric: api.deploymentStage.metricLatency({
        period: Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 2000,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription:
        'Alerts when API Gateway latency exceeds 2 seconds on average over 5 minutes.',
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
    apiLatencyAlarm.addAlarmAction(new SnsAction(notificationTopic));

    const stackRegion = cdk.Stack.of(this).region;
    const canCreateBillingAlarm =
      Token.isUnresolved(stackRegion) || stackRegion === 'us-east-1';

    if (canCreateBillingAlarm) {
      const billingAlarm = new cloudwatch.Alarm(this, 'MonthlyBillingAlarm', {
        alarmName: resourceName('billing-alarm'),
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Billing',
          metricName: 'EstimatedCharges',
          statistic: 'Maximum',
          period: Duration.hours(6),
          region: 'us-east-1',
          dimensionsMap: {
            Currency: 'USD',
          },
        }),
        threshold: billingThreshold,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: `Triggers when estimated monthly charges exceed $${billingThreshold}.`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      billingAlarm.addAlarmAction(new SnsAction(notificationTopic));
    } else {
      cdk.Annotations.of(this).addWarning(
        'Billing alarm is only created in the us-east-1 region; skipping for this deployment.'
      );
    }

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

    new CfnOutput(this, 'UserFunctionUrl', {
      value: userFunctionUrl.url,
      description: 'HTTPS endpoint for the user service Lambda function.',
    });

    new CfnOutput(this, 'ProductFunctionUrl', {
      value: productFunctionUrl.url,
      description: 'HTTPS endpoint for the product service Lambda function.',
    });

    new CfnOutput(this, 'OrderFunctionUrl', {
      value: orderFunctionUrl.url,
      description: 'HTTPS endpoint for the order service Lambda function.',
    });
  }
}
