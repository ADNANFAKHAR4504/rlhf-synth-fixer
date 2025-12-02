import { ReportGenerator, ReportFormat } from '../lib/report-generator';
import {
  ComplianceReport,
  ResourceInventory,
  ComplianceStatus,
  ViolationSeverity,
  ResourceType,
} from '../lib/types';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  let mockComplianceReport: ComplianceReport;
  let mockInventory: ResourceInventory;

  beforeEach(() => {
    generator = new ReportGenerator();

    // Mock compliance report
    mockComplianceReport = {
      reportId: 'test-report-123',
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      totalResources: 10,
      compliantResources: 7,
      nonCompliantResources: 3,
      complianceScore: 70,
      resourcesByType: {
        [ResourceType.S3_BUCKET]: 5,
        [ResourceType.EC2_INSTANCE]: 5,
      },
      violationsBySeverity: {
        [ViolationSeverity.CRITICAL]: 1,
        [ViolationSeverity.HIGH]: 2,
        [ViolationSeverity.MEDIUM]: 3,
        [ViolationSeverity.LOW]: 1,
        [ViolationSeverity.INFO]: 0,
      },
      results: [
        {
          resourceId: 'bucket-1',
          resourceArn: 'arn:aws:s3:::bucket-1',
          resourceType: ResourceType.S3_BUCKET,
          status: ComplianceStatus.NON_COMPLIANT,
          violations: [
            {
              resourceId: 'bucket-1',
              resourceArn: 'arn:aws:s3:::bucket-1',
              resourceType: ResourceType.S3_BUCKET,
              rule: 'S3_ENCRYPTION',
              severity: ViolationSeverity.CRITICAL,
              description: 'S3 bucket must have encryption',
              recommendation: 'Enable encryption',
              detectedAt: new Date('2025-01-01T00:00:00Z'),
            },
          ],
          checkedAt: new Date('2025-01-01T00:00:00Z'),
        },
      ],
      summary: {
        criticalViolations: 1,
        highViolations: 2,
        mediumViolations: 3,
        lowViolations: 1,
      },
    };

    // Mock inventory
    mockInventory = {
      inventoryId: 'inv-123',
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      totalResources: 5,
      resourcesByRegion: {
        'us-east-1': 3,
        'us-west-2': 2,
      },
      resourcesByType: {
        [ResourceType.S3_BUCKET]: 3,
        [ResourceType.EC2_INSTANCE]: 2,
      },
      entries: [
        {
          resource: {
            id: 'bucket-1',
            arn: 'arn:aws:s3:::bucket-1',
            type: ResourceType.S3_BUCKET,
            region: 'us-east-1',
            tags: { Environment: 'dev' },
          },
          ageInDays: 30,
          isOrphaned: false,
          complianceStatus: ComplianceStatus.COMPLIANT,
        },
        {
          resource: {
            id: 'bucket-2',
            arn: 'arn:aws:s3:::bucket-2',
            type: ResourceType.S3_BUCKET,
            region: 'us-east-1',
            tags: {},
          },
          ageInDays: 200,
          isOrphaned: true,
          complianceStatus: ComplianceStatus.NON_COMPLIANT,
        },
      ],
    };
  });

  describe('generateComplianceReport', () => {
    it('should generate JSON report', () => {
      const report = generator.generateComplianceReport(
        mockComplianceReport,
        ReportFormat.JSON
      );

      expect(report).toBeTruthy();
      const parsed = JSON.parse(report);
      expect(parsed.reportId).toBe('test-report-123');
      expect(parsed.totalResources).toBe(10);
      expect(parsed.complianceScore).toBe(70);
    });

    it('should generate TEXT report', () => {
      const report = generator.generateComplianceReport(
        mockComplianceReport,
        ReportFormat.TEXT
      );

      expect(report).toBeTruthy();
      expect(report).toContain('COMPLIANCE REPORT');
      expect(report).toContain('test-report-123');
      expect(report).toContain('Total Resources: 10');
      expect(report).toContain('Compliance Score: 70.00%');
      expect(report).toContain('Critical: 1');
    });

    it('should generate HTML report', () => {
      const report = generator.generateComplianceReport(
        mockComplianceReport,
        ReportFormat.HTML
      );

      expect(report).toBeTruthy();
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('Compliance Report');
      expect(report).toContain('test-report-123');
      expect(report).toContain('70.0%');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        generator.generateComplianceReport(
          mockComplianceReport,
          'INVALID' as ReportFormat
        );
      }).toThrow('Unsupported format');
    });
  });

  describe('generateInventoryReport', () => {
    it('should generate JSON inventory', () => {
      const report = generator.generateInventoryReport(
        mockInventory,
        ReportFormat.JSON
      );

      expect(report).toBeTruthy();
      const parsed = JSON.parse(report);
      expect(parsed.inventoryId).toBe('inv-123');
      expect(parsed.totalResources).toBe(5);
    });

    it('should generate TEXT inventory', () => {
      const report = generator.generateInventoryReport(
        mockInventory,
        ReportFormat.TEXT
      );

      expect(report).toBeTruthy();
      expect(report).toContain('RESOURCE INVENTORY');
      expect(report).toContain('inv-123');
      expect(report).toContain('Total Resources: 5');
      expect(report).toContain('ORPHANED RESOURCES');
    });

    it('should generate HTML inventory', () => {
      const report = generator.generateInventoryReport(
        mockInventory,
        ReportFormat.HTML
      );

      expect(report).toBeTruthy();
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('Resource Inventory');
      expect(report).toContain('inv-123');
    });
  });

  describe('generateExecutiveSummary', () => {
    it('should generate executive summary', () => {
      const summary = generator.generateExecutiveSummary(mockComplianceReport);

      expect(summary).toBeTruthy();
      expect(summary).toContain('EXECUTIVE SUMMARY');
      expect(summary).toContain('Compliance Score: 70.00%');
      expect(summary).toContain('Total Resources Scanned: 10');
      expect(summary).toContain('1 CRITICAL violations');
    });

    it('should show all resources compliant message', () => {
      const compliantReport = {
        ...mockComplianceReport,
        nonCompliantResources: 0,
        summary: {
          criticalViolations: 0,
          highViolations: 0,
          mediumViolations: 0,
          lowViolations: 0,
        },
      };

      const summary = generator.generateExecutiveSummary(compliantReport);
      expect(summary).toContain('All resources are compliant!');
    });
  });
});
