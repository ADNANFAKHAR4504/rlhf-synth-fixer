import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;

  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args || {}, opts);

    args = args || {};
    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // KMS key for SNS topic encryption
    const snsKmsKey = new aws.kms.Key(
      `compliance-sns-key-${environmentSuffix}`,
      {
        description: 'KMS key for SNS topic encryption',
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `compliance-sns-key-${environmentSuffix}`,
          Purpose: 'sns-encryption',
        },
      },
      { parent: this }
    );

    // Create KMS key alias for easier reference
    new aws.kms.Alias(
      `compliance-sns-key-alias-${environmentSuffix}`,
      {
        name: `alias/compliance-sns-${environmentSuffix}`,
        targetKeyId: snsKmsKey.keyId,
      },
      { parent: this }
    );

    // SNS Topic for critical violation alerts
    const snsTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: 'Compliance Critical Alerts',
        kmsMasterKeyId: snsKmsKey.id,
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
          Purpose: 'compliance-notifications',
        },
      },
      { parent: this }
    );

    // S3 Bucket for compliance reports
    const reportBucket = new aws.s3.BucketV2(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `compliance-reports-${environmentSuffix}`,
          Purpose: 'compliance-reports',
        },
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(
      `compliance-reports-versioning-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-block-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `compliance-reports-encryption-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // IAM Role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-role-${environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
          Purpose: 'lambda-execution',
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `compliance-scanner-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for scanning and reporting
    const scannerPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([reportBucket.arn, snsTopic.arn, snsKmsKey.arn])
          .apply(([bucketArn, topicArn, kmsKeyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:DescribeInstances',
                    'ec2:DescribeVolumes',
                    'ec2:DescribeTags',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ListAllMyBuckets',
                    's3:GetBucketPublicAccessBlock',
                    's3:GetBucketPolicyStatus',
                    's3:GetBucketAcl',
                    's3:GetBucketPolicy',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'iam:ListRoles',
                    'iam:GetRole',
                    'iam:ListRolePolicies',
                    'iam:GetRolePolicy',
                    'iam:ListAttachedRolePolicies',
                    'iam:GetPolicy',
                    'iam:GetPolicyVersion',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                  Condition: {
                    StringEquals: {
                      'cloudwatch:namespace': 'ComplianceMonitoring',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: kmsKeyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'compliance-scanner')
          ),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.bucket,
            SNS_TOPIC_ARN: snsTopic.arn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
          Purpose: 'compliance-scanning',
        },
      },
      { parent: this, dependsOn: [lambdaBasicExecution, scannerPolicy] }
    );

    // CloudWatch Log Group for Lambda
    new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `compliance-scanner-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Outputs
    this.reportBucketName = reportBucket.bucket;
    this.snsTopicArn = snsTopic.arn;
    this.lambdaFunctionArn = lambdaFunction.arn;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      snsTopicArn: this.snsTopicArn,
      lambdaFunctionArn: this.lambdaFunctionArn,
    });
  }
}
