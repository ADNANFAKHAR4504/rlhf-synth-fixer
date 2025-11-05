/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for multi-environment data processing infrastructure.
 * Deploys S3, Lambda, DynamoDB, CloudWatch, and IAM resources with environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'staging', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Environment-specific configuration interface
 */
interface EnvironmentConfig {
  lambdaMemory: number;
  dynamoDbRCU: number;
  dynamoDbWCU: number;
  logRetentionDays: number;
  enableXRay: boolean;
  useDynamoDbOnDemand: boolean;
}

/**
 * Main Pulumi component resource for multi-environment data processing infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config();
    const environmentSuffix = args.environmentSuffix || 'dev';
    const projectName = config.get('projectName') || 'dataprocessing';
    const tags = args.tags || {};

    // Merge project tag with provided tags
    const resourceTags = {
      ...tags,
      Project: projectName,
      Environment: environmentSuffix,
    };

    // Get environment-specific configuration
    const envConfig = this.getEnvironmentConfig(environmentSuffix);

    // 1. Create CloudWatch Log Group (must be created before Lambda)
    const logGroup = new aws.cloudwatch.LogGroup(
      `${environmentSuffix}-datavalidation-loggroup`,
      {
        name: `/aws/lambda/${environmentSuffix}-datavalidation-function`,
        retentionInDays: envConfig.logRetentionDays,
        tags: resourceTags,
      },
      { parent: this }
    );

    // 2. Create S3 Bucket for raw data ingestion
    const bucket = new aws.s3.Bucket(
      `${environmentSuffix}-rawdata-bucket`,
      {
        bucket: `${environmentSuffix}-rawdata-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // Block all public access to the S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `${environmentSuffix}-rawdata-bucket-public-access-block`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: bucket }
    );

    // 3. Create DynamoDB Table for metadata storage
    const billingMode = envConfig.useDynamoDbOnDemand
      ? 'PAY_PER_REQUEST'
      : 'PROVISIONED';

    const dynamoTable = new aws.dynamodb.Table(
      `${environmentSuffix}-metadata-table`,
      {
        name: `${environmentSuffix}-metadata-table-${environmentSuffix}`,
        billingMode: billingMode,
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        ...(billingMode === 'PROVISIONED' && {
          readCapacity: envConfig.dynamoDbRCU,
          writeCapacity: envConfig.dynamoDbWCU,
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // 4. Create IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(
      `${environmentSuffix}-datavalidation-lambda-role`,
      {
        name: `${environmentSuffix}-datavalidation-lambda-role-${environmentSuffix}`,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // 5. Create IAM Policy for S3 read access (least privilege)
    const s3ReadPolicy = new aws.iam.Policy(
      `${environmentSuffix}-lambda-s3-read-policy`,
      {
        name: `${environmentSuffix}-lambda-s3-read-policy-${environmentSuffix}`,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
              ],
              "Resource": "${bucket.arn}/*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "s3:ListBucket"
              ],
              "Resource": "${bucket.arn}"
            }
          ]
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // 6. Create IAM Policy for DynamoDB write access (least privilege)
    const dynamoWritePolicy = new aws.iam.Policy(
      `${environmentSuffix}-lambda-dynamodb-write-policy`,
      {
        name: `${environmentSuffix}-lambda-dynamodb-write-policy-${environmentSuffix}`,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
              ],
              "Resource": "${dynamoTable.arn}"
            }
          ]
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // 7. Create IAM Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.Policy(
      `${environmentSuffix}-lambda-logs-policy`,
      {
        name: `${environmentSuffix}-lambda-logs-policy-${environmentSuffix}`,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": "${logGroup.arn}:*"
            }
          ]
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // 8. Create IAM Policy for X-Ray (if enabled)
    let xrayPolicy: aws.iam.Policy | undefined;
    if (envConfig.enableXRay) {
      xrayPolicy = new aws.iam.Policy(
        `${environmentSuffix}-lambda-xray-policy`,
        {
          name: `${environmentSuffix}-lambda-xray-policy-${environmentSuffix}`,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                Resource: '*',
              },
            ],
          }),
          tags: resourceTags,
        },
        { parent: this }
      );
    }

    // 9. Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(
      `${environmentSuffix}-lambda-s3-attachment`,
      {
        role: lambdaRole.name,
        policyArn: s3ReadPolicy.arn,
      },
      { parent: lambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `${environmentSuffix}-lambda-dynamodb-attachment`,
      {
        role: lambdaRole.name,
        policyArn: dynamoWritePolicy.arn,
      },
      { parent: lambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `${environmentSuffix}-lambda-logs-attachment`,
      {
        role: lambdaRole.name,
        policyArn: logsPolicy.arn,
      },
      { parent: lambdaRole }
    );

    if (xrayPolicy) {
      new aws.iam.RolePolicyAttachment(
        `${environmentSuffix}-lambda-xray-attachment`,
        {
          role: lambdaRole.name,
          policyArn: xrayPolicy.arn,
        },
        { parent: lambdaRole }
      );
    }

    // 10. Create Lambda Function for data validation
    const lambdaFunction = new aws.lambda.Function(
      `${environmentSuffix}-datavalidation-function`,
      {
        name: `${environmentSuffix}-datavalidation-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        memorySize: envConfig.lambdaMemory,
        timeout: 60,
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
      const size = record.s3.object.size;

      console.log(\`Processing file: \${key} from bucket: \${bucket}\`);

      // Basic validation
      if (size === 0) {
        console.warn(\`Empty file detected: \${key}\`);
        continue;
      }

      // Store metadata in DynamoDB
      const tableName = process.env.DYNAMO_TABLE_NAME;
      const timestamp = new Date().toISOString();

      const params = {
        TableName: tableName,
        Item: {
          id: \`\${bucket}/\${key}\`,
          bucket: bucket,
          key: key,
          size: size,
          timestamp: timestamp,
          environment: process.env.ENVIRONMENT,
          status: 'validated',
        },
      };

      await dynamodb.put(params).promise();
      console.log(\`Metadata stored for: \${key}\`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Validation completed successfully' }),
    };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
          `),
        }),
        ...(envConfig.enableXRay && {
          tracingConfig: {
            mode: 'Active',
          },
        }),
        tags: resourceTags,
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // 11. Grant S3 permission to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `${environmentSuffix}-s3-invoke-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 's3.amazonaws.com',
        sourceArn: bucket.arn,
      },
      { parent: lambdaFunction }
    );

    // 12. Configure S3 bucket notification to trigger Lambda
    new aws.s3.BucketNotification(
      `${environmentSuffix}-rawdata-bucket-notification`,
      {
        bucket: bucket.id,
        lambdaFunctions: [
          {
            lambdaFunctionArn: lambdaFunction.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      { parent: bucket, dependsOn: [lambdaPermission] }
    );

    // 13. Export outputs with environment prefix
    this.bucketName = bucket.id;
    this.lambdaArn = lambdaFunction.arn;
    this.dynamoTableName = dynamoTable.name;

    this.registerOutputs({
      [`${environmentSuffix}-bucketName`]: this.bucketName,
      [`${environmentSuffix}-lambdaArn`]: this.lambdaArn,
      [`${environmentSuffix}-dynamoTableName`]: this.dynamoTableName,
    });
  }

  /**
   * Get environment-specific configuration
   */
  private getEnvironmentConfig(environment: string): EnvironmentConfig {
    switch (environment.toLowerCase()) {
      case 'prod':
      case 'production':
        return {
          lambdaMemory: 2048,
          dynamoDbRCU: 10,
          dynamoDbWCU: 10,
          logRetentionDays: 30,
          enableXRay: true,
          useDynamoDbOnDemand: true,
        };
      case 'staging':
      case 'stage':
        return {
          lambdaMemory: 1024,
          dynamoDbRCU: 5,
          dynamoDbWCU: 5,
          logRetentionDays: 7,
          enableXRay: true,
          useDynamoDbOnDemand: false,
        };
      case 'dev':
      case 'development':
      default:
        return {
          lambdaMemory: 512,
          dynamoDbRCU: 1,
          dynamoDbWCU: 1,
          logRetentionDays: 7,
          enableXRay: false,
          useDynamoDbOnDemand: false,
        };
    }
  }
}
