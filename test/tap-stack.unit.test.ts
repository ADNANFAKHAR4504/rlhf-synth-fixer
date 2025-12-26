import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Payment Processing Infrastructure - Single Stack'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Unique suffix for resource naming'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'APIEndpoint',
        'SessionTableName',
        'TransactionQueueUrl',
        'TransactionLogBucket',
        'LambdaFunctionArn',
        'AlertTopicArn',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Payment Processor Lambda ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PaymentProcessorFunction', 'Arn'],
      });
    });

    test('SessionTableName output should be correct', () => {
      const output = template.Outputs.SessionTableName;
      expect(output.Description).toBe('DynamoDB Session Table Name');
      expect(output.Value).toEqual({ Ref: 'SessionTable' });
    });

    test('TransactionLogBucket output should be correct', () => {
      const output = template.Outputs.TransactionLogBucket;
      expect(output.Description).toBe('S3 Bucket for Transaction Logs');
      expect(output.Value).toEqual({ Ref: 'TransactionLogBucket' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Payment Processing stack has 28 resources
      expect(resourceCount).toBe(28);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Core Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Lambda function resource', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      expect(template.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have DynamoDB table resource', () => {
      expect(template.Resources.SessionTable).toBeDefined();
      expect(template.Resources.SessionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have S3 bucket resource', () => {
      expect(template.Resources.TransactionLogBucket).toBeDefined();
      expect(template.Resources.TransactionLogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have SQS queue resource', () => {
      expect(template.Resources.TransactionQueue).toBeDefined();
      expect(template.Resources.TransactionQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('should have API Gateway resource', () => {
      expect(template.Resources.PaymentAPI).toBeDefined();
      expect(template.Resources.PaymentAPI.Type).toBe('AWS::ApiGatewayV2::Api');
    });

    test('should have KMS key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have SNS topic resource', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.TransactionLogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.TransactionLogBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('SQS queue should have KMS encryption', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.Properties.KmsMasterKeyId).toBeDefined();
    });
  });
});
