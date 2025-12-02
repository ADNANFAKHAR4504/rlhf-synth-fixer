# Lambda Function Optimization - Pulumi TypeScript Implementation

This implementation provides a complete solution for optimizing an existing Lambda function deployment with cost savings, improved performance, and modern runtime.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Optimized Lambda function deployment using Pulumi TypeScript
 *
 * This implementation includes:
 * - Node.js 18.x runtime migration
 * - Memory optimization from 3008MB to 512MB
 * - Reserved concurrency of 50
 * - AWS X-Ray tracing enabled
 * - CloudWatch log retention (7 days)
 * - IAM role with least privilege DynamoDB access
 * - Proper resource tagging
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * New Relic license key for APM integration
   */
  newRelicLicenseKey?: pulumi.Input<string>;

  /**
   * Database connection pool size
   */
  dbConnectionPoolSize?: pulumi.Input<string>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates an optimized Lambda function with:
 * - Modern Node.js 18.x runtime
 * - Cost-optimized memory allocation (512MB)
 * - Reserved concurrency for reliability
 * - X-Ray tracing for observability
 * - Least privilege IAM permissions
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly iamRole: aws.iam.Role;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Merge provided tags with required tags for cost allocation
    const defaultTags = {
      Environment: 'production',
      Team: 'payments',
      CostCenter: 'engineering',
      ManagedBy: 'Pulumi',
      ...(args.tags as any || {}),
    };

    // Get config values for environment variables
    const config = new pulumi.Config();
    const newRelicKey = args.newRelicLicenseKey || config.get('newRelicLicenseKey') || 'placeholder-key';
    const dbPoolSize = args.dbConnectionPoolSize || config.get('dbConnectionPoolSize') || '10';

    // --- IAM Role for Lambda ---
    // Create IAM role with least privilege access to DynamoDB
    const lambdaRole = new aws.iam.Role(
      `lambda-payments-role-${environmentSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach AWS managed policy for basic Lambda execution (CloudWatch Logs)
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach AWS managed policy for X-Ray tracing
    new aws.iam.RolePolicyAttachment(
      `lambda-xray-access-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Create inline policy for least privilege DynamoDB access
    new aws.iam.RolePolicy(
      `lambda-dynamodb-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
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
              Resource: `arn:aws:dynamodb:${aws.config.region}:*:table/payments-table`,
            },
          ],
        }),
      },
      { parent: this }
    );

    // --- CloudWatch Log Group ---
    // Create log group with 7-day retention for cost optimization
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-payments-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/payments-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // --- Lambda Function ---
    // Read the Lambda function code
    const lambdaCodePath = path.join(__dirname, 'lambda');

    // Create Lambda function with optimized configuration
    const lambdaFunction = new aws.lambda.Function(
      `payments-function-${environmentSuffix}`,
      {
        name: `payments-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(lambdaCodePath),
        }),

        // Optimized memory allocation based on CloudWatch metrics
        memorySize: 512,

        // Reduced timeout from 15 minutes to 30 seconds
        timeout: 30,

        // Reserved concurrency to prevent throttling
        reservedConcurrentExecutions: 50,

        // Environment variables
        environment: {
          variables: {
            NEW_RELIC_LICENSE_KEY: newRelicKey,
            DB_CONNECTION_POOL_SIZE: dbPoolSize,
            AWS_REGION: aws.config.region || 'us-east-1',
          },
        },

        // Enable AWS X-Ray tracing for performance monitoring
        tracingConfig: {
          mode: 'Active',
        },

        tags: defaultTags,
      },
      {
        parent: this,
        dependsOn: [logGroup],
      }
    );

    // --- Exports ---
    this.lambdaFunction = lambdaFunction;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.lambdaFunctionName = lambdaFunction.name;
    this.iamRole = lambdaRole;
    this.logGroup = logGroup;

    // Register the outputs of this component
    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      lambdaFunctionName: this.lambdaFunctionName,
      iamRoleArn: lambdaRole.arn,
      logGroupName: logGroup.name,
    });
  }
}
```

## File: lib/lambda/index.js

```javascript
/**
 * Optimized Lambda function handler for payments processing
 *
 * This function has been optimized with:
 * - Node.js 18.x runtime
 * - 512MB memory allocation
 * - 30-second timeout
 * - AWS X-Ray tracing enabled
 * - Reserved concurrency of 50
 */

const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  console.log('Processing payment request', {
    requestId: event.requestId,
    timestamp: new Date().toISOString(),
  });

  try {
    // Get configuration from environment variables
    const newRelicKey = process.env.NEW_RELIC_LICENSE_KEY;
    const connectionPoolSize = process.env.DB_CONNECTION_POOL_SIZE || '10';
    const tableName = 'payments-table';

    console.log('Configuration loaded', {
      newRelicConfigured: !!newRelicKey,
      connectionPoolSize,
      tableName,
    });

    // Example: Query DynamoDB payments table
    const params = {
      TableName: tableName,
      Key: {
        paymentId: { S: event.paymentId || 'test-payment-id' },
      },
    };

    const result = await dynamodb.send(new GetItemCommand(params));

    console.log('DynamoDB query completed', {
      found: !!result.Item,
      paymentId: event.paymentId,
    });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processed successfully',
        paymentId: event.paymentId,
        data: result.Item,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing payment', {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process payment',
        error: error.message,
      }),
    };
  }
};
```

## Implementation Summary

### All 9 Requirements Implemented

1. **Node.js 18.x Runtime**: Lambda function configured with `runtime: aws.lambda.Runtime.NodeJS18dX`
2. **Memory Optimization**: Memory reduced from 3008MB to 512MB with `memorySize: 512`
3. **Reserved Concurrency**: Set to 50 with `reservedConcurrentExecutions: 50`
4. **Environment Variables**: Both `NEW_RELIC_LICENSE_KEY` and `DB_CONNECTION_POOL_SIZE` configured
5. **X-Ray Tracing**: Enabled with `tracingConfig: { mode: 'Active' }`
6. **Timeout Optimization**: Reduced from 15 minutes to 30 seconds with `timeout: 30`
7. **IAM Least Privilege**: Custom IAM role with specific DynamoDB permissions for 'payments-table'
8. **CloudWatch Log Retention**: Set to 7 days with `retentionInDays: 7`
9. **Resource Tagging**: All resources tagged with Environment, Team, and CostCenter

### AWS Services Used

- **AWS Lambda**: Compute service for the function
- **AWS IAM**: Role and policy management
- **AWS CloudWatch Logs**: Log aggregation and retention
- **AWS X-Ray**: Distributed tracing
- **AWS DynamoDB**: Target database for IAM permissions (table: payments-table)

### Key Features

- **Cost Optimization**: Memory reduced by 83% (3008MB → 512MB), log retention optimized
- **Security**: Least privilege IAM with specific DynamoDB table access only
- **Observability**: X-Ray tracing enabled for performance monitoring
- **Reliability**: Reserved concurrency prevents throttling during peak load
- **Maintainability**: Clean TypeScript code with comprehensive comments
- **Flexibility**: Environment variables configurable through Pulumi config or args

### Resource Naming

All resources include `environmentSuffix` for deployment isolation:
- Lambda function: `payments-function-{environmentSuffix}`
- IAM role: `lambda-payments-role-{environmentSuffix}`
- Log group: `lambda-payments-logs-{environmentSuffix}`
- Policy attachments: Include `{environmentSuffix}` in names

### Deployment

The stack can be deployed with:

```bash
pulumi up
```

Optional configuration:

```bash
pulumi config set newRelicLicenseKey "your-key-here"
pulumi config set dbConnectionPoolSize "20"
```

The implementation is production-ready and addresses all optimization requirements while maintaining security, observability, and cost-effectiveness.
