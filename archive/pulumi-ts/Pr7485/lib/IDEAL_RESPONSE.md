# Multi-Environment Payment Processing System - Ideal Implementation

This document contains the corrected implementation of the multi-environment payment processing system using Pulumi TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface PaymentProcessorArgs {
  environment: string;
  environmentSuffix: string;
  region: string;
  lambdaMemory: number;
  lambdaConcurrency: number;
  enablePitr: boolean;
  dlqRetries: number;
  notificationEmail: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<pulumi.Input<string>[]>;
}

class PaymentProcessor extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly topic: aws.sns.Topic;
  public readonly lambda: aws.lambda.Function;
  public readonly dlq: aws.sqs.Queue;

  constructor(
    name: string,
    args: PaymentProcessorArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:PaymentProcessor', name, {}, opts);

    const resourceOpts = { parent: this };

    // Dead Letter Queue
    this.dlq = new aws.sqs.Queue(
      `payment-dlq-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-dlq-${args.environment}-${args.environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // DynamoDB Table for transactions
    this.table = new aws.dynamodb.Table(
      `payment-transactions-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-transactions-${args.environment}-${args.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'customerId', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'CustomerIndex',
            hashKey: 'customerId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        pointInTimeRecovery: {
          enabled: args.enablePitr,
        },
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // SNS Topic for notifications
    this.topic = new aws.sns.Topic(
      `payment-notifications-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-notifications-${args.environment}-${args.environmentSuffix}`,
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // SNS Email Subscription
    new aws.sns.TopicSubscription(
      `payment-email-${args.environment}-${args.environmentSuffix}`,
      {
        topic: this.topic.arn,
        protocol: 'email',
        endpoint: args.notificationEmail,
      },
      resourceOpts
    );

    // Security Group for Lambda
    const lambdaSg = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-lambda-sg-${args.environment}-${args.environmentSuffix}`,
        description: 'Security group for payment processor Lambda',
        vpcId: args.vpcId,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Lambda IAM Role
    const lambdaRole = new aws.iam.Role(
      `payment-lambda-role-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-lambda-role-${args.environment}-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Lambda IAM Policy for DynamoDB, SNS, and SQS access
    const lambdaPolicy = new aws.iam.RolePolicy(
      `payment-lambda-policy-${args.environment}-${args.environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([this.table.arn, this.topic.arn, this.dlq.arn])
          .apply(([tableArn, topicArn, dlqArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: [tableArn, `${tableArn}/index/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: dlqArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                    'ec2:DeleteNetworkInterface',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      resourceOpts
    );

    // Lambda Function
    this.lambda = new aws.lambda.Function(
      `payment-processor-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-processor-${args.environment}-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        architectures: ['arm64'],
        memorySize: args.lambdaMemory,
        timeout: 30,
        reservedConcurrentExecutions: args.lambdaConcurrency,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log("Processing payment:", JSON.stringify(event));

  const transactionId = event.transactionId || \`txn-\${Date.now()}\`;
  const customerId = event.customerId || "unknown";
  const amount = event.amount || 0;
  const timestamp = Date.now();

  try {
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        customerId: { S: customerId },
        amount: { N: amount.toString() },
        status: { S: "processed" },
        processedAt: { S: new Date().toISOString() }
      }
    }));

    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Subject: \`Payment Processed: \${transactionId}\`,
      Message: JSON.stringify({
        transactionId,
        customerId,
        amount,
        status: "processed",
        timestamp: new Date().toISOString()
      }, null, 2)
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Payment processed successfully",
        transactionId
      })
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(`
{
  "name": "payment-processor",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  }
}
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: this.table.name,
            TOPIC_ARN: this.topic.arn,
            DLQ_ARN: this.dlq.arn,
            ENVIRONMENT: args.environment,
          },
        },
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [lambdaSg.id],
        },
        deadLetterConfig: {
          targetArn: this.dlq.arn,
        },
        tags: {
          Environment: args.environment,
          ManagedBy: 'Pulumi',
        },
      },
      { ...resourceOpts, dependsOn: [lambdaPolicy] }
    );

    this.registerOutputs({
      tableArn: this.table.arn,
      topicArn: this.topic.arn,
      lambdaArn: this.lambda.arn,
      dlqArn: this.dlq.arn,
    });
  }
}

export class TapStack extends pulumi.ComponentResource {
  public readonly processor: PaymentProcessor;
  public readonly vpc: aws.ec2.Vpc;
  public readonly dynamodbEndpoint: aws.ec2.VpcEndpoint;
  public readonly snsEndpoint: aws.ec2.VpcEndpoint;

  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super('custom:tap:TapStack', name, {}, opts);

    const config = new pulumi.Config();
    const environment = pulumi.getStack();
    const environmentSuffix = config.require('environmentSuffix');
    const region = config.require('region');
    const lambdaMemory = config.requireNumber('lambdaMemory');
    const lambdaConcurrency = config.requireNumber('lambdaConcurrency');
    const enablePitr = config.requireBoolean('enablePitr');
    const dlqRetries = config.requireNumber('dlqRetries');
    const notificationEmail = config.require('notificationEmail');

    const resourceOpts = { parent: this };

    // VPC for Lambda
    this.vpc = new aws.ec2.Vpc(
      `tap-vpc-${environment}-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `tap-vpc-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Private Subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-1-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${region}a`,
        tags: {
          Name: `payment-private-subnet-1-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-2-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${region}b`,
        tags: {
          Name: `payment-private-subnet-2-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Route Table for Private Subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `payment-private-rt-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-private-rt-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    new aws.ec2.RouteTableAssociation(
      `payment-private-rta-1-${environment}-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      resourceOpts
    );

    new aws.ec2.RouteTableAssociation(
      `payment-private-rta-2-${environment}-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      resourceOpts
    );

    // VPC Endpoint for DynamoDB
    this.dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `payment-dynamodb-endpoint-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${region}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: {
          Name: `payment-dynamodb-endpoint-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Security Group for VPC Endpoints
    const endpointSg = new aws.ec2.SecurityGroup(
      `payment-endpoint-sg-${environment}-${environmentSuffix}`,
      {
        name: `payment-endpoint-sg-${environment}-${environmentSuffix}`,
        description: 'Security group for VPC endpoints',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [this.vpc.cidrBlock],
          },
        ],
        tags: {
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // VPC Endpoint for SNS
    this.snsEndpoint = new aws.ec2.VpcEndpoint(
      `payment-sns-endpoint-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${region}.sns`,
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [endpointSg.id],
        tags: {
          Name: `payment-sns-endpoint-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      resourceOpts
    );

    // Payment Processor Component
    this.processor = new PaymentProcessor(
      `payment-processor-${environment}`,
      {
        environment,
        environmentSuffix,
        region,
        lambdaMemory,
        lambdaConcurrency,
        enablePitr,
        dlqRetries,
        notificationEmail,
        vpcId: this.vpc.id,
        privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
      },
      { ...resourceOpts, dependsOn: [this.dynamodbEndpoint, this.snsEndpoint] }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      tableArn: this.processor.table.arn,
      tableName: this.processor.table.name,
      topicArn: this.processor.topic.arn,
      lambdaArn: this.processor.lambda.arn,
      lambdaName: this.processor.lambda.name,
      dlqArn: this.processor.dlq.arn,
    });
  }
}
```

## Key Features

1. **PaymentProcessor ComponentResource**: Reusable component encapsulating Lambda, DynamoDB, SNS, and SQS resources
2. **Multi-Environment Support**: Configuration-driven deployment with environment-specific settings
3. **VPC Integration**: Private subnets with VPC endpoints for DynamoDB (Gateway) and SNS (Interface)
4. **ARM64 Architecture**: Lambda configured with ARM64 for cost efficiency
5. **Dead Letter Queue**: SQS DLQ for failed Lambda invocations
6. **Proper IAM Policies**: Least-privilege access for Lambda to DynamoDB, SNS, SQS, and VPC networking
7. **Environment Variables**: DLQ_ARN included for Lambda error handling visibility
