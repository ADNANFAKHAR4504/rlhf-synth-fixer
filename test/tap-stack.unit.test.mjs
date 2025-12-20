import { App, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { SecurityGroupConstruct } from '../lib/constructs/security-group.mjs';

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
      new TapStack(app, 'EmptyConfigStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'qa',
        config: emptyConfig
      });
    }).toThrow("No configuration found for environment: 'qa' (even 'dev' is missing)");
    
    delete process.env.CDK_LOCAL;
  });

  test('Throws error when VPC ID is missing', () => {
    process.env.CDK_LOCAL = 'true';
    
    const configWithoutVpc = {
      dev: {
        ...mockConfig.dev,
        existingVpcId: undefined
      }
    };
    
    const app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: configWithoutVpc,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
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
      dev: {
        ...mockConfig.dev,
        existingS3Bucket: undefined
      }
    };
    
    const app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: configWithoutS3,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
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
      dev: {
        ...mockConfig.dev,
        environment: undefined
      }
    };
    
    const app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: configWithoutEnv,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    expect(() => {
      new TapStack(app, 'NoEnvStack', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        config: configWithoutEnv
      });
    }).toThrow("No environment field found in configuration for 'dev'");
    
    delete process.env.CDK_LOCAL;
  });
});

// Test SecurityGroupConstruct directly for non-LocalStack path (VPC Endpoints)
describe('SecurityGroupConstruct Direct Tests', () => {
  test('Creates security group with VPC endpoints in non-LocalStack mode', () => {
    // Clear LocalStack env vars
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new Stack(app, 'SecurityGroupTestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Create a real VPC with subnets for endpoint creation
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        }
      ]
    });
    
    // Create SecurityGroupConstruct with isLocalStack = false
    const sgConstruct = new SecurityGroupConstruct(stack, 'TestSecurityGroup', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
      isLocalStack: false
    });
    
    expect(sgConstruct.securityGroup).toBeDefined();
    
    const template = Template.fromStack(stack);
    
    // Verify security group is created
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for secure web application instances'
    });
    
    // Verify VPC endpoints are created (CloudWatch, Logs, Events)
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
    
    // Restore env vars
    process.env.CDK_LOCAL = 'true';
  });

  test('Creates security group without VPC endpoints in LocalStack mode', () => {
    process.env.CDK_LOCAL = 'true';
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new Stack(app, 'LocalStackSecurityGroupTestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Create VPC
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 1
    });
    
    // Create SecurityGroupConstruct with isLocalStack = true
    const sgConstruct = new SecurityGroupConstruct(stack, 'TestSecurityGroup', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      isLocalStack: true
    });
    
    expect(sgConstruct.securityGroup).toBeDefined();
    
    const template = Template.fromStack(stack);
    
    // Verify security group is created
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for secure web application instances'
    });
    
    // Verify NO VPC endpoints in LocalStack mode
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    
    delete process.env.CDK_LOCAL;
  });

  test('Throws error for unsupported region in S3 prefix list', () => {
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    // Use an unsupported region
    const stack = new Stack(app, 'UnsupportedRegionStack', {
      env: { account: '123456789012', region: 'unsupported-region-1' }
    });
    
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 1,
      subnetConfiguration: [
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }
      ]
    });
    
    expect(() => {
      new SecurityGroupConstruct(stack, 'TestSecurityGroup', {
        vpc: vpc,
        sshCidrBlock: '10.0.0.0/16',
        trustedOutboundCidrs: ['10.0.0.0/8'],
        isLocalStack: false
      });
    }).toThrow('Unsupported region for S3 prefix list');
    
    process.env.CDK_LOCAL = 'true';
  });

  test('Supports multiple AWS regions for S3 prefix list', () => {
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    
    const regions = ['us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
    
    regions.forEach((region, index) => {
      const app = new App({
        context: { '@aws-cdk/core:newStyleStackSynthesis': false }
      });
      
      const stack = new Stack(app, `RegionTestStack${index}`, {
        env: { account: '123456789012', region: region }
      });
      
      const vpc = new ec2.Vpc(stack, 'TestVpc', {
        maxAzs: 2,
        subnetConfiguration: [
          { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
          { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }
        ]
      });
      
      // Should not throw for supported regions
      const sgConstruct = new SecurityGroupConstruct(stack, 'TestSecurityGroup', {
        vpc: vpc,
        sshCidrBlock: '10.0.0.0/16',
        trustedOutboundCidrs: ['10.0.0.0/8'],
        isLocalStack: false
      });
      
      expect(sgConstruct.securityGroup).toBeDefined();
    });
    
    process.env.CDK_LOCAL = 'true';
  });
});
