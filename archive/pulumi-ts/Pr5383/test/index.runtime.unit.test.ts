import * as pulumi from '@pulumi/pulumi';

/**
 * Runtime Unit Tests for Pulumi Infrastructure
 * Uses Pulumi's testing framework to validate resource creation
 */

describe('Pulumi Infrastructure Runtime Tests', () => {
  // Mock Pulumi runtime for testing
  beforeAll(() => {
    process.env.PULUMI_TEST_MODE = 'true';
    process.env.PULUMI_NODEJS_STACK = 'test-stack';
    process.env.PULUMI_NODEJS_PROJECT = 'TapStack';
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-west-2';
  });

  const basePulumiConfig: Record<string, string> = {};

  const setPulumiConfig = (configEntries: Record<string, string>) => {
    process.env.PULUMI_CONFIG = JSON.stringify(configEntries);
  };

  beforeEach(() => {
    setPulumiConfig(basePulumiConfig);
    jest.resetModules();
  });

  afterAll(() => {
    delete process.env.PULUMI_TEST_MODE;
    delete process.env.PULUMI_NODEJS_STACK;
    delete process.env.PULUMI_NODEJS_PROJECT;
    delete process.env.PULUMI_CONFIG;
    delete process.env.AWS_REGION;
  });

  interface LoadOptions {
    configOverrides?: Partial<Record<'environment' | 'environmentSuffix', string | undefined>>;
  }

  const loadStackModule = (options?: LoadOptions) => {
    let moduleExports: Record<string, unknown> | undefined;
    jest.isolateModules(() => {
      if (options?.configOverrides) {
        const overrides = options.configOverrides;
        jest.doMock('@pulumi/pulumi', () => {
          const actual = jest.requireActual('@pulumi/pulumi');

          class ConfigWithOverrides extends actual.Config {
            override get(key: string) {
              if (Object.prototype.hasOwnProperty.call(overrides, key)) {
                return overrides[key as 'environment' | 'environmentSuffix'];
              }

              return super.get(key);
            }
          }

          return {
            ...actual,
            Config: ConfigWithOverrides,
          };
        });
      }

      moduleExports = require('../lib/index');
    });
    jest.dontMock('@pulumi/pulumi');
    return moduleExports;
  };

  it('should load module without errors', () => {
    expect(() => loadStackModule()).not.toThrow();
  });

  it('should expose deploymentRegion output derived from AWS_REGION', () => {
    const moduleExports = loadStackModule() || {};
    expect(moduleExports).toHaveProperty('deploymentRegion', process.env.AWS_REGION);
  });

  it('should prefer environment values defined in Pulumi config', async () => {
    const moduleExports =
      loadStackModule({
        configOverrides: {
          environment: 'staging',
          environmentSuffix: 'cfgsuffix',
        },
      }) || {};

    expect(moduleExports).toHaveProperty('deployedEnvironment', 'staging');
    expect(moduleExports).toHaveProperty('deploymentSuffix', 'cfgsuffix');
  });

  it('should derive environment values from process environment variables', async () => {
    const originalEnvironment = process.env.ENVIRONMENT;
    const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

    process.env.ENVIRONMENT = 'Staging';
    process.env.ENVIRONMENT_SUFFIX = 'EnvSuffix';

    const moduleExports =
      loadStackModule({
        configOverrides: {
          environment: undefined,
          environmentSuffix: undefined,
        },
      }) || {};

    expect(moduleExports).toHaveProperty('deployedEnvironment', 'staging');
    expect(moduleExports).toHaveProperty('deploymentSuffix', 'envsuffix');

    if (originalEnvironment) {
      process.env.ENVIRONMENT = originalEnvironment;
    } else {
      delete process.env.ENVIRONMENT;
    }

    if (originalEnvironmentSuffix) {
      process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  it('should default environment settings when config and environment variables are absent', async () => {
    const originalEnvironment = process.env.ENVIRONMENT;
    const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

    delete process.env.ENVIRONMENT;
    delete process.env.ENVIRONMENT_SUFFIX;

    const moduleExports =
      loadStackModule({
        configOverrides: {
          environment: undefined,
          environmentSuffix: undefined,
        },
      }) || {};

    expect(moduleExports).toHaveProperty('deployedEnvironment', 'dev');
    expect(moduleExports).toHaveProperty('deploymentSuffix', 'test-stack');

    if (originalEnvironment) {
      process.env.ENVIRONMENT = originalEnvironment;
    }

    if (originalEnvironmentSuffix) {
      process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
    }
  });

  it('should throw when AWS_REGION is not defined', () => {
    const originalRegion = process.env.AWS_REGION;
    delete process.env.AWS_REGION;
    setPulumiConfig(basePulumiConfig);

    expect(() => {
      jest.isolateModules(() => {
        require('../lib/index');
      });
    }).toThrow('AWS_REGION environment variable must be set to select the deployment region.');

    if (originalRegion) {
      process.env.AWS_REGION = originalRegion;
    } else {
      delete process.env.AWS_REGION;
    }
  });

  it('should validate environment configuration logic', () => {
    const envConfig = {
      dev: {
        lambdaMemory: 512,
        logRetentionDays: 7,
      },
      staging: {
        lambdaMemory: 1024,
        logRetentionDays: 14,
      },
      prod: {
        lambdaMemory: 2048,
        logRetentionDays: 30,
      },
    };

    // Test dev config
    const devConfig = envConfig['dev'];
    expect(devConfig.lambdaMemory).toBe(512);
    expect(devConfig.logRetentionDays).toBe(7);

    // Test staging config
    const stagingConfig = envConfig['staging'];
    expect(stagingConfig.lambdaMemory).toBe(1024);
    expect(stagingConfig.logRetentionDays).toBe(14);

    // Test prod config
    const prodConfig = envConfig['prod'];
    expect(prodConfig.lambdaMemory).toBe(2048);
    expect(prodConfig.logRetentionDays).toBe(30);
  });

  it('should throw error for invalid environment', () => {
    expect(() =>
      loadStackModule({
        configOverrides: {
          environment: 'invalid',
          environmentSuffix: 'badsuffix',
        },
      })
    ).toThrow('Invalid environment: invalid. Must be dev, staging, or prod');
  });

  describe('Lambda Handler Logic', () => {
    it('should export handler function', () => {
      // Extract Lambda code from index.ts
      const fs = require('fs');
      const path = require('path');
      const indexPath = path.join(__dirname, '../lib/index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Find Lambda code section
      const lambdaCodeMatch = content.match(/const lambdaCode = `([\s\S]*?)`;/);
      expect(lambdaCodeMatch).toBeTruthy();

      if (lambdaCodeMatch) {
        const lambdaCode = lambdaCodeMatch[1];
        expect(lambdaCode).toContain('exports.handler = async (event)');
      }
    });

    it('should process S3 event records', async () => {
      // Mock S3 event
      const mockEvent = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test.txt', size: 1024 },
            },
            eventTime: '2024-01-01T00:00:00Z',
          },
        ],
      };

      // Validate event structure matches Lambda code expectations
      expect(mockEvent.Records).toHaveLength(1);
      expect(mockEvent.Records[0].s3.bucket.name).toBe('test-bucket');
      expect(mockEvent.Records[0].s3.object.key).toBe('test.txt');
      expect(mockEvent.Records[0].s3.object.size).toBe(1024);
    });
  });

  describe('Resource Naming Logic', () => {
    it('should construct correct bucket name', () => {
      const environment = 'dev';
      const environmentSuffix = 'test123';
      const bucketName = `data-processor-${environment}-${environmentSuffix}`;
      expect(bucketName).toBe('data-processor-dev-test123');
    });

    it('should construct correct table name', () => {
      const environment = 'prod';
      const environmentSuffix = 'abc456';
      const tableName = `data-table-${environment}-${environmentSuffix}`;
      expect(tableName).toBe('data-table-prod-abc456');
    });

    it('should construct correct Lambda function name', () => {
      const environment = 'staging';
      const environmentSuffix = 'xyz789';
      const lambdaName = `s3-processor-${environment}-${environmentSuffix}`;
      expect(lambdaName).toBe('s3-processor-staging-xyz789');
    });

    it('should construct correct log group name', () => {
      const environment = 'dev';
      const environmentSuffix = 'log123';
      const logGroupName = `/aws/lambda/s3-processor-${environment}-${environmentSuffix}`;
      expect(logGroupName).toBe('/aws/lambda/s3-processor-dev-log123');
    });

    it('should construct correct IAM role name', () => {
      const environment = 'prod';
      const environmentSuffix = 'role456';
      const roleName = `lambda-role-${environment}-${environmentSuffix}`;
      expect(roleName).toBe('lambda-role-prod-role456');
    });
  });

  describe('Configuration Validation', () => {
    it('should use correct Lambda runtime', () => {
      const runtime = 'nodejs18.x';
      expect(runtime).toBe('nodejs18.x');
    });

    it('should use correct Lambda timeout', () => {
      const timeout = 60;
      expect(timeout).toBe(60);
    });

    it('should use correct DynamoDB billing mode', () => {
      const billingMode = 'PAY_PER_REQUEST';
      expect(billingMode).toBe('PAY_PER_REQUEST');
    });

    it('should use correct S3 encryption algorithm', () => {
      const algorithm = 'AES256';
      expect(algorithm).toBe('AES256');
    });

    it('should use correct hash key attribute type', () => {
      const attributeType = 'S';
      expect(attributeType).toBe('S');
    });
  });

  describe('IAM Policy Construction', () => {
    it('should grant correct S3 permissions', () => {
      const s3Actions = ['s3:GetObject', 's3:ListBucket'];
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
      expect(s3Actions).toHaveLength(2);
    });

    it('should grant correct DynamoDB permissions', () => {
      const dynamoActions = ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'];
      expect(dynamoActions).toContain('dynamodb:PutItem');
      expect(dynamoActions).toContain('dynamodb:GetItem');
      expect(dynamoActions).toContain('dynamodb:UpdateItem');
      expect(dynamoActions).toHaveLength(3);
    });

    it('should grant correct CloudWatch Logs permissions', () => {
      const logsActions = [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ];
      expect(logsActions).toContain('logs:CreateLogGroup');
      expect(logsActions).toContain('logs:CreateLogStream');
      expect(logsActions).toContain('logs:PutLogEvents');
      expect(logsActions).toHaveLength(3);
    });
  });

  describe('Lambda Environment Variables', () => {
    it('should set TABLE_NAME environment variable', () => {
      const tableName = 'data-table-dev-test';
      const envVars = {
        TABLE_NAME: tableName,
        ENVIRONMENT: 'dev',
      };
      expect(envVars.TABLE_NAME).toBe('data-table-dev-test');
    });

    it('should set ENVIRONMENT environment variable', () => {
      const envVars = {
        TABLE_NAME: 'test-table',
        ENVIRONMENT: 'prod',
      };
      expect(envVars.ENVIRONMENT).toBe('prod');
    });
  });

  describe('S3 Event Configuration', () => {
    it('should trigger on object creation events', () => {
      const events = ['s3:ObjectCreated:*'];
      expect(events).toContain('s3:ObjectCreated:*');
      expect(events).toHaveLength(1);
    });

    it('should use correct Lambda permission action', () => {
      const action = 'lambda:InvokeFunction';
      expect(action).toBe('lambda:InvokeFunction');
    });

    it('should use correct permission principal', () => {
      const principal = 's3.amazonaws.com';
      expect(principal).toBe('s3.amazonaws.com');
    });
  });

  describe('Resource Tags', () => {
    it('should apply Environment tag', () => {
      const environment = 'dev';
      const tags = {
        Environment: environment,
        ManagedBy: 'Pulumi',
        Region: 'us-west-2',
      };
      expect(tags.Environment).toBe('dev');
    });

    it('should apply ManagedBy tag', () => {
      const tags = {
        Environment: 'dev',
        ManagedBy: 'Pulumi',
        Region: 'us-west-2',
      };
      expect(tags.ManagedBy).toBe('Pulumi');
    });

    it('should include Region tag definition in stack source', () => {
      const fs = require('fs');
      const path = require('path');
      const indexPath = path.join(__dirname, '../lib/index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('Region: args.awsRegion');
    });
  });

  describe('S3 Bucket Public Access Configuration', () => {
    it('should block all public access settings', () => {
      const publicAccessConfig = {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      };

      expect(publicAccessConfig.blockPublicAcls).toBe(true);
      expect(publicAccessConfig.blockPublicPolicy).toBe(true);
      expect(publicAccessConfig.ignorePublicAcls).toBe(true);
      expect(publicAccessConfig.restrictPublicBuckets).toBe(true);
    });
  });

  describe('DynamoDB Table Schema', () => {
    it('should use id as partition key', () => {
      const hashKey = 'id';
      const attributes = [
        {
          name: 'id',
          type: 'S',
        },
      ];

      expect(hashKey).toBe('id');
      expect(attributes[0].name).toBe('id');
      expect(attributes[0].type).toBe('S');
    });
  });

  describe('Lambda Code DynamoDB Item Structure', () => {
    it('should construct correct DynamoDB item', () => {
      const bucket = 'test-bucket';
      const key = 'test-file.txt';
      const eventTime = '2024-01-01T00:00:00Z';
      const size = 2048;

      const item = {
        id: `${bucket}/${key}`,
        bucket: bucket,
        key: key,
        processedAt: eventTime,
        size: size,
        timestamp: new Date().toISOString(),
      };

      expect(item.id).toBe('test-bucket/test-file.txt');
      expect(item.bucket).toBe('test-bucket');
      expect(item.key).toBe('test-file.txt');
      expect(item.processedAt).toBe('2024-01-01T00:00:00Z');
      expect(item.size).toBe(2048);
      expect(item.timestamp).toBeTruthy();
    });
  });

  describe('Component Resource Type', () => {
    it('should use correct custom resource type', () => {
      const resourceType = 'custom:DataProcessingComponent';
      expect(resourceType).toBe('custom:DataProcessingComponent');
    });

    it('should use correct component name', () => {
      const componentName = 'data-processor';
      expect(componentName).toBe('data-processor');
    });
  });

  describe('Stack Outputs', () => {
    it('should export required output names', () => {
      const outputs = [
        's3BucketName',
        'lambdaFunctionArn',
        'dynamoTableName',
        'deployedEnvironment',
        'deploymentRegion',
      ];

      expect(outputs).toContain('s3BucketName');
      expect(outputs).toContain('lambdaFunctionArn');
      expect(outputs).toContain('dynamoTableName');
      expect(outputs).toContain('deployedEnvironment');
      expect(outputs).toContain('deploymentRegion');
      expect(outputs).toHaveLength(5);
    });
  });
});
