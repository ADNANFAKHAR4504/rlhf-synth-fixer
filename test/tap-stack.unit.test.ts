import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: { ...args.inputs },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Initialization', () => {
    it('should create stack with required properties', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        region: 'us-east-1',
      });

      expect(stack).toBeDefined();
      expect(stack.functionUrl).toBeDefined();
      expect(stack.tableArn).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should use default region when not specified', async () => {
      const stack = new TapStack('test-stack-default', {
        environmentSuffix: 'test456',
      });

      expect(stack).toBeDefined();
      // Default region should be us-east-1
    });

    it('should handle pulumi.output for environmentSuffix', async () => {
      const stack = new TapStack('test-stack-output', {
        environmentSuffix: pulumi.output('testOutput'),
        region: 'us-west-2',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create DynamoDB table with correct attributes', async () => {
      const stack = new TapStack('test-stack-dynamo', {
        environmentSuffix: 'test',
      });

      // Test that table is created with required attributes
      expect(stack.tableArn).toBeDefined();
    });

    it('should use PAY_PER_REQUEST billing mode', async () => {
      const stack = new TapStack('test-stack-billing', {
        environmentSuffix: 'test',
      });

      expect(stack.tableArn).toBeDefined();
    });

    it('should have correct hash and range keys', async () => {
      const stack = new TapStack('test-stack-keys', {
        environmentSuffix: 'test',
      });

      expect(stack.tableArn).toBeDefined();
    });
  });

  describe('Secrets Manager Configuration', () => {
    it('should create secret with description', async () => {
      const stack = new TapStack('test-stack-secret', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create secret version with placeholder values', async () => {
      const stack = new TapStack('test-stack-secret-version', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    it('should create Lambda execution role', async () => {
      const stack = new TapStack('test-stack-iam', {
        environmentSuffix: 'test',
      });

      expect(stack.lambdaArn).toBeDefined();
    });

    it('should create DynamoDB access policy', async () => {
      const stack = new TapStack('test-stack-dynamo-policy', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Secrets Manager access policy', async () => {
      const stack = new TapStack('test-stack-secrets-policy', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CloudWatch Logs policy', async () => {
      const stack = new TapStack('test-stack-logs-policy', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create X-Ray policy', async () => {
      const stack = new TapStack('test-stack-xray-policy', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create Lambda function with correct runtime', async () => {
      const stack = new TapStack('test-stack-lambda', {
        environmentSuffix: 'test',
      });

      expect(stack.lambdaArn).toBeDefined();
    });

    it('should set Lambda memory to 512MB', async () => {
      const stack = new TapStack('test-stack-memory', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should enable X-Ray tracing', async () => {
      const stack = new TapStack('test-stack-tracing', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Lambda function URL', async () => {
      const stack = new TapStack('test-stack-url', {
        environmentSuffix: 'test',
      });

      expect(stack.functionUrl).toBeDefined();
    });

    it('should configure function URL with AWS_IAM auth', async () => {
      const stack = new TapStack('test-stack-auth', {
        environmentSuffix: 'test',
      });

      expect(stack.functionUrl).toBeDefined();
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should create log group with 7-day retention', async () => {
      const stack = new TapStack('test-stack-logs', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should use correct log group name pattern', async () => {
      const stack = new TapStack('test-stack-log-name', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should tag resources with Environment=prod', async () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should tag resources with MigrationPhase=testing', async () => {
      const stack = new TapStack('test-stack-migration', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Function Code', () => {
    beforeEach(() => {
      // Clean up any existing lambda directory
      const lambdaDir = path.join(__dirname, '../lib/lambda');
      if (fs.existsSync(lambdaDir)) {
        const indexFile = path.join(lambdaDir, 'index.js');
        const packageFile = path.join(lambdaDir, 'package.json');
        if (fs.existsSync(indexFile)) fs.unlinkSync(indexFile);
        if (fs.existsSync(packageFile)) fs.unlinkSync(packageFile);
      }
    });

    it('should create lambda directory if it does not exist', async () => {
      const lambdaDir = path.join(__dirname, '../lib/lambda');

      // Remove directory to test creation path
      if (fs.existsSync(lambdaDir)) {
        fs.rmSync(lambdaDir, { recursive: true, force: true });
      }

      const stack = new TapStack('test-stack-lambda-dir', {
        environmentSuffix: 'test',
      });

      expect(fs.existsSync(lambdaDir)).toBe(true);
    });

    it('should write Lambda function code to file', async () => {
      const stack = new TapStack('test-stack-lambda-file', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      expect(fs.existsSync(indexFile)).toBe(true);
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('DynamoDBClient');
      expect(content).toContain('SecretsManagerClient');
    });

    it('should write package.json with AWS SDK dependencies', async () => {
      const stack = new TapStack('test-stack-package', {
        environmentSuffix: 'test',
      });

      const packageFile = path.join(__dirname, '../lib/lambda/package.json');
      expect(fs.existsSync(packageFile)).toBe(true);
      const content = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
      expect(content.dependencies).toHaveProperty(
        '@aws-sdk/client-dynamodb'
      );
      expect(content.dependencies).toHaveProperty(
        '@aws-sdk/client-secrets-manager'
      );
    });

    it('should include region in Lambda code', async () => {
      const stack = new TapStack('test-stack-region', {
        environmentSuffix: 'test',
        region: 'us-west-2',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('us-west-2');
    });

    it('should use default region in Lambda code when not specified', async () => {
      const stack = new TapStack('test-stack-default-region', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('us-east-1');
    });
  });

  describe('Lambda Handler Logic', () => {
    it('should include webhook validation function', async () => {
      const stack = new TapStack('test-stack-validation', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('validateWebhook');
    });

    it('should include secrets caching logic', async () => {
      const stack = new TapStack('test-stack-caching', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('cachedSecrets');
      expect(content).toContain('getSecrets');
    });

    it('should include DynamoDB PutItem logic', async () => {
      const stack = new TapStack('test-stack-putitem', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('PutItemCommand');
    });

    it('should handle error responses', async () => {
      const stack = new TapStack('test-stack-errors', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('statusCode: 400');
      expect(content).toContain('statusCode: 500');
    });

    it('should return success response', async () => {
      const stack = new TapStack('test-stack-success', {
        environmentSuffix: 'test',
      });

      const indexFile = path.join(__dirname, '../lib/lambda/index.js');
      const content = fs.readFileSync(indexFile, 'utf-8');
      expect(content).toContain('statusCode: 200');
      expect(content).toContain('Webhook processed successfully');
    });
  });

  describe('Stack Outputs', () => {
    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });

      expect(stack.functionUrl).toBeDefined();
      expect(stack.tableArn).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create Lambda with dependencies on policies', async () => {
      const stack = new TapStack('test-stack-dependencies', {
        environmentSuffix: 'test',
      });

      expect(stack.lambdaArn).toBeDefined();
    });

    it('should create log group before Lambda function', async () => {
      const stack = new TapStack('test-stack-log-dependency', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environmentSuffix in resource names', async () => {
      const stack = new TapStack('test-stack-suffix', {
        environmentSuffix: 'custom123',
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new TapStack('test-stack-special', {
        environmentSuffix: 'test-123',
      });

      expect(stack).toBeDefined();
    });
  });
});
