# Lambda Function Optimization - Pulumi TypeScript Implementation

This implementation demonstrates 10 critical optimizations for Lambda function deployment using Pulumi with TypeScript.

## Architecture Overview

The solution implements a highly optimized Lambda function with:
- Reserved concurrency for cost control
- Performance-tuned memory and timeout settings
- X-Ray distributed tracing
- Configuration management via Pulumi Config
- IAM least-privilege security model
- CloudWatch log retention for cost optimization
- Lambda layers for shared dependencies
- Dead letter queue for error handling
- Comprehensive resource tagging

## File: lib/lambda-optimizer-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaOptimizerStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaOptimizerStack extends pulumi.ComponentResource {
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly lambdaName: pulumi.Output<string>;
  public readonly roleArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  constructor(name: string, args: LambdaOptimizerStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:lambda:OptimizerStack', name, args, opts);

    const config = new pulumi.Config();
    const { environmentSuffix, tags } = args;

    // Configuration Management (Requirement 5): Use Pulumi Config for environment variables
    const dbEndpoint = config.require('dbEndpoint');
    const apiKey = config.requireSecret('apiKey');
    const maxRetries = config.getNumber('maxRetries') || 3;
    const logLevel = config.get('logLevel') || 'INFO';

    // Dead Letter Queue (Requirement 9): DLQ for failed invocations
    const dlq = new aws.sqs.Queue(`lambda-dlq-${environmentSuffix}`, {
      name: `lambda-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: tags,
    }, { parent: this });

    // IAM Security (Requirement 6): Least-privilege IAM role
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      name: `lambda-role-${environmentSuffix}`,
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
      tags: tags,
    }, { parent: this });

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // X-Ray Tracing (Requirement 4): IAM policy for X-Ray
    new aws.iam.RolePolicyAttachment(`lambda-xray-access-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    }, { parent: this });

    // Least-privilege policy for SQS DLQ access
    const sqsPolicy = new aws.iam.RolePolicy(`lambda-sqs-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([dlq.arn]).apply(([dlqArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'sqs:SendMessage',
            'sqs:GetQueueAttributes',
          ],
          Resource: dlqArn,
        }],
      })),
    }, { parent: this });

    // Lambda Layers (Requirement 8): Shared dependencies layer
    const dependenciesLayer = new aws.lambda.LayerVersion(`dependencies-layer-${environmentSuffix}`, {
      layerName: `dependencies-layer-${environmentSuffix}`,
      compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
      code: new pulumi.asset.AssetArchive({
        'nodejs': new pulumi.asset.FileArchive('./lib/lambda/layers/dependencies'),
      }),
      description: 'Shared dependencies layer for Lambda functions',
    }, { parent: this });

    // Log Retention (Requirement 7): CloudWatch Logs with 7-day retention
    const logGroup = new aws.cloudwatch.LogGroup(`lambda-log-group-${environmentSuffix}`, {
      name: `/aws/lambda/optimized-function-${environmentSuffix}`,
      retentionInDays: 7,
      tags: tags,
    }, { parent: this });

    // Lambda Function with all optimizations
    const optimizedFunction = new aws.lambda.Function(`optimized-function-${environmentSuffix}`, {
      name: `optimized-function-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: lambdaRole.arn,

      // Memory Allocation (Requirement 2): 512MB based on profiling
      memorySize: 512,

      // Timeout Optimization (Requirement 3): 30 seconds instead of 5 minutes
      timeout: 30,

      // Reserved Concurrency (Requirement 1): 10 for cost control
      reservedConcurrentExecutions: 10,

      // X-Ray Tracing (Requirement 4): Enable active tracing
      tracingConfig: {
        mode: 'Active',
      },

      // Lambda Layers (Requirement 8): Attach dependencies layer
      layers: [dependenciesLayer.arn],

      // Dead Letter Queue (Requirement 9): Configure DLQ
      deadLetterConfig: {
        targetArn: dlq.arn,
      },

      // Configuration Management (Requirement 5): Environment variables from Pulumi Config
      environment: {
        variables: {
          DB_ENDPOINT: dbEndpoint,
          API_KEY: apiKey,
          MAX_RETRIES: maxRetries.toString(),
          LOG_LEVEL: logLevel,
          ENVIRONMENT: environmentSuffix,
        },
      },

      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive('./lib/lambda/function'),
      }),

      // Resource Tagging (Requirement 10): Cost tracking and compliance tags
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Application: 'LambdaOptimization',
        CostCenter: 'Engineering',
        Compliance: 'Required',
        Optimization: 'Performance',
      })),
    }, { parent: this, dependsOn: [logGroup, sqsPolicy] });

    // CloudWatch Alarms for monitoring
    new aws.cloudwatch.MetricAlarm(`lambda-errors-${environmentSuffix}`, {
      name: `lambda-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'Alert when Lambda errors exceed threshold',
      dimensions: {
        FunctionName: optimizedFunction.name,
      },
      tags: tags,
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`lambda-throttles-${environmentSuffix}`, {
      name: `lambda-throttles-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Throttles',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      alarmDescription: 'Alert when Lambda function is throttled',
      dimensions: {
        FunctionName: optimizedFunction.name,
      },
      tags: tags,
    }, { parent: this });

    // Expose outputs
    this.lambdaArn = optimizedFunction.arn;
    this.lambdaName = optimizedFunction.name;
    this.roleArn = lambdaRole.arn;
    this.logGroupName = logGroup.name;
    this.dlqUrl = dlq.url;
    this.layerArn = dependenciesLayer.arn;

    this.registerOutputs({
      lambdaArn: this.lambdaArn,
      lambdaName: this.lambdaName,
      roleArn: this.roleArn,
      logGroupName: this.logGroupName,
      dlqUrl: this.dlqUrl,
      layerArn: this.layerArn,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { LambdaOptimizerStack } from './lambda-optimizer-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly lambdaName: pulumi.Output<string>;
  public readonly roleArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Instantiate Lambda Optimizer Stack
    const lambdaStack = new LambdaOptimizerStack('lambda-optimizer', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Expose outputs
    this.lambdaArn = lambdaStack.lambdaArn;
    this.lambdaName = lambdaStack.lambdaName;
    this.roleArn = lambdaStack.roleArn;
    this.logGroupName = lambdaStack.logGroupName;
    this.dlqUrl = lambdaStack.dlqUrl;
    this.layerArn = lambdaStack.layerArn;

    this.registerOutputs({
      lambdaArn: this.lambdaArn,
      lambdaName: this.lambdaName,
      roleArn: this.roleArn,
      logGroupName: this.logGroupName,
      dlqUrl: this.dlqUrl,
      layerArn: this.layerArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for Lambda optimization infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'synth-agent';
const prNumber = process.env.PR_NUMBER || 'local';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
}, { provider });

// Export stack outputs
export const lambdaArn = stack.lambdaArn;
export const lambdaName = stack.lambdaName;
export const roleArn = stack.roleArn;
export const logGroupName = stack.logGroupName;
export const dlqUrl = stack.dlqUrl;
export const layerArn = stack.layerArn;
```

## File: lib/lambda/function/index.js

```javascript
/**
 * Optimized Lambda function with proper error handling and logging
 */
const AWS = require('aws-sdk');

// Initialize AWS X-Ray
const AWSXRay = require('aws-xray-sdk-core');
const aws = AWSXRay.captureAWS(AWS);

// Environment variables from Pulumi Config
const DB_ENDPOINT = process.env.DB_ENDPOINT;
const API_KEY = process.env.API_KEY;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

// Logger utility
const log = (level, message, metadata = {}) => {
  if (shouldLog(level)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: ENVIRONMENT,
      ...metadata,
    }));
  }
};

const shouldLog = (level) => {
  const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  return levels[level] >= levels[LOG_LEVEL];
};

/**
 * Lambda handler with optimized performance and error handling
 */
exports.handler = async (event, context) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('ProcessEvent');

  try {
    log('INFO', 'Processing Lambda event', {
      requestId: context.requestId,
      functionName: context.functionName,
      memoryLimit: context.memoryLimitInMB,
    });

    // Validate input
    if (!event || !event.body) {
      throw new Error('Invalid event: missing body');
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    log('DEBUG', 'Parsed event body', { body });

    // Simulate processing with retry logic
    let result;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        subsegment.addAnnotation('attempt', attempt);
        result = await processData(body);
        break;
      } catch (error) {
        log('WARN', `Attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries: MAX_RETRIES,
        });

        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    subsegment.close();

    log('INFO', 'Successfully processed event', {
      requestId: context.requestId,
      resultSize: JSON.stringify(result).length,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.requestId,
      },
      body: JSON.stringify({
        success: true,
        data: result,
        requestId: context.requestId,
      }),
    };

  } catch (error) {
    subsegment.addError(error);
    subsegment.close();

    log('ERROR', 'Lambda execution failed', {
      error: error.message,
      stack: error.stack,
      requestId: context.requestId,
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.requestId,
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        requestId: context.requestId,
      }),
    };
  }
};

/**
 * Simulated data processing function
 */
async function processData(data) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    processed: true,
    timestamp: new Date().toISOString(),
    input: data,
    environment: ENVIRONMENT,
  };
}
```

## File: lib/lambda/function/package.json

```json
{
  "name": "optimized-lambda-function",
  "version": "1.0.0",
  "description": "Optimized Lambda function with X-Ray tracing",
  "main": "index.js",
  "dependencies": {
    "aws-xray-sdk-core": "^3.5.3",
    "aws-sdk": "^2.1498.0"
  }
}
```

## File: lib/lambda/layers/dependencies/nodejs/package.json

```json
{
  "name": "lambda-dependencies-layer",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "lodash": "^4.17.21",
    "moment": "^2.29.4",
    "uuid": "^9.0.1"
  }
}
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
  TapStack:environmentSuffix: dev
  TapStack:dbEndpoint: dev-db.example.com:5432
  TapStack:apiKey:
    secure: PLACEHOLDER_API_KEY_SECRET
  TapStack:maxRetries: "3"
  TapStack:logLevel: INFO
```

## Implementation Summary

### All 10 Requirements Implemented:

1. **Reserved Concurrency**: Set to 10 for cost control via `reservedConcurrentExecutions`
2. **Memory Allocation**: Configured to 512MB based on profiling data
3. **Timeout Optimization**: Set to 30 seconds (reduced from 5 minutes)
4. **X-Ray Tracing**: Active tracing enabled with X-Ray SDK integration
5. **Configuration Management**: Environment variables managed via Pulumi Config
6. **IAM Security**: Least-privilege role with specific SQS and X-Ray permissions
7. **Log Retention**: CloudWatch Logs configured with 7-day retention
8. **Lambda Layers**: Dependencies layer created for shared libraries
9. **Error Handling**: Dead letter queue configured for failed invocations
10. **Resource Tagging**: Comprehensive tags for cost tracking and compliance

### Additional Features:

- CloudWatch alarms for error monitoring and throttling detection
- Retry logic with exponential backoff in Lambda code
- Structured logging with different log levels
- X-Ray subsegments for detailed tracing
- Proper error handling with DLQ integration
- Environment suffix applied to all resource names

### Deployment:

```bash
# Install dependencies
npm install

# Configure Pulumi stack
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set TapStack:dbEndpoint dev-db.example.com:5432
pulumi config set --secret TapStack:apiKey YOUR_API_KEY

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```
