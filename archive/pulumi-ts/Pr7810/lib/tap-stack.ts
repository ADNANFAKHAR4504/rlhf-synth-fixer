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
  public readonly complianceFunctionArn: pulumi.Output<string>;
  public readonly complianceFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // S3 bucket for compliance reports
    const reportBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `compliance-reports-${environmentSuffix}`,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
            id: 'delete-old-reports',
          },
        ],
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-role-${environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM policy for Lambda function
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([reportBucket.bucket]).apply(([bucketName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeVolumes',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeVpcs',
                  'ec2:DescribeFlowLogs',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'iam:ListRoles',
                  'iam:ListRolePolicies',
                  'iam:ListAttachedRolePolicies',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: `arn:aws:s3:::${bucketName}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda function for compliance scanning
    const complianceFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda', 'compliance-scanner.js')
          ),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // CloudWatch Log Group for Lambda
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const logGroup = new aws.cloudwatch.LogGroup(
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

    this.reportBucketName = reportBucket.bucket;
    this.complianceFunctionArn = complianceFunction.arn;
    this.complianceFunctionName = complianceFunction.name;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceFunctionArn: this.complianceFunctionArn,
      complianceFunctionName: this.complianceFunctionName,
    });
  }
}
