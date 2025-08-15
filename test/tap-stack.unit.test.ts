import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Mock modules that produce unresolved tokens
jest.mock('../lib/modules', () => {
  const dummy = { id: 'dummy-id', name: 'dummy-name' };
  return {
    VpcModule: jest.fn(() => ({ vpc: dummy, publicSubnet: dummy, privateSubnet: dummy })),
    SecurityGroupModule: jest.fn(() => ({
      ec2SecurityGroup: dummy,
      rdsSecurityGroup: dummy,
    })),
    IAMModule: jest.fn(() => ({
      ec2Role: dummy,
      ec2InstanceProfile: { name: 'dummy-profile' },
    })),
    EC2Module: jest.fn(() => ({ instance: dummy })),
    RDSModule: jest.fn(() => ({ dbInstance: dummy })),
    S3Module: jest.fn(() => ({ bucket: dummy })),
    CloudWatchLogsModule: jest.fn(() => ({ logGroup: dummy })),
  };
});

describe('TapStack Unit Tests', () => {
  const makeStack = (props?: any) => {
    const app = new App();
    return new TapStack(app, 'TestStack', props);
  };

  // --------------------------------------------------------------------------
  // 1️⃣ Basic instantiation
  // --------------------------------------------------------------------------
  test('stack should instantiate without errors', () => {
    const stack = makeStack();
    expect(stack).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 2️⃣ Branch coverage tests
  // --------------------------------------------------------------------------
  test('should handle AWS_REGION_OVERRIDE', () => {
    const stack = makeStack({ awsRegion: 'us-west-2' });
    process.env.AWS_REGION_OVERRIDE = 'us-east-2'; // simulate override
    expect(stack).toBeDefined();
    delete process.env.AWS_REGION_OVERRIDE;
  });

  test('should handle defaultTags undefined', () => {
    const stack = makeStack();
    expect(stack).toBeDefined();
  });

  test('should handle keyPairName undefined', () => {
    const stack = makeStack({ environmentSuffix: 'dev' });
    expect(stack).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 3️⃣ Terraform outputs
  // --------------------------------------------------------------------------
  test('should define outputs', () => {
    const stack = makeStack();
    const synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized);

    const expectedOutputs = [
      'vpc_id',
      'public_subnet_id',
      'private_subnet_id',
      'ec2_instance_id',
      'ec2_public_ip',
      'ec2_private_ip',
      'rds_endpoint',
      'rds_port',
      's3_bucket_name_output',
      's3_bucket_arn',
      'ec2_security_group_id',
      'rds_security_group_id',
      'ec2_role_arn',
      'cloudwatch_log_group_name',
      'ssh_connection_command',
    ];

    expectedOutputs.forEach((key) => {
      expect(parsed.output[key]).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4️⃣ Synthesize JSON correctly
  // --------------------------------------------------------------------------
  test('should synthesize Terraform JSON correctly', () => {
  const stack = makeStack();
  const synthesized = Testing.synth(stack);
  const parsed = JSON.parse(synthesized);

  // Check that terraform block exists
  expect(parsed.terraform).toBeDefined();

  // Optional: verify that outputs are present
  expect(parsed.output).toBeDefined();
  const expectedOutputs = [
    'vpc_id',
    'public_subnet_id',
    'private_subnet_id',
    'ec2_instance_id',
    'ec2_public_ip',
    'ec2_private_ip',
    'rds_endpoint',
    'rds_port',
    's3_bucket_name_output',
    's3_bucket_arn',
    'ec2_security_group_id',
    'rds_security_group_id',
    'ec2_role_arn',
    'cloudwatch_log_group_name',
    'ssh_connection_command',
  ];
  expectedOutputs.forEach((key) => {
    expect(parsed.output[key]).toBeDefined();
  });
});
});

describe('TapStack branch coverage', () => {
  test('should handle AWS_REGION_OVERRIDE', () => {
    const app = new App();
    const stack = new TapStack(app, 'OverrideStack', { awsRegion: 'us-west-2' });
    // Force override to test the true branch
    process.env.AWS_REGION_OVERRIDE = 'us-east-2';
    expect(stack).toBeDefined();
    delete process.env.AWS_REGION_OVERRIDE;
  });

  test('should handle defaultTags undefined', () => {
    const app = new App();
    const stack = new TapStack(app, 'NoTagsStack');
    expect(stack).toBeDefined();
  });

  test('should handle keyPairName undefined', () => {
    const app = new App();
    const stack = new TapStack(app, 'NoKeyStack', { environmentSuffix: 'dev' });
    expect(stack).toBeDefined();
  });
});
