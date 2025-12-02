import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly complianceTable: pulumi.Output<string>;
  public readonly reportBucket: pulumi.Output<string>;
  public readonly scannerFunction: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // S3 bucket for compliance reports
    const reportsBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        versioning: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Block public access for compliance reports bucket
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-block-${environmentSuffix}`,
      {
        bucket: reportsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // DynamoDB table for compliance findings
    const complianceTable = new aws.dynamodb.Table(
      `compliance-findings-${environmentSuffix}`,
      {
        name: `compliance-findings-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'resourceId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'resourceId', type: 'S' },
          { name: 'timestamp', type: 'S' },
          { name: 'violationType', type: 'S' },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        globalSecondaryIndexes: [
          {
            name: 'ViolationTypeIndex',
            hashKey: 'violationType',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for read-only access
    const compliancePolicy = new aws.iam.Policy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeTags',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeVolumes',
                'ec2:CreateTags',
                's3:ListAllMyBuckets',
                's3:GetBucketEncryption',
                's3:GetBucketPublicAccessBlock',
                's3:PutObject',
                'iam:ListUsers',
                'iam:ListAccessKeys',
                'iam:GetAccessKeyLastUsed',
                'logs:DescribeLogGroups',
                'ec2:DescribeVpcs',
                'ec2:DescribeFlowLogs',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:BatchWriteItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:DescribeStream',
                'dynamodb:ListStreams',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `compliance-policy-attach-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: compliancePolicy.arn,
      },
      { parent: this }
    );

    // Lambda function for compliance scanning
    const scannerFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 900,
        memorySize: 512,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/scanner')
          ),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE: complianceTable.name,
            S3_BUCKET: reportsBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Lambda - dynamically derived from function name
    new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${scannerFunction.name}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge rule for daily scanning
    const schedulerRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${environmentSuffix}`,
      {
        scheduleExpression: 'cron(0 2 * * ? *)',
        description: 'Trigger compliance scan daily at 2 AM UTC',
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-scan-target-${environmentSuffix}`,
      {
        rule: schedulerRule.name,
        arn: scannerFunction.arn,
      },
      { parent: this }
    );

    // Permission for EventBridge to invoke Lambda
    new aws.lambda.Permission(
      `eventbridge-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: scannerFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: schedulerRule.arn,
      },
      { parent: this }
    );

    // Stream processor Lambda
    const streamProcessor = new aws.lambda.Function(
      `compliance-stream-processor-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/stream-processor')
          ),
        }),
        environment: {
          variables: {
            S3_BUCKET: reportsBucket.bucket,
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // DynamoDB Stream event source
    new aws.lambda.EventSourceMapping(
      `dynamodb-stream-${environmentSuffix}`,
      {
        eventSourceArn: complianceTable.streamArn,
        functionName: streamProcessor.arn,
        startingPosition: 'LATEST',
        batchSize: 10,
      },
      { parent: this }
    );

    this.complianceTable = complianceTable.name;
    this.reportBucket = reportsBucket.bucket;
    this.scannerFunction = scannerFunction.arn;

    this.registerOutputs({
      complianceTableName: this.complianceTable,
      reportBucketName: this.reportBucket,
      scannerFunctionArn: this.scannerFunction,
    });
  }
}
