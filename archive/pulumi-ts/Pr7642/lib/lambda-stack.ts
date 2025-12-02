import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly role: aws.iam.Role;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:lambda:LambdaStack', name, {}, opts);

    const { environmentSuffix, tags = {} } = args;

    // Create IAM role for Lambda
    this.role = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for EC2 and SSM access
    const lambdaPolicy = new aws.iam.Policy(
      `lambda-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:CreateTags',
                'ec2:DescribeTags',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ssm:PutParameter', 'ssm:GetParameter'],
              Resource: `arn:aws:ssm:*:*:parameter/compliance/reports/${environmentSuffix}/*`,
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `lambda-policy-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach custom policy
    new aws.iam.RolePolicyAttachment(
      `lambda-custom-policy-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: this }
    );

    // Read Lambda function code
    const lambdaCode = fs.readFileSync(
      path.join(__dirname, 'lambda', 'tag-remediation.py'),
      'utf-8'
    );

    // Create Lambda function
    this.function = new aws.lambda.Function(
      `tag-remediation-${environmentSuffix}`,
      {
        runtime: 'python3.13',
        handler: 'index.lambda_handler',
        role: this.role.arn,
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(lambdaCode),
        }),
        timeout: 60,
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...tags,
          Name: `tag-remediation-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    new aws.cloudwatch.LogGroup(
      `lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/tag-remediation-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `lambda-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
    });
  }
}
