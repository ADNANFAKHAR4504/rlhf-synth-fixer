# Multi-Environment Data Processing Infrastructure

I'll create a Pulumi TypeScript implementation that uses ComponentResource pattern to create reusable, multi-environment data processing infrastructure.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

// Configuration
const config = new pulumi.Config();
const environment = config.require("environment");
const environmentSuffix = config.require("environmentSuffix");

// Environment-specific configurations
const envConfig = {
    dev: {
        lambdaMemory: 512,
        logRetentionDays: 7,
    },
    staging: {
        lambdaMemory: 1024,
        logRetentionDays: 14,
    },
    prod: {
        lambdaMemory: 2048,
        logRetentionDays: 30,
    },
};

// Get configuration for current environment
const currentEnvConfig = envConfig[environment as keyof typeof envConfig];
if (!currentEnvConfig) {
    throw new Error(`Invalid environment: ${environment}. Must be dev, staging, or prod`);
}

// ComponentResource for Data Processing Pipeline
class DataProcessingComponent extends pulumi.ComponentResource {
    public readonly bucket: aws.s3.Bucket;
    public readonly lambdaFunction: aws.lambda.Function;
    public readonly table: aws.dynamodb.Table;
    public readonly bucketName: pulumi.Output<string>;
    public readonly lambdaArn: pulumi.Output<string>;
    public readonly tableName: pulumi.Output<string>;

    constructor(name: string, args: {
        environment: string;
        environmentSuffix: string;
        lambdaMemory: number;
        logRetentionDays: number;
    }, opts?: pulumi.ComponentResourceOptions) {
        super("custom:DataProcessingComponent", name, {}, opts);

        const componentOpts = { parent: this };

        // DynamoDB Table
        this.table = new aws.dynamodb.Table(`data-table-${args.environment}-${args.environmentSuffix}`, {
            name: `data-table-${args.environment}-${args.environmentSuffix}`,
            billingMode: "PAY_PER_REQUEST",
            hashKey: "id",
            attributes: [{
                name: "id",
                type: "S",
            }],
            tags: {
                Environment: args.environment,
                ManagedBy: "Pulumi",
            },
        }, componentOpts);

        // IAM Role for Lambda
        const lambdaRole = new aws.iam.Role(`lambda-role-${args.environment}-${args.environmentSuffix}`, {
            name: `lambda-role-${args.environment}-${args.environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com",
                    },
                }],
            }),
            tags: {
                Environment: args.environment,
                ManagedBy: "Pulumi",
            },
        }, componentOpts);

        // S3 Bucket
        this.bucket = new aws.s3.Bucket(`data-processor-${args.environment}-${args.environmentSuffix}`, {
            bucket: `data-processor-${args.environment}-${args.environmentSuffix}`,
            versioning: {
                enabled: true,
            },
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    },
                },
            },
            tags: {
                Environment: args.environment,
                ManagedBy: "Pulumi",
            },
        }, componentOpts);

        // Block public access to S3 bucket
        new aws.s3.BucketPublicAccessBlock(`bucket-public-access-block-${args.environment}-${args.environmentSuffix}`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, componentOpts);

        // Lambda function inline code
        const lambdaCode = `
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();

    console.log('Processing S3 event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;
            const eventTime = record.eventTime;

            console.log(\`Processing file: \${key} from bucket: \${bucket}\`);

            // Store metadata in DynamoDB
            const params = {
                TableName: process.env.TABLE_NAME,
                Item: {
                    id: \`\${bucket}/\${key}\`,
                    bucket: bucket,
                    key: key,
                    processedAt: eventTime,
                    size: record.s3.object.size,
                    timestamp: new Date().toISOString(),
                },
            };

            await dynamodb.put(params).promise();
            console.log(\`Successfully processed and stored metadata for \${key}\`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully processed S3 event' }),
        };
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
};
`;

        // CloudWatch Log Group
        const logGroup = new aws.cloudwatch.LogGroup(`lambda-logs-${args.environment}-${args.environmentSuffix}`, {
            name: `/aws/lambda/s3-processor-${args.environment}-${args.environmentSuffix}`,
            retentionInDays: args.logRetentionDays,
            tags: {
                Environment: args.environment,
                ManagedBy: "Pulumi",
            },
        }, componentOpts);

        // Lambda function
        this.lambdaFunction = new aws.lambda.Function(`s3-processor-${args.environment}-${args.environmentSuffix}`, {
            name: `s3-processor-${args.environment}-${args.environmentSuffix}`,
            runtime: "nodejs18.x",
            role: lambdaRole.arn,
            handler: "index.handler",
            memorySize: args.lambdaMemory,
            timeout: 60,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(lambdaCode),
            }),
            environment: {
                variables: {
                    TABLE_NAME: this.table.name,
                    ENVIRONMENT: args.environment,
                },
            },
            tags: {
                Environment: args.environment,
                ManagedBy: "Pulumi",
            },
        }, { ...componentOpts, dependsOn: [logGroup] });

        // IAM Policy for Lambda to access S3
        const s3Policy = new aws.iam.RolePolicy(`lambda-s3-policy-${args.environment}-${args.environmentSuffix}`, {
            role: lambdaRole.id,
            policy: pulumi.interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "${this.bucket.arn}",
                            "${this.bucket.arn}/*"
                        ]
                    }
                ]
            }`,
        }, componentOpts);

        // IAM Policy for Lambda to access DynamoDB
        const dynamoPolicy = new aws.iam.RolePolicy(`lambda-dynamo-policy-${args.environment}-${args.environmentSuffix}`, {
            role: lambdaRole.id,
            policy: pulumi.interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": "${this.table.arn}"
                    }
                ]
            }`,
        }, componentOpts);

        // IAM Policy for Lambda to write CloudWatch Logs
        const logsPolicy = new aws.iam.RolePolicy(`lambda-logs-policy-${args.environment}-${args.environmentSuffix}`, {
            role: lambdaRole.id,
            policy: pulumi.interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "${logGroup.arn}:*"
                    }
                ]
            }`,
        }, componentOpts);

        // Lambda permission for S3 to invoke
        const lambdaPermission = new aws.lambda.Permission(`s3-invoke-lambda-${args.environment}-${args.environmentSuffix}`, {
            action: "lambda:InvokeFunction",
            function: this.lambdaFunction.name,
            principal: "s3.amazonaws.com",
            sourceArn: this.bucket.arn,
        }, componentOpts);

        // S3 Bucket Notification
        new aws.s3.BucketNotification(`bucket-notification-${args.environment}-${args.environmentSuffix}`, {
            bucket: this.bucket.id,
            lambdaFunctions: [{
                lambdaFunctionArn: this.lambdaFunction.arn,
                events: ["s3:ObjectCreated:*"],
            }],
        }, { ...componentOpts, dependsOn: [lambdaPermission, s3Policy, dynamoPolicy, logsPolicy] });

        // Set outputs
        this.bucketName = this.bucket.bucket;
        this.lambdaArn = this.lambdaFunction.arn;
        this.tableName = this.table.name;

        this.registerOutputs({
            bucketName: this.bucketName,
            lambdaArn: this.lambdaArn,
            tableName: this.tableName,
        });
    }
}

// Create the data processing component
const dataProcessor = new DataProcessingComponent("data-processor", {
    environment,
    environmentSuffix,
    lambdaMemory: currentEnvConfig.lambdaMemory,
    logRetentionDays: currentEnvConfig.logRetentionDays,
});

// Export stack outputs
export const s3BucketName = dataProcessor.bucketName;
export const lambdaFunctionArn = dataProcessor.lambdaArn;
export const dynamoTableName = dataProcessor.tableName;
export const deployedEnvironment = environment;
```

## File: Pulumi.yaml

```yaml
name: data-processing
runtime: nodejs
description: Multi-environment data processing infrastructure with S3, Lambda, and DynamoDB
config:
  aws:region:
    value: ap-northeast-2
```

## File: package.json

```json
{
  "name": "data-processing-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment data processing infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/random": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Deployment Instructions

### Configure for Development Environment

```bash
pulumi config set environment dev
pulumi config set environmentSuffix $(openssl rand -hex 4)
pulumi up
```

### Configure for Staging Environment

```bash
pulumi config set environment staging
pulumi config set environmentSuffix $(openssl rand -hex 4)
pulumi up
```

### Configure for Production Environment

```bash
pulumi config set environment prod
pulumi config set environmentSuffix $(openssl rand -hex 4)
pulumi up
```

## Architecture Overview

The infrastructure creates:

1. **DynamoDB Table**: Stores metadata about processed S3 objects with on-demand billing
2. **S3 Bucket**: Stores data files with versioning enabled and public access blocked
3. **Lambda Function**: Processes S3 events and stores metadata in DynamoDB
4. **IAM Roles & Policies**: Least-privilege access for Lambda to S3, DynamoDB, and CloudWatch
5. **CloudWatch Logs**: Stores Lambda execution logs with environment-specific retention
6. **S3 Event Notifications**: Triggers Lambda on object creation

## Environment-Specific Configuration

| Environment | Lambda Memory | Log Retention |
|-------------|---------------|---------------|
| dev         | 512 MB        | 7 days        |
| staging     | 1024 MB       | 14 days       |
| prod        | 2048 MB       | 30 days       |

## Testing the Infrastructure

Upload a file to test the event processing:

```bash
# Get bucket name from stack outputs
BUCKET_NAME=$(pulumi stack output s3BucketName)

# Upload a test file
echo "test data" > test.txt
aws s3 cp test.txt s3://$BUCKET_NAME/test.txt

# Check Lambda logs
aws logs tail /aws/lambda/s3-processor-${ENVIRONMENT}-${SUFFIX} --follow

# Verify DynamoDB entry
TABLE_NAME=$(pulumi stack output dynamoTableName)
aws dynamodb get-item --table-name $TABLE_NAME --key "{\"id\": {\"S\": \"$BUCKET_NAME/test.txt\"}}"
```

## Cleanup

```bash
pulumi destroy
```
