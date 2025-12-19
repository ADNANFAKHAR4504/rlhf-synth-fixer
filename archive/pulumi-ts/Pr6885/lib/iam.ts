import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamProps {
  environment: string;
  environmentSuffix: string;
  transactionTableArn: pulumi.Input<string>;
  auditBucketArn: pulumi.Input<string>;
}

export class IamComponent extends pulumi.ComponentResource {
  public lambdaRole: aws.iam.Role;

  constructor(
    name: string,
    props: IamProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:iam:IamComponent', name, {}, opts);

    // Create Lambda execution role
    this.lambdaRole = new aws.iam.Role(
      `${props.environment}-lambda-role-${props.environment}-${props.environmentSuffix}`,
      {
        name: `${props.environment}-payments-lambda-${props.environment}-${props.environmentSuffix}`,
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
          Name: `${props.environment}-lambda-role-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `${props.environment}-lambda-basic-${props.environment}-${props.environmentSuffix}`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for DynamoDB and S3 access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lambdaCustomPolicy = new aws.iam.RolePolicy(
      `${props.environment}-lambda-custom-policy-${props.environment}-${props.environmentSuffix}`,
      {
        role: this.lambdaRole.id,
        policy: pulumi
          .all([props.transactionTableArn, props.auditBucketArn])
          .apply(([tableArn, bucketArn]) =>
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
                  Resource: [tableArn, `${tableArn}/index/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject'],
                  Resource: `${bucketArn}/*`,
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
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({
      lambdaRoleArn: this.lambdaRole.arn,
    });
  }
}
