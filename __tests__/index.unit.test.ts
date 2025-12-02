import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing index
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = { ...args.inputs };

    // Set specific mock outputs based on resource type
    if (args.type === 'aws:s3/bucketV2:BucketV2') {
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

// Set required config before importing index
// Note: Use "project:" prefix for global config values
pulumi.runtime.setConfig('project:environmentSuffix', 'test123');
pulumi.runtime.setConfig('project:environment', 'dev');
pulumi.runtime.setConfig('project:imageQuality', '80');
pulumi.runtime.setConfig('project:maxFileSize', '10485760');
pulumi.runtime.setConfig('project:lambdaMemory', '512');
pulumi.runtime.setConfig('project:logRetention', '7');
pulumi.runtime.setConfig('project:reservedConcurrency', '5');

describe('Image Processor Infrastructure Tests', () => {
  let module: any;

  beforeAll(async () => {
    // Import the index module
    module = require('../index');
  });

  describe('Exports', () => {
    it('should export bucketName', (done) => {
      pulumi.all([module.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(bucketName).toContain('test123');
        done();
      });
    });

    it('should export bucketArn', (done) => {
      pulumi.all([module.bucketArn]).apply(([bucketArn]) => {
        expect(bucketArn).toBeDefined();
        expect(bucketArn).toContain('arn:aws:s3:::');
        done();
      });
    });

    it('should export lambdaFunctionName', (done) => {
      pulumi.all([module.lambdaFunctionName]).apply(([functionName]) => {
        expect(functionName).toBeDefined();
        expect(functionName).toContain('test123');
        done();
      });
    });

    it('should export lambdaFunctionArn', (done) => {
      pulumi.all([module.lambdaFunctionArn]).apply(([functionArn]) => {
        expect(functionArn).toBeDefined();
        expect(functionArn).toContain('arn:aws:lambda:');
        done();
      });
    });

    it('should export logGroupName', (done) => {
      pulumi.all([module.logGroupName]).apply(([logGroupName]) => {
        expect(logGroupName).toBeDefined();
        expect(logGroupName).toContain('/aws/lambda/');
        done();
      });
    });

    it('should export lambdaRoleArn', (done) => {
      pulumi.all([module.lambdaRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        expect(roleArn).toContain('arn:aws:iam::');
        done();
      });
    });
  });

  describe('Configuration Tests', () => {
    it('should use environmentSuffix in resource names', (done) => {
      pulumi.all([module.bucketName, module.lambdaFunctionName]).apply(
        ([bucketName, functionName]) => {
          expect(bucketName).toContain('test123');
          expect(functionName).toContain('test123');
          done();
        }
      );
    });
  });
});
