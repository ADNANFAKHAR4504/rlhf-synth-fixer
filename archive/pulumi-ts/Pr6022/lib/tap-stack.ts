import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface TapStackProps {
  tags?: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly apiKeyValue: pulumi.Output<string>;
  public readonly apiKeyId: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly usagePlanId: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;

  constructor(name: string, props?: TapStackProps) {
    super('custom:TapStack', name, {}, {});

    const config = new pulumi.Config();
    const environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

    // S3 Bucket for audit logs
    const auditBucket = new aws.s3.Bucket(
      `audit-bucket-${environmentSuffix}`,
      {
        bucket: `audit-logs-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'glacier-transition',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: {
          ...props?.tags,
          Name: `audit-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // DynamoDB Table for transactions
    const transactionsTable = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          ...props?.tags,
          Name: `transactions-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Dead Letter Queues for Lambda functions
    const validatorDlq = new aws.sqs.Queue(
      `validator-dlq-${environmentSuffix}`,
      {
        name: `validator-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...props?.tags,
          Name: `validator-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processorDlq = new aws.sqs.Queue(
      `processor-dlq-${environmentSuffix}`,
      {
        name: `processor-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: {
          ...props?.tags,
          Name: `processor-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const notifierDlq = new aws.sqs.Queue(
      `notifier-dlq-${environmentSuffix}`,
      {
        name: `notifier-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: {
          ...props?.tags,
          Name: `notifier-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/validator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `validator-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/processor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `processor-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const notifierLogGroup = new aws.cloudwatch.LogGroup(
      `notifier-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/notifier-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `notifier-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Role for Validator Lambda
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        name: `validator-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `validator-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `validator-basic-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `validator-xray-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `validator-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: [validatorDlq.arn],
            },
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction'],
              Resource: ['*'],
            },
          ],
        },
      },
      { parent: this }
    );

    // IAM Role for Processor Lambda
    const processorRole = new aws.iam.Role(
      `processor-role-${environmentSuffix}`,
      {
        name: `processor-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `processor-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `processor-basic-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `processor-xray-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `processor-policy-${environmentSuffix}`,
      {
        name: `processor-policy-${environmentSuffix}`,
        role: processorRole.id,
        policy: pulumi
          .all([transactionsTable.arn, auditBucket.arn, processorDlq.arn])
          .apply(([tableArn, bucketArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:GetItem',
                  ],
                  Resource: [tableArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: [`${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: [dlqArn],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for Notifier Lambda
    const notifierRole = new aws.iam.Role(
      `notifier-role-${environmentSuffix}`,
      {
        name: `notifier-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `notifier-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `notifier-basic-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `notifier-xray-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `notifier-policy-${environmentSuffix}`,
      {
        role: notifierRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: [notifierDlq.arn],
            },
          ],
        },
      },
      { parent: this }
    );

    // Lambda Functions
    const validatorFunction = new aws.lambda.Function(
      `validator-${environmentSuffix}`,
      {
        name: `validator-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.CustomAL2023,
        handler: 'bootstrap',
        role: validatorRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/validator/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 10,
        deadLetterConfig: {
          targetArn: validatorDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `validator-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    const processorFunction = new aws.lambda.Function(
      `processor-${environmentSuffix}`,
      {
        name: `processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.CustomAL2023,
        handler: 'bootstrap',
        role: processorRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/processor/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 10,
        deadLetterConfig: {
          targetArn: processorDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            DYNAMODB_TABLE: transactionsTable.name,
            S3_BUCKET: auditBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `processor-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    new aws.lambda.Function(
      `notifier-${environmentSuffix}`,
      {
        name: `notifier-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.CustomAL2023,
        handler: 'bootstrap',
        role: notifierRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/notifier/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 10,
        deadLetterConfig: {
          targetArn: notifierDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `notifier-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [notifierLogGroup] }
    );

    // Lambda Event Invoke Config for Destinations
    new aws.lambda.FunctionEventInvokeConfig(
      `validator-destination-${environmentSuffix}`,
      {
        functionName: validatorFunction.name,
        destinationConfig: {
          onSuccess: {
            destination: processorFunction.arn,
          },
        },
      },
      { parent: this }
    );

    // Permission for validator to invoke processor
    new aws.lambda.Permission(
      `processor-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: processorFunction.name,
        principal: 'lambda.amazonaws.com',
        sourceArn: validatorFunction.arn,
      },
      { parent: this }
    );

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: `transaction-api-${environmentSuffix}`,
        description: 'Transaction Processing API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          ...props?.tags,
          Name: `transaction-api-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // API Gateway Resource
    const transactionResource = new aws.apigateway.Resource(
      `transaction-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'transaction',
      },
      { parent: this }
    );

    // Request Validator
    const requestValidator = new aws.apigateway.RequestValidator(
      `request-validator-${environmentSuffix}`,
      {
        restApi: api.id,
        name: `transaction-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    // API Gateway Method
    const postMethod = new aws.apigateway.Method(
      `post-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        apiKeyRequired: true,
        requestValidatorId: requestValidator.id,
      },
      { parent: this }
    );

    // Lambda Integration
    const lambdaIntegration = new aws.apigateway.Integration(
      `validator-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorFunction.invokeArn,
      },
      { parent: this }
    );

    // Method Response
    new aws.apigateway.MethodResponse(
      `method-response-200-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '200',
        responseModels: {
          'application/json': 'Empty',
        },
      },
      { parent: this }
    );

    new aws.apigateway.MethodResponse(
      `method-response-400-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '400',
        responseModels: {
          'application/json': 'Error',
        },
      },
      { parent: this }
    );

    new aws.apigateway.MethodResponse(
      `method-response-500-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '500',
        responseModels: {
          'application/json': 'Error',
        },
      },
      { parent: this }
    );

    // Lambda Permission for API Gateway
    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      {
        parent: this,
        dependsOn: [postMethod, lambdaIntegration],
      }
    );

    // API Stage
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags: {
          ...props?.tags,
          Name: `api-stage-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Usage Plan
    const usagePlan = new aws.apigateway.UsagePlan(
      `usage-plan-${environmentSuffix}`,
      {
        name: `transaction-usage-plan-${environmentSuffix}`,
        description: 'Usage plan for transaction API',
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          burstLimit: 1000,
          rateLimit: 500,
        },
        quotaSettings: {
          limit: 100000,
          period: 'DAY',
        },
        tags: {
          ...props?.tags,
          Name: `usage-plan-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // API Key
    const apiKey = new aws.apigateway.ApiKey(
      `api-key-${environmentSuffix}`,
      {
        name: `transaction-api-key-${environmentSuffix}`,
        enabled: true,
        tags: {
          ...props?.tags,
          Name: `api-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Usage Plan Key
    new aws.apigateway.UsagePlanKey(
      `usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // Exports
    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}`;
    this.apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/transaction`;
    this.tableName = transactionsTable.name;
    this.bucketName = auditBucket.bucket;
    this.apiKeyValue = apiKey.value;
    this.apiKeyId = apiKey.id;
    this.apiId = api.id;
    this.usagePlanId = usagePlan.id;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiEndpoint: this.apiEndpoint,
      tableName: this.tableName,
      bucketName: this.bucketName,
      apiKeyValue: this.apiKeyValue,
      apiKeyId: this.apiKeyId,
      apiId: this.apiId,
      usagePlanId: this.usagePlanId,
    });
  }
}
