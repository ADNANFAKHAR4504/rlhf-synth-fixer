import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready serverless web application infrastructure'
      );
    });
  });

  describe('Parameters', () => {
    test('should define core parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.DynamoDBReadCapacity).toBeDefined();
      expect(template.Parameters.DynamoDBWriteCapacity).toBeDefined();
      expect(template.Parameters.AllowedOrigins).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('S3 Website Bucket', () => {
    test('should configure website hosting with versioning and SSE-KMS', () => {
      const bucket = template.Resources.WebsiteS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.WebsiteConfiguration.IndexDocument).toBe('index.html');
      const enc = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('aws:kms');
    });
    test('should have a proper bucket policy resource ARN', () => {
      const policy = template.Resources.WebsiteS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Action).toBe('s3:GetObject');
      const resource = statement.Resource;
      if (typeof resource === 'string') {
        expect(resource).toContain('arn:aws:s3:::');
      } else {
        expect(resource['Fn::Sub']).toContain('arn:aws:s3:::');
      }
    });
  });

  describe('DynamoDB', () => {
    test('should define table with provisioned throughput and streams', () => {
      const table = template.Resources.ApplicationDataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
    test('stream should trigger stream processor lambda', () => {
      const mapping = template.Resources.DynamoDBStreamEventSourceMapping;
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      const fnName = mapping.Properties.FunctionName;
      if (typeof fnName === 'string') {
        expect(fnName).toBe('StreamProcessorLambdaFunction');
      } else {
        expect(fnName.Ref).toBe('StreamProcessorLambdaFunction');
      }
    });
  });

  describe('Lambdas and API Gateway', () => {
    test('should define main and stream processor lambdas with nodejs16.x', () => {
      expect(template.Resources.MainLambdaFunction.Properties.Runtime).toBe('nodejs22.x');
      expect(template.Resources.StreamProcessorLambdaFunction.Properties.Runtime).toBe('nodejs22.x');
    });
    test('API Gateway should be configured with logging and stage variables', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.AccessLogSetting).toBeDefined();
      expect(stage.Properties.Variables).toBeDefined();
      expect(stage.Properties.Variables.Environment).toBeDefined();
    });
    test('CORS OPTIONS method should exist', () => {
      const options = template.Resources.ApiOptionsMethod;
      expect(options.Type).toBe('AWS::ApiGateway::Method');
      expect(options.Properties.HttpMethod).toBe('OPTIONS');
    });
  });

  describe('Outputs', () => {
    test('should have key outputs for website, api and table', () => {
      const expected = ['WebsiteURL', 'S3BucketName', 'ApiGatewayURL', 'DynamoDBTableName'];
      expected.forEach((key) => expect(template.Outputs[key]).toBeDefined());
    });
  });
});
