/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  stateBucket?: pulumi.Input<string>;
  stateBucketRegion?: pulumi.Input<string>;
  awsRegion?: string;
  alertEmail?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config('tapstack');
    const environmentSuffix =
      args.environmentSuffix ?? config.get('environmentSuffix') ?? 'dev';

    const region =
      args.awsRegion ??
      config.get('awsRegion') ??
      config.get('region') ??
      process.env.AWS_REGION ??
      'eu-west-1';

    const mergedTags: { [key: string]: string } = {
      Environment: environmentSuffix,
      Application: 'webhook-processor',
      ...(args.tags && typeof args.tags === 'object'
        ? (args.tags as { [key: string]: string })
        : {}),
    };

    const provider = new aws.Provider(
      `${name}-provider`,
      {
        region,
        defaultTags: {
          tags: mergedTags,
        },
      },
      { parent: this }
    );

    const table = new aws.dynamodb.Table(
      `webhook-events-${environmentSuffix}`,
      {
        name: `webhook-events-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'eventId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'eventId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        serverSideEncryption: {
          enabled: true,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const deadLetterQueue = new aws.sqs.Queue(
      `webhook-dlq-${environmentSuffix}`,
      {
        name: `webhook-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 14 * 24 * 60 * 60,
        kmsMasterKeyId: 'alias/aws/sqs',
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const failureTopic = new aws.sns.Topic(
      `webhook-failures-${environmentSuffix}`,
      {
        name: `webhook-failures-${environmentSuffix}`,
        kmsMasterKeyId: 'alias/aws/sns',
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const alertEmail =
      args.alertEmail ??
      config.get('alertEmail') ??
      pulumi
        .output(process.env.WEBHOOK_ALERT_EMAIL)
        .apply(value =>
          value && value.trim().length > 0 ? value : 'alerts@example.com'
        );

    new aws.sns.TopicSubscription(
      `webhook-failures-email-${environmentSuffix}`,
      {
        topic: failureTopic.arn,
        protocol: 'email',
        endpoint: alertEmail,
      },
      { parent: this, provider }
    );

    const lambdaRole = new aws.iam.Role(
      `webhook-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `webhook-lambda-dynamo-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([table.arn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                ],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `webhook-lambda-logs-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `webhook-lambda-xray-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `webhook-lambda-sqs-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([deadLetterQueue.arn]).apply(([queueArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: queueArn,
              },
            ],
          })
        ),
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `webhook-lambda-sns-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([failureTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this, provider }
    );

    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `webhook-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/webhook-processor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const lambdaFunction = new aws.lambda.Function(
      `webhook-processor-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('lib/lambda/webhook-processor'),
        }),
        memorySize: 512,
        timeout: 30,
        environment: {
          variables: {
            DYNAMODB_TABLE: table.name,
            SNS_TOPIC_ARN: failureTopic.arn,
            DLQ_URL: deadLetterQueue.id,
          },
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: mergedTags,
      },
      {
        parent: this,
        provider,
        dependsOn: [lambdaLogGroup],
      }
    );

    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `webhook-api-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const restApi = new aws.apigateway.RestApi(
      `webhook-api-${environmentSuffix}`,
      {
        name: `webhook-api-${environmentSuffix}`,
        endpointConfiguration: {
          types: ['EDGE'],
        },
        minimumCompressionSize: 1024,
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    const requestValidator = new aws.apigateway.RequestValidator(
      `webhook-request-validator-${environmentSuffix}`,
      {
        restApi: restApi.id,
        validateRequestBody: true,
        validateRequestParameters: false,
        name: `webhook-validator-${environmentSuffix}`,
      },
      { parent: this, provider }
    );

    const requestModel = new aws.apigateway.Model(
      `webhook-request-model-${environmentSuffix}`,
      {
        restApi: restApi.id,
        name: `webhook-model-${environmentSuffix}`,
        contentType: 'application/json',
        schema: JSON.stringify({
          type: 'object',
          required: ['source', 'data'],
          properties: {
            source: { type: 'string' },
            data: { type: 'object' },
          },
        }),
      },
      { parent: this, provider }
    );

    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${environmentSuffix}`,
      {
        restApi: restApi.id,
        parentId: restApi.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this, provider }
    );

    const webhookMethod = new aws.apigateway.Method(
      `webhook-method-${environmentSuffix}`,
      {
        restApi: restApi.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': requestModel.name,
        },
      },
      { parent: this, provider }
    );

    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${environmentSuffix}`,
      {
        restApi: restApi.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      },
      { parent: this, provider }
    );

    new aws.lambda.Permission(
      `webhook-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${restApi.executionArn}/*/*`,
      },
      { parent: this, provider }
    );

    const deployment = new aws.apigateway.Deployment(
      `webhook-deployment-${environmentSuffix}`,
      {
        restApi: restApi.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      { parent: this, provider, dependsOn: [webhookIntegration] }
    );

    const stage = new aws.apigateway.Stage(
      `webhook-stage-${environmentSuffix}`,
      {
        restApi: restApi.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        xrayTracingEnabled: true,
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: mergedTags,
      },
      { parent: this, provider }
    );

    new aws.apigateway.MethodSettings(
      `webhook-method-settings-${environmentSuffix}`,
      {
        restApi: restApi.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          loggingLevel: 'INFO',
          metricsEnabled: true,
          dataTraceEnabled: true,
          throttlingBurstLimit: 100,
          throttlingRateLimit: 100,
        },
      },
      { parent: this, provider }
    );

    const usagePlan = new aws.apigateway.UsagePlan(
      `webhook-usage-plan-${environmentSuffix}`,
      {
        name: `webhook-usage-plan-${environmentSuffix}`,
        quotaSettings: {
          limit: 1000,
          period: 'DAY',
        },
        throttleSettings: {
          rateLimit: 100,
          burstLimit: 50,
        },
        apiStages: [
          {
            apiId: restApi.id,
            stage: stage.stageName,
          },
        ],
      },
      { parent: this, provider }
    );

    const apiKey = new aws.apigateway.ApiKey(
      `webhook-api-key-${environmentSuffix}`,
      {
        name: `webhook-api-key-${environmentSuffix}`,
        enabled: true,
      },
      { parent: this, provider }
    );

    new aws.apigateway.UsagePlanKey(
      `webhook-usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this, provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `webhook-error-alarm-${environmentSuffix}`,
      {
        alarmName: `webhook-error-alarm-${environmentSuffix}`,
        alarmDescription:
          'Alarm when webhook processor errors exceed 5 within five minutes',
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        threshold: 5,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        statistic: 'Sum',
        period: 300,
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        alarmActions: [failureTopic.arn],
        treatMissingData: 'notBreaching',
      },
      { parent: this, provider }
    );

    this.apiUrl = pulumi.interpolate`https://${restApi.id}.execute-api.${region}.amazonaws.com/${stage.stageName}`;
    this.dynamoTableName = table.name;
    this.lambdaFunctionName = lambdaFunction.name;
    this.snsTopicArn = failureTopic.arn;
    this.dlqUrl = deadLetterQueue.id;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      dynamoTableName: this.dynamoTableName,
      lambdaFunctionName: this.lambdaFunctionName,
      snsTopicArn: this.snsTopicArn,
      dlqUrl: this.dlqUrl,
      environmentSuffix,
      region,
      stateBucket: args.stateBucket ?? config.get('stateBucket') ?? null,
      stateBucketRegion:
        args.stateBucketRegion ?? config.get('stateBucketRegion') ?? null,
    });
  }
}
