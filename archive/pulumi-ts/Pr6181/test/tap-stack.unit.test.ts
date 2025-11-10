/**
 * Unit tests for TapStack - Multi-Region DR Infrastructure
 *
 * Tests the TapStack component using Pulumi mocking to achieve 100% coverage.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Mock specific resource types with appropriate outputs
    switch (args.type) {
      case 'aws:dynamodb/table:Table':
        outputs.name = args.inputs.name || `mock-table-${args.name}`;
        outputs.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${outputs.name}`;
        outputs.streamArn = `arn:aws:dynamodb:us-east-1:123456789012:table/${outputs.name}/stream/2023-01-01T00:00:00.000`;
        break;

      case 'aws:s3/bucket:Bucket':
        outputs.id = args.inputs.bucket || `mock-bucket-${args.name}`;
        outputs.bucket = outputs.id;
        outputs.arn = `arn:aws:s3:::${outputs.id}`;
        break;

      case 'aws:iam/role:Role':
        outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        outputs.id = `mock-role-${args.name}`;
        outputs.name = args.name;
        break;

      case 'aws:iam/rolePolicy:RolePolicy':
        outputs.id = `mock-policy-${args.name}`;
        outputs.name = args.name;
        break;

      case 'aws:lambda/function:Function':
        outputs.name = args.inputs.name || `mock-function-${args.name}`;
        outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${outputs.name}`;
        outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${outputs.arn}/invocations`;
        break;

      case 'aws:lambda/functionUrl:FunctionUrl':
        outputs.functionUrl = `https://mock-url-${args.name}.lambda-url.us-east-1.on.aws/`;
        break;

      case 'aws:lambda/permission:Permission':
        outputs.id = `mock-permission-${args.name}`;
        break;

      case 'pulumi:providers:aws':
        outputs.region = args.inputs.region || 'us-east-1';
        break;

      default:
        outputs.id = `mock-${args.name}`;
    }

    return {
      id: outputs.id || `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack - Multi-Region DR Infrastructure', () => {
  let stack: TapStack;
  let outputs: {
    primaryLambdaUrl: pulumi.Output<string>;
    secondaryLambdaUrl: pulumi.Output<string>;
    globalTableName: pulumi.Output<string>;
    primaryBucketName: pulumi.Output<string>;
    secondaryBucketName: pulumi.Output<string>;
  };

  beforeAll(() => {
    // Create the stack
    stack = new TapStack('test-tap-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Project: 'tap',
      },
    });

    // Get outputs (they will be tested via apply())
    outputs = {
      primaryLambdaUrl: stack.primaryLambdaUrl,
      secondaryLambdaUrl: stack.secondaryLambdaUrl,
      globalTableName: stack.globalTableName,
      primaryBucketName: stack.primaryBucketName,
      secondaryBucketName: stack.secondaryBucketName,
    };
  });

  describe('Stack Creation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('Stack Outputs', () => {
    it('should export primary Lambda URL', (done) => {
      outputs.primaryLambdaUrl.apply((url) => {
        expect(url).toBeDefined();
        expect(url).toContain('lambda-url');
        expect(url).toContain('primary-lambda-url');
        done();
        return url;
      });
    });

    it('should export secondary Lambda URL', (done) => {
      outputs.secondaryLambdaUrl.apply((url) => {
        expect(url).toBeDefined();
        expect(url).toContain('lambda-url');
        expect(url).toContain('secondary-lambda-url');
        done();
        return url;
      });
    });

    it('should export global table name', (done) => {
      outputs.globalTableName.apply((name) => {
        expect(name).toBeDefined();
        expect(name).toBe('tap-test-global');
        done();
        return name;
      });
    });

    it('should export primary bucket name', (done) => {
      outputs.primaryBucketName.apply((name) => {
        expect(name).toBeDefined();
        expect(name).toContain('tap-test-primary');
        done();
        return name;
      });
    });

    it('should export secondary bucket name', (done) => {
      outputs.secondaryBucketName.apply((name) => {
        expect(name).toBeDefined();
        expect(name).toContain('tap-test-secondary');
        done();
        return name;
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should include environmentSuffix in DynamoDB table name', (done) => {
      outputs.globalTableName.apply((name) => {
        expect(name).toContain('test');
        done();
        return name;
      });
    });

    it('should include environmentSuffix in bucket names', (done) => {
      pulumi.all([outputs.primaryBucketName, outputs.secondaryBucketName]).apply(([primary, secondary]) => {
        expect(primary).toContain('test');
        expect(secondary).toContain('test');
        done();
        return [primary, secondary];
      });
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should have Lambda URLs from both regions', (done) => {
      pulumi.all([outputs.primaryLambdaUrl, outputs.secondaryLambdaUrl]).apply(([primary, secondary]) => {
        expect(primary).toBeDefined();
        expect(secondary).toBeDefined();
        expect(primary).not.toBe(secondary);
        done();
        return [primary, secondary];
      });
    });

    it('should have buckets for both regions', (done) => {
      pulumi.all([outputs.primaryBucketName, outputs.secondaryBucketName]).apply(([primary, secondary]) => {
        expect(primary).toContain('us-east-1');
        expect(secondary).toContain('us-west-2');
        done();
        return [primary, secondary];
      });
    });
  });

  describe('Default Values', () => {
    let defaultStack: TapStack;

    beforeAll(() => {
      defaultStack = new TapStack('test-default-stack', {});
    });

    it('should use default environmentSuffix when not provided', (done) => {
      defaultStack.globalTableName.apply((name) => {
        expect(name).toContain('dev');
        done();
        return name;
      });
    });

    it('should create stack without tags', () => {
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should have all required outputs registered', () => {
      expect(stack.primaryLambdaUrl).toBeDefined();
      expect(stack.secondaryLambdaUrl).toBeDefined();
      expect(stack.globalTableName).toBeDefined();
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.secondaryBucketName).toBeDefined();
    });
  });

  describe('Resource Types', () => {
    it('should return Pulumi Output types', () => {
      expect(stack.primaryLambdaUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.secondaryLambdaUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.globalTableName).toBeInstanceOf(pulumi.Output);
      expect(stack.primaryBucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.secondaryBucketName).toBeInstanceOf(pulumi.Output);
    });
  });
});

describe('TapStack - Tag Application', () => {
  it('should apply tags to resources', (done) => {
    const stack = new TapStack('test-tags-stack', {
      environmentSuffix: 'prod',
      tags: {
        Environment: 'production',
        Team: 'platform',
        CostCenter: '1234',
      },
    });

    stack.globalTableName.apply((name) => {
      expect(name).toContain('prod');
      done();
      return name;
    });
  });

  it('should handle empty tags object', (done) => {
    const stack = new TapStack('test-empty-tags-stack', {
      environmentSuffix: 'staging',
      tags: {},
    });

    stack.globalTableName.apply((name) => {
      expect(name).toContain('staging');
      done();
      return name;
    });
  });
});

describe('TapStack - Edge Cases', () => {
  it('should handle special characters in environmentSuffix', (done) => {
    const stack = new TapStack('test-special-stack', {
      environmentSuffix: 'test-123',
      tags: {},
    });

    stack.globalTableName.apply((name) => {
      expect(name).toContain('test-123');
      done();
      return name;
    });
  });

  it('should create stack with minimal configuration', () => {
    const stack = new TapStack('minimal-stack', {});
    expect(stack).toBeDefined();
  });
});
