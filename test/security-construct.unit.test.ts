import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityConstruct } from '../lib/security-construct';

describe('SecurityConstruct', () => {
  let stack: cdk.Stack;
  let template: Template;
  let securityConstruct: SecurityConstruct;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    securityConstruct = new SecurityConstruct(stack, 'Security', {
      environmentSuffix: 'test',
      region: 'us-east-1',
    });

    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', 
        Match.objectLike({
          AliasName: 'alias/test-encryption-key-us-east-1',
        })
      );
    });

    test('should expose KMS key', () => {
      expect(securityConstruct.kmsKey).toBeDefined();
    });
  });

  describe('Lambda Execution Role', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-lambda-execution-role-us-east-1',
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: Match.objectLike({
                  Service: 'lambda.amazonaws.com',
                }),
                Action: 'sts:AssumeRole',
              }),
            ]),
          }),
        })
      );
    });

    test('should attach VPC access execution role policy', () => {
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.values(resources).find((r: any) => 
        r.Type === 'AWS::IAM::Role' && 
        r.Properties?.RoleName === 'test-lambda-execution-role-us-east-1'
      ) as any;
      
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(lambdaRole.Properties.ManagedPolicyArns.some((arn: any) => 
        JSON.stringify(arn).includes('AWSLambdaVPCAccessExecutionRole')
      )).toBe(true);
    });

    test('should include cross-region DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-lambda-execution-role-us-east-1',
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: Match.objectLike({
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.arrayWith([
                      'dynamodb:GetItem',
                      'dynamodb:PutItem',
                      'dynamodb:UpdateItem',
                      'dynamodb:DeleteItem',
                      'dynamodb:Query',
                      'dynamodb:Scan',
                    ]),
                    Resource: 'arn:aws:dynamodb:*:123456789012:table/test-*',
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    test('should include S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-lambda-execution-role-us-east-1',
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: Match.objectLike({
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.arrayWith([
                      's3:GetObject',
                      's3:PutObject',
                      's3:DeleteObject',
                    ]),
                    Resource: 'arn:aws:s3:::test-*/*',
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    test('should include KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-lambda-execution-role-us-east-1',
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: Match.objectLike({
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.arrayWith([
                      'kms:Decrypt',
                      'kms:GenerateDataKey',
                    ]),
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    test('should include CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-lambda-execution-role-us-east-1',
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: Match.objectLike({
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.arrayWith([
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents',
                    ]),
                    Resource: '*',
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    test('should expose Lambda execution role', () => {
      expect(securityConstruct.lambdaExecutionRole).toBeDefined();
    });
  });

  describe('Cross-Region Role', () => {
    test('should create cross-region role', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-cross-region-role-us-east-1',
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: Match.objectLike({
                  AWS: Match.anyValue(),
                }),
                Action: 'sts:AssumeRole',
              }),
            ]),
          }),
        })
      );
    });

    test('should include STS assume role permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: 'test-cross-region-role-us-east-1',
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: Match.objectLike({
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Resource: 'arn:aws:iam::123456789012:role/test-cross-region-role-*',
                  }),
                ]),
              }),
            }),
          ]),
        })
      );
    });

    test('should expose cross-region role', () => {
      expect(securityConstruct.crossRegionRole).toBeDefined();
    });
  });
});