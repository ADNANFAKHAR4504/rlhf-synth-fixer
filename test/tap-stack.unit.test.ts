import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with production VPC configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackProdVPC', {
      environmentSuffix: 'prod',
      vpcId: 'vpc-12345678',
      subnetIds: ['subnet-12345678', 'subnet-87654321'],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with custom Lambda configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackLambdaConfig', {
      environmentSuffix: 'test',
      lambdaConfig: {
        runtime: 'nodejs20.x',
        timeout: 600,
        memorySize: 1024,
        architecture: 'arm64',
      },
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with availability zones configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackAZ', {
      environmentSuffix: 'staging',
      vpcId: 'vpc-12345678',
      subnetIds: ['subnet-12345678', 'subnet-87654321'],
      availabilityZones: ['us-east-1a', 'us-east-1b'],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

describe('Stack Error Handling', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  test('TapStack throws error with insufficient subnets for production', () => {
    expect(() => {
      new TapStack(app, 'TestTapStackError', {
        environmentSuffix: 'prod',
        vpcId: 'vpc-12345678',
        subnetIds: ['subnet-12345678'], // Only 1 subnet, should require 2+
      });
    }).toThrow('Production deployment requires at least 2 subnets for high availability');
  });

  test('TapStack throws error when createVpc is enabled', () => {
    expect(() => {
      new TapStack(app, 'TestTapStackCreateVPC', {
        environmentSuffix: 'prod',
        createVpc: true,
      });
    }).toThrow('VPC creation mode not implemented in this version');
  });

  test('TapStack throws error when subnet count does not match AZ count', () => {
    expect(() => {
      new TapStack(app, 'TestTapStackAZMismatch', {
        environmentSuffix: 'prod',
        vpcId: 'vpc-12345678',
        subnetIds: ['subnet-12345678', 'subnet-87654321'],
        availabilityZones: ['us-east-1a'], // 2 subnets but 1 AZ
      });
    }).toThrow('Number of subnets must match number of availability zones');
  });
});

// add more test suites and cases as needed
