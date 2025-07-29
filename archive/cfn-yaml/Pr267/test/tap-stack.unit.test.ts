
import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateBody = fs.readFileSync(templatePath, 'utf8');
const template = Template.fromString(templateBody);

describe('CloudFormation Template Unit Tests - S3 Lambda Integration Stack', () => {
  // S3 Bucket Tests
  test('S3 Bucket has versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
    });
  });

  test('S3 Bucket is created with correct name pattern', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'corp-s3-assets',
    });
  });

  test('S3 Bucket has correct tags', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: [
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Name', Value: 'corp-s3-bucket' },
        { Key: 'ManagedBy', Value: 'CloudFormation' },
      ],
    });
  });

  // S3 Bucket Policy Tests
  test('S3 Bucket policy allows public read access', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::corp-s3-assets/*',
          },
        ],
        Version: '2012-10-17',
      },
    });
  });

  test('S3 Bucket Policy is attached to the correct bucket', () => {
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const policy = Object.values(policies)[0];
    expect(policy.Properties.Bucket.Ref).toEqual('CorpBucket');
  });

  // Lambda Function Tests
  test('Lambda Function is created with correct name pattern', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: { 'Fn::Sub': 'corp-s3-event-handler-${AWS::StackName}' },
    });
  });

  test('Lambda uses Node.js 18.x runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
    });
  });

  test('Lambda has correct handler', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
    });
  });

  test('Lambda has correct environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          BUCKET_NAME: 'corp-s3-assets',
          ENV: 'Production',
        },
      },
    });
  });

  test('Lambda has inline code with expected structure', () => {
    const lambdaResources = template.findResources('AWS::Lambda::Function');
    const lambda = Object.values(lambdaResources)[0];
    expect(lambda.Properties.Code.ZipFile).toContain("exports.handler = async (event)");
  });

  // IAM Role Tests
  test('Lambda Execution Role has correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('Lambda Execution Role has basic execution permissions', () => {
    const roles = template.findResources('AWS::IAM::Role');
    const role = Object.values(roles)[0];
    expect(role.Properties.Policies[0].PolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Allow',
          Action: expect.arrayContaining([
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ]),
          Resource: '*',
        }),
      ])
    );
  });

  test('Lambda Execution Role has S3 read permissions', () => {
    const roles = template.findResources('AWS::IAM::Role');
    const role = Object.values(roles)[0];
    expect(role.Properties.Policies[0].PolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Allow',
          Action: expect.arrayContaining(['s3:GetObject', 's3:ListBucket']),
          Resource: expect.arrayContaining([
            'arn:aws:s3:::corp-s3-assets',
            'arn:aws:s3:::corp-s3-assets/*',
          ]),
        }),
      ])
    );
  });

  // CloudWatch Logs Tests
  test('CloudWatch Log Group is created with correct name pattern', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: { 'Fn::Sub': '/aws/lambda/corp-s3-event-handler-${AWS::StackName}' },
    });
  });

  test('CloudWatch Log Group has 14 day retention period', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 14,
    });
  });

  // Lambda Permissions Tests
  test('S3 has permission to invoke Lambda', () => {
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 's3.amazonaws.com',
      SourceArn: 'arn:aws:s3:::corp-s3-assets',
      SourceAccount: { Ref: 'AWS::AccountId' },
    });
  });

  // Outputs Tests
  test('Bucket ARN is exported in outputs', () => {
    template.hasOutput('BucketArn', {
      Export: {
        Name: { 'Fn::Sub': '${AWS::StackName}-BucketArn' },
      },
    });
  });

  test('Lambda function name is exported in outputs', () => {
    template.hasOutput('LambdaFunctionName', {
      Export: {
        Name: { 'Fn::Sub': '${AWS::StackName}-LambdaFunctionName' },
      },
    });
  });
});
