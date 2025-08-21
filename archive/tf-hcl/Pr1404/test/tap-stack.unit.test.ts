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
      environmentSuffix: 'dev',  // Use dev instead of prod to avoid VPC requirement
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
    }).toThrow('Deployment requires at least 2 subnets for high availability');
  });

  test('TapStack throws error for production environment without VPC config', () => {
    expect(() => {
      new TapStack(app, 'TestTapStackProdNoVPC', {
        environmentSuffix: 'prod',
        // Missing vpcId and subnetIds - should require for production
      });
    }).toThrow("Production environment 'prod' requires explicit VPC configuration");
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

describe('Lambda Asset Management', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  test('TapStack generates asset version and build metadata', () => {
    stack = new TapStack(app, 'TestTapStackAssetVersion', {
      environmentSuffix: 'dev',
    });
    
    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    
    // Check that asset version is included in Lambda environment variables
    expect(synthesized).toContain('ASSET_VERSION');
    expect(synthesized).toContain('BUILD_TIMESTAMP');
    expect(synthesized).toContain('NODE_ENV');
  });

  test('TapStack sets production environment variables for production deployment', () => {
    stack = new TapStack(app, 'TestTapStackProdEnv', {
      environmentSuffix: 'prod',
      vpcId: 'vpc-12345678',
      subnetIds: ['subnet-12345678', 'subnet-87654321'],
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"NODE_ENV": "production"');
    expect(synthesized).toContain('"publish": true'); // Production versioning enabled
  });

  test('TapStack sets development environment variables for non-production', () => {
    stack = new TapStack(app, 'TestTapStackDevEnv', {
      environmentSuffix: 'dev',
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"NODE_ENV": "development"');
    expect(synthesized).toContain('"publish": false'); // Development versioning disabled
  });

  test('TapStack includes asset version in Lambda tags', () => {
    stack = new TapStack(app, 'TestTapStackAssetTags', {
      environmentSuffix: 'test',
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('AssetVersion');
    expect(synthesized).toContain('BuildTimestamp');
  });

  test('TapStack outputs include asset version and build metadata', () => {
    stack = new TapStack(app, 'TestTapStackAssetOutputs', {
      environmentSuffix: 'staging',
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('lambda-asset-version');
    expect(synthesized).toContain('lambda-build-metadata');
    expect(synthesized).toContain('Version hash of the Lambda asset');
    expect(synthesized).toContain('Complete build metadata for production');
  });
});

// add more test suites and cases as needed
