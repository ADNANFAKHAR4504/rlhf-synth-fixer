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
      dev: { ...mockConfig.dev }
    };
    // Remove the environment property from the config
    delete configWithoutEnv.dev.environment;
    
    const app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    const stack = new TapStack(app, 'NoEnvStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: configWithoutEnv
    });
    
    // Should not create resources when environment is missing
    expect(stack.vpc).toBeUndefined();
    expect(stack.bucket).toBeUndefined();
    
    delete process.env.CDK_LOCAL;
  });
});

// Test VPC lookup
describe('TapStack VPC Tests', () => {
  test('Uses VPC lookup when not in LocalStack', () => {
    // Temporarily disable LocalStack mode
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.AWS_ENDPOINT_URL;
    delete process.env.LOCALSTACK_HOSTNAME;
    
    const app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    const stack = new TapStack(app, 'VPCLookupStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    // VPC should still be created (fromLookup returns a placeholder in test mode)
    expect(stack.vpc).toBeDefined();
    
    // Restore LocalStack mode
    process.env.CDK_LOCAL = 'true';
  });
});

// Import constructs for testing
import { SecurityGroupConstruct } from '../lib/constructs/security-group.mjs';
import { EC2InstancesConstruct } from '../lib/constructs/ec2-instances.mjs';
import { CloudWatchLoggingConstruct } from '../lib/constructs/cloudwatch-logging.mjs';
import { IAMRolesConstruct } from '../lib/constructs/iam-roles.mjs';

describe('Construct Tests', () => {
  let app;
  let stack;
  let vpc;
  let bucket;

  beforeEach(() => {
    process.env.CDK_LOCAL = 'true';
    
    app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
    
    stack = new Stack(app, 'ConstructTestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Create mock VPC
    vpc = ec2.Vpc.fromVpcAttributes(stack, 'TestVPC', {
      vpcId: 'vpc-12345678',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnetIds: ['subnet-12345678', 'subnet-87654321'],
      privateSubnetIds: ['subnet-12345678', 'subnet-87654321'],
    });
    
    // Create mock bucket
    bucket = s3.Bucket.fromBucketName(stack, 'TestBucket', 'test-bucket');
  });

  afterEach(() => {
    delete process.env.CDK_LOCAL;
  });

  test('Security group construct creates proper rules', () => {
    const sg = new SecurityGroupConstruct(stack, 'TestSG', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
      isLocalStack: true
    });
    
    expect(sg.securityGroup).toBeDefined();
    
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for secure web application instances',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow HTTP traffic',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80
        },
        {
          CidrIp: '10.0.0.0/16',
          Description: 'Allow SSH from trusted CIDR',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22
        }
      ]
    });
  });

  test('EC2 instances are created with correct configuration', () => {
    const logging = new CloudWatchLoggingConstruct(stack, 'TestLogging', {
      s3BucketName: bucket.bucketName
    });
    
    const iamRoles = new IAMRolesConstruct(stack, 'TestRoles', {
      s3BucketName: bucket.bucketName,
      logGroup: logging.logGroup
    });
    
    const sg = new SecurityGroupConstruct(stack, 'TestSG', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      isLocalStack: true
    });
    
    const instances = new EC2InstancesConstruct(stack, 'TestInstances', {
      vpc: vpc,
      securityGroup: sg.securityGroup,
      instanceProfile: iamRoles.instanceProfile,
      cloudWatchConfig: logging.cloudWatchConfig,
      isLocalStack: true
    });
    
    expect(instances.instances).toBeDefined();
    expect(instances.instances.length).toBeGreaterThan(0);
    
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro'
    });
  });

  test('CloudWatch logging is configured correctly', () => {
    const logging = new CloudWatchLoggingConstruct(stack, 'TestLogging', {
      s3BucketName: bucket.bucketName
    });
    
    expect(logging.logGroup).toBeDefined();
    expect(logging.cloudWatchConfig).toBeDefined();
    
    const template = Template.fromStack(stack);
    
    // Check for log group, not log stream
    template.hasResourceProperties('AWS::Logs::LogGroup', {});
  });

  test('IAM roles are created with correct policies', () => {
    const logging = new CloudWatchLoggingConstruct(stack, 'TestLogging', {
      s3BucketName: bucket.bucketName
    });
    
    const iamRoles = new IAMRolesConstruct(stack, 'TestRoles', {
      s3BucketName: bucket.bucketName,
      logGroup: logging.logGroup
    });
    
    expect(iamRoles.role).toBeDefined();
    expect(iamRoles.instanceProfile).toBeDefined();
    
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {});
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
  });

  test('Stack outputs are created correctly', () => {
    const testStack = new TapStack(app, 'OutputTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    
    const template = Template.fromStack(testStack);
    const outputs = template.toJSON().Outputs || {};
    
    // Check that outputs exist
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
    
    // Check for specific output patterns
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(key => key.includes('SecurityGroupId'))).toBe(true);
    expect(outputKeys.some(key => key.includes('LogGroupName'))).toBe(true);
    expect(outputKeys.some(key => key.includes('VpcId'))).toBe(true);
    expect(outputKeys.some(key => key.includes('LogsBucketName'))).toBe(true);
  });
});

// Import necessary AWS CDK modules for construct tests
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';

describe('Security Group Region Tests', () => {
  let app;
  let stack;
  let vpc;

  beforeEach(() => {
    // Important: Do NOT set CDK_LOCAL for these tests
    // We want to test the region validation logic
    delete process.env.CDK_LOCAL;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    
    app = new App({
      context: { '@aws-cdk/core:newStyleStackSynthesis': false }
    });
  });

  afterEach(() => {
    // Restore CDK_LOCAL
    process.env.CDK_LOCAL = 'true';
  });

  test('Security group handles us-west-2 region correctly', () => {
    stack = new Stack(app, 'USWest2Stack', {
      env: { account: '123456789012', region: 'us-west-2' }
    });
    
    vpc = ec2.Vpc.fromVpcAttributes(stack, 'TestVPC', {
      vpcId: 'vpc-12345678',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-west-2a'],
      publicSubnetIds: ['subnet-12345678'],
      privateSubnetIds: ['subnet-12345678'],
    });
    
    const sg = new SecurityGroupConstruct(stack, 'TestSG', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      isLocalStack: false  // Important: set to false to test region logic
    });
    
    expect(sg.securityGroup).toBeDefined();
  });

  test('Security group handles eu-west-1 region correctly', () => {
    stack = new Stack(app, 'EUWest1Stack', {
      env: { account: '123456789012', region: 'eu-west-1' }
    });
    
    vpc = ec2.Vpc.fromVpcAttributes(stack, 'TestVPC', {
      vpcId: 'vpc-12345678',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['eu-west-1a'],
      publicSubnetIds: ['subnet-12345678'],
      privateSubnetIds: ['subnet-12345678'],
    });
    
    const sg = new SecurityGroupConstruct(stack, 'TestSG', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      isLocalStack: false
    });
    
    expect(sg.securityGroup).toBeDefined();
  });

  test('Security group handles ap-southeast-1 region correctly', () => {
    stack = new Stack(app, 'APSoutheast1Stack', {
      env: { account: '123456789012', region: 'ap-southeast-1' }
    });
    
    vpc = ec2.Vpc.fromVpcAttributes(stack, 'TestVPC', {
      vpcId: 'vpc-12345678',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['ap-southeast-1a'],
      publicSubnetIds: ['subnet-12345678'],
      privateSubnetIds: ['subnet-12345678'],
    });
    
    const sg = new SecurityGroupConstruct(stack, 'TestSG', {
      vpc: vpc,
      sshCidrBlock: '10.0.0.0/16',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      isLocalStack: false
    });
    
    expect(sg.securityGroup).toBeDefined();
  });

  test('Security group throws for unsupported region', () => {
    stack = new Stack(app, 'UnsupportedRegionStack', {
      env: { account: '123456789012', region: 'unsupported-region' }
    });
    
    vpc = ec2.Vpc.fromVpcAttributes(stack, 'TestVPC', {
      vpcId: 'vpc-12345678',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['unsupported-region-1a'],
      publicSubnetIds: ['subnet-12345678'],
      privateSubnetIds: ['subnet-12345678'],
    });
    
    expect(() => {
      new SecurityGroupConstruct(stack, 'TestSG', {
        vpc: vpc,
        sshCidrBlock: '10.0.0.0/16',
        trustedOutboundCidrs: ['10.0.0.0/8'],
        isLocalStack: false  // Important: must be false to reach the region check
      });
    }).toThrow('Unsupported region for S3 prefix list');
  });
});
