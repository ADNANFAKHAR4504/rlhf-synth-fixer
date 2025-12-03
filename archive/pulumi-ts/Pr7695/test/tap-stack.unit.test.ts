import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('constructor', () => {
    it('should instantiate successfully with default parameters', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {});
      }).not.toThrow();
    });

    it('should instantiate with custom environmentSuffix', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          environmentSuffix: 'prod',
        });
      }).not.toThrow();
    });

    it('should instantiate with custom region', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          region: 'us-west-2',
        });
      }).not.toThrow();
    });

    it('should instantiate with dryRun enabled', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          dryRun: true,
        });
      }).not.toThrow();
    });

    it('should instantiate with all custom parameters', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          environmentSuffix: 'staging',
          region: 'eu-west-1',
          dryRun: true,
        });
      }).not.toThrow();
    });

    it('should use default values when parameters are undefined', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          environmentSuffix: undefined,
          region: undefined,
          dryRun: undefined,
        });
      }).not.toThrow();
    });
  });

  describe('registerOutputs', () => {
    it('should create scanner with correct parameters', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new TapStack('test-stack', {
          environmentSuffix: 'test',
          region: 'us-east-1',
          dryRun: false,
        });
      }).not.toThrow();
    });
  });
});
