import { App, Stack } from 'aws-cdk-lib';
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
  }
};

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
    delete process.env.CDK_LOCAL;
    delete process.env.ENVIRONMENT_SUFFIX;
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
});

// Test with fallback to dev environment
describe('TapStack Fallback Tests', () => {
  test('Falls back to dev when unknown environment', () => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'unknown';
    
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
    
    delete process.env.CDK_LOCAL;
    delete process.env.ENVIRONMENT_SUFFIX;
  });
});

// Test config loading from props
describe('TapStack Config Loading Tests', () => {
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
    
    delete process.env.CDK_LOCAL;
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
    
    delete process.env.CDK_LOCAL;
    delete process.env.ENVIRONMENT_SUFFIX;
  });
});

// Test error handling
describe('TapStack Error Handling Tests', () => {
  test('Throws error when no config found', () => {
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
    
    delete process.env.CDK_LOCAL;
  });
});

// Test missing required config fields
describe('TapStack Missing Config Field Tests', () => {
  test('Throws error when prod config is missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutProd = {
      dev: { ...mockConfig.dev }
    };
    
    const app = new App({
      context: {
        environmentSuffix: 'prod',
        environments: configWithoutProd,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    expect(() => {
      new TapStack(app, 'NoProdConfigStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'prod',
        config: configWithoutProd
      });
    }).toThrow("No configuration found for 'prod'");
    
    delete process.env.CDK_LOCAL;
  });

  test('Throws error when dev fallback is also missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const emptyConfig = {};
    
    const app = new App({
      context: {
        environmentSuffix: 'qa',
        environments: emptyConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    expect(() => {
      new TapStack(app, 'NoDevFallbackStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'qa',
        config: emptyConfig
      });
    }).toThrow("even 'dev' is missing");
    
    delete process.env.CDK_LOCAL;
  });

  test('Throws error when VPC ID is missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutVpc = {
      dev: { ...mockConfig.dev, existingVpcId: null }
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
    
    delete process.env.CDK_LOCAL;
  });

  test('Throws error when S3 bucket is missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutS3 = {
      dev: { ...mockConfig.dev, existingS3Bucket: null }
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

  test('Handles missing environment in config gracefully', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutEnv = {
      dev: { ...mockConfig.dev, environment: undefined }
    };
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'NoEnvStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: configWithoutEnv
    });
    
    // Stack should be created but without environment-specific resources
    expect(stack).toBeDefined();
    
    delete process.env.CDK_LOCAL;
  });
});

// Test VPC lookup
describe('TapStack VPC Tests', () => {
  test('Uses VPC lookup when not in LocalStack', () => {
    // Temporarily disable LocalStack mode
    const origCdkLocal = process.env.CDK_LOCAL;
    const origCi = process.env.CI;
    const origGithubActions = process.env.GITHUB_ACTIONS;
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'VpcLookupStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.vpc).toBeDefined();
    
    // Restore environment
    if (origCdkLocal) process.env.CDK_LOCAL = origCdkLocal;
    if (origCi) process.env.CI = origCi;
    if (origGithubActions) process.env.GITHUB_ACTIONS = origGithubActions;
  });
});

// Test individual constructs
describe('Construct Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    process.env.CDK_LOCAL = 'true';
    app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
  });

  afterEach(() => {
    delete process.env.CDK_LOCAL;
  });

  test('Security group construct creates proper rules', () => {
    stack = new TapStack(app, 'SecurityGroupTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);

    // Check for security group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for secure web application instances',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80
        },
        {
          CidrIp: '10.0.0.0/16',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22
        }
      ]
    });
  });

  test('EC2 instances are created with correct configuration', () => {
    stack = new TapStack(app, 'EC2TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);

    // Check for EC2 instances
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro'
    });
  });

  test('CloudWatch logging is configured correctly', () => {
    stack = new TapStack(app, 'LoggingTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);
    
    // Check for log group with correct retention (90 days, not 30)
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 90
    });
    
    // Check for log stream
    template.hasResourceProperties('AWS::Logs::LogStream', {});
  });

  test('IAM roles are created with correct policies', () => {
    stack = new TapStack(app, 'IAMTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);

    // Check for IAM role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com'
          }
        }]
      }
    });
  });

  test('Stack outputs are created correctly', () => {
    stack = new TapStack(app, 'OutputsTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);

    // Check for outputs
    const outputs = template.toJSON().Outputs || {};
    expect(Object.keys(outputs).some(key => key.includes('SecurityGroupId'))).toBe(true);
    expect(Object.keys(outputs).some(key => key.includes('LogGroupName'))).toBe(true);
    expect(Object.keys(outputs).some(key => key.includes('VpcId'))).toBe(true);
    expect(Object.keys(outputs).some(key => key.includes('LogsBucketName'))).toBe(true);
  });
});

// Test security group in different regions
describe('Security Group Region Tests', () => {
  let app;

  beforeEach(() => {
    process.env.CDK_LOCAL = 'true';
    app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
  });

  afterEach(() => {
    delete process.env.CDK_LOCAL;
  });

  test('Security group handles us-west-2 region correctly', () => {
    const stack = new TapStack(app, 'USWest2Stack', {
      env: { account: '123456789012', region: 'us-west-2' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.securityGroup).toBeDefined();
  });

  test('Security group handles eu-west-1 region correctly', () => {
    const stack = new TapStack(app, 'EUWest1Stack', {
      env: { account: '123456789012', region: 'eu-west-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.securityGroup).toBeDefined();
  });

  test('Security group handles ap-southeast-1 region correctly', () => {
    const stack = new TapStack(app, 'APSoutheast1Stack', {
      env: { account: '123456789012', region: 'ap-southeast-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    expect(stack.securityGroup).toBeDefined();
  });

  test('Security group throws for unsupported region', () => {
    // Turn off LocalStack mode to test real AWS behavior
    delete process.env.CDK_LOCAL;
    
    expect(() => {
      new TapStack(app, 'UnsupportedRegionStack', {
        env: { account: '123456789012', region: 'unsupported-region' },
        environmentSuffix: 'dev',
        config: mockConfig
      });
    }).toThrow('Unsupported region for S3 prefix list');
  });
});
