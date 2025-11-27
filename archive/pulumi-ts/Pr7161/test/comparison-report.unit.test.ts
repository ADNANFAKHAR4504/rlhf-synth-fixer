import * as fs from 'fs';
import * as path from 'path';
import { generateComparisonReport, compareEnvironments } from '../lib/utils/comparison-report';

describe('Comparison Report Utility', () => {
  const testOutputsDir = path.join(process.cwd(), 'test-outputs');

  beforeAll(() => {
    // Create test outputs directory
    if (!fs.existsSync(testOutputsDir)) {
      fs.mkdirSync(testOutputsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test outputs
    if (fs.existsSync(testOutputsDir)) {
      const files = fs.readdirSync(testOutputsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testOutputsDir, file));
      });
      fs.rmdirSync(testOutputsDir);
    }

    // Clean up root-level reports
    const rootFiles = fs.readdirSync(process.cwd());
    rootFiles.forEach(file => {
      if (file.startsWith('comparison-report-') && file.endsWith('.json')) {
        fs.unlinkSync(path.join(process.cwd(), file));
      }
    });
  });

  describe('generateComparisonReport', () => {
    const mockOutputs = {
      vpcId: 'vpc-12345',
      clusterArn: 'arn:aws:ecs:us-east-1:123456789012:cluster/dev-cluster',
      albDns: 'alb-123.us-east-1.elb.amazonaws.com',
      dbEndpoint: 'db.cluster.us-east-1.rds.amazonaws.com',
      dbInstanceClass: 'db.r5.large',
      ecrUrl: '123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-processor',
    };

    it('should generate comparison report file', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('dev', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        expect(fs.existsSync(reportPath)).toBe(true);
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should include environment name in report', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('staging', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-staging.json');
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        expect(report.environment).toBe('staging');
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should include timestamp in report', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('prod', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-prod.json');
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        expect(report.timestamp).toBeDefined();
        expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should include configuration in report', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('dev', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        expect(report.configuration).toBeDefined();
        expect(report.configuration.vpcId).toBe('vpc-12345');
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should include all infrastructure outputs', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('dev', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        expect(report.configuration.vpcId).toBeDefined();
        expect(report.configuration.clusterArn).toBeDefined();
        expect(report.configuration.albDnsName).toBeDefined();
        expect(report.configuration.dbEndpoint).toBeDefined();
        expect(report.configuration.dbInstanceClass).toBeDefined();
        expect(report.configuration.ecrRepositoryUrl).toBeDefined();
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should include metadata', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('dev', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        expect(report.metadata).toBeDefined();
        expect(report.metadata.generatedBy).toBe('pulumi-payment-infrastructure');
        expect(report.metadata.version).toBe('1.0.0');
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });

    it('should create valid JSON file', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);
        generateComparisonReport('dev', mockOutputs);
        const reportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        const content = fs.readFileSync(reportPath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });
  });

  describe('compareEnvironments', () => {
    const devReport = {
      env: 'dev',
      data: {
        configuration: {
          vpcId: 'vpc-dev',
          clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/dev',
          albDnsName: 'alb-dev.elb.amazonaws.com',
          dbEndpoint: 'db-dev.rds.amazonaws.com',
          dbInstanceClass: 'db.t3.medium',
          ecrRepositoryUrl: '123.dkr.ecr.us-east-1.amazonaws.com/repo',
        },
      },
    };

    const stagingReport = {
      env: 'staging',
      data: {
        configuration: {
          vpcId: 'vpc-staging',
          clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/staging',
          albDnsName: 'alb-staging.elb.amazonaws.com',
          dbEndpoint: 'db-staging.rds.amazonaws.com',
          dbInstanceClass: 'db.r5.large',
          ecrRepositoryUrl: '123.dkr.ecr.us-east-1.amazonaws.com/repo',
        },
      },
    };

    const prodReport = {
      env: 'prod',
      data: {
        configuration: {
          vpcId: 'vpc-prod',
          clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/prod',
          albDnsName: 'alb-prod.elb.amazonaws.com',
          dbEndpoint: 'db-prod.rds.amazonaws.com',
          dbInstanceClass: 'db.r5.xlarge',
          ecrRepositoryUrl: '123.dkr.ecr.us-east-1.amazonaws.com/repo',
        },
      },
    };

    it('should compare multiple environments', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      expect(comparison).toBeDefined();
      expect(comparison.environments).toHaveLength(3);
    });

    it('should include timestamp', () => {
      const comparison = compareEnvironments([devReport, stagingReport]);
      expect(comparison.timestamp).toBeDefined();
      expect(new Date(comparison.timestamp).toISOString()).toBe(comparison.timestamp);
    });

    it('should list all environment names', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      expect(comparison.environments).toEqual(['dev', 'staging', 'prod']);
    });

    it('should compare database instance classes', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      expect(comparison.differences.dbInstanceClass).toBeDefined();
      expect(comparison.differences.dbInstanceClass).toHaveLength(3);
      expect(comparison.differences.dbInstanceClass[0].class).toBe('db.t3.medium');
      expect(comparison.differences.dbInstanceClass[1].class).toBe('db.r5.large');
      expect(comparison.differences.dbInstanceClass[2].class).toBe('db.r5.xlarge');
    });

    it('should compare VPC IDs', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      expect(comparison.differences.vpcIds).toBeDefined();
      expect(comparison.differences.vpcIds).toHaveLength(3);
    });

    it('should compare ECR repository URLs', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      expect(comparison.differences.ecrRepositoryUrls).toBeDefined();
      expect(comparison.differences.ecrRepositoryUrls).toHaveLength(3);
    });

    it('should handle single environment', () => {
      const comparison = compareEnvironments([devReport]);
      expect(comparison.environments).toHaveLength(1);
      expect(comparison.differences.dbInstanceClass).toHaveLength(1);
    });

    it('should handle two environments', () => {
      const comparison = compareEnvironments([devReport, stagingReport]);
      expect(comparison.environments).toHaveLength(2);
      expect(comparison.differences.dbInstanceClass).toHaveLength(2);
    });

    it('should identify shared ECR repositories', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      const ecrUrls = comparison.differences.ecrRepositoryUrls.map(e => e.url);
      expect(ecrUrls[0]).toBe(ecrUrls[1]);
      expect(ecrUrls[1]).toBe(ecrUrls[2]);
    });

    it('should identify unique VPCs per environment', () => {
      const comparison = compareEnvironments([devReport, stagingReport, prodReport]);
      const vpcIds = comparison.differences.vpcIds.map(v => v.vpcId);
      expect(new Set(vpcIds).size).toBe(3);
    });

    it('should preserve environment associations', () => {
      const comparison = compareEnvironments([devReport, stagingReport]);
      expect(comparison.differences.dbInstanceClass[0].env).toBe('dev');
      expect(comparison.differences.dbInstanceClass[1].env).toBe('staging');
    });
  });

  describe('Integration', () => {
    it('should generate and compare reports', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(testOutputsDir);

        const devOutputs = {
          vpcId: 'vpc-dev',
          clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/dev',
          albDns: 'alb-dev.elb.amazonaws.com',
          dbEndpoint: 'db-dev.rds.amazonaws.com',
          dbInstanceClass: 'db.t3.medium',
          ecrUrl: '123.dkr.ecr.us-east-1.amazonaws.com/repo',
        };

        const stagingOutputs = {
          vpcId: 'vpc-staging',
          clusterArn: 'arn:aws:ecs:us-east-1:123:cluster/staging',
          albDns: 'alb-staging.elb.amazonaws.com',
          dbEndpoint: 'db-staging.rds.amazonaws.com',
          dbInstanceClass: 'db.r5.large',
          ecrUrl: '123.dkr.ecr.us-east-1.amazonaws.com/repo',
        };

        generateComparisonReport('dev', devOutputs);
        generateComparisonReport('staging', stagingOutputs);

        const devReportPath = path.join(testOutputsDir, 'comparison-report-dev.json');
        const stagingReportPath = path.join(testOutputsDir, 'comparison-report-staging.json');

        expect(fs.existsSync(devReportPath)).toBe(true);
        expect(fs.existsSync(stagingReportPath)).toBe(true);

        const devReport = JSON.parse(fs.readFileSync(devReportPath, 'utf-8'));
        const stagingReport = JSON.parse(fs.readFileSync(stagingReportPath, 'utf-8'));

        const comparison = compareEnvironments([
          { env: 'dev', data: devReport },
          { env: 'staging', data: stagingReport },
        ]);

        expect(comparison.environments).toEqual(['dev', 'staging']);
        process.chdir(originalCwd);
      } catch (error) {
        process.chdir(originalCwd);
        throw error;
      }
    });
  });
});
