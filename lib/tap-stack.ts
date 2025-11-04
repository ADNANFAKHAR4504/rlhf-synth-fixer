import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// AWS resources
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

interface TapStackProps {
  environment?: 'dev' | 'staging' | 'prod';
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'ap-northeast-2'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environment = props?.environment || 'dev';
    const environmentSuffix = props?.environmentSuffix || environment;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-northeast-2';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Payment API resources
    const commonTags = {
      Environment: environment,
      Project: 'payment-api',
      ManagedBy: 'cdktf',
      EnvironmentSuffix: environmentSuffix,
    };

    // S3 buckets: logs and receipts
    const logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `payment-logs-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: 'transaction-logs',
      },
      forceDestroy: environment !== 'prod',
    });

    new S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: logsBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, 'logs-bucket-lifecycle', {
      bucket: logsBucket.id,
      rule: [
        {
          id: 'expire-old-logs',
          status: 'Enabled',
          expiration: [
            {
              days:
                environment === 'prod'
                  ? 90
                  : environment === 'staging'
                    ? 30
                    : 7,
            },
          ],
        },
      ],
    });

    const receiptsBucket = new S3Bucket(this, 'receipts-bucket', {
      bucket: `payment-receipts-${environmentSuffix}`,
      tags: {
        ...commonTags,
        Purpose: 'payment-receipts',
      },
      forceDestroy: environment !== 'prod',
    });

    new S3BucketVersioningA(this, 'receipts-bucket-versioning', {
      bucket: receiptsBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'receipts-bucket-encryption',
      {
        bucket: receiptsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'receipts-bucket-pab', {
      bucket: receiptsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, 'receipts-bucket-lifecycle', {
      bucket: receiptsBucket.id,
      rule: [
        {
          id: 'expire-old-receipts',
          status: 'Enabled',
          expiration: [
            {
              days:
                environment === 'prod'
                  ? 90
                  : environment === 'staging'
                    ? 30
                    : 7,
            },
          ],
        },
      ],
    });

    // DynamoDB table for transactions
    const transactionsTable = new DynamodbTable(this, 'transactions-table', {
      name: `payment-transactions-${environmentSuffix}`,
      billingMode: environment === 'dev' ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      readCapacity:
        environment === 'prod' ? 10 : environment === 'staging' ? 5 : undefined,
      writeCapacity:
        environment === 'prod' ? 10 : environment === 'staging' ? 5 : undefined,
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        { name: 'transactionId', type: 'S' },
        { name: 'timestamp', type: 'N' },
        { name: 'customerId', type: 'S' },
        { name: 'transactionDate', type: 'S' },
      ],
      globalSecondaryIndex: [
        {
          name: 'customer-index',
          hashKey: 'customerId',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
          writeCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
        },
        {
          name: 'date-index',
          hashKey: 'transactionDate',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
          writeCapacity:
            environment === 'prod'
              ? 10
              : environment === 'staging'
                ? 5
                : undefined,
        },
      ],
      pointInTimeRecovery: { enabled: environment === 'prod' },
      tags: { ...commonTags, Purpose: 'transaction-storage' },
    });

    // CloudWatch log group for Lambda
    const logRetentionDays =
      environment === 'prod' ? 30 : environment === 'staging' ? 14 : 7;

    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/payment-processor-${environmentSuffix}`,
      retentionInDays: logRetentionDays,
      tags: commonTags,
    });

    // IAM role and policies for Lambda
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `payment-processor-role-${environmentSuffix}`,
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
      tags: commonTags,
    });

    // Basic execution role for logs
    new IamRolePolicyAttachment(this, 'lambda-basic-exec', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Least-privilege inline policy for DynamoDB and S3
    new IamRolePolicy(this, 'lambda-inline-policy', {
      name: `payment-processor-inline-${environmentSuffix}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
              'dynamodb:DescribeTable',
            ],
            Resource: [
              transactionsTable.arn,
              `${transactionsTable.arn}/index/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: [`${logsBucket.arn}/*`, `${receiptsBucket.arn}/*`],
          },
        ],
      }),
    });

    // Lambda function
    const lambdaFn = new LambdaFunction(this, 'payment-processor', {
      functionName: `payment-processor-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      memorySize:
        environment === 'prod' ? 2048 : environment === 'staging' ? 1024 : 512,
      timeout: 30,
      environment: {
        variables: {
          TRANSACTIONS_TABLE: transactionsTable.name,
          LOGS_BUCKET: logsBucket.bucket,
          RECEIPTS_BUCKET: receiptsBucket.bucket,
          ENVIRONMENT: environment,
        },
      },
      filename: 'lambda/payment-processor.zip',
      sourceCodeHash: '${filebase64sha256("lambda/payment-processor.zip")}',
      tags: commonTags,
      dependsOn: [lambdaLogGroup],
    });

    // API Gateway: /payments POST -> Lambda (proxy)
    const api = new ApiGatewayRestApi(this, 'payment-api', {
      name: `payment-api-${environmentSuffix}`,
      description: `Payment Processing API - ${environment}`,
      tags: commonTags,
    });

    const paymentsResource = new ApiGatewayResource(this, 'payments-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'payments',
    });

    const postMethod = new ApiGatewayMethod(this, 'post-method', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFn.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    const integration = new ApiGatewayIntegration(this, 'lambda-integration', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFn.invokeArn,
    });

    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [postMethod],
      lifecycle: { createBeforeDestroy: true },
      triggers: { redeploy: integration.id },
    });

    // Instantiate Stage without assigning (avoid unused variable lint)
    new ApiGatewayStage(this, 'api-stage', {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: environment,
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${awsRegion}.amazonaws.com/${environment}/payments`,
      description: 'Payment API endpoint URL',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket,
      description: 'S3 bucket for transaction logs',
    });

    new TerraformOutput(this, 'receipts-bucket-name', {
      value: receiptsBucket.bucket,
      description: 'S3 bucket for payment receipts',
    });

    new TerraformOutput(this, 'transactions-table-name', {
      value: transactionsTable.name,
      description: 'DynamoDB table for transactions',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambdaFn.functionName,
      description: 'Lambda function name',
    });
  }
}
