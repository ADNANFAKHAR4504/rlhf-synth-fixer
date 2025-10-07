import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // DynamoDB Table
    const playerScoresTable = new dynamodb.Table(this, 'PlayerScoresTable', {
      tableName: `PlayerScores-${environmentSuffix}`,
      partitionKey: {
        name: 'playerId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    // Lambda Execution Role with X-Ray permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Create Lambda Functions with X-Ray tracing
    const createScoreFunction = new lambda.Function(
      this,
      'CreateScoreFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'createScore.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        role: lambdaExecutionRole,
        environment: {
          TABLE_NAME: playerScoresTable.tableName,
          ENVIRONMENT: environmentSuffix,
        },
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: cdk.Duration.millis(200),
          maxRetries: 10,
        },
      }
    );

    const getScoreFunction = new lambda.Function(this, 'GetScoreFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getScore.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: playerScoresTable.tableName,
        ENVIRONMENT: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_DAY,
      logRetentionRetryOptions: {
        base: cdk.Duration.millis(200),
        maxRetries: 10,
      },
    });

    const updateScoreFunction = new lambda.Function(
      this,
      'UpdateScoreFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'updateScore.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        role: lambdaExecutionRole,
        environment: {
          TABLE_NAME: playerScoresTable.tableName,
          ENVIRONMENT: environmentSuffix,
        },
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: cdk.Duration.millis(200),
          maxRetries: 10,
        },
      }
    );

    const deleteScoreFunction = new lambda.Function(
      this,
      'DeleteScoreFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'deleteScore.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        role: lambdaExecutionRole,
        environment: {
          TABLE_NAME: playerScoresTable.tableName,
          ENVIRONMENT: environmentSuffix,
        },
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: cdk.Duration.millis(200),
          maxRetries: 10,
        },
      }
    );

    // Grant DynamoDB permissions
    playerScoresTable.grantWriteData(createScoreFunction);
    playerScoresTable.grantReadData(getScoreFunction);
    playerScoresTable.grantWriteData(updateScoreFunction);
    playerScoresTable.grantWriteData(deleteScoreFunction);

    // API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'ScoresApi', {
      restApiName: `ScoresApi-${environmentSuffix}`,
      description: 'API for managing player scores',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // API Resources and Methods
    const scoresResource = api.root.addResource('scores');
    const playerResource = scoresResource.addResource('{playerId}');

    // POST /scores
    scoresResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // GET /scores/{playerId}
    playerResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // PUT /scores/{playerId}
    playerResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // DELETE /scores/{playerId}
    playerResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // Create API Key
    const apiKey = new apigateway.ApiKey(this, 'ScoresApiKey', {
      apiKeyName: `ScoresApiKey-${environmentSuffix}`,
      description: 'API Key for accessing the Scores API',
    });

    // Create Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'ScoresUsagePlan', {
      name: `ScoresUsagePlan-${environmentSuffix}`,
      description: 'Usage plan for the Scores API with rate limiting',
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    // Associate API Key with Usage Plan
    usagePlan.addApiKey(apiKey);

    // Parameter Store
    new ssm.StringParameter(this, 'ApiEndpointParameter', {
      parameterName: `/scores-api/${environmentSuffix}/endpoint`,
      stringValue: api.url,
      description: 'API Gateway endpoint URL',
    });

    new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: `/scores-api/${environmentSuffix}/table-name`,
      stringValue: playerScoresTable.tableName,
      description: 'DynamoDB table name',
    });

    new ssm.StringParameter(this, 'EnvironmentParameter', {
      parameterName: `/scores-api/${environmentSuffix}/environment`,
      stringValue: environmentSuffix,
      description: 'Environment name',
    });

    new ssm.StringParameter(this, 'ApiKeyIdParameter', {
      parameterName: `/scores-api/${environmentSuffix}/api-key-id`,
      stringValue: apiKey.keyId,
      description: 'API Key ID for the Scores API',
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: playerScoresTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'CreateScoreFunctionName', {
      value: createScoreFunction.functionName,
      description: 'Create Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'GetScoreFunctionName', {
      value: getScoreFunction.functionName,
      description: 'Get Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'UpdateScoreFunctionName', {
      value: updateScoreFunction.functionName,
      description: 'Update Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DeleteScoreFunctionName', {
      value: deleteScoreFunction.functionName,
      description: 'Delete Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for accessing the API',
    });

    new cdk.CfnOutput(this, 'UsagePlanId', {
      value: usagePlan.usagePlanId,
      description: 'Usage Plan ID for the API',
    });
  }
}
