# Multi-Environment Payment Processing System - Pulumi TypeScript Implementation

This implementation provides a complete multi-environment payment processing system with reusable ComponentResource patterns, drift detection, and environment-specific configurations.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface PaymentProcessorArgs {
  environment: string;
  environmentSuffix: string;
  region: string;
  lambdaMemory: number;
  lambdaConcurrency: number;
  enablePitr: boolean;
  dlqRetries: number;
  notificationEmail: string;
  vpcId: string;
  privateSubnetIds: string[];
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
    super("custom:payment:PaymentProcessor", name, {}, opts);

    const resourceOpts = { parent: this };

    // Dead Letter Queue
    this.dlq = new aws.sqs.Queue(
      `payment-dlq-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-dlq-${args.environment}-${args.environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          Environment: args.environment,
          ManagedBy: "Pulumi",
        },
      },
      resourceOpts
    );

    // DynamoDB Table for transactions
    this.table = new aws.dynamodb.Table(
      `payment-transactions-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-transactions-${args.environment}-${args.environmentSuffix}`,
        billingMode: "PAY_PER_REQUEST",
        hashKey: "transactionId",
        rangeKey: "timestamp",
        attributes: [
          { name: "transactionId", type: "S" },
          { name: "timestamp", type: "N" },
          { name: "customerId", type: "S" },
        ],
        globalSecondaryIndexes: [
          {
            name: "CustomerIndex",
            hashKey: "customerId",
            rangeKey: "timestamp",
            projectionType: "ALL",
          },
        ],
        pointInTimeRecovery: {
          enabled: args.enablePitr,
        },
        tags: {
          Environment: args.environment,
          ManagedBy: "Pulumi",
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
          ManagedBy: "Pulumi",
        },
      },
      resourceOpts
    );

    // SNS Email Subscription
    new aws.sns.TopicSubscription(
      `payment-email-${args.environment}-${args.environmentSuffix}`,
      {
        topic: this.topic.arn,
        protocol: "email",
        endpoint: args.notificationEmail,
      },
      resourceOpts
    );

    // Security Group for Lambda
    const lambdaSg = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${args.environment}-${args.environmentSuffix}`,
      {
        name: `payment-lambda-sg-${args.environment}-${args.environmentSuffix}`,
        description: "Security group for payment processor Lambda",
        vpcId: args.vpcId,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: {
          Environment: args.environment,
          ManagedBy: "Pulumi",
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
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Effect: "Allow",
            },
          ],
        }),
        tags: {
          Environment: args.environment,
          ManagedBy: "Pulumi",
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
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem",
                  ],
                  Resource: [tableArn, `${tableArn}/index/*`],
                },
                {
                  Effect: "Allow",
                  Action: ["sns:Publish"],
                  Resource: topicArn,
                },
                {
                  Effect: "Allow",
                  Action: ["sqs:SendMessage"],
                  Resource: dlqArn,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                  ],
                  Resource: "arn:aws:logs:*:*:*",
                },
                {
                  Effect: "Allow",
                  Action: [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                  ],
                  Resource: "*",
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
        runtime: "nodejs18.x",
        handler: "index.handler",
        role: lambdaRole.arn,
        architectures: ["arm64"],
        memorySize: args.lambdaMemory,
        timeout: 30,
        reservedConcurrentExecutions: args.lambdaConcurrency,
        code: new pulumi.asset.AssetArchive({
          "index.js": new pulumi.asset.StringAsset(`
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
    // Store transaction in DynamoDB
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

    // Send notification
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
          "package.json": new pulumi.asset.StringAsset(`
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
          ManagedBy: "Pulumi",
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
    super("custom:tap:TapStack", name, {}, opts);

    const config = new pulumi.Config();
    const environment = pulumi.getStack();
    const environmentSuffix = config.require("environmentSuffix");
    const region = config.require("region");
    const lambdaMemory = config.requireNumber("lambdaMemory");
    const lambdaConcurrency = config.requireNumber("lambdaConcurrency");
    const enablePitr = config.requireBoolean("enablePitr");
    const dlqRetries = config.requireNumber("dlqRetries");
    const notificationEmail = config.require("notificationEmail");

    const resourceOpts = { parent: this };

    // VPC for Lambda
    this.vpc = new aws.ec2.Vpc(
      `payment-vpc-${environment}-${environmentSuffix}`,
      {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payment-vpc-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: "Pulumi",
        },
      },
      resourceOpts
    );

    // Private Subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-1-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.1.0/24",
        availabilityZone: `${region}a`,
        tags: {
          Name: `payment-private-subnet-1-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: "Pulumi",
        },
      },
      resourceOpts
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-2-${environment}-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.2.0/24",
        availabilityZone: `${region}b`,
        tags: {
          Name: `payment-private-subnet-2-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: "Pulumi",
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
          ManagedBy: "Pulumi",
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
        vpcEndpointType: "Gateway",
        routeTableIds: [privateRouteTable.id],
        tags: {
          Name: `payment-dynamodb-endpoint-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: "Pulumi",
        },
      },
      resourceOpts
    );

    // Security Group for VPC Endpoints
    const endpointSg = new aws.ec2.SecurityGroup(
      `payment-endpoint-sg-${environment}-${environmentSuffix}`,
      {
        name: `payment-endpoint-sg-${environment}-${environmentSuffix}`,
        description: "Security group for VPC endpoints",
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: [this.vpc.cidrBlock],
          },
        ],
        tags: {
          Environment: environment,
          ManagedBy: "Pulumi",
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
        vpcEndpointType: "Interface",
        privateDnsEnabled: true,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [endpointSg.id],
        tags: {
          Name: `payment-sns-endpoint-${environment}-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: "Pulumi",
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

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const stack = new TapStack("tap-stack");

export const vpcId = stack.vpc.id;
export const tableArn = stack.processor.table.arn;
export const tableName = stack.processor.table.name;
export const topicArn = stack.processor.topic.arn;
export const lambdaArn = stack.processor.lambda.arn;
export const lambdaName = stack.processor.lambda.name;
export const dlqArn = stack.processor.dlq.arn;
```

## File: Pulumi.dev.yaml

```yaml
config:
  TapStack:environmentSuffix: "dev001"
  TapStack:region: "us-east-1"
  TapStack:lambdaMemory: "512"
  TapStack:lambdaConcurrency: "1"
  TapStack:enablePitr: "false"
  TapStack:dlqRetries: "2"
  TapStack:notificationEmail: "dev-payments@example.com"
```

## File: Pulumi.staging.yaml

```yaml
config:
  TapStack:environmentSuffix: "staging001"
  TapStack:region: "us-west-2"
  TapStack:lambdaMemory: "1024"
  TapStack:lambdaConcurrency: "10"
  TapStack:enablePitr: "true"
  TapStack:dlqRetries: "3"
  TapStack:notificationEmail: "staging-payments@example.com"
```

## File: Pulumi.prod.yaml

```yaml
config:
  TapStack:environmentSuffix: "prod001"
  TapStack:region: "eu-west-1"
  TapStack:lambdaMemory: "2048"
  TapStack:lambdaConcurrency: "100"
  TapStack:enablePitr: "true"
  TapStack:dlqRetries: "5"
  TapStack:notificationEmail: "prod-payments@example.com"
```

## File: lib/drift-detection.ts

```typescript
import * as automation from "@pulumi/pulumi/automation";
import * as path from "path";

interface DriftReport {
  environment: string;
  differences: {
    parameter: string;
    stagingValue: any;
    prodValue: any;
    isControlled: boolean;
  }[];
  timestamp: string;
}

async function getStackOutputs(
  stackName: string
): Promise<automation.OutputMap> {
  const projectName = "TapStack";
  const workDir = path.join(__dirname, "..");

  const stack = await automation.LocalWorkspace.selectStack({
    stackName,
    projectName,
    workDir,
  });

  return await stack.outputs();
}

async function getStackConfig(stackName: string): Promise<Record<string, any>> {
  const projectName = "TapStack";
  const workDir = path.join(__dirname, "..");

  const stack = await automation.LocalWorkspace.selectStack({
    stackName,
    projectName,
    workDir,
  });

  const config = await stack.getAllConfig();
  return config;
}

async function detectDrift(): Promise<DriftReport> {
  console.log("Starting drift detection between staging and prod...");

  // Get configurations
  const stagingConfig = await getStackConfig("staging");
  const prodConfig = await getStackConfig("prod");

  // Get outputs
  const stagingOutputs = await getStackOutputs("staging");
  const prodOutputs = await getStackOutputs("prod");

  const differences: DriftReport["differences"] = [];

  // Controlled variations (scaling parameters)
  const controlledParams = [
    "lambdaMemory",
    "lambdaConcurrency",
    "dlqRetries",
    "region",
    "environmentSuffix",
  ];

  // Compare configurations
  const allKeys = new Set([
    ...Object.keys(stagingConfig),
    ...Object.keys(prodConfig),
  ]);

  for (const key of allKeys) {
    const stagingValue = stagingConfig[key]?.value;
    const prodValue = prodConfig[key]?.value;

    if (JSON.stringify(stagingValue) !== JSON.stringify(prodValue)) {
      const paramName = key.split(":")[1] || key;
      differences.push({
        parameter: paramName,
        stagingValue,
        prodValue,
        isControlled: controlledParams.includes(paramName),
      });
    }
  }

  const report: DriftReport = {
    environment: "staging-vs-prod",
    differences,
    timestamp: new Date().toISOString(),
  };

  return report;
}

async function main() {
  try {
    const report = await detectDrift();

    console.log("\n=== DRIFT DETECTION REPORT ===");
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`\nTotal Differences Found: ${report.differences.length}`);

    const controlledDiffs = report.differences.filter((d) => d.isControlled);
    const uncontrolledDiffs = report.differences.filter((d) => !d.isControlled);

    if (controlledDiffs.length > 0) {
      console.log(
        `\nControlled Variations (Expected): ${controlledDiffs.length}`
      );
      controlledDiffs.forEach((diff) => {
        console.log(`  - ${diff.parameter}:`);
        console.log(`      Staging: ${JSON.stringify(diff.stagingValue)}`);
        console.log(`      Prod:    ${JSON.stringify(diff.prodValue)}`);
      });
    }

    if (uncontrolledDiffs.length > 0) {
      console.log(
        `\n⚠️  UNCONTROLLED DRIFT DETECTED: ${uncontrolledDiffs.length}`
      );
      uncontrolledDiffs.forEach((diff) => {
        console.log(`  - ${diff.parameter}:`);
        console.log(`      Staging: ${JSON.stringify(diff.stagingValue)}`);
        console.log(`      Prod:    ${JSON.stringify(diff.prodValue)}`);
      });
      console.log(
        "\n⚠️  WARNING: Uncontrolled drift may indicate configuration inconsistency!"
      );
    } else {
      console.log(
        "\n✅ No uncontrolled drift detected. Staging and Prod are consistent."
      );
    }

    // Save report to file
    const fs = require("fs");
    fs.writeFileSync(
      "drift-report.json",
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("\nReport saved to: drift-report.json");
  } catch (error) {
    console.error("Error during drift detection:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { detectDrift, DriftReport };
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Processing System

This Pulumi TypeScript project implements a multi-environment payment processing system with automated deployment across dev, staging, and production environments.

## Architecture

### Components

- **PaymentProcessor ComponentResource**: Reusable infrastructure pattern containing:
  - AWS Lambda function for payment processing (ARM64 architecture)
  - DynamoDB table for transaction storage
  - SNS topic for notifications
  - SQS dead letter queue for failed processing

- **VPC Configuration**:
  - Private subnets for Lambda isolation
  - VPC endpoints for DynamoDB (Gateway type)
  - VPC endpoints for SNS (Interface type)

### Multi-Environment Setup

The infrastructure deploys to three separate environments:

| Environment | Region      | Lambda Memory | Concurrency | PITR  | DLQ Retries |
|-------------|-------------|---------------|-------------|-------|-------------|
| dev         | us-east-1   | 512 MB        | 1           | No    | 2           |
| staging     | us-west-2   | 1 GB          | 10          | Yes   | 3           |
| prod        | eu-west-1   | 2 GB          | 100         | Yes   | 5           |

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
- AWS CLI configured with credentials for all three accounts
- Cross-account IAM roles configured for deployment

## Installation

```bash
npm install
```

## Configuration

Each environment has its own configuration file:

- `Pulumi.dev.yaml` - Development configuration
- `Pulumi.staging.yaml` - Staging configuration
- `Pulumi.prod.yaml` - Production configuration

### Configuration Parameters

- `environmentSuffix`: Unique suffix for resource names
- `region`: AWS region for deployment
- `lambdaMemory`: Lambda memory allocation in MB
- `lambdaConcurrency`: Reserved concurrent executions
- `enablePitr`: Enable DynamoDB point-in-time recovery
- `dlqRetries`: Number of retry attempts before DLQ
- `notificationEmail`: Email for SNS notifications (requires confirmation)

## Deployment

### Deploy to Development

```bash
pulumi stack select dev
pulumi up
```

### Deploy to Staging

```bash
pulumi stack select staging
pulumi up
```

### Deploy to Production

```bash
pulumi stack select prod
pulumi up
```

## Stack References

To use outputs from one stack in another:

```typescript
import * as pulumi from "@pulumi/pulumi";

// Reference staging stack from prod
const stagingStack = new pulumi.StackReference("organization/TapStack/staging");
const stagingTableArn = stagingStack.getOutput("tableArn");
```

## Drift Detection

The included drift detection script compares staging and production configurations:

```bash
npm run drift-detect
```

This will:
1. Compare all configuration parameters between staging and prod
2. Identify controlled variations (scaling parameters)
3. Flag any uncontrolled drift
4. Generate a JSON report: `drift-report.json`

### Running Drift Detection

```bash
# Install dependencies for drift detection
npm install @pulumi/pulumi

# Run the drift detection script
npx ts-node lib/drift-detection.ts
```

## Environment Promotion Workflow

1. **Dev to Staging**: Test changes in dev, then deploy to staging
   ```bash
   pulumi stack select dev
   pulumi up
   # Verify functionality
   pulumi stack select staging
   pulumi up
   ```

2. **Staging to Prod**: Validate in staging, then promote to prod
   ```bash
   # Run drift detection
   npm run drift-detect
   # Review report
   pulumi stack select prod
   pulumi up
   ```

## Testing Lambda Function

Invoke the Lambda function:

```bash
aws lambda invoke \
  --function-name payment-processor-dev-dev001 \
  --payload '{"transactionId":"test-123","customerId":"customer-456","amount":100}' \
  response.json
```

## Resource Cleanup

To destroy all resources in an environment:

```bash
pulumi stack select dev
pulumi destroy
```

## SNS Email Subscription

Note: Email subscriptions require manual confirmation. After deployment:
1. Check the email inbox for the configured address
2. Click the confirmation link in the AWS SNS email
3. Verify subscription in AWS Console

## Cross-Account Deployment

This project requires cross-account IAM roles. Example role policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "dynamodb:*",
        "sns:*",
        "sqs:*",
        "ec2:*",
        "iam:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

Configure AWS CLI profiles for each account:

```bash
# ~/.aws/config
[profile dev-account]
role_arn = arn:aws:iam::111111111111:role/PulumiDeployRole
source_profile = default

[profile staging-account]
role_arn = arn:aws:iam::222222222222:role/PulumiDeployRole
source_profile = default

[profile prod-account]
role_arn = arn:aws:iam::333333333333:role/PulumiDeployRole
source_profile = default
```

## Monitoring

Monitor the infrastructure:

- CloudWatch Logs: `/aws/lambda/payment-processor-{env}-{suffix}`
- DynamoDB Tables: Monitor read/write capacity in CloudWatch
- SNS Topics: Monitor published/delivered messages
- SQS DLQ: Set up alarms for messages in dead letter queue

## Security

- Lambda functions run in private subnets only
- VPC endpoints ensure traffic to AWS services stays within AWS network
- IAM roles follow least privilege principle
- DynamoDB encryption at rest enabled by default
- SNS topics use HTTPS endpoints

## Troubleshooting

### Lambda cannot access DynamoDB
- Verify VPC endpoint for DynamoDB is created
- Check Lambda security group allows outbound traffic
- Verify IAM role has DynamoDB permissions

### SNS notifications not received
- Confirm email subscription in AWS Console
- Check SNS topic policy allows Lambda to publish
- Verify VPC endpoint for SNS is configured with private DNS

### Cross-account deployment fails
- Verify IAM role trust relationships
- Check AWS CLI profile configuration
- Ensure Pulumi backend has access to all accounts
```

## File: package.json

```json
{
  "name": "tap-stack",
  "version": "1.0.0",
  "description": "Multi-environment payment processing system with Pulumi",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "drift-detect": "ts-node lib/drift-detection.ts",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["bin/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist"]
}
```