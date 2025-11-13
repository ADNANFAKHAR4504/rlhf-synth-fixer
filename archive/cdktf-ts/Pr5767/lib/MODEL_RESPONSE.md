# Multi-Environment Data Processing Pipeline - CDKTF TypeScript Implementation

This implementation provides a complete multi-environment data processing pipeline using CDKTF with TypeScript. The solution includes a custom construct that encapsulates the entire pipeline and can be reused across dev, staging, and prod environments with environment-specific configurations.

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node bin/tap.ts",
  "projectId": "data-pipeline-multi-env",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true",
    "environments": {
      "dev": {
        "name": "dev",
        "region": "ap-southeast-1",
        "lambdaMemory": 512,
        "dynamodbReadCapacity": 5,
        "dynamodbWriteCapacity": 5,
        "dynamodbBillingMode": "PAY_PER_REQUEST",
        "s3LifecycleDays": 30,
        "enableXrayTracing": false,
        "snsEmail": "dev-alerts@example.com",
        "costCenter": "development"
      },
      "staging": {
        "name": "staging",
        "region": "ap-southeast-1",
        "lambdaMemory": 1024,
        "dynamodbReadCapacity": 10,
        "dynamodbWriteCapacity": 10,
        "dynamodbBillingMode": "PROVISIONED",
        "s3LifecycleDays": 90,
        "enableXrayTracing": true,
        "snsEmail": "staging-alerts@example.com",
        "costCenter": "staging"
      },
      "prod": {
        "name": "prod",
        "region": "ap-southeast-1",
        "lambdaMemory": 2048,
        "dynamodbReadCapacity": 25,
        "dynamodbWriteCapacity": 25,
        "dynamodbBillingMode": "PROVISIONED",
        "s3LifecycleDays": 365,
        "enableXrayTracing": true,
        "snsEmail": "prod-alerts@example.com",
        "costCenter": "production"
      }
    }
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import { App } from "cdktf";
import { DataPipelineStack } from "../lib/data-pipeline-stack";

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "default";

// Get environments from context
const environments = app.node.tryGetContext("environments") || {};

// Create a stack for each environment
Object.keys(environments).forEach((envName) => {
  const envConfig = environments[envName];

  new DataPipelineStack(app, `DataPipeline-${envConfig.name}-Stack`, {
    environment: envConfig.name,
    environmentSuffix: environmentSuffix,
    region: envConfig.region,
    lambdaMemory: envConfig.lambdaMemory,
    dynamodbReadCapacity: envConfig.dynamodbReadCapacity,
    dynamodbWriteCapacity: envConfig.dynamodbWriteCapacity,
    dynamodbBillingMode: envConfig.dynamodbBillingMode,
    s3LifecycleDays: envConfig.s3LifecycleDays,
    enableXrayTracing: envConfig.enableXrayTracing,
    snsEmail: envConfig.snsEmail,
    costCenter: envConfig.costCenter,
  });
});

app.synth();
```

## File: lib/data-pipeline-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataPipelineConstruct, DataPipelineConfig } from "./constructs/data-pipeline-construct";

export interface DataPipelineStackProps extends DataPipelineConfig {
  region: string;
}

export class DataPipelineStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: DataPipelineStackProps) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: props.region,
      defaultTags: [{
        tags: {
          Environment: props.environment,
          CostCenter: props.costCenter,
          ManagedBy: "CDKTF",
          EnvironmentSuffix: props.environmentSuffix,
        },
      }],
    });

    // Create the data pipeline using our custom construct
    const pipeline = new DataPipelineConstruct(this, "DataPipeline", props);

    // CloudFormation Outputs
    new TerraformOutput(this, "S3BucketName", {
      value: pipeline.dataBucket.bucket,
      description: "Name of the S3 data ingestion bucket",
    });

    new TerraformOutput(this, "S3BucketArn", {
      value: pipeline.dataBucket.arn,
      description: "ARN of the S3 data ingestion bucket",
    });

    new TerraformOutput(this, "DynamoDBTableName", {
      value: pipeline.metadataTable.name,
      description: "Name of the DynamoDB metadata table",
    });

    new TerraformOutput(this, "DynamoDBTableArn", {
      value: pipeline.metadataTable.arn,
      description: "ARN of the DynamoDB metadata table",
    });

    new TerraformOutput(this, "LambdaFunctionName", {
      value: pipeline.processorFunction.functionName,
      description: "Name of the Lambda processor function",
    });

    new TerraformOutput(this, "LambdaFunctionArn", {
      value: pipeline.processorFunction.arn,
      description: "ARN of the Lambda processor function",
    });

    new TerraformOutput(this, "SNSTopicArn", {
      value: pipeline.alertTopic.arn,
      description: "ARN of the SNS alert topic",
    });

    new TerraformOutput(this, "EventBridgeRuleName", {
      value: pipeline.s3EventRule.name,
      description: "Name of the EventBridge rule for S3 events",
    });
  }
}
```

## File: lib/constructs/data-pipeline-construct.ts

```typescript
import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketNotification } from "@cdktf/provider-aws/lib/s3-bucket-notification";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { CloudwatchEventRule } from "@cdktf/provider-aws/lib/cloudwatch-event-rule";
import { CloudwatchEventTarget } from "@cdktf/provider-aws/lib/cloudwatch-event-target";
import { DataArchiveFile } from "@cdktf/provider-archive/lib/data-archive-file";
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider";
import * as path from "path";

export interface DataPipelineConfig {
  environment: string;
  environmentSuffix: string;
  lambdaMemory: number;
  dynamodbReadCapacity: number;
  dynamodbWriteCapacity: number;
  dynamodbBillingMode: string;
  s3LifecycleDays: number;
  enableXrayTracing: boolean;
  snsEmail: string;
  costCenter: string;
}

export class DataPipelineConstruct extends Construct {
  public readonly dataBucket: S3Bucket;
  public readonly metadataTable: DynamodbTable;
  public readonly processorFunction: LambdaFunction;
  public readonly alertTopic: SnsTopic;
  public readonly s3EventRule: CloudwatchEventRule;

  constructor(scope: Construct, id: string, config: DataPipelineConfig) {
    super(scope, id);

    // Initialize Archive provider for Lambda packaging
    new ArchiveProvider(this, "archive");

    // Create S3 Bucket for data ingestion
    this.dataBucket = new S3Bucket(this, "DataBucket", {
      bucket: `myapp-${config.environment}-data-${config.environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `myapp-${config.environment}-data-${config.environmentSuffix}`,
        Purpose: "Data Ingestion",
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, "DataBucketVersioning", {
      bucket: this.dataBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Configure S3 bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(this, "DataBucketEncryption", {
      bucket: this.dataBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
        bucketKeyEnabled: true,
      }],
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, "DataBucketPublicAccessBlock", {
      bucket: this.dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Configure lifecycle policy
    new S3BucketLifecycleConfiguration(this, "DataBucketLifecycle", {
      bucket: this.dataBucket.id,
      rule: [{
        id: `expire-after-${config.s3LifecycleDays}-days`,
        status: "Enabled",
        expiration: {
          days: config.s3LifecycleDays,
        },
      }],
    });

    // Create DynamoDB table for metadata storage
    const billingModeConfig = config.dynamodbBillingMode === "PAY_PER_REQUEST"
      ? {
          billingMode: "PAY_PER_REQUEST",
        }
      : {
          billingMode: "PROVISIONED",
          readCapacity: config.dynamodbReadCapacity,
          writeCapacity: config.dynamodbWriteCapacity,
        };

    this.metadataTable = new DynamodbTable(this, "MetadataTable", {
      name: `myapp-${config.environment}-metadata-${config.environmentSuffix}`,
      hashKey: "id",
      rangeKey: "timestamp",
      attribute: [
        {
          name: "id",
          type: "S",
        },
        {
          name: "timestamp",
          type: "N",
        },
      ],
      ...billingModeConfig,
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `myapp-${config.environment}-metadata-${config.environmentSuffix}`,
        Purpose: "Metadata Storage",
      },
    });

    // Create SNS Topic for alerts
    this.alertTopic = new SnsTopic(this, "AlertTopic", {
      name: `myapp-${config.environment}-alerts-${config.environmentSuffix}`,
      displayName: `Data Pipeline Alerts - ${config.environment}`,
      tags: {
        Name: `myapp-${config.environment}-alerts-${config.environmentSuffix}`,
        Purpose: "Alert Notifications",
      },
    });

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, "AlertTopicSubscription", {
      topicArn: this.alertTopic.arn,
      protocol: "email",
      endpoint: config.snsEmail,
    });

    // Create IAM role for Lambda function
    const lambdaRole = new IamRole(this, "LambdaExecutionRole", {
      name: `myapp-${config.environment}-lambda-role-${config.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: {
        Name: `myapp-${config.environment}-lambda-role-${config.environmentSuffix}`,
        Purpose: "Lambda Execution Role",
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, "LambdaBasicExecution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    // Create custom IAM policy for Lambda
    const lambdaPolicy = new IamPolicy(this, "LambdaCustomPolicy", {
      name: `myapp-${config.environment}-lambda-policy-${config.environmentSuffix}`,
      description: "Custom policy for Lambda data processor",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:ListBucket",
              "s3:GetBucketLocation",
            ],
            Resource: [
              this.dataBucket.arn,
              `${this.dataBucket.arn}/*`,
            ],
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:UpdateItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: this.metadataTable.arn,
          },
          {
            Effect: "Allow",
            Action: [
              "sns:Publish",
            ],
            Resource: this.alertTopic.arn,
          },
          ...(config.enableXrayTracing ? [{
            Effect: "Allow",
            Action: [
              "xray:PutTraceSegments",
              "xray:PutTelemetryRecords",
            ],
            Resource: "*",
          }] : []),
        ],
      }),
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, "LambdaCustomPolicyAttachment", {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Package Lambda function code
    const lambdaArchive = new DataArchiveFile(this, "LambdaArchive", {
      type: "zip",
      sourceDir: path.join(__dirname, "../lambda/data-processor"),
      outputPath: path.join(__dirname, "../../dist/lambda-processor.zip"),
    });

    // Create Lambda function
    this.processorFunction = new LambdaFunction(this, "ProcessorFunction", {
      functionName: `myapp-${config.environment}-processor-${config.environmentSuffix}`,
      description: `Data processor for ${config.environment} environment`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: config.lambdaMemory,
      timeout: 300,
      environment: {
        variables: {
          ENVIRONMENT: config.environment,
          DYNAMODB_TABLE: this.metadataTable.name,
          SNS_TOPIC_ARN: this.alertTopic.arn,
          S3_BUCKET: this.dataBucket.bucket,
        },
      },
      tracingConfig: {
        mode: config.enableXrayTracing ? "Active" : "PassThrough",
      },
      tags: {
        Name: `myapp-${config.environment}-processor-${config.environmentSuffix}`,
        Purpose: "Data Processing",
      },
    });

    // Create EventBridge rule for S3 events
    this.s3EventRule = new CloudwatchEventRule(this, "S3EventRule", {
      name: `myapp-${config.environment}-s3-events-${config.environmentSuffix}`,
      description: `Trigger Lambda on S3 object creation in ${config.environment}`,
      eventPattern: JSON.stringify({
        source: ["aws.s3"],
        "detail-type": ["Object Created"],
        detail: {
          bucket: {
            name: [this.dataBucket.bucket],
          },
        },
      }),
      tags: {
        Name: `myapp-${config.environment}-s3-events-${config.environmentSuffix}`,
        Purpose: "Event Routing",
      },
    });

    // Add Lambda as EventBridge target
    new CloudwatchEventTarget(this, "S3EventTarget", {
      rule: this.s3EventRule.name,
      arn: this.processorFunction.arn,
    });

    // Grant EventBridge permission to invoke Lambda
    new LambdaPermission(this, "EventBridgeInvokeLambda", {
      statementId: "AllowEventBridgeInvoke",
      action: "lambda:InvokeFunction",
      functionName: this.processorFunction.functionName,
      principal: "events.amazonaws.com",
      sourceArn: this.s3EventRule.arn,
    });

    // Configure S3 bucket notification to EventBridge
    new S3BucketNotification(this, "S3BucketNotification", {
      bucket: this.dataBucket.id,
      eventbridge: true,
    });
  }
}
```

## File: lib/lambda/data-processor/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const dynamodbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const s3Client = new S3Client({});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract S3 event details from EventBridge event
    const s3Event = event.detail;
    const bucketName = s3Event.bucket.name;
    const objectKey = s3Event.object.key;
    const objectSize = s3Event.object.size;

    console.log(`Processing S3 object: s3://${bucketName}/${objectKey}`);

    // Get object metadata from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    // Store metadata in DynamoDB
    const timestamp = Date.now();
    const dynamodbParams = {
      TableName: DYNAMODB_TABLE,
      Item: {
        id: { S: objectKey },
        timestamp: { N: timestamp.toString() },
        bucket: { S: bucketName },
        size: { N: objectSize.toString() },
        contentType: { S: s3Response.ContentType || "unknown" },
        environment: { S: ENVIRONMENT },
        processedAt: { S: new Date().toISOString() },
        status: { S: "processed" },
      },
    };

    await dynamodbClient.send(new PutItemCommand(dynamodbParams));
    console.log(`Metadata stored in DynamoDB: ${objectKey}`);

    // Send notification to SNS
    const snsMessage = {
      event: "Object Processed",
      environment: ENVIRONMENT,
      bucket: bucketName,
      key: objectKey,
      size: objectSize,
      timestamp: new Date().toISOString(),
    };

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `Data Processing Complete - ${ENVIRONMENT}`,
        Message: JSON.stringify(snsMessage, null, 2),
      })
    );

    console.log("SNS notification sent successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Processing completed successfully",
        objectKey: objectKey,
        environment: ENVIRONMENT,
      }),
    };
  } catch (error) {
    console.error("Error processing event:", error);

    // Send error notification
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `Data Processing Error - ${ENVIRONMENT}`,
          Message: JSON.stringify({
            error: error.message,
            event: JSON.stringify(event),
            environment: ENVIRONMENT,
            timestamp: new Date().toISOString(),
          }, null, 2),
        })
      );
    } catch (snsError) {
      console.error("Failed to send error notification:", snsError);
    }

    throw error;
  }
};
```

## File: lib/lambda/data-processor/package.json

```json
{
  "name": "data-processor",
  "version": "1.0.0",
  "description": "Lambda function for processing data pipeline events",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-sns": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0"
  }
}
```

## Implementation Notes

This implementation provides:

1. **Multi-Environment Support**: Three separate CDKTF stacks (dev, staging, prod) sharing the same infrastructure code
2. **Custom Construct**: `DataPipelineConstruct` encapsulates the entire pipeline for reuse
3. **Environment-Specific Configuration**: All parameters defined in `cdktf.json` context
4. **S3 Buckets**: With versioning, encryption, lifecycle policies, and environmentSuffix in names
5. **DynamoDB Tables**: With consistent schemas and environment-specific capacity settings
6. **Lambda Functions**: Node.js 18.x with environment-specific memory and X-Ray tracing
7. **EventBridge Integration**: S3 events trigger Lambda via EventBridge
8. **SNS Topics**: Environment-specific email notifications
9. **IAM Roles**: Least-privilege permissions for all AWS services
10. **Resource Tagging**: Uniform tags via AWS provider default tags
11. **CloudFormation Outputs**: All required resource identifiers
12. **Full Destroyability**: No Retain policies, all resources can be cleanly destroyed

The architecture ensures complete consistency across environments while allowing environment-specific parameters for capacity, naming, and operational settings.
