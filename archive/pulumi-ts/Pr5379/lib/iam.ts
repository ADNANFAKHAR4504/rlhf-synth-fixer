/**
 * IAM roles and policies with region restrictions
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface LambdaRoleArgs {
  roleName: string;
  region: string;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;

  constructor(
    name: string,
    args: LambdaRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:LambdaRole', name, {}, opts);

    this.role = new aws.iam.Role(
      `${args.roleName}-${args.environmentSuffix}`,
      {
        name: `${args.roleName}-${args.environmentSuffix}`,
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
        inlinePolicies: [
          {
            name: 'lambda-execution-policy',
            policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    's3:GetObject',
                    's3:PutObject',
                  ],
                  Resource: '*',
                  Condition: {
                    StringEquals: {
                      'aws:RequestedRegion': args.region,
                    },
                  },
                },
                {
                  Effect: 'Deny',
                  Action: '*',
                  Resource: '*',
                  Condition: {
                    StringNotEquals: {
                      'aws:RequestedRegion': args.region,
                    },
                  },
                },
              ],
            }),
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      roleArn: this.role.arn,
      roleName: this.role.name,
    });
  }
}
