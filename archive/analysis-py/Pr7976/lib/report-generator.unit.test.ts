import { ReportGenerator } from './report-generator';
import { AuditResult, Finding } from './auditor';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('ReportGenerator', () => {
  let reportGen: ReportGenerator;
  const mockOutputDir = '/test/reports';
  let mockAuditResult: AuditResult;

  beforeEach(() => {
    jest.clearAllMocks();
    reportGen = new ReportGenerator(mockOutputDir);

    mockAuditResult = {
      summary: {
        totalResources: 25,
        totalFindings: 12,
        complianceScore: 75,
        bySeverity: {
          critical: 2,
          high: 3,
          medium: 4,
          low: 3,
        },
        byService: {
          'EC2 Security': 5,
          'RDS Security': 4,
          'IAM Security': 3,
        },
      },
      findings: [
        {
          id: 'test-finding-1',
          resourceType: 'EC2 Instance',
          resourceName: 'test-instance',
          severity: 'Critical',
          category: 'EC2 Security',
          description: 'Critical security issue',
          remediation: 'Fix this immediately',
          remediationCode: 'const fix = true;',
          awsDocLink: 'https://docs.aws.amazon.com/ec2',
        },
        {
          id: 'test-finding-2',
          resourceType: 'RDS Instance',
          resourceName: 'test-db',
          severity: 'High',
          category: 'RDS Security',
          description: 'High priority issue',
          remediation: 'Fix this soon',
        },
        {
          id: 'test-finding-3',
          resourceType: 'IAM Role',
          resourceName: 'test-role',
          severity: 'Medium',
          category: 'IAM Security',
          description: 'Medium priority issue',
          remediation: 'Consider fixing',
        },
        {
          id: 'test-finding-4',
          resourceType: 'Security Group',
          resourceName: 'test-sg',
          severity: 'Low',
          category: 'Network Security',
          description: 'Low priority issue',
          remediation: 'Fix when possible',
        },
      ],
      timestamp: '2025-12-05T10:00:00.000Z',
      environment: 'test',
      region: 'us-east-1',
    };
  });

  describe('generateJsonReport', () => {
    it('should generate JSON report with correct structure', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.json';

      await reportGen.generateJsonReport(mockAuditResult, filePath);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(mockAuditResult, null, 2)
      );
    });

    it('should log success message', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const filePath = '/test/reports/audit.json';

      await reportGen.generateJsonReport(mockAuditResult, filePath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('JSON report saved')
      );
    });
  });

  describe('generateHtmlReport', () => {
    it('should generate HTML report', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>AWS Security Audit Report</title>');
    });

    it('should include environment and region information', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('test');
      expect(htmlContent).toContain('us-east-1');
    });

    it('should include summary metrics', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('25'); // totalResources
      expect(htmlContent).toContain('12'); // totalFindings
      expect(htmlContent).toContain('75'); // complianceScore
    });

    it('should include findings by severity', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('2'); // critical
      expect(htmlContent).toContain('3'); // high
      expect(htmlContent).toContain('4'); // medium
      expect(htmlContent).toContain('3'); // low
    });

    it('should include detailed findings', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('test-instance');
      expect(htmlContent).toContain('Critical security issue');
      expect(htmlContent).toContain('Fix this immediately');
    });

    it('should include remediation code when present', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('const fix = true;');
    });

    it('should include AWS documentation links when present', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('https://docs.aws.amazon.com/ec2');
    });

    it('should group findings by severity', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('Critical Severity');
      expect(htmlContent).toContain('High Severity');
      expect(htmlContent).toContain('Medium Severity');
      expect(htmlContent).toContain('Low Severity');
    });

    it('should include service breakdown', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('EC2 Security');
      expect(htmlContent).toContain('RDS Security');
      expect(htmlContent).toContain('IAM Security');
      expect(htmlContent).toContain('5 finding(s)');
      expect(htmlContent).toContain('4 finding(s)');
      expect(htmlContent).toContain('3 finding(s)');
    });

    it('should apply correct CSS classes for score', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('good'); // 75 is in "good" range
    });

    it('should handle excellent compliance score', async () => {
      const excellentResult = {
        ...mockAuditResult,
        summary: {
          ...mockAuditResult.summary,
          complianceScore: 95,
        },
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(excellentResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('excellent');
    });

    it('should handle fair compliance score', async () => {
      const fairResult = {
        ...mockAuditResult,
        summary: {
          ...mockAuditResult.summary,
          complianceScore: 60,
        },
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(fairResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('fair');
    });

    it('should handle poor compliance score', async () => {
      const poorResult = {
        ...mockAuditResult,
        summary: {
          ...mockAuditResult.summary,
          complianceScore: 30,
        },
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(poorResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('poor');
    });

    it('should escape HTML in remediation code', async () => {
      const resultWithHtml = {
        ...mockAuditResult,
        findings: [
          {
            id: 'test-html',
            resourceType: 'Test',
            resourceName: 'test',
            severity: 'Low' as const,
            category: 'Test',
            description: 'Test',
            remediation: 'Test',
            remediationCode: '<script>alert("xss")</script>',
          },
        ],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(resultWithHtml, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('&lt;script&gt;');
      expect(htmlContent).not.toContain('<script>alert');
    });

    it('should handle zero total findings for bar width calculation', async () => {
      const emptyResult = {
        ...mockAuditResult,
        summary: {
          ...mockAuditResult.summary,
          totalFindings: 0,
          bySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
        },
        findings: [],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(emptyResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('0%');
    });

    it('should skip severity sections with no findings', async () => {
      const partialResult = {
        ...mockAuditResult,
        findings: [
          {
            id: 'test-critical',
            resourceType: 'Test',
            resourceName: 'test',
            severity: 'Critical' as const,
            category: 'Test',
            description: 'Test',
            remediation: 'Test',
          },
        ],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(partialResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('Critical Severity');
      // Should not have sections for empty severities (they would show "0)" in the heading)
    });

    it('should handle findings without AWS doc links', async () => {
      const noLinkResult = {
        ...mockAuditResult,
        findings: [
          {
            id: 'test-no-link',
            resourceType: 'Test',
            resourceName: 'test',
            severity: 'Low' as const,
            category: 'Test',
            description: 'Test',
            remediation: 'Test',
          },
        ],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(noLinkResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toBeDefined();
      // Should not throw error
    });

    it('should handle findings without remediation code', async () => {
      const noCodeResult = {
        ...mockAuditResult,
        findings: [
          {
            id: 'test-no-code',
            resourceType: 'Test',
            resourceName: 'test',
            severity: 'Low' as const,
            category: 'Test',
            description: 'Test',
            remediation: 'Test',
          },
        ],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(noCodeResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toBeDefined();
      // Should not throw error
    });

    it('should include CSS styles', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('.container');
      expect(htmlContent).toContain('.metric');
      expect(htmlContent).toContain('.finding');
    });

    it('should calculate bar widths proportionally', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      // Should contain percentage widths
      expect(htmlContent).toMatch(/width:\s*\d+(\.\d+)?%/);
    });

    it('should handle special characters in descriptions', async () => {
      const specialCharsResult = {
        ...mockAuditResult,
        findings: [
          {
            id: 'test-special',
            resourceType: 'Test',
            resourceName: 'test&<>"',
            severity: 'Low' as const,
            category: 'Test',
            description: 'Test with & < > " characters',
            remediation: 'Test',
            remediationCode: 'const x = "&<>"',
          },
        ],
      };

      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(specialCharsResult, filePath);

      const htmlContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(htmlContent).toContain('&amp;');
      expect(htmlContent).toContain('&lt;');
      expect(htmlContent).toContain('&gt;');
      expect(htmlContent).toContain('&quot;');
    });

    it('should log success message', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const filePath = '/test/reports/audit.html';

      await reportGen.generateHtmlReport(mockAuditResult, filePath);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTML report saved')
      );
    });
  });

  describe('constructor', () => {
    it('should create ReportGenerator with output directory', () => {
      const generator = new ReportGenerator('/custom/path');
      expect(generator).toBeDefined();
    });
  });
});
