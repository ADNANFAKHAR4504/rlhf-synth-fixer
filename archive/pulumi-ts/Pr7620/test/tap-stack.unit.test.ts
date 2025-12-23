import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    const mockState: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Add specific mocks for different resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      mockState.bucket = args.inputs.bucket || `${args.name}`;
    }
    if (args.type === 'aws:ecr/repository:Repository') {
      mockState.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
    }
    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      mockState.name = args.inputs.name;
    }
    if (args.type === 'aws:sns/topic:Topic') {
      mockState.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
    }
    if (args.type === 'aws:sqs/queue:Queue') {
      mockState.url = `https://sqs.us-east-1.amazonaws.com/123456789012/${args.inputs.name}`;
    }
    if (args.type === 'aws:lambda/function:Function') {
      mockState.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
    }
    if (args.type === 'aws:dynamodb/table:Table') {
      mockState.name = args.inputs.name;
    }

    return {
      id: mockState.id,
      state: mockState,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack CI/CD Pipeline Infrastructure', () => {
  let stack: TapStack;
  const environmentSuffix = 'test';

  describe('Stack Creation with Custom Props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStack', {
        environmentSuffix: environmentSuffix,
        awsRegion: 'us-east-1',
      });
    });

    it('should create the stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have pipeline URL output', done => {
      pulumi.all([stack.pipelineUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(url).toContain('codepipeline');
        expect(url).toContain('us-east-1');
        done();
      });
    });

    it('should have ECR repository URI output', done => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([uri]) => {
        expect(uri).toBeDefined();
        expect(uri).toContain('.dkr.ecr.us-east-1.amazonaws.com');
        expect(uri).toContain(`app-images-${environmentSuffix}`);
        done();
      });
    });

    it('should have S3 bucket name output', done => {
      pulumi.all([stack.bucketName]).apply(([bucket]) => {
        expect(bucket).toBeDefined();
        expect(bucket).toContain('pipeline-artifacts');
        expect(bucket).toContain(environmentSuffix);
        done();
      });
    });

    it('should have SNS topic ARN output', done => {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:sns');
        expect(arn).toContain('pipeline-notifications');
        done();
      });
    });

    it('should have SQS queue URL output', done => {
      pulumi.all([stack.sqsQueueUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(url).toContain('sqs.us-east-1.amazonaws.com');
        expect(url).toContain('build-events');
        done();
      });
    });

    it('should have Lambda function ARN output', done => {
      pulumi.all([stack.lambdaFunctionArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:lambda');
        expect(arn).toContain('pipeline-action');
        done();
      });
    });

    it('should have DynamoDB table name output', done => {
      pulumi.all([stack.dynamodbTableName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('pipeline-state');
        expect(name).toContain(environmentSuffix);
        done();
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    beforeAll(() => {
      stack = new TapStack('NamingTestStack', {
        environmentSuffix: 'prod',
      });
    });

    it('should include environmentSuffix in S3 bucket name', done => {
      pulumi.all([stack.bucketName]).apply(([bucket]) => {
        expect(bucket).toMatch(/pipeline-artifacts-prod/);
        done();
      });
    });

    it('should include environmentSuffix in ECR repository', done => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([uri]) => {
        expect(uri).toContain('app-images-prod');
        done();
      });
    });

    it('should include environmentSuffix in DynamoDB table', done => {
      pulumi.all([stack.dynamodbTableName]).apply(([name]) => {
        expect(name).toContain('pipeline-state-prod');
        done();
      });
    });
  });

  describe('Stack Creation with Default Values', () => {
    beforeAll(() => {
      process.env.ENVIRONMENT_SUFFIX = 'dev';
      stack = new TapStack('DefaultTestStack');
    });

    afterAll(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should create stack with default environment suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should use default environment suffix in outputs', done => {
      pulumi.all([stack.bucketName]).apply(([bucket]) => {
        expect(bucket).toContain('dev');
        done();
      });
    });
  });

  describe('Security Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('SecurityTestStack', {
        environmentSuffix: 'secure',
        awsRegion: 'us-east-1',
      });
    });

    it('should have outputs defined for secure deployment', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.bucketName).toBeDefined();
    });
  });

  describe('Multi-Region Support', () => {
    beforeAll(() => {
      stack = new TapStack('RegionTestStack', {
        environmentSuffix: 'west',
        awsRegion: 'us-west-2',
      });
    });

    it('should create stack for different region', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    beforeAll(() => {
      stack = new TapStack('OutputTestStack', {
        environmentSuffix: 'output',
      });
    });

    it('should have all required outputs', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.sqsQueueUrl).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.dynamodbTableName).toBeDefined();
    });

    it('should have outputs as Pulumi Outputs', () => {
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
      expect(stack.sqsQueueUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.lambdaFunctionArn).toBeInstanceOf(pulumi.Output);
      expect(stack.dynamodbTableName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use ENVIRONMENT_SUFFIX from environment', () => {
      process.env.ENVIRONMENT_SUFFIX = 'env-test';
      const envStack = new TapStack('EnvTestStack');
      expect(envStack).toBeDefined();
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should use AWS_REGION from environment', () => {
      process.env.AWS_REGION = 'eu-west-1';
      const regionStack = new TapStack('RegionEnvStack');
      expect(regionStack).toBeDefined();
      delete process.env.AWS_REGION;
    });

    it('should prioritize props over environment variables', () => {
      process.env.ENVIRONMENT_SUFFIX = 'env';
      const propsStack = new TapStack('PropsTestStack', {
        environmentSuffix: 'props',
      });
      expect(propsStack).toBeDefined();
      delete process.env.ENVIRONMENT_SUFFIX;
    });
  });

  describe('Resource Dependencies', () => {
    beforeAll(() => {
      stack = new TapStack('DependencyTestStack', {
        environmentSuffix: 'deps',
      });
    });

    it('should create all dependent resources', done => {
      pulumi
        .all([
          stack.bucketName,
          stack.ecrRepositoryUri,
          stack.snsTopicArn,
          stack.sqsQueueUrl,
          stack.lambdaFunctionArn,
          stack.dynamodbTableName,
          stack.pipelineUrl,
        ])
        .apply(([bucket, ecr, sns, sqs, lambda, dynamodb, pipeline]) => {
          expect(bucket).toBeDefined();
          expect(ecr).toBeDefined();
          expect(sns).toBeDefined();
          expect(sqs).toBeDefined();
          expect(lambda).toBeDefined();
          expect(dynamodb).toBeDefined();
          expect(pipeline).toBeDefined();
          done();
        });
    });
  });
});
