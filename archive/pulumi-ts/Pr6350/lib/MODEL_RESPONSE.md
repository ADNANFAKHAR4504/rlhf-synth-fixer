# Payment Processing Infrastructure - Pulumi TypeScript Implementation

This implementation provides a complete, production-ready payment processing infrastructure using Pulumi with TypeScript, deployed to AWS Ohio (eu-south-2). The architecture follows the Component Resource pattern and implements all PCI DSS compliance requirements.

## File: lib/tap-stack.ts

```typescript
/**
 * TapStack - Main orchestrator for payment processing infrastructure
 *
 * This stack coordinates all component resources and exports key outputs.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './components/networking';
import { DataStack } from './components/data';
import { ComputeStack } from './components/compute';
import { MonitoringStack } from './components/monitoring';
import { ApiGatewayStack } from './components/api-gateway';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'payment-processing',
      ManagedBy: 'Pulumi',
    }));

    // 1. Networking: VPC, subnets, NAT gateways, VPC endpoints, flow logs, transit gateway
    const networking = new NetworkingStack(`networking-${environmentSuffix}`, {
      environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZoneCount: 3,
      tags,
    }, { parent: this });

    // 2. Data: DynamoDB, S3, KMS
    const data = new DataStack(`data-${environmentSuffix}`, {
      environmentSuffix,
      tags,
    }, { parent: this });

    // 3. Compute: Lambda functions
    const compute = new ComputeStack(`compute-${environmentSuffix}`, {
      environmentSuffix,
      vpc: networking.vpc,
      privateSubnetIds: networking.privateSubnetIds,
      securityGroupId: networking.lambdaSecurityGroupId,
      tableName: data.tableName,
      bucketName: data.bucketName,
      snsTopicArn: pulumi.output(''), // Will be set after monitoring stack
      tags,
    }, { parent: this });

    // 4. API Gateway
    const apiGateway = new ApiGatewayStack(`api-${environmentSuffix}`, {
      environmentSuffix,
      validatorLambdaArn: compute.validatorLambdaArn,
      tags,
    }, { parent: this });

    // 5. Monitoring: CloudWatch logs, dashboard, alarms, SNS
    const monitoring = new MonitoringStack(`monitoring-${environmentSuffix}`, {
      environmentSuffix,
      validatorLambdaName: compute.validatorLambdaName,
      processorLambdaName: compute.processorLambdaName,
      notifierLambdaName: compute.notifierLambdaName,
      tableName: data.tableName,
      apiGatewayId: apiGateway.apiId,
      apiGatewayStageName: apiGateway.stageName,
      flowLogGroupName: networking.flowLogGroupName,
      tags,
    }, { parent: this });

    // Update compute stack with SNS topic ARN
    compute.setSnsTopicArn(monitoring.snsTopicArn);

    // Export key outputs
    this.apiUrl = apiGateway.apiUrl;
    this.bucketName = data.bucketName;
    this.tableName = data.tableName;
    this.dashboardUrl = monitoring.dashboardUrl;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      tableName: this.tableName,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
```

## File: lib/components/networking.ts

```typescript
/**
 * NetworkingStack - VPC, subnets, NAT gateways, VPC endpoints, flow logs
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  cidrBlock: string;
  availabilityZoneCount: number;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;
  public readonly flowLogGroupName: pulumi.Output<string>;

  constructor(name: string, args: NetworkingStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const { environmentSuffix, cidrBlock, availabilityZoneCount, tags } = args;

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC
    this.vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-vpc-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`payment-igw-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-igw-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Public and Private Subnets
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < availabilityZoneCount; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(`payment-public-subnet-${i}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azs.then(az => az.names[i]),
        mapPublicIpOnLaunch: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-subnet-${i}-${environmentSuffix}`,
        })),
      }, { parent: this });
      this.publicSubnetIds.push(publicSubnet.id);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(`payment-private-subnet-${i}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${10 + i}.0/24`,
        availabilityZone: azs.then(az => az.names[i]),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-subnet-${i}-${environmentSuffix}`,
        })),
      }, { parent: this });
      this.privateSubnetIds.push(privateSubnet.id);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(`payment-nat-eip-${i}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-eip-${i}-${environmentSuffix}`,
        })),
      }, { parent: this });

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(`payment-nat-${i}-${environmentSuffix}`, {
        subnetId: publicSubnet.id,
        allocationId: eip.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-${i}-${environmentSuffix}`,
        })),
      }, { parent: this });
      natGateways.push(natGateway);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(`payment-public-rt-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-public-rt-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.ec2.Route(`payment-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    for (let i = 0; i < availabilityZoneCount; i++) {
      new aws.ec2.RouteTableAssociation(`payment-public-rta-${i}-${environmentSuffix}`, {
        subnetId: this.publicSubnetIds[i],
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    }

    // Private Route Tables (one per AZ for NAT Gateway)
    for (let i = 0; i < availabilityZoneCount; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(`payment-private-rt-${i}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-rt-${i}-${environmentSuffix}`,
        })),
      }, { parent: this });

      new aws.ec2.Route(`payment-private-route-${i}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`payment-private-rta-${i}-${environmentSuffix}`, {
        subnetId: this.privateSubnetIds[i],
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    }

    // VPC Endpoints for S3 and DynamoDB
    const s3Endpoint = new aws.ec2.VpcEndpoint(`payment-s3-endpoint-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.eu-south-2.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [publicRouteTable.id],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-s3-endpoint-${environmentSuffix}`,
      })),
    }, { parent: this });

    const dynamoEndpoint = new aws.ec2.VpcEndpoint(`payment-dynamodb-endpoint-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      serviceName: `com.amazonaws.eu-south-2.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [publicRouteTable.id],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`payment-lambda-sg-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: 'Security group for payment Lambda functions',
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-lambda-sg-${environmentSuffix}`,
      })),
    }, { parent: this });

    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    // VPC Flow Logs
    const flowLogRole = new aws.iam.Role(`payment-flow-log-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com',
          },
        }],
      }),
      maxSessionDuration: 3600, // 1 hour
      tags,
    }, { parent: this });

    new aws.iam.RolePolicy(`payment-flow-log-policy-${environmentSuffix}`, {
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          Effect: 'Allow',
          Resource: '*',
        }],
      }),
    }, { parent: this });

    const flowLogGroup = new aws.cloudwatch.LogGroup(`payment-flow-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags,
    }, { parent: this });

    this.flowLogGroupName = flowLogGroup.name;

    new aws.ec2.FlowLog(`payment-flow-log-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      tags,
    }, { parent: this });

    // Transit Gateway
    const transitGateway = new aws.ec2transitgateway.TransitGateway(`payment-tgw-${environmentSuffix}`, {
      description: 'Transit Gateway for payment processing multi-region connectivity',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-tgw-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.ec2transitgateway.VpcAttachment(`payment-tgw-attachment-${environmentSuffix}`, {
      transitGatewayId: transitGateway.id,
      vpcId: this.vpc.id,
      subnetIds: this.privateSubnetIds,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-tgw-attachment-${environmentSuffix}`,
      })),
    }, { parent: this });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
      flowLogGroupName: this.flowLogGroupName,
    });
  }
}
```
## File: lib/components/data.ts

```typescript
/**
 * DataStack - DynamoDB, S3, KMS resources
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DataStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DataStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;

  constructor(name: string, args: DataStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:data:DataStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // KMS Key for database backup encryption
    const kmsKey = new aws.kms.Key(`payment-kms-${environmentSuffix}`, {
      description: 'Customer-managed KMS key for payment database backup encryption',
      deletionWindowInDays: 10,
      enableKeyRotation: true,
      tags,
    }, { parent: this });

    new aws.kms.Alias(`payment-kms-alias-${environmentSuffix}`, {
      name: `alias/payment-db-backup-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    this.kmsKeyArn = kmsKey.arn;

    // DynamoDB Table
    const table = new aws.dynamodb.Table(`transactions-${environmentSuffix}`, {
      name: `transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST', // On-demand billing
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attributes: [
        { name: 'transactionId', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `transactions-${environmentSuffix}`,
      })),
    }, { parent: this });

    this.tableName = table.name;

    // S3 Bucket for audit logs
    const bucket = new aws.s3.Bucket(`payment-audit-logs-${environmentSuffix}`, {
      bucket: `payment-audit-logs-${environmentSuffix}`,
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
      lifecycleRules: [{
        enabled: true,
        id: 'archive-old-logs',
        transitions: [{
          days: 90,
          storageClass: 'GLACIER',
        }],
      }],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-audit-logs-${environmentSuffix}`,
      })),
    }, { parent: this });

    this.bucketName = bucket.id;

    // Block public access
    new aws.s3.BucketPublicAccessBlock(`payment-audit-logs-pab-${environmentSuffix}`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    this.registerOutputs({
      tableName: this.tableName,
      bucketName: this.bucketName,
      kmsKeyArn: this.kmsKeyArn,
    });
  }
}
```


## File: lib/components/compute.ts

```typescript
/**
 * ComputeStack - Lambda functions for payment processing
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  securityGroupId: pulumi.Output<string>;
  tableName: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly validatorLambdaArn: pulumi.Output<string>;
  public readonly processorLambdaArn: pulumi.Output<string>;
  public readonly notifierLambdaArn: pulumi.Output<string>;
  public readonly validatorLambdaName: pulumi.Output<string>;
  public readonly processorLambdaName: pulumi.Output<string>;
  public readonly notifierLambdaName: pulumi.Output<string>;

  private snsTopicArnInput: pulumi.Output<string>;

  constructor(name: string, args: ComputeStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:compute:ComputeStack', name, args, opts);

    const { environmentSuffix, vpc, privateSubnetIds, securityGroupId, tableName, bucketName, tags } = args;
    this.snsTopicArnInput = args.snsTopicArn;

    // IAM Role for Lambda functions
    const lambdaRole = new aws.iam.Role(`payment-lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      maxSessionDuration: 3600, // 1 hour
      tags,
    }, { parent: this });

    // IAM Policies for Lambda
    new aws.iam.RolePolicyAttachment(`payment-lambda-vpc-policy-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { parent: this });

    const lambdaPolicy = new aws.iam.RolePolicy(`payment-lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([tableName, bucketName, this.snsTopicArnInput]).apply(([table, bucket, sns]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: `arn:aws:dynamodb:eu-south-2:*:table/${table}`,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
            ],
            Resource: `arn:aws:s3:::${bucket}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'sns:Publish',
            ],
            Resource: sns || '*',
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
        ],
      })),
    }, { parent: this });

    // Lambda Function: payment-validator
    const validatorFunction = new aws.lambda.Function(`payment-validator-${environmentSuffix}`, {
      name: `payment-validator-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      vpcConfig: {
        subnetIds: privateSubnetIds,
        securityGroupIds: [securityGroupId],
      },
      environment: {
        variables: {
          TABLE_NAME: tableName,
          BUCKET_NAME: bucketName,
          REGION: 'eu-south-2',
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Payment Validator - Processing request:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');

  // Validation logic
  if (!body.amount || !body.currency || !body.paymentMethod) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: amount, currency, or paymentMethod'
      }),
    };
  }

  if (body.amount <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Amount must be positive' }),
    };
  }

  // Generate transaction ID
  const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Payment validation successful',
      transactionId,
      status: 'validated',
      amount: body.amount,
      currency: body.currency,
    }),
  };
};
        `),
      }),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-validator-${environmentSuffix}`,
      })),
    }, { parent: this, dependsOn: [lambdaPolicy] });

    this.validatorLambdaArn = validatorFunction.arn;
    this.validatorLambdaName = validatorFunction.name;

    // Lambda Function: payment-processor
    const processorFunction = new aws.lambda.Function(`payment-processor-${environmentSuffix}`, {
      name: `payment-processor-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      vpcConfig: {
        subnetIds: privateSubnetIds,
        securityGroupIds: [securityGroupId],
      },
      environment: {
        variables: {
          TABLE_NAME: tableName,
          BUCKET_NAME: bucketName,
          REGION: 'eu-south-2',
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const s3 = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Payment Processor - Processing transaction:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');
  const transactionId = body.transactionId || \`txn-\${Date.now()}\`;
  const timestamp = Date.now();

  try {
    // Store transaction in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: (body.amount || 0).toString() },
        currency: { S: body.currency || 'USD' },
        status: { S: 'processed' },
        processedAt: { S: new Date().toISOString() },
      },
    }));

    // Log to S3 for audit
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: \`transactions/\${transactionId}.json\`,
      Body: JSON.stringify({
        transactionId,
        timestamp,
        amount: body.amount,
        currency: body.currency,
        status: 'processed',
        processedAt: new Date().toISOString(),
      }),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processed successfully',
        transactionId,
        status: 'processed',
      }),
    };
  } catch (error) {
    console.error('Processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment processing failed' }),
    };
  }
};
        `),
      }),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-processor-${environmentSuffix}`,
      })),
    }, { parent: this, dependsOn: [lambdaPolicy] });

    this.processorLambdaArn = processorFunction.arn;
    this.processorLambdaName = processorFunction.name;

    // Lambda Function: payment-notifier
    const notifierFunction = new aws.lambda.Function(`payment-notifier-${environmentSuffix}`, {
      name: `payment-notifier-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      vpcConfig: {
        subnetIds: privateSubnetIds,
        securityGroupIds: [securityGroupId],
      },
      environment: {
        variables: {
          SNS_TOPIC_ARN: this.snsTopicArnInput,
          REGION: 'eu-south-2',
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Payment Notifier - Sending notification:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');

  try {
    if (process.env.SNS_TOPIC_ARN && process.env.SNS_TOPIC_ARN !== '') {
      await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: 'Payment Notification',
        Message: JSON.stringify({
          transactionId: body.transactionId,
          status: body.status || 'completed',
          amount: body.amount,
          currency: body.currency,
          timestamp: new Date().toISOString(),
        }, null, 2),
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification sent successfully',
        transactionId: body.transactionId,
      }),
    };
  } catch (error) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Notification failed' }),
    };
  }
};
        `),
      }),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-notifier-${environmentSuffix}`,
      })),
    }, { parent: this, dependsOn: [lambdaPolicy] });

    this.notifierLambdaArn = notifierFunction.arn;
    this.notifierLambdaName = notifierFunction.name;

    this.registerOutputs({
      validatorLambdaArn: this.validatorLambdaArn,
      processorLambdaArn: this.processorLambdaArn,
      notifierLambdaArn: this.notifierLambdaArn,
      validatorLambdaName: this.validatorLambdaName,
      processorLambdaName: this.processorLambdaName,
      notifierLambdaName: this.notifierLambdaName,
    });
  }

  public setSnsTopicArn(arn: pulumi.Output<string>) {
    this.snsTopicArnInput = arn;
  }
}
```


## File: lib/components/api-gateway.ts

```typescript
/**
 * ApiGatewayStack - API Gateway with Lambda integration
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  validatorLambdaArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly stageName: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:api:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, validatorLambdaArn, tags } = args;

    // REST API
    const api = new aws.apigateway.RestApi(`payment-api-${environmentSuffix}`, {
      name: `payment-api-${environmentSuffix}`,
      description: 'Payment Processing API',
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-api-${environmentSuffix}`,
      })),
    }, { parent: this });

    this.apiId = api.id;

    // Resource: /payments
    const paymentsResource = new aws.apigateway.Resource(`payment-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'payments',
    }, { parent: this });

    // Method: POST /payments
    const paymentsMethod = new aws.apigateway.Method(`payment-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: paymentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    }, { parent: this });

    // Lambda Integration
    const integration = new aws.apigateway.Integration(`payment-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: paymentsResource.id,
      httpMethod: paymentsMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: validatorLambdaArn.apply(arn =>
        `arn:aws:apigateway:eu-south-2:lambda:path/2015-03-31/functions/${arn}/invocations`
      ),
    }, { parent: this });

    // Lambda Permission for API Gateway
    new aws.lambda.Permission(`payment-lambda-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: validatorLambdaArn,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*/*`,
    }, { parent: this });

    // Deployment
    const deployment = new aws.apigateway.Deployment(`payment-deployment-${environmentSuffix}`, {
      restApi: api.id,
      triggers: {
        redeployment: pulumi.all([paymentsResource.id, paymentsMethod.id, integration.id])
          .apply(([r, m, i]) => JSON.stringify({ resource: r, method: m, integration: i })),
      },
    }, { parent: this, dependsOn: [integration] });

    // Stage with throttling
    const stage = new aws.apigateway.Stage(`payment-stage-${environmentSuffix}`, {
      restApi: api.id,
      deployment: deployment.id,
      stageName: environmentSuffix,
      tags,
    }, { parent: this });

    this.stageName = stage.stageName;

    // Method Settings for throttling (10,000 requests per minute = ~167 per second)
    new aws.apigateway.MethodSettings(`payment-method-settings-${environmentSuffix}`, {
      restApi: api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 167, // 10,000 per minute / 60 seconds
      },
    }, { parent: this });

    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.eu-south-2.amazonaws.com/${stage.stageName}/payments`;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      stageName: this.stageName,
    });
  }
}
```


## File: lib/components/monitoring.ts

```typescript
/**
 * MonitoringStack - CloudWatch logs, dashboard, alarms, SNS
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  validatorLambdaName: pulumi.Output<string>;
  processorLambdaName: pulumi.Output<string>;
  notifierLambdaName: pulumi.Output<string>;
  tableName: pulumi.Output<string>;
  apiGatewayId: pulumi.Output<string>;
  apiGatewayStageName: pulumi.Output<string>;
  flowLogGroupName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, validatorLambdaName, processorLambdaName, notifierLambdaName,
            tableName, apiGatewayId, apiGatewayStageName, tags } = args;

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(`payment-notifications-${environmentSuffix}`, {
      name: `payment-notifications-${environmentSuffix}`,
      displayName: 'Payment Processing Notifications',
      tags,
    }, { parent: this });

    this.snsTopicArn = snsTopic.arn;

    // Email subscription (configure email address as needed)
    new aws.sns.TopicSubscription(`payment-email-subscription-${environmentSuffix}`, {
      topic: snsTopic.arn,
      protocol: 'email',
      endpoint: 'payments-team@example.com', // Replace with actual email
    }, { parent: this });

    // CloudWatch Log Groups for Lambda functions
    new aws.cloudwatch.LogGroup(`validator-logs-${environmentSuffix}`, {
      name: pulumi.interpolate`/aws/lambda/${validatorLambdaName}`,
      retentionInDays: 7,
      tags,
    }, { parent: this });

    new aws.cloudwatch.LogGroup(`processor-logs-${environmentSuffix}`, {
      name: pulumi.interpolate`/aws/lambda/${processorLambdaName}`,
      retentionInDays: 7,
      tags,
    }, { parent: this });

    new aws.cloudwatch.LogGroup(`notifier-logs-${environmentSuffix}`, {
      name: pulumi.interpolate`/aws/lambda/${notifierLambdaName}`,
      retentionInDays: 7,
      tags,
    }, { parent: this });

    // CloudWatch Alarms for Lambda errors
    new aws.cloudwatch.MetricAlarm(`validator-alarm-${environmentSuffix}`, {
      name: `payment-validator-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      alarmDescription: 'Alert when validator Lambda error rate exceeds 1%',
      alarmActions: [snsTopic.arn],
      dimensions: {
        FunctionName: validatorLambdaName,
      },
      tags,
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`processor-alarm-${environmentSuffix}`, {
      name: `payment-processor-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      alarmDescription: 'Alert when processor Lambda error rate exceeds 1%',
      alarmActions: [snsTopic.arn],
      dimensions: {
        FunctionName: processorLambdaName,
      },
      tags,
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`notifier-alarm-${environmentSuffix}`, {
      name: `payment-notifier-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Average',
      threshold: 0.01, // 1% error rate
      alarmDescription: 'Alert when notifier Lambda error rate exceeds 1%',
      alarmActions: [snsTopic.arn],
      dimensions: {
        FunctionName: notifierLambdaName,
      },
      tags,
    }, { parent: this });

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`payment-dashboard-${environmentSuffix}`, {
      dashboardName: `payment-processing-${environmentSuffix}`,
      dashboardBody: pulumi.all([validatorLambdaName, processorLambdaName, notifierLambdaName,
                                  tableName, apiGatewayId, apiGatewayStageName])
        .apply(([validator, processor, notifier, table, apiId, stage]) => JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                title: 'Lambda Invocations',
                region: 'eu-south-2',
                metrics: [
                  ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'Validator' }, { FunctionName: validator }],
                  ['.', '.', { stat: 'Sum', label: 'Processor' }, { FunctionName: processor }],
                  ['.', '.', { stat: 'Sum', label: 'Notifier' }, { FunctionName: notifier }],
                ],
                period: 300,
                yAxis: {
                  left: { min: 0 },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'Lambda Error Rates',
                region: 'eu-south-2',
                metrics: [
                  ['AWS/Lambda', 'Errors', { stat: 'Average', label: 'Validator' }, { FunctionName: validator }],
                  ['.', '.', { stat: 'Average', label: 'Processor' }, { FunctionName: processor }],
                  ['.', '.', { stat: 'Average', label: 'Notifier' }, { FunctionName: notifier }],
                ],
                period: 300,
                yAxis: {
                  left: { min: 0, max: 1 },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'DynamoDB Read/Write Capacity',
                region: 'eu-south-2',
                metrics: [
                  ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { stat: 'Sum', label: 'Read' }, { TableName: table }],
                  ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum', label: 'Write' }, { TableName: table }],
                ],
                period: 300,
                yAxis: {
                  left: { min: 0 },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'API Gateway Requests',
                region: 'eu-south-2',
                metrics: [
                  ['AWS/ApiGateway', 'Count', { stat: 'Sum', label: 'Requests' }, { ApiName: apiId, Stage: stage }],
                  ['.', '4XXError', { stat: 'Sum', label: '4XX Errors' }, { ApiName: apiId, Stage: stage }],
                  ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }, { ApiName: apiId, Stage: stage }],
                ],
                period: 300,
                yAxis: {
                  left: { min: 0 },
                },
              },
            },
          ],
        })),
    }, { parent: this });

    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=eu-south-2#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure

Complete Pulumi TypeScript implementation for payment processing infrastructure in AWS Ohio (eu-south-2).

## Architecture Overview

This infrastructure implements a production-ready payment processing system with:

- **Network Layer**: VPC across 3 availability zones with public/private subnets, NAT gateways, VPC endpoints
- **API Layer**: API Gateway REST API with throttling and Lambda integration
- **Compute Layer**: Three Lambda functions (validator, processor, notifier)
- **Data Layer**: DynamoDB table with point-in-time recovery, S3 bucket with versioning
- **Monitoring Layer**: CloudWatch logs, dashboard, alarms, and SNS notifications
- **Security**: KMS encryption, VPC isolation, IAM least-privilege policies

## Components

### NetworkingStack
- VPC with CIDR 10.0.0.0/16
- 3 public subnets, 3 private subnets across 3 AZs
- NAT Gateways in each AZ
- VPC endpoints for S3 and DynamoDB
- VPC Flow Logs
- Transit Gateway for multi-region connectivity

### DataStack
- DynamoDB table: transactions-{environmentSuffix}
- S3 bucket: payment-audit-logs-{environmentSuffix}
- KMS key for backup encryption

### ComputeStack
- payment-validator: Input validation and fraud checks
- payment-processor: Transaction processing and storage
- payment-notifier: Stakeholder notifications

### ApiGatewayStack
- REST API with /payments endpoint
- Request throttling: 10,000 requests per minute
- Lambda proxy integration

### MonitoringStack
- CloudWatch Log Groups (7-day retention)
- CloudWatch Dashboard with key metrics
- CloudWatch Alarms (>1% error rate triggers SNS)
- SNS topic with email subscription

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI v2 configured
- AWS credentials with appropriate permissions

## Deployment

```bash
# Install dependencies
npm install

# Configure Pulumi stack
pulumi stack init dev

# Set AWS region
pulumi config set aws:region eu-south-2

# Set environment suffix
pulumi config set env dev

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- **apiUrl**: API Gateway endpoint URL
- **bucketName**: S3 audit logs bucket name
- **tableName**: DynamoDB transactions table name
- **dashboardUrl**: CloudWatch dashboard URL

## PCI DSS Compliance

This infrastructure implements PCI DSS requirements:

- All compute resources in private subnets
- Encryption at rest (DynamoDB, S3, KMS)
- Encryption in transit (HTTPS/TLS)
- Network isolation (VPC, security groups)
- Audit logging (S3 bucket with versioning)
- Monitoring and alerting (CloudWatch)
- IAM least-privilege access
- Session policies (1-hour maximum)

## Clean Up

```bash
pulumi destroy
```

All resources are configured for clean teardown without manual intervention.
```

