import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs) {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Structure', () => {
  let stack: TapStack;

  describe('with props', () => {
    beforeAll(() => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Owner: 'test-team',
        },
      };
      stack = new TapStack('TestTapStackWithProps', args);
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has websiteUrl output', () => {
      expect(stack.websiteUrl).toBeDefined();
    });

    it('has cloudfrontDomain output', () => {
      expect(stack.cloudfrontDomain).toBeDefined();
    });

    it('has s3BucketName output', () => {
      expect(stack.s3BucketName).toBeDefined();
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      const args: TapStackArgs = {};
      stack = new TapStack('TestTapStackDefault', args);
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has websiteUrl output', () => {
      expect(stack.websiteUrl).toBeDefined();
    });

    it('has cloudfrontDomain output', () => {
      expect(stack.cloudfrontDomain).toBeDefined();
    });

    it('has s3BucketName output', () => {
      expect(stack.s3BucketName).toBeDefined();
    });
  });
});
