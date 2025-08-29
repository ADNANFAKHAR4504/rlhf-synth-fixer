import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Instantiate the stack with the isTest flag to speed up tests
    stack = new TapStack(app, 'TestTapStack', {
      env: { region: 'us-west-2', account: '123456789012' },
      isTest: true,
    });
    template = Template.fromStack(stack);
  });

  // --- VPC AND NETWORKING ---
  describe('VPC Infrastructure', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Secrets Manager VPC Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: 'com.amazonaws.us-west-2.secretsmanager',
      });
    });
  });

  // --- S3 BUCKET ---
  describe('S3 Static Website Hosting', () => {
    test('should create S3 bucket with website configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'error.html',
        },
      });
    });
  });

  // --- DATABASE ---
  describe('Database Infrastructure', () => {
    test('should create Secrets Manager secret correctly', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'PostgreSQL database credentials for MyWebApp',
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"postgres"}',
          GenerateStringKey: 'password',
          PasswordLength: 32,
        },
      });
    });

    test('should create RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '14',
        DBInstanceClass: 'db.t3.micro',
        DeletionProtection: false,
      });
    });
  });

  // --- LAMBDA FUNCTION ---
  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      // THIS IS THE FIX: Dynamically check the architecture
      const expectedArchitecture =
        process.env.TARGET_ARCHITECTURE === 'arm64' ? 'arm64' : 'x86_64';

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.8',
        Handler: 'handler.lambda_handler',
        Timeout: 60,
        Architectures: [expectedArchitecture], // Assert the correct architecture for the environment
        Description: 'Lambda function for MyWebApp API backend',
      });
    });

    test('should create Lambda execution role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Execution role for MyWebApp Lambda function',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({ 'Fn::Join': Match.anyValue() }),
          Match.objectLike({ 'Fn::Join': Match.anyValue() }),
        ]),
      });
    });

    test('should be configured with correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_SECRET_ARN: Match.anyValue(),
            DB_NAME: 'mywebappdb',
            DB_HOST: Match.anyValue(),
          },
        },
      });
    });
  });

  // --- API GATEWAY ---
  describe('API Gateway', () => {
    test('should create REST API with CORS options', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'MyWebApp API',
      });
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('should create GET method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });
  });

  // --- OUTPUTS ---
  describe('CloudFormation Outputs', () => {
    test('should have descriptive output descriptions', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.WebsiteBucketName.Description).toBe(
        'Name of the S3 bucket for static website hosting'
      );
      expect(outputs.ApiEndpointURL.Description).toBe(
        'Complete API endpoint URL for testing the Lambda function'
      );
      expect(outputs.DatabaseSecretArn.Description).toBe(
        'ARN of the Secrets Manager secret for database credentials'
      );
    });
  });
});
