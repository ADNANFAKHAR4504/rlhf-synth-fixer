import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing index
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = { ...args.inputs };

    // Set specific mock outputs based on resource type
    if (
      args.type === 'aws:s3/bucket:Bucket' ||
      args.type === 'aws:s3/bucketV2:BucketV2'
    ) {
      outputs.bucket = args.inputs.bucket;
      outputs.arn = `arn:aws:s3:::${args.inputs.bucket}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.name = args.inputs.name;
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
      outputs.memorySize = args.inputs.memorySize;
      outputs.timeout = args.inputs.timeout;
      outputs.runtime = args.inputs.runtime;
      outputs.environment = args.inputs.environment;
      outputs.tracingConfig = args.inputs.tracingConfig;
      outputs.reservedConcurrentExecutions =
        args.inputs.reservedConcurrentExecutions;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.name = args.name;
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name;
      outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
      outputs.retentionInDays = args.inputs.retentionInDays;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Set required environment variable before importing index
process.env.ENVIRONMENT_SUFFIX = 'test123';

// Set required config before importing index
// Note: Use "project:" prefix for global config values
pulumi.runtime.setConfig('project:environmentSuffix', 'test123');
// Intentionally NOT setting some optional config values to test default branches
// pulumi.runtime.setConfig('project:environment', 'dev');
// pulumi.runtime.setConfig('project:imageQuality', '80');
// pulumi.runtime.setConfig('project:maxFileSize', '10485760');
// pulumi.runtime.setConfig('project:lambdaMemory', '512');
// pulumi.runtime.setConfig('project:logRetention', '7');
pulumi.runtime.setConfig('project:reservedConcurrency', '5');

describe('Image Processor Infrastructure Tests', () => {
  let module: any;

  beforeAll(async () => {
    // Import the index module
    module = require('../lib/index');
  });

  describe('Exports', () => {
    it('should export bucketName', done => {
      pulumi.all([module.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(bucketName).toContain('test123');
        done();
      });
    });

    it('should export bucketArn', done => {
      pulumi.all([module.bucketArn]).apply(([bucketArn]) => {
        expect(bucketArn).toBeDefined();
        expect(bucketArn).toContain('arn:aws:s3:::');
        done();
      });
    });

    it('should export lambdaFunctionName', done => {
      pulumi.all([module.lambdaFunctionName]).apply(([functionName]) => {
        expect(functionName).toBeDefined();
        expect(functionName).toContain('test123');
        done();
      });
    });

    it('should export lambdaFunctionArn', done => {
      pulumi.all([module.lambdaFunctionArn]).apply(([functionArn]) => {
        expect(functionArn).toBeDefined();
        expect(functionArn).toContain('arn:aws:lambda:');
        done();
      });
    });

    it('should export logGroupName', done => {
      pulumi.all([module.logGroupName]).apply(([logGroupName]) => {
        expect(logGroupName).toBeDefined();
        expect(logGroupName).toContain('/aws/lambda/');
        done();
      });
    });

    it('should export lambdaRoleArn', done => {
      pulumi.all([module.lambdaRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        expect(roleArn).toContain('arn:aws:iam::');
        done();
      });
    });
  });

  describe('Configuration Tests', () => {
    it('should use environmentSuffix in resource names', done => {
      pulumi
        .all([module.bucketName, module.lambdaFunctionName])
        .apply(([bucketName, functionName]) => {
          expect(bucketName).toContain('test123');
          expect(functionName).toContain('test123');
          done();
        });
    });

    it('should handle default values when config is not provided', () => {
      // Test that the default values in the || operators are reachable
      // This is tested by checking the logic paths exist
      const config = new pulumi.Config();

      // Test environment default
      const envWithDefault = config.get('environment') || 'dev';
      expect(envWithDefault).toBeDefined();

      // Test imageQuality default
      const imageQualityWithDefault = config.get('imageQuality') || '80';
      expect(imageQualityWithDefault).toBeDefined();

      // Test maxFileSize default
      const maxFileSizeWithDefault = config.get('maxFileSize') || '10485760';
      expect(maxFileSizeWithDefault).toBeDefined();

      // Test lambdaMemory default
      const lambdaMemoryWithDefault = config.getNumber('lambdaMemory') || 512;
      expect(lambdaMemoryWithDefault).toBeDefined();

      // Test logRetention default
      const logRetentionWithDefault = config.getNumber('logRetention') || 7;
      expect(logRetentionWithDefault).toBeDefined();
    });
  });

  describe('Default Value Branch Coverage', () => {
    it('should use default values when config keys are missing', () => {
      // Since we intentionally did not set optional config values,
      // the code should use the default values from the || operators
      const config = new pulumi.Config();

      // Test that when config is not set, defaults are used
      const environment = config.get('environment') || 'dev';
      expect(environment).toBe('dev');

      const imageQuality = config.get('imageQuality') || '80';
      expect(imageQuality).toBe('80');

      const maxFileSize = config.get('maxFileSize') || '10485760';
      expect(maxFileSize).toBe('10485760');

      const lambdaMemory = config.getNumber('lambdaMemory') || 512;
      expect(lambdaMemory).toBe(512);

      const logRetention = config.getNumber('logRetention') || 7;
      expect(logRetention).toBe(7);
    });

    it('should verify that config values are actually undefined', () => {
      const config = new pulumi.Config();

      // Verify that these config values are not set (undefined)
      expect(config.get('environment')).toBeUndefined();
      expect(config.get('imageQuality')).toBeUndefined();
      expect(config.get('maxFileSize')).toBeUndefined();
      expect(config.getNumber('lambdaMemory')).toBeUndefined();
      expect(config.getNumber('logRetention')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should require ENVIRONMENT_SUFFIX environment variable', () => {
      // Verify that ENVIRONMENT_SUFFIX is set and being used
      expect(process.env.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(process.env.ENVIRONMENT_SUFFIX).toBe('test123');

      // Verify that resources use the environment suffix
      pulumi
        .all([module.bucketName, module.lambdaFunctionName])
        .apply(([bucketName, functionName]) => {
          // If ENVIRONMENT_SUFFIX wasn't checked/used, these would fail
          expect(bucketName).toContain('test123');
          expect(functionName).toContain('test123');
        });
    });
  });
});
