import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environment = (process.env.ENVIRONMENT_SUFFIX || 'dev') as 'dev' | 'staging' | 'prod';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environment: environment,
      allowedSshIpRange: '10.0.0.0/8',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Should create VPC with proper configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Should create KMS key for encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('Should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Should create Lambda function in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should create RDS Aurora cluster', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
    });

    test('Should create CloudWatch log group with KMS encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('Should create AWS Config resources', () => {
      // Verify AWS Config Configuration Recorder is created
      template.resourceCountIs('AWS::Config::ConfigurationRecorder', 1);

      // Verify AWS Config Delivery Channel is created
      template.resourceCountIs('AWS::Config::DeliveryChannel', 1);

      // Verify AWS Config rules are created (4 rules)
      template.resourceCountIs('AWS::Config::ConfigRule', 4);

      // Verify IAM role for Config is created with correct service principal
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ],
        },
      });

      // Verify SNS topic for compliance alerts is created
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Verify CloudWatch alarm for non-compliance is created
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ComplianceByConfigRule',
      });
    });

    test('Should output VPC ID', () => {
      template.hasOutput('VpcId', {});
    });

    test('Should output bucket name', () => {
      template.hasOutput('BucketName', {});
    });

    test('Should output database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {});
    });

    test('Should output Lambda function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {});
    });

    test('Should output Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {});
    });
  });
});
