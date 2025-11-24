import * as pulumi from '@pulumi/pulumi';
import { DriftDetector } from '../lib/drift-detection';

// Mock Pulumi StackReference
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    StackReference: jest.fn().mockImplementation(() => {
      return {
        getOutputValue: jest.fn().mockResolvedValue({
          vpcId: 'vpc-mock',
          region: 'us-east-1',
        }),
      };
    }),
  };
});

describe('DriftDetector', () => {
  let detector: DriftDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    detector = new DriftDetector({
      environments: ['dev', 'staging', 'prod'],
      organizationName: 'test-org',
    });
  });

  describe('constructor', () => {
    it('should create a DriftDetector instance', () => {
      expect(detector).toBeInstanceOf(DriftDetector);
    });

    it('should store configuration', () => {
      expect(detector).toBeDefined();
    });
  });

  describe('detectDrift', () => {
    it('should return empty environments for empty config', async () => {
      const emptyDetector = new DriftDetector({
        environments: [],
        organizationName: 'test-org',
      });

      const report = await emptyDetector.detectDrift();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(typeof report.timestamp).toBe('string');
      expect(report.environments).toBeDefined();
      expect(typeof report.environments).toBe('object');
      expect(Object.keys(report.environments)).toHaveLength(0);
    });

    it('should fetch and populate environment data', async () => {
      const report = await detector.detectDrift();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.environments).toBeDefined();
      expect(Object.keys(report.environments)).toHaveLength(3);
      expect(report.environments.dev).toBeDefined();
      expect(report.environments.staging).toBeDefined();
      expect(report.environments.prod).toBeDefined();
    });
  });

  describe('generateComparisonReport', () => {
    it('should generate comparison report for multiple environments', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            vpcId: 'vpc-dev',
            region: 'us-east-1',
          },
          staging: {
            vpcId: 'vpc-staging',
            region: 'us-west-2',
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('# Infrastructure Comparison Report');
      expect(comparison).toContain('2025-11-24T10:00:00Z');
      expect(comparison).toContain('dev vs staging');
      expect(comparison).toContain('**vpcId**');
      expect(comparison).toContain('**region**');
    });

    it('should handle empty environments object', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {},
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('# Infrastructure Comparison Report');
      expect(comparison).toContain('2025-11-24T10:00:00Z');
    });

    it('should generate comparison for three environments', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            vpcId: 'vpc-dev',
          },
          staging: {
            vpcId: 'vpc-staging',
          },
          prod: {
            vpcId: 'vpc-prod',
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('dev vs staging');
      expect(comparison).toContain('staging vs prod');
    });

    it('should detect no differences when environments match', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            vpcId: 'vpc-123',
            region: 'us-east-1',
          },
          staging: {
            vpcId: 'vpc-123',
            region: 'us-east-1',
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('No differences detected');
    });

    it('should detect differences in nested objects', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            database: { host: 'db-dev', port: 5432 },
          },
          staging: {
            database: { host: 'db-staging', port: 3306 },
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('**database**');
    });

    it('should handle properties that exist in only one environment', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            vpcId: 'vpc-dev',
            enableFeatureX: true,
          },
          staging: {
            vpcId: 'vpc-staging',
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('**enableFeatureX**');
    });

    it('should handle single environment', () => {
      const report = {
        timestamp: '2025-11-24T10:00:00Z',
        environments: {
          dev: {
            vpcId: 'vpc-dev',
          },
        },
      };

      const comparison = detector.generateComparisonReport(report);

      expect(comparison).toContain('# Infrastructure Comparison Report');
      // Should not have any comparisons since there's only one environment
      expect(comparison).not.toContain('vs');
    });
  });
});
