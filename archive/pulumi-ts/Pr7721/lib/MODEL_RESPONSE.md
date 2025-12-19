# Lambda Function Optimization - Pulumi TypeScript Implementation

This implementation creates a baseline Lambda function infrastructure with non-optimized settings that will later be optimized by the `optimize.py` script.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Lambda Function Optimization - BASELINE Infrastructure
 *
 * IMPORTANT: This stack contains NON-OPTIMIZED baseline values:
 * - Lambda memory: 3008MB (high baseline)
 * - Lambda timeout: 300 seconds (5 minutes)
 * - CloudWatch log retention: NEVER_EXPIRE (indefinite)
 * - No reserved concurrency limits
 * - No X-Ray tracing
 * - No Dead Letter Queue
 * - No CloudWatch alarms
 *
 * These will be optimized by the lib/optimize.py script after deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

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
}

/**
 * TapStack - Lambda Function Infrastructure with baseline (non-optimized) configuration
 *
 * Creates:
 * - S3 bucket for Lambda deployment packages
 * - Lambda Layer for shared dependencies
 * - IAM role for Lambda execution
 * - Lambda function with BASELINE configuration
 * - CloudWatch log group with NO retention (indefinite)
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly deploymentBucketName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // S3 Bucket for Lambda deployment packages with versioning
    const deploymentBucket = new aws.s3.Bucket(`lambda-deployment-${environmentSuffix}`, {
      versioning: {
        enabled: true,
      },
      forceDestroy: true, // Allows destruction during testing
      tags: {
        ...tags,
        Name: `lambda-deployment-${environmentSuffix}`,
        Purpose: 'Lambda deployment packages',
      },
    }, { parent: this });

    // Lambda Layer for shared dependencies
    const sharedLayer = new aws.lambda.LayerVersion(`lambda-shared-layer-${environmentSuffix}`, {
      layerName: `lambda-shared-layer-${environmentSuffix}`,
      compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
      code: new pulumi.asset.AssetArchive({
        'nodejs': new pulumi.asset.StringAsset('// Shared dependencies placeholder'),
      }),
      description: 'Shared dependencies for Lambda functions',
    }, { parent: this });

    // IAM Role for Lambda execution
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
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
      tags: {
        ...tags,
        Name: `lambda-role-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // CloudWatch Log Group with NO retention (BASELINE - indefinite retention)
    const logGroup = new aws.cloudwatch.LogGroup(`lambda-log-group-${environmentSuffix}`, {
      name: `/aws/lambda/lambda-function-${environmentSuffix}`,
      retentionInDays: 0, // 0 means NEVER_EXPIRE - will be optimized to 7 days
      tags: {
        ...tags,
        Name: `lambda-log-group-${environmentSuffix}`,
      },
    }, { parent: this });

    // Lambda Function with BASELINE (non-optimized) configuration
    const lambdaFunction = new aws.lambda.Function(`lambda-function-${environmentSuffix}`, {
      name: `lambda-function-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,

      // BASELINE: High memory allocation (will be optimized to 1024MB)
      memorySize: 3008,

      // BASELINE: Long timeout (will be optimized to 30 seconds)
      timeout: 300,

      // BASELINE: Basic environment variables (non-secret)
      // Will be enhanced with DATABASE_URL and API_KEY from Secrets Manager
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
          LOG_LEVEL: 'INFO',
        },
      },

      // Use the Lambda layer
      layers: [sharedLayer.arn],

      // BASELINE: No X-Ray tracing (will be added by optimize.py)
      tracingConfig: {
        mode: 'PassThrough',
      },

      // BASELINE: No reserved concurrency (will be set to 50 by optimize.py)
      // reservedConcurrentExecutions: undefined,

      // BASELINE: No Dead Letter Queue (will be added by optimize.py)
      // deadLetterConfig: undefined,

      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Processing event:', JSON.stringify(event));

    // Simulate some work
    const result = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Lambda function executed successfully',
            environment: process.env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
        }),
    };

    return result;
};
        `),
      }),

      tags: {
        ...tags,
        Name: `lambda-function-${environmentSuffix}`,
        Purpose: 'Baseline Lambda for optimization',
      },
    }, { parent: this, dependsOn: [logGroup] });

    // Expose outputs
    this.lambdaFunctionName = lambdaFunction.name;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.deploymentBucketName = deploymentBucket.id;

    // Register the outputs of this component
    this.registerOutputs({
      lambdaFunctionName: this.lambdaFunctionName,
      lambdaFunctionArn: this.lambdaFunctionArn,
      deploymentBucketName: this.deploymentBucketName,
    });
  }
}
```

## File: Pulumi.yaml

```yaml
name: lambda-optimization-${environmentSuffix}
runtime: nodejs
description: Lambda function optimization infrastructure
```

## File: package.json

```json
{
  "name": "lambda-optimization",
  "version": "1.0.0",
  "description": "Lambda function optimization with Pulumi",
  "main": "lib/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint lib/**/*.ts"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

## Notes

This implementation provides BASELINE infrastructure:
1. S3 bucket with versioning for Lambda deployment packages
2. Lambda layer for shared dependencies
3. IAM role with basic Lambda execution permissions
4. Lambda function with NON-OPTIMIZED configuration:
   - Memory: 3008MB (baseline - will be optimized to 1024MB)
   - Timeout: 300 seconds (baseline - will be optimized to 30s)
   - No reserved concurrency (will be added: 50)
   - X-Ray tracing: PassThrough (will be enabled: Active)
5. CloudWatch log group with indefinite retention (will be optimized to 7 days)

The `lib/optimize.py` script will perform the following optimizations after deployment:
- Reduce Lambda memory: 3008MB → 1024MB
- Reduce Lambda timeout: 300s → 30s
- Set CloudWatch log retention: indefinite → 7 days
- Add reserved concurrency: 50
- Enable X-Ray tracing: Active
- Configure Dead Letter Queue with SQS
- Add environment variables: DATABASE_URL and API_KEY
- Create CloudWatch alarms for error rate and duration

This approach allows testing both baseline and optimized configurations.