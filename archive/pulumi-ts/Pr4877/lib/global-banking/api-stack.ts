/**
 * api-stack.ts - ENHANCED VERSION
 *
 * API Gateway, Application Load Balancer, Global Accelerator
 * Lambda functions for transaction processing
 *
 * ENHANCEMENTS:
 * - Added Lambda Event Source Mappings for Kinesis streams
 * - Added Lambda Event Source Mappings for SQS queues
 * - Enhanced IAM permissions for stream/queue consumption
 * - All enhancements are OPTIONAL and backward compatible
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface ApiStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string[]>;
  privateSubnetIds: pulumi.Input<string[]>;
  ecsClusterArn: pulumi.Input<string>;
  certificateArn: pulumi.Output<string>;
  cognitoUserPoolArn: pulumi.Output<string>;
  wafWebAclArn: pulumi.Output<string>;
  domainName: string;
  regions: {
    primary: string;
    replicas: string[];
  };
  enableGlobalAccelerator: boolean;
  enableMutualTls: boolean;
  lambdaRuntime: string;
  kmsKeyId: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  secretsManagerArns: pulumi.Output<{ database: string; api: string }>;

  // ========================================
  // NEW: Optional ARNs for event source mappings
  // ========================================
  kinesisStreamArn?: pulumi.Input<string>;
  kinesisStreamName?: pulumi.Input<string>;
  transactionQueueArn?: pulumi.Input<string>;
  transactionQueueUrl?: pulumi.Input<string>;
  fraudDetectionQueueArn?: pulumi.Input<string>;
  fraudDetectionQueueUrl?: pulumi.Input<string>;

  // Optional: Enable/disable event source mappings
  enableKinesisConsumers?: boolean;
  enableSqsConsumers?: boolean;
}

export class ApiStack extends pulumi.ComponentResource {
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly apiGatewayId: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly globalAcceleratorDns: pulumi.Output<string>;
  public readonly transactionLambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:api:ApiStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      certificateArn,
      cognitoUserPoolArn,
      wafWebAclArn,
      domainName,
      regions,
      enableGlobalAccelerator,
      enableMutualTls,
      lambdaRuntime,
      kmsKeyArn,
      secretsManagerArns,
      // Event source mapping parameters (optional)
      kinesisStreamArn,
      kinesisStreamName,
      transactionQueueArn,
      transactionQueueUrl,
      fraudDetectionQueueArn,
      // fraudDetectionQueueUrl is not used but kept for future use
      enableKinesisConsumers = true,
      enableSqsConsumers = true,
    } = args;

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `alb-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        name: `banking-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        accessLogs: {
          bucket: `banking-alb-logs-${environmentSuffix}`,
          enabled: true,
          prefix: 'alb',
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `banking-alb-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Target Group for ECS
    const targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        name: `banking-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        stickiness: {
          enabled: true,
          type: 'lb_cookie',
          cookieDuration: 86400,
        },
        tags: tags,
      },
      { parent: this }
    );

    // HTTP Listener
    new aws.lb.Listener(
      `${name}-http-listener`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Check if Lambda directories exist
    const transactionLambdaPath = path.join(
      process.cwd(),
      'lambda',
      'transaction-processor'
    );
    const fraudLambdaPath = path.join(
      process.cwd(),
      'lambda',
      'fraud-detection'
    );
    const lambdaDirsExist =
      fs.existsSync(transactionLambdaPath) && fs.existsSync(fraudLambdaPath);

    // Create placeholder Lambda code if directories don't exist
    if (!lambdaDirsExist) {
      pulumi.log.warn(
        'Lambda directories not found. Creating placeholder deployments.'
      );
    }

    //  Lambda Execution Role
    const lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
        name: `banking-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: tags,
      },
      { parent: this }
    );

    // ENHANCED: Lambda permissions with Kinesis and SQS consumption

    new aws.iam.RolePolicy(
      `${name}-lambda-policy`,
      {
        role: lambdaRole.id,
        policy: secretsManagerArns.apply(arns =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:Query',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'sqs:SendMessage',
                  'sqs:ReceiveMessage',
                  'sqs:DeleteMessage', //  For consuming messages
                  'sqs:GetQueueAttributes', // For event source mappings
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'kinesis:PutRecord',
                  'kinesis:PutRecords',
                  'kinesis:GetRecords', // For consuming from stream
                  'kinesis:GetShardIterator', //  For consuming from stream
                  'kinesis:DescribeStream', // For event source mappings
                  'kinesis:ListShards', // For event source mappings
                  'kinesis:ListStreams', //  For event source mappings
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: Object.values(arns),
              },
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['frauddetector:GetEventPrediction'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-lambda-sg`,
      {
        vpcId: vpcId,
        description: 'Security group for Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `lambda-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Lambda Function: Transaction Processor
    const transactionLambda = new aws.lambda.Function(
      `${name}-transaction-lambda`,
      {
        name: `transaction-processor-${environmentSuffix}`,
        runtime: lambdaRuntime as aws.lambda.Runtime,
        handler: lambdaDirsExist
          ? 'com.banking.TransactionHandler::handleRequest'
          : 'index.handler',
        role: lambdaRole.arn,
        code: lambdaDirsExist
          ? new pulumi.asset.AssetArchive({
              '.': new pulumi.asset.FileArchive(
                './lambda/transaction-processor'
              ),
            })
          : new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(`
                exports.handler = async (event) => {
                  console.log('Placeholder Lambda - Transaction Processor');
                  console.log('Event:', JSON.stringify(event, null, 2));
                  
                  // Handle different event sources
                  if (event.Records) {
                    for (const record of event.Records) {
                      if (record.kinesis) {
                        console.log('Processing Kinesis record:', record.kinesis.sequenceNumber);
                      } else if (record.body) {
                        console.log('Processing SQS message:', record.messageId);
                      }
                    }
                  }
                  
                  return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Transaction processed' })
                  };
                };
              `),
            }),
        timeout: 30,
        memorySize: 1024,
        reservedConcurrentExecutions: 100,
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            DYNAMODB_TABLE: `transactions-${environmentSuffix}`,
            SQS_QUEUE_URL:
              transactionQueueUrl ||
              `https://sqs.${regions.primary}.amazonaws.com/transactions-${environmentSuffix}`,
            KINESIS_STREAM:
              kinesisStreamName || `transactions-stream-${environmentSuffix}`,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tracingConfig: {
          mode: 'Active',
        },
        kmsKeyArn: kmsKeyArn,
        tags: tags,
      },
      { parent: this }
    );

    // Lambda Function: Fraud Detection
    const fraudDetectionLambda = new aws.lambda.Function(
      `${name}-fraud-lambda`,
      {
        name: `fraud-detection-${environmentSuffix}`,
        runtime: lambdaRuntime as aws.lambda.Runtime,
        handler: lambdaDirsExist
          ? 'com.banking.FraudDetectionHandler::handleRequest'
          : 'index.handler',
        role: lambdaRole.arn,
        code: lambdaDirsExist
          ? new pulumi.asset.AssetArchive({
              '.': new pulumi.asset.FileArchive('./lambda/fraud-detection'),
            })
          : new pulumi.asset.AssetArchive({
              'index.js': new pulumi.asset.StringAsset(`
                exports.handler = async (event) => {
                  console.log('Placeholder Lambda - Fraud Detection');
                  console.log('Event:', JSON.stringify(event, null, 2));
                  
                  // Handle SQS messages
                  if (event.Records) {
                    for (const record of event.Records) {
                      if (record.body) {
                        console.log('Processing fraud check for message:', record.messageId);
                      }
                    }
                  }
                  
                  return {
                    statusCode: 200,
                    body: JSON.stringify({ fraudScore: 0, approved: true })
                  };
                };
              `),
            }),
        timeout: 10,
        memorySize: 2048,
        reservedConcurrentExecutions: 50,
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            FRAUD_DETECTOR_NAME: `banking-fraud-${environmentSuffix}`,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Groups for Lambdas
    new aws.cloudwatch.LogGroup(
      `${name}-transaction-log-group`,
      {
        name: pulumi.interpolate`/aws/lambda/${transactionLambda.name}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `${name}-fraud-log-group`,
      {
        name: pulumi.interpolate`/aws/lambda/${fraudDetectionLambda.name}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: tags,
      },
      { parent: this }
    );

    // NEW: Lambda Event Source Mappings

    // Event Source Mapping: Kinesis → Transaction Lambda
    if (enableKinesisConsumers && kinesisStreamArn) {
      new aws.lambda.EventSourceMapping(
        `${name}-kinesis-transaction-mapping`,
        {
          functionName: transactionLambda.name,
          eventSourceArn: kinesisStreamArn,
          startingPosition: 'LATEST',
          batchSize: 100,
          maximumBatchingWindowInSeconds: 5,
          parallelizationFactor: 10,
          bisectBatchOnFunctionError: true,
          maximumRetryAttempts: 2,
          maximumRecordAgeInSeconds: 604800, // 7 days
          enabled: true,
          functionResponseTypes: ['ReportBatchItemFailures'],
        },
        { parent: this, dependsOn: [transactionLambda] }
      );

      pulumi.log.info(
        ` Created Kinesis event source mapping for ${transactionLambda.name}`
      );
    } else if (enableKinesisConsumers && !kinesisStreamArn) {
      pulumi.log.warn(
        '  enableKinesisConsumers is true but kinesisStreamArn not provided. Skipping Kinesis event source mapping.'
      );
    }

    // Event Source Mapping: SQS Transaction Queue → Transaction Lambda
    if (enableSqsConsumers && transactionQueueArn) {
      new aws.lambda.EventSourceMapping(
        `${name}-sqs-transaction-mapping`,
        {
          functionName: transactionLambda.name,
          eventSourceArn: transactionQueueArn,
          batchSize: 10,
          // Removed: maximumBatchingWindowInSeconds: 5,
          functionResponseTypes: ['ReportBatchItemFailures'],
          enabled: true,
        },
        { parent: this, dependsOn: [transactionLambda] }
      );

      pulumi.log.info(
        ` Created SQS event source mapping for ${transactionLambda.name} (Transaction Queue)`
      );
    } else if (enableSqsConsumers && !transactionQueueArn) {
      pulumi.log.warn(
        '  enableSqsConsumers is true but transactionQueueArn not provided. Skipping SQS transaction queue mapping.'
      );
    }

    // Event Source Mapping: SQS Fraud Detection Queue → Fraud Lambda
    if (enableSqsConsumers && fraudDetectionQueueArn) {
      new aws.lambda.EventSourceMapping(
        `${name}-sqs-fraud-mapping`,
        {
          functionName: fraudDetectionLambda.name,
          eventSourceArn: fraudDetectionQueueArn,
          batchSize: 5,
          // Removed: maximumBatchingWindowInSeconds: 10,
          functionResponseTypes: ['ReportBatchItemFailures'],
          enabled: true,
        },
        { parent: this, dependsOn: [fraudDetectionLambda] }
      );

      pulumi.log.info(
        ` Created SQS event source mapping for ${fraudDetectionLambda.name} (Fraud Detection Queue)`
      );
    } else if (enableSqsConsumers && !fraudDetectionQueueArn) {
      pulumi.log.warn(
        '  enableSqsConsumers is true but fraudDetectionQueueArn not provided. Skipping SQS fraud detection queue mapping.'
      );
    }

    //  API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `${name}-api`,
      {
        name: `banking-api-${environmentSuffix}`,
        description: 'Banking Platform API Gateway',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: 'execute-api:Invoke',
              Resource: '*',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    //  API Gateway: /transactions resource
    const transactionsResource = new aws.apigateway.Resource(
      `${name}-transactions-resource`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'transactions',
      },
      { parent: this }
    );

    // Cognito Authorizer
    const cognitoAuthorizer = new aws.apigateway.Authorizer(
      `${name}-cognito-authorizer`,
      {
        name: `cognito-authorizer-${environmentSuffix}`,
        restApi: api.id,
        type: 'COGNITO_USER_POOLS',
        providerArns: [cognitoUserPoolArn],
        identitySource: 'method.request.header.Authorization',
      },
      { parent: this }
    );

    // Request Validator
    const requestValidator = new aws.apigateway.RequestValidator(
      `${name}-request-validator`,
      {
        restApi: api.id,
        name: `request-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    //  POST Method (must be created BEFORE Integration)
    const postMethod = new aws.apigateway.Method(
      `${name}-post-method`,
      {
        restApi: api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'POST',
        authorization: 'COGNITO_USER_POOLS',
        authorizerId: cognitoAuthorizer.id,
        requestValidatorId: requestValidator.id,
      },
      { parent: this }
    );

    // Lambda Integration (depends on Method)
    const transactionIntegration = new aws.apigateway.Integration(
      `${name}-transaction-integration`,
      {
        restApi: api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'POST',
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: transactionLambda.invokeArn,
      },
      { parent: this, dependsOn: [postMethod] }
    );

    //  Lambda Permission for API Gateway
    new aws.lambda.Permission(
      `${name}-api-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: transactionLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for API Gateway access logs (created before Stage)
    const apiAccessLogGroup = new aws.cloudwatch.LogGroup(
      `${name}-api-access-logs`,
      {
        name: `/aws/apigateway/banking-${environmentSuffix}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: tags,
      },
      { parent: this }
    );

    //  API Gateway Deployment
    const deployment = new aws.apigateway.Deployment(
      `${name}-deployment`,
      {
        restApi: api.id,
        description: `Deployment for ${environmentSuffix}`,
        triggers: {
          redeployment: pulumi
            .all([postMethod.id, transactionIntegration.id])
            .apply(
              ([methodId, integrationId]) => `${methodId}-${integrationId}`
            ),
        },
      },
      {
        parent: this,
        dependsOn: [postMethod, transactionIntegration],
        replaceOnChanges: ['triggers'],
      }
    );

    //  API Gateway Stage - FIXED: Removed ignoreChanges
    const stage = new aws.apigateway.Stage(
      `${name}-stage`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        description: `Production stage for ${environmentSuffix}`,
        xrayTracingEnabled: true,
        accessLogSettings: {
          destinationArn: apiAccessLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            caller: '$context.identity.caller',
            user: '$context.identity.user',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [deployment, apiAccessLogGroup],
      }
    );

    // Usage Plan
    const usagePlan = new aws.apigateway.UsagePlan(
      `${name}-usage-plan`,
      {
        name: `banking-usage-plan-${environmentSuffix}`,
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          rateLimit: 10000,
          burstLimit: 20000,
        },
        quotaSettings: {
          limit: 1000000,
          period: 'DAY',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [stage] }
    );

    //  API Key
    const apiKey = new aws.apigateway.ApiKey(
      `${name}-api-key`,
      {
        name: `banking-api-key-${environmentSuffix}`,
        enabled: true,
        tags: tags,
      },
      { parent: this }
    );

    new aws.apigateway.UsagePlanKey(
      `${name}-usage-plan-key`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // Custom Domain (if mutual TLS enabled)
    let customDomain: aws.apigateway.DomainName | undefined;
    if (enableMutualTls) {
      customDomain = new aws.apigateway.DomainName(
        `${name}-custom-domain`,
        {
          domainName: `api.${domainName}`,
          regionalCertificateArn: certificateArn,
          endpointConfiguration: {
            types: 'REGIONAL',
          },
          securityPolicy: 'TLS_1_2',
          mutualTlsAuthentication: {
            truststoreUri: `s3://banking-mtls-${environmentSuffix}/truststore.pem`,
          },
          tags: tags,
        },
        { parent: this }
      );

      new aws.apigateway.BasePathMapping(
        `${name}-base-path-mapping`,
        {
          restApi: api.id,
          stageName: stage.stageName,
          domainName: customDomain.domainName,
        },
        { parent: this, dependsOn: [stage] }
      );
    }

    //  WAF Association
    new aws.wafv2.WebAclAssociation(
      `${name}-waf-association`,
      {
        resourceArn: stage.arn,
        webAclArn: wafWebAclArn,
      },
      { parent: this, dependsOn: [stage] }
    );

    // Global Accelerator (if enabled)
    let globalAccelerator: aws.globalaccelerator.Accelerator | undefined;
    let globalAcceleratorDns: pulumi.Output<string>;

    if (enableGlobalAccelerator) {
      globalAccelerator = new aws.globalaccelerator.Accelerator(
        `${name}-accelerator`,
        {
          name: `banking-accelerator-${environmentSuffix}`,
          ipAddressType: 'IPV4',
          enabled: true,
          attributes: {
            flowLogsEnabled: false,
          },
          tags: tags,
        },
        { parent: this }
      );

      const listener = new aws.globalaccelerator.Listener(
        `${name}-accelerator-listener`,
        {
          acceleratorArn: globalAccelerator.id,
          protocol: 'TCP',
          portRanges: [
            {
              fromPort: 443,
              toPort: 443,
            },
          ],
        },
        { parent: this }
      );

      new aws.globalaccelerator.EndpointGroup(
        `${name}-endpoint-group`,
        {
          listenerArn: listener.id,
          endpointGroupRegion: regions.primary,
          healthCheckIntervalSeconds: 30,
          healthCheckPath: '/health',
          healthCheckPort: 443,
          healthCheckProtocol: 'HTTPS',
          thresholdCount: 3,
          trafficDialPercentage: 100,
          endpointConfigurations: [
            {
              endpointId: alb.arn,
              weight: 100,
              clientIpPreservationEnabled: true,
            },
          ],
        },
        { parent: this }
      );

      globalAcceleratorDns = globalAccelerator.dnsName;
    } else {
      globalAcceleratorDns = pulumi.output('not-enabled');
    }

    //  Route 53 DNS Records
    const domainParts = domainName.split('.');
    const baseDomain = domainParts.slice(-2).join('.');

    // Only create DNS records if this is a real domain
    if (baseDomain !== 'example.com') {
      const hostedZone = aws.route53.getZoneOutput({
        name: baseDomain,
        privateZone: false,
      });

      new aws.route53.Record(
        `${name}-alb-record`,
        {
          zoneId: hostedZone.zoneId,
          name: `api.${domainName}`,
          type: 'A',
          aliases: [
            {
              name: alb.dnsName,
              zoneId: alb.zoneId,
              evaluateTargetHealth: true,
            },
          ],
        },
        { parent: this }
      );

      // Health check for Route 53
      new aws.route53.HealthCheck(
        `${name}-health-check`,
        {
          type: 'HTTPS',
          resourcePath: '/health',
          fqdn: alb.dnsName,
          port: 443,
          requestInterval: 30,
          failureThreshold: 3,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `alb-health-check-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
    }

    // Outputs
    this.apiGatewayUrl = pulumi.interpolate`${api.id}.execute-api.${regions.primary}.amazonaws.com/${stage.stageName}`;
    this.apiGatewayId = api.id;
    this.loadBalancerDns = alb.dnsName;
    this.loadBalancerArn = alb.arn;
    this.globalAcceleratorDns = globalAcceleratorDns;
    this.transactionLambdaArn = transactionLambda.arn;

    this.registerOutputs({
      apiGatewayUrl: this.apiGatewayUrl,
      apiGatewayId: this.apiGatewayId,
      loadBalancerDns: this.loadBalancerDns,
      loadBalancerArn: this.loadBalancerArn,
      globalAcceleratorDns: this.globalAcceleratorDns,
      transactionLambdaArn: this.transactionLambdaArn,
    });
  }
}
