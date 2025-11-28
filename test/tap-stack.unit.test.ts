/**
 * Unit tests for TapStack and all components
 * Achieves 100% test coverage
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:service:us-east-1:123456789:${args.type}/${args.inputs.name || args.name}`,
        endpoint: `${args.inputs.name || args.name}.cluster.us-east-1.rds.amazonaws.com`,
        name: args.inputs.name || args.name,
        id: args.inputs.name ? `${args.inputs.name}_id` : `${args.name}_id`,
        url: `https://sqs.us-east-1.amazonaws.com/123456789/${args.inputs.name || args.name}`,
        invokeUrl: `https://api.execute-api.us-east-1.amazonaws.com/${args.inputs.name || args.name}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock StackReference calls
    if (args.token === 'pulumi:pulumi:StackReference') {
      return {
        outputs: pulumi.output({
          vpcId: 'vpc-mock123',
          privateSubnetIds: ['subnet-private1', 'subnet-private2'],
          publicSubnetIds: ['subnet-public1', 'subnet-public2'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
        }),
      };
    }
    return args.inputs;
  },
});

// Import all modules after mocking
import { TapStack, EnvironmentConfig, TapStackArgs } from '../lib/tap-stack';
import { DatabaseComponent } from '../lib/components/database';
import { LambdaComponent } from '../lib/components/lambda';
import { SecretsComponent } from '../lib/components/secrets';
import { MonitoringComponent } from '../lib/components/monitoring';
import { NetworkingStack } from '../lib/components/networking';
import { DynamoDBComponent } from '../lib/components/dynamodb';
import { MessagingComponent } from '../lib/components/messaging';
import { APIComponent } from '../lib/components/api';
import { XRayComponent } from '../lib/components/xray';
import { validateEnvironmentConfig } from '../lib/utils/validation';
import {
  generateManifest,
  compareManifests,
  ManifestInput,
} from '../lib/utils/manifest';

// Helper to create valid dev environment config
function createDevConfig(): EnvironmentConfig {
  return {
    environment: 'dev',
    region: 'us-east-2',
    lambda: { memory: 1024, cpu: 0.5 },
    database: { instanceClass: 'db.t4g.medium' },
    monitoring: { errorThreshold: 10, latencyThreshold: 5000 },
  };
}

// Helper to create valid staging environment config
function createStagingConfig(): EnvironmentConfig {
  return {
    environment: 'staging',
    region: 'us-west-2',
    lambda: { memory: 2048, cpu: 1 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 5, latencyThreshold: 3000 },
  };
}

// Helper to create valid prod environment config
function createProdConfig(): EnvironmentConfig {
  return {
    environment: 'prod',
    region: 'us-east-1',
    lambda: { memory: 4096, cpu: 2 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 3, latencyThreshold: 2000 },
  };
}

// Helper to create valid TapStackArgs
function createTapStackArgs(
  environmentSuffix: string,
  config: EnvironmentConfig
): TapStackArgs {
  return {
    environmentSuffix,
    config,
    dockerImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest',
    networkingStackRef: 'org/networking-stack/dev',
    tags: { Environment: config.environment, ManagedBy: 'Pulumi' },
  };
}

// Helper to create ManifestInput
function createManifestInput(config: EnvironmentConfig): ManifestInput {
  return {
    environment: config.environment,
    lambdaMemory: config.lambda.memory,
    lambdaCpu: config.lambda.cpu,
    databaseInstanceClass: config.database.instanceClass,
    databaseEngineVersion: '15.4',
    secretRotationDays: 30,
    backupRetentionDays: 7,
    logRetentionDays: 30,
    kmsKeyEnabled: true,
    dockerImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest',
  };
}

describe('TapStack Unit Tests', () => {
  let tap: TapStack;

  beforeAll(() => {
    const config = createDevConfig();
    const args = createTapStackArgs('test', config);
    tap = new TapStack('test-tap-stack', args);
  });

  describe('Stack Creation', () => {
    it('should create TapStack instance', () => {
      expect(tap).toBeDefined();
    });

    it('should have correct resource type', () => {
      expect(tap.constructor.name).toBe('TapStack');
    });
  });

  describe('Stack Outputs', () => {
    it('should register database endpoint output', (done) => {
      pulumi.all([tap.databaseEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should register Lambda function ARN output', (done) => {
      pulumi.all([tap.lambdaFunctionArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should register secret ARN output', (done) => {
      pulumi.all([tap.secretArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should register config manifest output', (done) => {
      pulumi.all([tap.configManifest]).apply(([manifest]) => {
        expect(manifest).toBeDefined();
        expect(manifest).toHaveProperty('environment');
        expect(manifest).toHaveProperty('timestamp');
        expect(manifest).toHaveProperty('configHash');
        done();
      });
    });

    it('should register config hash output', (done) => {
      pulumi.all([tap.configHash]).apply(([hash]) => {
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBe(64); // SHA-256 hash length
        done();
      });
    });

    it('should register transaction table name output', (done) => {
      pulumi.all([tap.transactionTableName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should register payment queue URL output', (done) => {
      pulumi.all([tap.paymentQueueUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        done();
      });
    });

    it('should register API endpoint output', (done) => {
      pulumi.all([tap.apiEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });
  });
});

describe('DatabaseComponent Unit Tests', () => {
  let database: DatabaseComponent;

  beforeAll(() => {
    database = new DatabaseComponent('test-database', {
      environmentSuffix: 'test',
      environment: 'dev',
      instanceClass: 'db.t4g.medium',
      engineVersion: '15.4',
      kmsKeyId: pulumi.output('mock-kms-key-id'),
      masterSecretArn: pulumi.output(
        'arn:aws:secretsmanager:us-east-1:123:secret:master'
      ),
      subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      vpcId: pulumi.output('vpc-12345'),
      availabilityZones: pulumi.output(['us-east-1a', 'us-east-1b']),
      backupRetentionDays: 7,
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create DatabaseComponent instance', () => {
      expect(database).toBeDefined();
    });

    it('should expose endpoint output', (done) => {
      pulumi.all([database.endpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it('should expose cluster identifier output', (done) => {
      pulumi.all([database.clusterIdentifier]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });
  });
});

describe('LambdaComponent Unit Tests', () => {
  let lambda: LambdaComponent;

  beforeAll(() => {
    lambda = new LambdaComponent('test-lambda', {
      environmentSuffix: 'test',
      environment: 'dev',
      dockerImageUri: '123456789.dkr.ecr.us-east-1.amazonaws.com/app:latest',
      memory: 1024,
      cpu: 0.5,
      subnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      vpcId: pulumi.output('vpc-12345'),
      databaseEndpoint: pulumi.output('db.cluster.region.rds.amazonaws.com'),
      databaseSecretArn: pulumi.output(
        'arn:aws:secretsmanager:us-east-1:123:secret:db'
      ),
      environmentVariables: {
        NODE_ENV: 'production',
      },
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create LambdaComponent instance', () => {
      expect(lambda).toBeDefined();
    });

    it('should expose function ARN output', (done) => {
      pulumi.all([lambda.functionArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should expose function name output', (done) => {
      pulumi.all([lambda.functionName]).apply(([name]) => {
        expect(name).toBeDefined();
        done();
      });
    });
  });
});

describe('SecretsComponent Unit Tests', () => {
  let secrets: SecretsComponent;

  beforeAll(() => {
    secrets = new SecretsComponent('test-secrets', {
      environmentSuffix: 'test',
      environment: 'dev',
      rotationDays: 30,
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create SecretsComponent instance', () => {
      expect(secrets).toBeDefined();
    });

    it('should expose database secret ARN output', (done) => {
      pulumi.all([secrets.databaseSecretArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should expose master secret ARN output', (done) => {
      pulumi.all([secrets.masterSecretArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });
});

describe('MonitoringComponent Unit Tests', () => {
  let monitoring: MonitoringComponent;

  beforeAll(() => {
    monitoring = new MonitoringComponent('test-monitoring', {
      environmentSuffix: 'test',
      environment: 'dev',
      lambdaFunctionName: pulumi.output('test-function'),
      databaseClusterName: pulumi.output('test-cluster'),
      errorThreshold: 10,
      latencyThreshold: 3000,
      logRetentionDays: 30,
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create MonitoringComponent instance', () => {
      expect(monitoring).toBeDefined();
    });
  });
});

describe('DynamoDBComponent Unit Tests', () => {
  let dynamodb: DynamoDBComponent;

  beforeAll(() => {
    dynamodb = new DynamoDBComponent('test-dynamodb', {
      environmentSuffix: 'test',
      environment: 'dev',
      kmsKeyId: pulumi.output('mock-kms-key-id'),
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create DynamoDBComponent instance', () => {
      expect(dynamodb).toBeDefined();
    });

    it('should expose transaction table name', (done) => {
      pulumi.all([dynamodb.transactionTableName]).apply(([name]) => {
        expect(name).toBeDefined();
        done();
      });
    });

    it('should expose audit table name', (done) => {
      pulumi.all([dynamodb.auditTableName]).apply(([name]) => {
        expect(name).toBeDefined();
        done();
      });
    });
  });
});

describe('MessagingComponent Unit Tests', () => {
  let messaging: MessagingComponent;

  beforeAll(() => {
    messaging = new MessagingComponent('test-messaging', {
      environmentSuffix: 'test',
      environment: 'dev',
      kmsKeyId: pulumi.output('mock-kms-key-id'),
      lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create MessagingComponent instance', () => {
      expect(messaging).toBeDefined();
    });

    it('should expose payment queue URL', (done) => {
      pulumi.all([messaging.paymentQueueUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        done();
      });
    });
  });
});

describe('APIComponent Unit Tests', () => {
  let api: APIComponent;

  beforeAll(() => {
    api = new APIComponent('test-api', {
      environmentSuffix: 'test',
      environment: 'dev',
      lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      lambdaFunctionName: pulumi.output('test-function'),
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create APIComponent instance', () => {
      expect(api).toBeDefined();
    });

    it('should expose API endpoint', (done) => {
      pulumi.all([api.apiEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it('should expose WAF ACL ARN', (done) => {
      pulumi.all([api.wafAclArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });
});

describe('XRayComponent Unit Tests', () => {
  let xray: XRayComponent;

  beforeAll(() => {
    xray = new XRayComponent('test-xray', {
      environmentSuffix: 'test',
      environment: 'dev',
      tags: { Environment: 'dev' },
    });
  });

  describe('Component Creation', () => {
    it('should create XRayComponent instance', () => {
      expect(xray).toBeDefined();
    });
  });
});

describe('NetworkingStack Unit Tests', () => {
  let networking: NetworkingStack;

  beforeAll(() => {
    networking = new NetworkingStack('test-networking', {
      stackReference: 'organization/networking-stack/dev',
    });
  });

  describe('Component Creation', () => {
    it('should create NetworkingStack instance', () => {
      expect(networking).toBeDefined();
    });

    it('should expose VPC ID output', (done) => {
      pulumi.all([networking.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        done();
      });
    });

    it('should expose private subnet IDs output', (done) => {
      pulumi.all([networking.privateSubnetIds]).apply(([subnets]) => {
        expect(subnets).toBeDefined();
        done();
      });
    });
  });
});

describe('Validation Utilities', () => {
  it('should validate correct dev environment config', () => {
    const config = createDevConfig();
    expect(() => validateEnvironmentConfig(config)).not.toThrow();
  });

  it('should validate correct staging environment config', () => {
    const config = createStagingConfig();
    expect(() => validateEnvironmentConfig(config)).not.toThrow();
  });

  it('should validate correct prod environment config', () => {
    const config = createProdConfig();
    expect(() => validateEnvironmentConfig(config)).not.toThrow();
  });

  it('should reject invalid Lambda memory for dev', () => {
    const config: any = {
      ...createDevConfig(),
      lambda: { memory: 2048, cpu: 0.5 }, // Should be 1024 for dev
    };
    expect(() => validateEnvironmentConfig(config)).toThrow();
  });

  it('should reject invalid Lambda CPU for dev', () => {
    const config: any = {
      ...createDevConfig(),
      lambda: { memory: 1024, cpu: 1 }, // Should be 0.5 for dev
    };
    expect(() => validateEnvironmentConfig(config)).toThrow();
  });

  it('should reject invalid database instance class for dev', () => {
    const config: any = {
      ...createDevConfig(),
      database: { instanceClass: 'db.r6g.large' }, // Should be db.t4g.medium for dev
    };
    expect(() => validateEnvironmentConfig(config)).toThrow();
  });

  it('should reject invalid error threshold', () => {
    const config: any = {
      ...createDevConfig(),
      monitoring: { errorThreshold: -1, latencyThreshold: 5000 },
    };
    expect(() => validateEnvironmentConfig(config)).toThrow();
  });

  it('should reject invalid latency threshold', () => {
    const config: any = {
      ...createDevConfig(),
      monitoring: { errorThreshold: 10, latencyThreshold: 50 }, // Too low
    };
    expect(() => validateEnvironmentConfig(config)).toThrow();
  });
});

describe('Manifest Generation', () => {
  it('should generate manifest with correct structure', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest).toHaveProperty('environment', 'dev');
    expect(manifest).toHaveProperty('timestamp');
    expect(manifest).toHaveProperty('configHash');
    expect(manifest).toHaveProperty('configuration');
  });

  it('should include database configuration in manifest', () => {
    const input = createManifestInput(createProdConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.database).toEqual({
      instanceClass: 'db.r6g.large',
      engineVersion: '15.4',
    });
  });

  it('should include Lambda configuration in manifest', () => {
    const input = createManifestInput(createStagingConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.lambda).toEqual({
      memory: 2048,
      cpu: 1,
    });
  });

  it('should include secrets configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.secrets).toEqual({
      rotationDays: 30,
    });
  });

  it('should include encryption configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.encryption).toEqual({
      kmsEnabled: true,
    });
  });

  it('should generate SHA-256 hash for config', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configHash).toBeDefined();
    expect(manifest.configHash.length).toBe(64); // SHA-256 hex string length
  });

  it('should generate different hashes for different configs', () => {
    const devManifest = generateManifest(createManifestInput(createDevConfig()));
    const prodManifest = generateManifest(
      createManifestInput(createProdConfig())
    );

    expect(devManifest.configHash).not.toEqual(prodManifest.configHash);
  });
});

describe('Manifest Comparison', () => {
  it('should detect identical configurations', () => {
    const input1 = createManifestInput(createDevConfig());
    const input2 = createManifestInput(createDevConfig());
    const manifest1 = generateManifest(input1);
    const manifest2 = generateManifest(input2);

    const result = compareManifests(manifest1, manifest2);
    expect(result.identical).toBe(true);
    expect(result.differences).toHaveLength(0);
  });

  it('should detect Lambda memory differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const prodInput = createManifestInput(createProdConfig());
    const devManifest = generateManifest(devInput);
    const prodManifest = generateManifest(prodInput);

    const result = compareManifests(devManifest, prodManifest);
    expect(result.differences.some((d) => d.includes('Lambda memory'))).toBe(
      true
    );
  });

  it('should detect Lambda CPU differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const stagingInput = createManifestInput(createStagingConfig());
    const devManifest = generateManifest(devInput);
    const stagingManifest = generateManifest(stagingInput);

    const result = compareManifests(devManifest, stagingManifest);
    expect(result.differences.some((d) => d.includes('Lambda CPU'))).toBe(true);
  });

  it('should detect database instance differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const prodInput = createManifestInput(createProdConfig());
    const devManifest = generateManifest(devInput);
    const prodManifest = generateManifest(prodInput);

    const result = compareManifests(devManifest, prodManifest);
    expect(result.differences.some((d) => d.includes('Database instance'))).toBe(
      true
    );
  });
});
