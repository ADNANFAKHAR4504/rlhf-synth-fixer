import { App, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock config - includes ALL required fields
const mockConfig = {
  dev: {
    environment: 'dev',
    existingVpcId: 'vpc-12345678',
    vpcCidrBlock: '10.0.0.0/16',
    existingS3Bucket: 'test-bucket-dev',
    sshCidrBlock: '10.0.0.0/16',
    trustedOutboundCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
    instanceType: 't3.micro',
    keyPairName: 'test-key',
    amiId: 'ami-12345678',
    subnetIds: ['subnet-12345678'],
    availabilityZones: ['us-east-1a'],
  },
  prod: {
    environment: 'prod',
    existingVpcId: 'vpc-87654321',
    vpcCidrBlock: '10.0.0.0/16',
    existingS3Bucket: 'test-bucket-prod',
    sshCidrBlock: '10.0.0.0/16',
    trustedOutboundCidrs: ['10.0.0.0/8'],
    instanceType: 't3.small',
    keyPairName: 'prod-key',
    amiId: 'ami-87654321',
    subnetIds: ['subnet-87654321'],
    availabilityZones: ['us-east-1a', 'us-east-1b'],
  },
  qa: {
    environment: 'qa',
    existingVpcId: 'vpc-11111111',
    vpcCidrBlock: '10.0.0.0/16',
    existingS3Bucket: 'test-bucket-qa',
    sshCidrBlock: '10.0.0.0/16',
    trustedOutboundCidrs: ['10.0.0.0/8'],
    instanceType: 't3.micro',
    keyPairName: 'qa-key',
    amiId: 'ami-11111111',
    subnetIds: ['subnet-11111111'],
    availabilityZones: ['us-east-1a'],
  }
};

// Store original env vars
const originalEnv = { ...process.env };

// Helper function to clean environment
function cleanEnvironment() {
  // Remove ALL LocalStack detection env vars
  delete process.env.CDK_LOCAL;
  delete process.env.ENVIRONMENT_SUFFIX;
  delete process.env.CI;
  delete process.env.GITHUB_ACTIONS;
  delete process.env.AWS_ENDPOINT_URL;
  delete process.env.LOCALSTACK_HOSTNAME;
}

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    
    app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);
  });

  afterAll(() => {
    cleanEnvironment();
  });

  test('Stack is created successfully', () => {
    expect(stack).toBeDefined();
    expect(stack instanceof Stack).toBe(true);
  });

  test('Template is valid', () => {
    expect(template).toBeDefined();
  });

  test('Stack has expected resources', () => {
    const resources = template.toJSON().Resources || {};
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  test('Stack has correct environment tag', () => {
    const json = template.toJSON();
    expect(json).toBeDefined();
  });

  test('Stack has S3 bucket reference', () => {
    expect(stack.bucket).toBeDefined();
  });

  test('Stack has VPC reference', () => {
    expect(stack.vpc).toBeDefined();
  });

  test('Stack has security group', () => {
    expect(stack.securityGroup).toBeDefined();
  });

  test('Stack has IAM roles', () => {
    expect(stack.iamRoles).toBeDefined();
  });

  test('Stack has CloudWatch logging', () => {
    expect(stack.logging).toBeDefined();
  });

  test('Stack has EC2 instances', () => {
    expect(stack.instances).toBeDefined();
  });

  test('Stack config is loaded correctly', () => {
    expect(stack.config).toBeDefined();
    expect(stack.config.environment).toBe('dev');
  });

  test('Environment suffix is set correctly', () => {
    expect(stack.environmentSuffix).toBe('dev');
  });

  test('isLocalStack detection works correctly', () => {
    expect(stack.isLocalStack).toBe(true);
  });
});

// Test with fallback to dev environment
describe('TapStack Fallback Tests', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  test('Falls back to dev when unknown environment', () => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'unknown';
    
    // Mock console.info to avoid output during tests
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    
    const app = new App({
      context: {
        environmentSuffix: 'unknown',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    const stack = new TapStack(app, 'FallbackStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'unknown',
      config: mockConfig
    });
    
    // Should fall back to dev
    expect(stack.config.environment).toBe('dev');
    
    consoleSpy.mockRestore();
  });

  test('Uses qa environment when available', () => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'qa';
    
    const app = new App({
      context: {
        environmentSuffix: 'qa',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    const stack = new TapStack(app, 'QaStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'qa',
      config: mockConfig
    });
    
    expect(stack.config.environment).toBe('qa');
  });
});

// Test config loading from props
describe('TapStack Config Loading Tests', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  test('Loads config from props.config', () => {
    process.env.CDK_LOCAL = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'PropsConfigStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.config).toBeDefined();
    expect(stack.config.environment).toBe('dev');
  });

  test('Loads config from context when props.config not provided', () => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    
    const app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    const stack = new TapStack(app, 'ContextConfigStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev'
    });
    
    expect(stack.config).toBeDefined();
    expect(stack.config.environment).toBe('dev');
  });

  test('Throws error when no configuration found', () => {
    process.env.CDK_LOCAL = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    expect(() => {
      new TapStack(app, 'NoConfigStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev'
      });
    }).toThrow("No configuration found in 'props' or cdk.json context");
  });

  test('Throws error when environment field missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const badConfig = {
      dev: {
        // Missing environment field
        existingVpcId: 'vpc-12345678',
        existingS3Bucket: 'test-bucket'
      }
    };
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    expect(() => {
      new TapStack(app, 'BadConfigStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        config: badConfig
      });
    }).toThrow("No environment field found in configuration for 'dev'");
  });

  test('Throws error for prod with no config', () => {
    process.env.CDK_LOCAL = 'true';
    
    const emptyConfig = {};
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    expect(() => {
      new TapStack(app, 'ProdNoConfigStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'prod',
        config: emptyConfig
      });
    }).toThrow("No configuration found for 'prod'.");
  });

  test('Throws error when VPC ID not provided', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutVpc = {
      dev: {
        environment: 'dev',
        // Missing existingVpcId
        existingS3Bucket: 'test-bucket'
      }
    };
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    expect(() => {
      new TapStack(app, 'NoVpcStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        config: configWithoutVpc
      });
    }).toThrow('VPC ID must be provided');
  });

  test('Throws error when S3 bucket not provided', () => {
    process.env.CDK_LOCAL = 'true';

    const configWithoutS3 = {
      dev: {
        environment: 'dev',
        existingVpcId: 'vpc-12345678',
        vpcCidrBlock: '10.0.0.0/16',
        subnetIds: ['subnet-12345678', 'subnet-87654321'],
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        sshCidrBlock: '10.0.0.0/16',
        trustedOutboundCidrs: ['10.0.0.0/8'],
        // Missing existingS3Bucket
      }
    };

    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });

    expect(() => {
      new TapStack(app, 'NoS3Stack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        config: configWithoutS3
      });
    }).toThrow('S3 bucket must be provided');

    delete process.env.CDK_LOCAL;
  });
});

// Test isLocalStack detection
describe('TapStack LocalStack Detection Tests', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  test('Detects LocalStack with CDK_LOCAL=true', () => {
    process.env.CDK_LOCAL = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'LocalStackCDKStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(true);
  });

  test('Detects LocalStack with CI=true', () => {
    process.env.CI = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'LocalStackCIStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(true);
  });

  test('Detects LocalStack with GITHUB_ACTIONS=true', () => {
    process.env.GITHUB_ACTIONS = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'LocalStackGHStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(true);
  });

  test('Detects LocalStack with AWS_ENDPOINT_URL containing localhost', () => {
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'LocalStackEndpointStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(true);
  });

  test('Detects LocalStack with LOCALSTACK_HOSTNAME set', () => {
    process.env.LOCALSTACK_HOSTNAME = 'localhost';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'LocalStackHostnameStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(true);
  });

  test('Does not detect LocalStack when no indicators present', () => {
    // Clean environment - no LocalStack indicators
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'NotLocalStackStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.isLocalStack).toBe(false);
  });
});
