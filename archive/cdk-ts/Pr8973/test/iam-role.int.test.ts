import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ApiLambdaRole, ApiLambdaRoleProps } from '../lib/constructs/iam-role';

describe('ApiLambdaRole Integration', () => {
  let stack: cdk.Stack;
  const bucketArnForObjects = 'arn:aws:s3:::integration-bucket/*';
  const kmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/integration';

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('synthesizes IAM role and all expected policies', () => {
    const props: ApiLambdaRoleProps = { bucketArnForObjects, kmsKeyArn };
    new ApiLambdaRole(stack, 'IntegrationRole', props);

    const template = Template.fromStack(stack);

    // IAM Role
    const roles = template.findResources('AWS::IAM::Role');
    const roleProps = Object.values(roles)
      .map((r: any) => r.Properties)
      .find(
        (props: any) =>
          Array.isArray(props.AssumeRolePolicyDocument?.Statement) &&
          props.AssumeRolePolicyDocument.Statement.some(
            (stmt: any) =>
              stmt.Principal?.Service === 'lambda.amazonaws.com' ||
              (Array.isArray(stmt.Principal?.Service) &&
                stmt.Principal.Service.includes('lambda.amazonaws.com'))
          )
      );
    expect(roleProps).toBeDefined();
    expect(roleProps.AssumeRolePolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }),
      ])
    );

    // IAM Policy: CloudWatch Logs
    const policies = template.findResources('AWS::IAM::Policy');
    const policyStatements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    expect(policyStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining([
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ]),
          Resource: '*',
          Effect: 'Allow',
        }),
      ])
    );

    // IAM Policy: S3
    expect(policyStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining(['s3:GetObject', 's3:PutObject']),
          Resource: bucketArnForObjects,
          Effect: 'Allow',
        }),
      ])
    );

    // IAM Policy: KMS
    expect(policyStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining([
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:DescribeKey',
          ]),
          Resource: kmsKeyArn,
          Effect: 'Allow',
        }),
      ])
    );
  });
});
