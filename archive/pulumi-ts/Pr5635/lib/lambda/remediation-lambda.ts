import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface RemediationLambdaArgs {
  environmentSuffix: string;
  snsTopicArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupIds: pulumi.Input<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
  deadLetterQueueArn?: pulumi.Input<string>;
}

export class RemediationLambda extends pulumi.ComponentResource {
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly lambdaName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RemediationLambdaArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:Remediation', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `remediation-lambda-role-${suffix}`,
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
      `remediation-lambda-policy-${suffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([args.snsTopicArn, args.deadLetterQueueArn || ''])
          .apply(([topicArn, dlqArn]) => {
            const statements: any[] = [
              {
                Effect: 'Allow',
                Action: ['s3:PutBucketEncryption', 's3:PutBucketTagging'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['ec2:CreateTags', 'ec2:ModifyInstanceAttribute'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
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
      name: `remediation-lambda-${suffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 300,
      memorySize: 256,
      environment: {
        variables: {
          SNS_TOPIC_ARN: args.snsTopicArn,
        },
      },
      vpcConfig: {
        subnetIds: args.vpcSubnetIds,
        securityGroupIds: args.vpcSecurityGroupIds,
      },
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(
          path.join(__dirname, 'functions/remediation')
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
      `remediation-lambda-${suffix}`,
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
