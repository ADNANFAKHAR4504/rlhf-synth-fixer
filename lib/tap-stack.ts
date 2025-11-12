/**
 * tap-stack.ts
 *
 * Payment Processing Pipeline Infrastructure
 * Creates a serverless pipeline for processing payment webhooks with fraud detection
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly topicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get current region and account ID
    const regionName = aws.getRegionOutput({}, { parent: this }).name;
    const accountId = aws.getCallerIdentityOutput(
      {},
      { parent: this }
    ).accountId;
    const azs = aws.getAvailabilityZonesOutput(
      { state: 'available' },
      { parent: this }
    );

    // KMS Key for encryption with proper CloudWatch Logs permissions
    const kmsKey = new aws.kms.Key(
      `payment-kms-${environmentSuffix}`,
      {
        description: 'KMS key for payment processing pipeline encryption',
        enableKeyRotation: true,
        policy: pulumi.all([regionName, accountId]).apply(([region, account]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${account}:root` },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: { Service: `logs.${region}.amazonaws.com` },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${account}:log-group:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: { ...tags, Name: `payment-kms-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-processing-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // VPC for Lambda functions
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `payment-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Private subnets for Lambda functions (use dynamic AZs)
    const privateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: azs.names[0],
        tags: {
          ...tags,
          Name: `payment-private-subnet-1-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: azs.names[1],
        tags: {
          ...tags,
          Name: `payment-private-subnet-2-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment processing Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...tags, Name: `payment-lambda-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Security group for VPC Endpoints
    const vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-vpc-endpoint-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [vpc.cidrBlock],
            description: 'Allow HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...tags, Name: `payment-vpc-endpoint-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // VPC Endpoints for AWS services (allows Lambda in private subnets to access AWS services)
    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `payment-dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${regionName}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [vpc.mainRouteTableId],
        tags: {
          ...tags,
          Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this, ignoreChanges: ['routeTableIds'] }
    );

    const snsEndpoint = new aws.ec2.VpcEndpoint(
      `payment-sns-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${regionName}.sns`,
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [vpcEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `payment-sns-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const sqsEndpoint = new aws.ec2.VpcEndpoint(
      `payment-sqs-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${regionName}.sqs`,
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [vpcEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `payment-sqs-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // DynamoDB table for transaction storage
    const transactionsTable = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: { enabled: true },
        tags: { ...tags, Name: `transactions-${environmentSuffix}` },
      },
      { parent: this }
    );

    // SNS Topic for payment events
    const paymentTopic = new aws.sns.Topic(
      `payment-events-${environmentSuffix}`,
      {
        name: `payment-events-${environmentSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: { ...tags, Name: `payment-events-${environmentSuffix}` },
      },
      { parent: this }
    );

    // SQS Queue 1 - Transaction Recording
    const transactionQueue = new aws.sqs.Queue(
      `transaction-queue-${environmentSuffix}`,
      {
        name: `transaction-queue-${environmentSuffix}`,
        messageRetentionSeconds: 604800, // 7 days
        visibilityTimeoutSeconds: 300,
        kmsMasterKeyId: kmsKey.id,
        tags: { ...tags, Name: `transaction-queue-${environmentSuffix}` },
      },
      { parent: this }
    );

    // SQS Queue 2 - Fraud Detection
    const fraudQueue = new aws.sqs.Queue(
      `fraud-queue-${environmentSuffix}`,
      {
        name: `fraud-queue-${environmentSuffix}`,
        messageRetentionSeconds: 604800, // 7 days
        visibilityTimeoutSeconds: 300,
        kmsMasterKeyId: kmsKey.id,
        tags: { ...tags, Name: `fraud-queue-${environmentSuffix}` },
      },
      { parent: this }
    );

    // SNS Topic Subscriptions
    new aws.sns.TopicSubscription(
      `transaction-subscription-${environmentSuffix}`,
      {
        topic: paymentTopic.arn,
        protocol: 'sqs',
        endpoint: transactionQueue.arn,
      },
      { parent: this }
    );

    new aws.sns.TopicSubscription(
      `fraud-subscription-${environmentSuffix}`,
      {
        topic: paymentTopic.arn,
        protocol: 'sqs',
        endpoint: fraudQueue.arn,
      },
      { parent: this }
    );

    // SQS Queue Policies
    new aws.sqs.QueuePolicy(
      `transaction-queue-policy-${environmentSuffix}`,
      {
        queueUrl: transactionQueue.url,
        policy: pulumi
          .all([transactionQueue.arn, paymentTopic.arn])
          .apply(([queueArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'sns.amazonaws.com' },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: { ArnEquals: { 'aws:SourceArn': topicArn } },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    new aws.sqs.QueuePolicy(
      `fraud-queue-policy-${environmentSuffix}`,
      {
        queueUrl: fraudQueue.url,
        policy: pulumi
          .all([fraudQueue.arn, paymentTopic.arn])
          .apply(([queueArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'sns.amazonaws.com' },
                  Action: 'sqs:SendMessage',
                  Resource: queueArn,
                  Condition: { ArnEquals: { 'aws:SourceArn': topicArn } },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for webhook-processor Lambda
    const webhookRole = new aws.iam.Role(
      `webhook-processor-role-${environmentSuffix}`,
      {
        name: `webhook-processor-role-${environmentSuffix}`,
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
        tags: { ...tags, Name: `webhook-processor-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach policies for webhook processor
    new aws.iam.RolePolicyAttachment(
      `webhook-vpc-policy-${environmentSuffix}`,
      {
        role: webhookRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `webhook-sns-policy-${environmentSuffix}`,
      {
        role: webhookRole.id,
        policy: pulumi
          .all([paymentTopic.arn, kmsKey.arn])
          .apply(([topicArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for transaction-recorder Lambda
    const transactionRole = new aws.iam.Role(
      `transaction-recorder-role-${environmentSuffix}`,
      {
        name: `transaction-recorder-role-${environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `transaction-recorder-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `transaction-vpc-policy-${environmentSuffix}`,
      {
        role: transactionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `transaction-dynamodb-policy-${environmentSuffix}`,
      {
        role: transactionRole.id,
        policy: pulumi
          .all([transactionsTable.arn, transactionQueue.arn, kmsKey.arn])
          .apply(([tableArn, queueArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for fraud-detector Lambda
    const fraudRole = new aws.iam.Role(
      `fraud-detector-role-${environmentSuffix}`,
      {
        name: `fraud-detector-role-${environmentSuffix}`,
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
        tags: { ...tags, Name: `fraud-detector-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `fraud-vpc-policy-${environmentSuffix}`,
      {
        role: fraudRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `fraud-sqs-policy-${environmentSuffix}`,
      {
        role: fraudRole.id,
        policy: pulumi
          .all([fraudQueue.arn, kmsKey.arn])
          .apply(([queueArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const webhookLogGroup = new aws.cloudwatch.LogGroup(
      `webhook-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/webhook-processor-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: { ...tags, Name: `webhook-processor-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    const transactionLogGroup = new aws.cloudwatch.LogGroup(
      `transaction-recorder-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/transaction-recorder-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: {
          ...tags,
          Name: `transaction-recorder-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const fraudLogGroup = new aws.cloudwatch.LogGroup(
      `fraud-detector-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/fraud-detector-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: { ...tags, Name: `fraud-detector-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Lambda Functions
    const webhookProcessor = new aws.lambda.Function(
      `webhook-processor-${environmentSuffix}`,
      {
        name: `webhook-processor-${environmentSuffix}`,
        runtime: 'provided.al2',
        handler: 'bootstrap',
        role: webhookRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/webhook-processor/bootstrap')
          ),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: paymentTopic.arn,
            ENVIRONMENT: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        reservedConcurrentExecutions: 100,
        timeout: 30,
        tags: { ...tags, Name: `webhook-processor-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [webhookLogGroup, snsEndpoint] }
    );

    const transactionRecorder = new aws.lambda.Function(
      `transaction-recorder-${environmentSuffix}`,
      {
        name: `transaction-recorder-${environmentSuffix}`,
        runtime: 'provided.al2',
        handler: 'bootstrap',
        role: transactionRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/transaction-recorder/bootstrap')
          ),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE: transactionsTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        reservedConcurrentExecutions: 100,
        timeout: 30,
        tags: { ...tags, Name: `transaction-recorder-${environmentSuffix}` },
      },
      {
        parent: this,
        dependsOn: [transactionLogGroup, sqsEndpoint, dynamodbEndpoint],
      }
    );

    const fraudDetector = new aws.lambda.Function(
      `fraud-detector-${environmentSuffix}`,
      {
        name: `fraud-detector-${environmentSuffix}`,
        runtime: 'provided.al2',
        handler: 'bootstrap',
        role: fraudRole.arn,
        code: new pulumi.asset.AssetArchive({
          bootstrap: new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/fraud-detector/bootstrap')
          ),
        }),
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        reservedConcurrentExecutions: 100,
        timeout: 30,
        tags: { ...tags, Name: `fraud-detector-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [fraudLogGroup, sqsEndpoint] }
    );

    // Event Source Mappings
    new aws.lambda.EventSourceMapping(
      `transaction-queue-mapping-${environmentSuffix}`,
      {
        eventSourceArn: transactionQueue.arn,
        functionName: transactionRecorder.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    new aws.lambda.EventSourceMapping(
      `fraud-queue-mapping-${environmentSuffix}`,
      {
        eventSourceArn: fraudQueue.arn,
        functionName: fraudDetector.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        description: 'REST API for payment webhook processing',
        tags: { ...tags, Name: `payment-api-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this }
    );

    // POST method on /webhook
    const webhookMethod = new aws.apigateway.Method(
      `webhook-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration
    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: webhookProcessor.invokeArn,
      },
      { parent: this }
    );

    // Deploy API with throttling settings
    const deployment = new aws.apigateway.Deployment(
      `payment-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [webhookMethod, webhookIntegration] }
    );

    // Stage settings with throttling
    const stage = new aws.apigateway.Stage(
      `payment-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        tags: { ...tags, Name: `payment-stage-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Method settings for throttling
    new aws.apigateway.MethodSettings(
      `webhook-throttling-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 2000,
        },
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `api-invoke-webhook-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: webhookProcessor.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Outputs
    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${regionName}.amazonaws.com/${stage.stageName}`;
    this.tableName = transactionsTable.name;
    this.topicArn = paymentTopic.arn;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      topicArn: this.topicArn,
      webhookEndpoint: pulumi.interpolate`https://${api.id}.execute-api.${regionName}.amazonaws.com/${stage.stageName}/webhook`,
    });
  }
}
