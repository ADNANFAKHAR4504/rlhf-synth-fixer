# Multi-Region Disaster Recovery - Ideal Solution

Perfect implementation of multi-region DR infrastructure using Pulumi TypeScript.

## What Makes This Ideal

### 1. Clean Code Architecture
- **bin/tap.ts**: Entry point with proper environment variable handling and output exports
- **lib/tap-stack.ts**: Single comprehensive stack with all DR components

```typescript
/**
 * tap-stack.ts
 *
 * Multi-Region Disaster Recovery Infrastructure
 * Implements cross-region failover between us-east-1 and us-west-2
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Multi-Region Disaster Recovery Stack
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly primaryLambdaUrl: pulumi.Output<string>;
  public readonly secondaryLambdaUrl: pulumi.Output<string>;
  public readonly globalTableName: pulumi.Output<string>;
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Primary and secondary regions
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';

    // Create AWS providers for both regions
    const primaryProvider = new aws.Provider(
      'primary-provider',
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      'secondary-provider',
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // ===== DynamoDB Global Table =====
    const tableName = `tap-${environmentSuffix}-global`;

    // Create table in primary region
    const primaryTable = new aws.dynamodb.Table(
      'primary-table',
      {
        name: tableName,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        replicas: [
          {
            regionName: secondaryRegion,
          },
        ],
        tags: pulumi.output(tags).apply(t => ({ ...t, Name: tableName })),
      },
      { provider: primaryProvider, parent: this }
    );

    // ===== S3 Buckets with Cross-Region Replication =====
    const primaryBucketName = `tap-${environmentSuffix}-primary-${primaryRegion}`;
    const secondaryBucketName = `tap-${environmentSuffix}-secondary-${secondaryRegion}`;

    // Create replication role
    const replicationRole = new aws.iam.Role(
      's3-replication-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 's3.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `tap-${environmentSuffix}-replication-role`,
        })),
      },
      { parent: this }
    );

    // Secondary bucket (must exist before replication)
    const secondaryBucket = new aws.s3.Bucket(
      'secondary-bucket',
      {
        bucket: secondaryBucketName,
        versioning: { enabled: true },
        tags: pulumi
          .output(tags)
          .apply(t => ({ ...t, Name: secondaryBucketName })),
      },
      { provider: secondaryProvider, parent: this }
    );

    // Primary bucket with replication
    const primaryBucket = new aws.s3.Bucket(
      'primary-bucket',
      {
        bucket: primaryBucketName,
        versioning: { enabled: true },
        replicationConfiguration: {
          role: replicationRole.arn,
          rules: [
            {
              id: 'replicate-all',
              status: 'Enabled',
              destination: {
                bucket: secondaryBucket.arn,
                storageClass: 'STANDARD',
              },
            },
          ],
        },
        tags: pulumi
          .output(tags)
          .apply(t => ({ ...t, Name: primaryBucketName })),
      },
      { provider: primaryProvider, parent: this, dependsOn: [secondaryBucket] }
    );

    // Replication policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const replicationPolicy = new aws.iam.RolePolicy(
      's3-replication-policy',
      {
        role: replicationRole.id,
        policy: pulumi
          .all([primaryBucket.arn, secondaryBucket.arn])
          .apply(([src, dst]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: src,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                  ],
                  Resource: `${src}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
                  Resource: `${dst}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ===== Lambda Functions (without VPC for simplicity) =====
    const lambdaRole = new aws.iam.Role(
      'lambda-execution-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: pulumi
          .output(tags)
          .apply(t => ({ ...t, Name: `tap-${environmentSuffix}-lambda-role` })),
      },
      { parent: this }
    );

    // DynamoDB access policy
    const dynamoPolicy = new aws.iam.RolePolicy(
      'lambda-dynamo-policy',
      {
        role: lambdaRole.id,
        policy: primaryTable.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const region = process.env.AWS_REGION;
    const tableName = process.env.TABLE_NAME;

    try {
        // Put an item
        await dynamodb.put({
            TableName: tableName,
            Item: {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                region: region,
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Success from ' + region,
                tableName: tableName
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
`;

    // Primary Lambda
    const primaryLambda = new aws.lambda.Function(
      'primary-lambda',
      {
        name: `tap-${environmentSuffix}-primary`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        environment: {
          variables: {
            TABLE_NAME: primaryTable.name,
          },
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `tap-${environmentSuffix}-primary-lambda`,
        })),
      },
      { provider: primaryProvider, parent: this, dependsOn: [dynamoPolicy] }
    );

    // Secondary Lambda
    const secondaryLambda = new aws.lambda.Function(
      'secondary-lambda',
      {
        name: `tap-${environmentSuffix}-secondary`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        environment: {
          variables: {
            TABLE_NAME: primaryTable.name,
          },
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `tap-${environmentSuffix}-secondary-lambda`,
        })),
      },
      { provider: secondaryProvider, parent: this, dependsOn: [dynamoPolicy] }
    );

    // Lambda Function URLs
    const primaryLambdaUrl = new aws.lambda.FunctionUrl(
      'primary-lambda-url',
      {
        functionName: primaryLambda.name,
        authorizationType: 'NONE',
      },
      { provider: primaryProvider, parent: this }
    );

    const secondaryLambdaUrl = new aws.lambda.FunctionUrl(
      'secondary-lambda-url',
      {
        functionName: secondaryLambda.name,
        authorizationType: 'NONE',
      },
      { provider: secondaryProvider, parent: this }
    );

    // Lambda URL invoke permissions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const primaryLambdaPermission = new aws.lambda.Permission(
      'primary-lambda-url-permission',
      {
        action: 'lambda:InvokeFunctionUrl',
        function: primaryLambda.name,
        principal: '*',
        functionUrlAuthType: 'NONE',
      },
      { provider: primaryProvider, parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const secondaryLambdaPermission = new aws.lambda.Permission(
      'secondary-lambda-url-permission',
      {
        action: 'lambda:InvokeFunctionUrl',
        function: secondaryLambda.name,
        principal: '*',
        functionUrlAuthType: 'NONE',
      },
      { provider: secondaryProvider, parent: this }
    );

    // Set outputs
    this.primaryLambdaUrl = primaryLambdaUrl.functionUrl;
    this.secondaryLambdaUrl = secondaryLambdaUrl.functionUrl;
    this.globalTableName = primaryTable.name;
    this.primaryBucketName = primaryBucket.id;
    this.secondaryBucketName = secondaryBucket.id;

    // Register outputs
    this.registerOutputs({
      primaryLambdaUrl: this.primaryLambdaUrl,
      secondaryLambdaUrl: this.secondaryLambdaUrl,
      globalTableName: this.globalTableName,
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
    });
  }
}
```
