import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ApiLambdaRole, ApiLambdaRoleProps } from '../lib/constructs/iam-role';

describe('ApiLambdaRole', () => {
  let stack: cdk.Stack;
  const bucketArnForObjects = 'arn:aws:s3:::my-bucket/*';
  const kmsKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/abc123';

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('creates IAM role with correct trust policy', () => {
    const props: ApiLambdaRoleProps = { bucketArnForObjects, kmsKeyArn };
    const roleConstruct = new ApiLambdaRole(stack, 'TestRole', props);
    expect(roleConstruct.role).toBeInstanceOf(iam.Role);

    // Check trust policy
    const assumePolicyJson = roleConstruct.role.assumeRolePolicy?.toJSON();
    const principalServices =
      assumePolicyJson?.Statement[0]?.Principal?.Service;
    if (Array.isArray(principalServices)) {
      expect(principalServices).toContain('lambda.amazonaws.com');
    } else {
      expect(principalServices).toEqual(
        expect.stringContaining('lambda.amazonaws.com')
      );
    }
  });

  test('adds CloudWatch Logs policy', () => {
    const props: ApiLambdaRoleProps = { bucketArnForObjects, kmsKeyArn };
    new ApiLambdaRole(stack, 'TestRoleLogs', props);

    const template = Template.fromStack(stack);
    const policies = template.findResources('AWS::IAM::Policy');
    const statements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    expect(statements).toEqual(
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
  });

  test('adds S3 object-level policy', () => {
    const props: ApiLambdaRoleProps = { bucketArnForObjects, kmsKeyArn };
    new ApiLambdaRole(stack, 'TestRoleS3', props);

    const template = Template.fromStack(stack);
    const policies = template.findResources('AWS::IAM::Policy');
    const statements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining(['s3:GetObject', 's3:PutObject']),
          Resource: bucketArnForObjects,
          Effect: 'Allow',
        }),
      ])
    );
  });

  test('adds KMS key policy', () => {
    const props: ApiLambdaRoleProps = { bucketArnForObjects, kmsKeyArn };
    new ApiLambdaRole(stack, 'TestRoleKMS', props);

    const template = Template.fromStack(stack);
    const policies = template.findResources('AWS::IAM::Policy');
    const statements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining([
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:DescribeKey',
          ]),
          Resource: kmsKeyArn, // <-- Fix here
          Effect: 'Allow',
        }),
      ])
    );
  });

  test('throws if missing required props', () => {
    // Should throw if bucketArnForObjects is missing
    expect(
      () =>
        // @ts-expect-error
        new ApiLambdaRole(stack, 'MissingBucketArn', { kmsKeyArn })
    ).toThrow();
    // Should throw if kmsKeyArn is missing
    expect(
      () =>
        // @ts-expect-error
        new ApiLambdaRole(stack, 'MissingKmsArn', { bucketArnForObjects })
    ).toThrow();
  });
});
