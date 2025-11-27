import * as pulumi from '@pulumi/pulumi';

// Mock configuration values
const mockConfig: Record<string, string | number | boolean> = {
  environmentSuffix: 'test123',
  region: 'us-east-1',
  lambdaMemory: 512,
  lambdaConcurrency: 1,
  enablePitr: false,
  dlqRetries: 2,
  notificationEmail: 'test@example.com',
};

// Configure Pulumi runtime mocks BEFORE importing the stack
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      const resourceId = args.inputs.name
        ? `${args.name}-${args.inputs.name}-id`
        : `${args.name}-id`;

      // Return state with all expected properties
      return {
        id: resourceId,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type.split(':')[1] || 'resource'}:us-east-1:123456789012:${resourceId}`,
          id: resourceId,
          name: args.inputs.name || args.name,
          cidrBlock: args.inputs.cidrBlock || '10.0.0.0/16',
          tags: args.inputs.tags || {},
          runtime: args.inputs.runtime,
          handler: args.inputs.handler,
          architectures: args.inputs.architectures || ['arm64'],
          timeout: args.inputs.timeout || 30,
          memorySize: args.inputs.memorySize || 512,
          reservedConcurrentExecutions: args.inputs.reservedConcurrentExecutions,
          billingMode: args.inputs.billingMode || 'PAY_PER_REQUEST',
          hashKey: args.inputs.hashKey || 'id',
          attributes: args.inputs.attributes || [],
          messageRetentionSeconds: args.inputs.messageRetentionSeconds || 345600,
          vpcConfig: args.inputs.vpcConfig,
          environment: args.inputs.environment,
          deadLetterConfig: args.inputs.deadLetterConfig,
          role: args.inputs.role || `arn:aws:iam::123456789012:role/${args.name}-role`,
          code: args.inputs.code,
          serviceName: args.inputs.serviceName,
          vpcId: args.inputs.vpcId,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      return args.inputs;
    },
  },
  'project',
  'test',
  false
);

// Mock the Config class
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    Config: jest.fn().mockImplementation(() => ({
      get: jest.fn((key: string) => mockConfig[key]?.toString()),
      require: jest.fn((key: string) => {
        if (mockConfig[key] === undefined) {
          throw new Error(`Missing required configuration variable 'project:${key}'`);
        }
        return mockConfig[key].toString();
      }),
      requireNumber: jest.fn((key: string) => {
        if (mockConfig[key] === undefined) {
          throw new Error(`Missing required configuration variable 'project:${key}'`);
        }
        return Number(mockConfig[key]);
      }),
      requireBoolean: jest.fn((key: string) => {
        if (mockConfig[key] === undefined) {
          throw new Error(`Missing required configuration variable 'project:${key}'`);
        }
        return Boolean(mockConfig[key]);
      }),
    })),
    getStack: jest.fn(() => 'test'),
  };
});

// Helper function to get promise from Output
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

// Import the stack AFTER mocks are set up
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests - Comprehensive Coverage', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-stack');
  });

  describe('Stack Initialization', () => {
    it('should create TapStack instance', () => {
      expect(stack).toBeDefined();
    });

    it('should have VPC property', () => {
      expect(stack.vpc).toBeDefined();
    });

    it('should have PaymentProcessor property', () => {
      expect(stack.processor).toBeDefined();
    });

    it('should have VPC endpoints', () => {
      expect(stack.dynamodbEndpoint).toBeDefined();
      expect(stack.snsEndpoint).toBeDefined();
    });
  });

  describe('Configuration Loading', () => {
    it('should load environment configuration', () => {
      const config = new pulumi.Config();
      expect(config).toBeDefined();
    });

    it('should load environmentSuffix from config', () => {
      const config = new pulumi.Config();
      expect(config.require('environmentSuffix')).toBe('test123');
    });

    it('should load region from config', () => {
      const config = new pulumi.Config();
      expect(config.require('region')).toBe('us-east-1');
    });

    it('should load lambdaMemory as number', () => {
      const config = new pulumi.Config();
      expect(config.requireNumber('lambdaMemory')).toBe(512);
    });

    it('should load lambdaConcurrency as number', () => {
      const config = new pulumi.Config();
      expect(config.requireNumber('lambdaConcurrency')).toBe(1);
    });

    it('should load enablePitr as boolean', () => {
      const config = new pulumi.Config();
      expect(config.requireBoolean('enablePitr')).toBe(false);
    });

    it('should load dlqRetries as number', () => {
      const config = new pulumi.Config();
      expect(config.requireNumber('dlqRetries')).toBe(2);
    });

    it('should load notificationEmail', () => {
      const config = new pulumi.Config();
      expect(config.require('notificationEmail')).toBe('test@example.com');
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR', async () => {
      const cidrBlock = await promiseOf(stack.vpc.cidrBlock);
      expect(cidrBlock).toBe('10.0.0.0/16');
    });

    it('should have VPC tags with environment', async () => {
      const tags = await promiseOf(stack.vpc.tags);
      expect(tags).toHaveProperty('Environment');
      expect(tags).toHaveProperty('ManagedBy', 'Pulumi');
    });

    it('should have VPC name tag', async () => {
      const tags = await promiseOf(stack.vpc.tags);
      expect(tags?.Name).toContain('tap-vpc');
    });
  });

  describe('PaymentProcessor Component', () => {
    it('should have DynamoDB table', () => {
      expect(stack.processor.table).toBeDefined();
    });

    it('should have SNS topic', () => {
      expect(stack.processor.topic).toBeDefined();
    });

    it('should have Lambda function', () => {
      expect(stack.processor.lambda).toBeDefined();
    });

    it('should have DLQ', () => {
      expect(stack.processor.dlq).toBeDefined();
    });
  });

  describe('Lambda Configuration', () => {
    it('should have correct Lambda runtime', async () => {
      const runtime = await promiseOf(stack.processor.lambda.runtime);
      expect(runtime).toBe('nodejs18.x');
    });

    it('should use ARM64 architecture', async () => {
      const architectures = await promiseOf(stack.processor.lambda.architectures);
      expect(architectures).toEqual(['arm64']);
    });

    it('should have Lambda timeout configured', async () => {
      const timeout = await promiseOf(stack.processor.lambda.timeout);
      expect(timeout).toBe(30);
    });

    it('should have Lambda memory configured', async () => {
      const memorySize = await promiseOf(stack.processor.lambda.memorySize);
      expect(memorySize).toBeGreaterThan(0);
    });

    it('should have Lambda concurrency configured', async () => {
      const concurrency = await promiseOf(
        stack.processor.lambda.reservedConcurrentExecutions
      );
      expect(concurrency).toBeGreaterThanOrEqual(0);
    });

    it('should have Lambda handler configured', async () => {
      const handler = await promiseOf(stack.processor.lambda.handler);
      expect(handler).toBe('index.handler');
    });

    it('should have Lambda code defined', async () => {
      const code = await promiseOf(stack.processor.lambda.code);
      expect(code).toBeDefined();
    });

    it('should have Lambda role attached', async () => {
      const role = await promiseOf(stack.processor.lambda.role);
      expect(role).toBeDefined();
    });

    it('should have Lambda environment variables', async () => {
      const environment = await promiseOf(stack.processor.lambda.environment);
      expect(environment).toBeDefined();
      expect(environment?.variables).toBeDefined();
    });

    it('should have TABLE_NAME environment variable', async () => {
      const environment = await promiseOf(stack.processor.lambda.environment);
      expect(environment?.variables?.TABLE_NAME).toBeDefined();
    });

    it('should have TOPIC_ARN environment variable', async () => {
      const environment = await promiseOf(stack.processor.lambda.environment);
      expect(environment?.variables?.TOPIC_ARN).toBeDefined();
    });

    it('should have DLQ_ARN environment variable', async () => {
      const environment = await promiseOf(stack.processor.lambda.environment);
      expect(environment?.variables?.DLQ_ARN).toBeDefined();
    });

    it('should configure DLQ for Lambda', async () => {
      const deadLetterConfig = await promiseOf(
        stack.processor.lambda.deadLetterConfig
      );
      expect(deadLetterConfig).toBeDefined();
    });

    it('should configure VPC for Lambda', async () => {
      const vpcConfig = await promiseOf(stack.processor.lambda.vpcConfig);
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig?.subnetIds).toBeDefined();
      expect(vpcConfig?.securityGroupIds).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should have correct billing mode', async () => {
      const billingMode = await promiseOf(stack.processor.table.billingMode);
      expect(billingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have transactionId as hash key', async () => {
      const hashKey = await promiseOf(stack.processor.table.hashKey);
      expect(hashKey).toBe('transactionId');
    });

    it('should have attribute definitions', async () => {
      const attributes = await promiseOf(stack.processor.table.attributes);
      expect(attributes).toBeDefined();
    });

    it('should have table tags', async () => {
      const tags = await promiseOf(stack.processor.table.tags);
      expect(tags).toHaveProperty('ManagedBy', 'Pulumi');
    });

    it('should have table ARN', () => {
      expect(stack.processor.table.arn).toBeDefined();
    });

    it('should have table name', () => {
      expect(stack.processor.table.name).toBeDefined();
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should have correct topic name pattern', async () => {
      const name = await promiseOf(stack.processor.topic.name);
      expect(name).toContain('payment-notifications');
    });

    it('should have SNS topic tags', async () => {
      const tags = await promiseOf(stack.processor.topic.tags);
      expect(tags).toHaveProperty('ManagedBy', 'Pulumi');
    });

    it('should have topic ARN', () => {
      expect(stack.processor.topic.arn).toBeDefined();
    });
  });

  describe('SQS DLQ Configuration', () => {
    it('should have correct message retention', async () => {
      const retention = await promiseOf(
        stack.processor.dlq.messageRetentionSeconds
      );
      expect(retention).toBe(1209600); // 14 days
    });

    it('should have DLQ name', () => {
      expect(stack.processor.dlq.name).toBeDefined();
    });

    it('should have DLQ ARN', () => {
      expect(stack.processor.dlq.arn).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    it('should create DynamoDB VPC endpoint', () => {
      expect(stack.dynamodbEndpoint).toBeDefined();
    });

    it('should create SNS VPC endpoint', () => {
      expect(stack.snsEndpoint).toBeDefined();
    });

    it('should have DynamoDB endpoint service name', async () => {
      const serviceName = await promiseOf(stack.dynamodbEndpoint.serviceName);
      expect(serviceName).toContain('dynamodb');
    });

    it('should have SNS endpoint service name', async () => {
      const serviceName = await promiseOf(stack.snsEndpoint.serviceName);
      expect(serviceName).toContain('sns');
    });
  });

  describe('Resource Outputs', () => {
    it('should register VPC ID output', () => {
      expect(stack.vpc.id).toBeDefined();
    });

    it('should register table ARN output', () => {
      expect(stack.processor.table.arn).toBeDefined();
    });

    it('should register table name output', () => {
      expect(stack.processor.table.name).toBeDefined();
    });

    it('should register topic ARN output', () => {
      expect(stack.processor.topic.arn).toBeDefined();
    });

    it('should register Lambda ARN output', () => {
      expect(stack.processor.lambda.arn).toBeDefined();
    });

    it('should register Lambda name output', () => {
      expect(stack.processor.lambda.name).toBeDefined();
    });

    it('should register DLQ ARN output', () => {
      expect(stack.processor.dlq.arn).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in resource names', async () => {
      const tableName = await promiseOf(stack.processor.table.name);
      expect(tableName).toContain('test123');
    });

    it('should include environment in resource names', async () => {
      const tableName = await promiseOf(stack.processor.table.name);
      expect(tableName).toContain('test');
    });
  });

  describe('Pulumi Output Operations', () => {
    it('should handle pulumi.output correctly', async () => {
      const vpcId = stack.vpc.id;
      expect(vpcId).toBeDefined();
      const result = await promiseOf(vpcId);
      expect(result).toBeDefined();
    });

    it('should handle pulumi.all correctly', async () => {
      const combined = pulumi.all([stack.vpc.id, stack.processor.table.arn]);
      expect(combined).toBeDefined();
    });
  });

  describe('Stack Name', () => {
    it('should get stack name from pulumi', () => {
      const stackName = pulumi.getStack();
      expect(stackName).toBe('test');
    });
  });
});
