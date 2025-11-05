import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface ComplianceScannerLambdaArgs {
  environmentSuffix: string;
  bucketName: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupIds: pulumi.Input<string>[];
  metricsNamespace: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  deadLetterQueueArn?: pulumi.Input<string>;
}

export class ComplianceScannerLambda extends pulumi.ComponentResource {
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly lambdaName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComplianceScannerLambdaArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:ComplianceScanner', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${suffix}`,
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

    // IAM policy for Lambda permissions
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${suffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([
            args.bucketName,
            args.snsTopicArn,
            args.deadLetterQueueArn || '',
          ])
          .apply(([bucketName, topicArn, dlqArn]) => {
            const statements: any[] = [
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeTags',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:ListAllMyBuckets',
                  's3:GetBucketEncryption',
                  's3:GetBucketTagging',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:GetObject'],
                Resource: `arn:aws:s3:::${bucketName}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['lambda:ListFunctions', 'lambda:ListTags'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
              },
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
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                ],
                Resource: '*',
              },
            ];

            // Add SQS permissions if DLQ is provided
            if (dlqArn) {
              statements.push({
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: dlqArn,
              });
            }

            return JSON.stringify({
              Version: '2012-10-17',
              Statement: statements,
            });
          }),
      },
      { parent: this }
    );

    // Lambda function configuration
    const lambdaConfig: aws.lambda.FunctionArgs = {
      name: `compliance-scanner-${suffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          COMPLIANCE_BUCKET: args.bucketName,
          SNS_TOPIC_ARN: args.snsTopicArn,
          METRICS_NAMESPACE: args.metricsNamespace,
          REQUIRED_TAGS: 'Environment,Owner,CostCenter',
        },
      },
      vpcConfig: {
        subnetIds: args.vpcSubnetIds,
        securityGroupIds: args.vpcSecurityGroupIds,
      },
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(
          path.join(__dirname, 'functions/compliance-scanner')
        ),
      }),
      tags: tags,
    };

    // Add dead letter config if provided
    if (args.deadLetterQueueArn) {
      lambdaConfig.deadLetterConfig = {
        targetArn: args.deadLetterQueueArn,
      };
    }

    // Lambda function
    const lambda = new aws.lambda.Function(
      `compliance-scanner-${suffix}`,
      lambdaConfig,
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    this.lambdaArn = lambda.arn;
    this.lambdaName = lambda.name;

    this.registerOutputs({
      lambdaArn: this.lambdaArn,
      lambdaName: this.lambdaName,
    });
  }
}
