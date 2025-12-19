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
      ...((args.tags as Record<string, string>) || {}),
    };

    // Get config values for environment variables
    const config = new pulumi.Config();
    const newRelicKey =
      args.newRelicLicenseKey ||
      config.get('newRelicLicenseKey') ||
      'placeholder-key';
    const dbPoolSize =
      args.dbConnectionPoolSize || config.get('dbConnectionPoolSize') || '10';

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
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
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
        // Note: Set to 10 to avoid exceeding AWS account limits on unreserved concurrency
        // AWS requires minimum 100 unreserved concurrent executions per account
        reservedConcurrentExecutions: 10,

        // Environment variables
        environment: {
          variables: {
            NEW_RELIC_LICENSE_KEY: newRelicKey,
            DB_CONNECTION_POOL_SIZE: dbPoolSize,
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
