import { Construct } from 'constructs';
import { TerraformStack, TerraformAsset, AssetType } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import * as path from 'path';

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    props: {
      environmentSuffix: string;
      stateBucket: string;
      stateBucketRegion: string;
      awsRegion: string;
      defaultTags: { tags: Record<string, string> };
    }
  ) {
    super(scope, id);

    // Configure AWS Provider using the provided region
    new AwsProvider(this, 'AWS', {
      region: props.awsRegion,
    });

    // Use provided tags with fallback to Production
    const commonTags = {
      Environment: props.defaultTags.tags.Environment || 'Production',
      ...props.defaultTags.tags,
    };

    // Generate unique suffix for bucket name
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    // Create SQS Dead Letter Queue for Lambda function
    const dlqQueue = new SqsQueue(this, 'ImageProcessingDLQ', {
      name: 'image-processing-lambda-dlq',
      tags: commonTags,
    });

    // Create SNS Topic for success notifications
    const snsTopic = new SnsTopic(this, 'ImageProcessingTopic', {
      name: 'image-processing-completion-notifications',
      tags: commonTags,
    });

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
      name: '/aws/lambda/image-processing-function',
      retentionInDays: 14,
      tags: commonTags,
    });

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new IamRole(this, 'LambdaExecutionRole', {
      name: 'image-processing-lambda-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // Create IAM policy for Lambda function with specific permissions
    new IamRolePolicy(this, 'LambdaPolicy', {
      name: 'image-processing-lambda-policy',
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            // CloudWatch Logs permissions
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${logGroup.arn}:*`,
          },
          {
            // SNS publish permissions
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: snsTopic.arn,
          },
          {
            // SQS send message permissions for DLQ
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: dlqQueue.arn,
          },
        ],
      }),
    });

    // console.log("dirname: " + __dirname)

    // Package Lambda function code
    const lambdaAsset = new TerraformAsset(this, 'LambdaAsset', {
      path: path.join(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    // Create Lambda function
    const lambdaFunction = new LambdaFunction(this, 'ImageProcessingFunction', {
      functionName: 'image-processing-function',
      role: lambdaRole.arn,
      handler: 'index.lambda_handler',
      runtime: 'python3.8',
      filename: lambdaAsset.path,
      sourceCodeHash: lambdaAsset.assetHash,
      timeout: 30,
      environment: {
        variables: {
          SNS_TOPIC_ARN: snsTopic.arn,
        },
      },
      deadLetterConfig: {
        targetArn: dlqQueue.arn,
      },
      dependsOn: [logGroup],
      tags: commonTags,
    });

    // Create S3 bucket for image processing
    const s3Bucket = new S3Bucket(this, 'ImageProcessingBucket', {
      bucket: `image-processing-source-bucket-${props.environmentSuffix}-${uniqueSuffix}`,
      tags: commonTags,
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Grant S3 permission to invoke Lambda function
    new LambdaPermission(this, 'S3InvokeLambdaPermission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: s3Bucket.arn,
    });

    // Configure S3 bucket notification to trigger Lambda
    new S3BucketNotification(this, 'BucketNotification', {
      bucket: s3Bucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: lambdaFunction.arn,
          events: ['s3:ObjectCreated:*'],
        },
      ],
      dependsOn: [lambdaFunction],
    });

    // Note: Console output statements removed for production deployment
  }
}
