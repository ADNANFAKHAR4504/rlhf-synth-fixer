import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// --- Main Test Suite ---
describe('TapStack Unit Tests', () => {
  // --- SCENARIO 1: Testing in "Test Mode" (isTest: true) ---
  describe('in Test Environment', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeAll(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        env: { region: 'us-west-1', account: '123456789012' },
        isTest: true,
      });
      template = Template.fromStack(stack);
    });

    // All your original tests for basic resource creation remain here
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
        ServiceName: 'com.amazonaws.us-west-1.secretsmanager',
      });
    });
    test('should create S3 bucket with website configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'error.html',
        },
      });
    });
    test('should create Secrets Manager secret correctly', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'PostgreSQL database credentials for MyWebApp',
      });
    });
    test('should create RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '14',
      });
    });

    describe('Lambda Function', () => {
      test('should create Lambda function with correct base configuration', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Runtime: 'python3.8',
          Handler: 'handler.lambda_handler',
          Timeout: 60,
        });
      });
      test('should use inline code for Lambda in test mode', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Code: { ZipFile: 'def handler(event, context): pass' },
        });
      });
    });
  });

  // --- SCENARIO 2: Testing in "Production Mode" for Code Bundling ---
  describe('in Production Environment', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;
    const fs = require('fs');
    const path = require('path');
    const lambdaDir = path.join(__dirname, '..', 'lib', 'lambda');
    const nestedDir = path.join(lambdaDir, 'nested');
    const nestedFile = path.join(nestedDir, 'dummy.txt');

    beforeAll(() => {
      // Ensure a nested directory exists so local bundling exercises
      // both directory and file copy branches for coverage
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(nestedFile, 'dummy');
      // Provide a context flag to skip Docker bundling during unit tests
      app = new cdk.App({ context: { skipBundling: true } });
      stack = new TapStack(app, 'ProdTapStack', {
        env: { region: 'us-west-1', account: '123456789012' },
      });
      template = Template.fromStack(stack);
    });

    afterAll(() => {
      try {
        if (fs.existsSync(nestedFile)) fs.unlinkSync(nestedFile);
        if (fs.existsSync(nestedDir)) fs.rmdirSync(nestedDir);
      } catch {}
    });

    test('should bundle Lambda code from asset', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          S3Bucket: Match.anyValue(),
          S3Key: Match.stringLikeRegexp('\\.zip$'),
        },
      });
    });
  });

  // --- SCENARIO 3: Testing Architecture-Specific Logic ---
  // This new block specifically tests the TARGET_ARCHITECTURE branch.
  describe('for ARM64 Architecture', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;
    const originalArch = process.env.TARGET_ARCHITECTURE;

    beforeAll(() => {
      // Set the environment variable to trigger the 'arm64' path
      process.env.TARGET_ARCHITECTURE = 'arm64';
      app = new cdk.App();
      stack = new TapStack(app, 'ArmTapStack', {
        env: { region: 'us-west-1', account: '123456789012' },
        isTest: true,
      });
      template = Template.fromStack(stack);
    });

    // Reset the environment variable after the test to avoid side effects
    afterAll(() => {
      process.env.TARGET_ARCHITECTURE = originalArch;
    });

    test('should configure Lambda with ARM64 architecture when specified', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });
  });
});
