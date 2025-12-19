# Multi-Environment Data Processing Infrastructure - MODEL RESPONSE

This implementation creates multi-environment data processing pipeline using Pulumi TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts - Multi-environment data processing infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // MISTAKE 1: Missing CloudWatch log group - Lambda will auto-create it but won't have retention policy

    // Create S3 Bucket
    const bucket = new aws.s3.Bucket(
      `rawdata-bucket`,  // MISTAKE 2: Missing environment prefix
      {
        versioning: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // MISTAKE 3: Missing S3 public access block

    // Create DynamoDB Table
    const dynamoTable = new aws.dynamodb.Table(
      `${environmentSuffix}-metadata-table`,
      {
        name: `${environmentSuffix}-metadata-table`,
        billingMode: 'PROVISIONED',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        readCapacity: 5,  // MISTAKE 4: Hardcoded capacity, not environment-specific
        writeCapacity: 5,
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(
      `${environmentSuffix}-lambda-role`,
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
        tags: tags,
      },
      { parent: this }
    );

    // MISTAKE 5: Using wildcard permissions instead of least privilege
    const lambdaPolicy = new aws.iam.Policy(
      `${environmentSuffix}-lambda-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:*', 'dynamodb:*', 'logs:*'],  // Wildcard permissions
              Resource: '*',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${environmentSuffix}-lambda-policy-attachment`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: lambdaRole }
    );

    // Create Lambda Function
    const lambdaFunction = new aws.lambda.Function(
      `${environmentSuffix}-validator`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        memorySize: 1024,  // MISTAKE 6: Hardcoded memory, not environment-specific
        timeout: 60,
        environment: {
          variables: {
            TABLE_NAME: dynamoTable.name,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        id: key,
        bucket: bucket,
        timestamp: new Date().toISOString(),
      },
    }).promise();
  }

  return { statusCode: 200 };
};
          `),
        }),
        // MISTAKE 7: Missing X-Ray tracing configuration
        tags: tags,
      },
      { parent: this }
    );

    // Grant S3 permission to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `${environmentSuffix}-s3-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 's3.amazonaws.com',
        sourceArn: bucket.arn,
      },
      { parent: lambdaFunction }
    );

    // Configure S3 notification
    const bucketNotification = new aws.s3.BucketNotification(
      `${environmentSuffix}-bucket-notification`,
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

    this.bucketName = bucket.id;
    this.lambdaArn = lambdaFunction.arn;
    this.dynamoTableName = dynamoTable.name;

    // MISTAKE 8: Outputs don't include environment prefix as required
    this.registerOutputs({
      bucketName: this.bucketName,
      lambdaArn: this.lambdaArn,
      dynamoTableName: this.dynamoTableName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi entry point for data processing infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('env') || 'dev';

const defaultTags = {
  Environment: environmentSuffix,
  // MISTAKE 9: Missing Project tag
};

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

export const bucketName = stack.bucketName;
export const lambdaArn = stack.lambdaArn;
export const dynamoTableName = stack.dynamoTableName;
```

## Issues in This Implementation

This MODEL_RESPONSE contains the following realistic mistakes:

1. **Missing CloudWatch Log Group**: Lambda auto-creates log group without retention policy
2. **Inconsistent Naming**: S3 bucket missing environment prefix
3. **Missing Security**: No S3 public access block configuration
4. **Hardcoded Values**: DynamoDB capacity not environment-specific (should be 1/5/10)
5. **Wildcard IAM Permissions**: Using s3:*, dynamodb:*, logs:* instead of least privilege
6. **Hardcoded Lambda Memory**: Using 1024MB for all environments (should be 512/1024/2048)
7. **Missing X-Ray**: No tracing configuration for staging/prod
8. **Output Naming**: Outputs don't include environment prefix as required
9. **Missing Tags**: Project tag not included in all resources

These mistakes are typical of initial implementations and are used for training the QA system to detect common errors.