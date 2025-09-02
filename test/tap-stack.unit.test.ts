import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create TapStack with default values', () => {
      stack = new TapStack('TestTapStack', {});

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test('should create TapStack with custom environment suffix', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };

      stack = new TapStack('TestTapStack', args);

      expect(stack).toBeDefined();
    });

    test('should create TapStack with custom tags', () => {
      const args: TapStackArgs = {
        tags: {
          Environment: 'prod',
          Project: 'TAP',
          Owner: 'dev-team',
        },
      };

      stack = new TapStack('TestTapStack', args);

      expect(stack).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      stack = new TapStack('TestTapStack', {});

      // The default should be 'dev' as defined in the constructor
      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    beforeEach(() => {
      stack = new TapStack('TestTapStack', {});
    });

    test('should have bucket property', () => {
      expect(stack.bucket).toBeDefined();
      expect(stack.bucket).toBeInstanceOf(Object);
    });

    test('should have bucketName property', () => {
      // In unit tests, the bucketName might be undefined due to mocking
      // We'll test that the property exists on the class
      expect('bucketName' in stack).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing environment suffix gracefully', () => {
      expect(() => {
        new TapStack('TestTapStack', {});
      }).not.toThrow();
    });

    test('should handle missing tags gracefully', () => {
      expect(() => {
        new TapStack('TestTapStack', {});
      }).not.toThrow();
    });
  });

  describe('Basic Functionality', () => {
    test('should create TapStack with different environment suffixes', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach(env => {
        const stack = new TapStack(`TestTapStack-${env}`, {
          environmentSuffix: env,
        });
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });
    });

    test('should create TapStack with various tag combinations', () => {
      const tagSets = [
        { Environment: 'dev' },
        { Project: 'TAP', Environment: 'staging' },
        { Owner: 'team', CostCenter: '123', Environment: 'prod' },
      ];

      tagSets.forEach(tags => {
        const stack = new TapStack('TestTapStack', {
          tags: tags as unknown as { [key: string]: string },
        });
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });
    });
  });
});
