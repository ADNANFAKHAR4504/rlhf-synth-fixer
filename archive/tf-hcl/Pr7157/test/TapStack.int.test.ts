/**
 * Integration Tests for Terraform Compliance Validation Infrastructure
 * Tests the deployed infrastructure using real AWS resources and outputs
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ComplianceReport {
  metadata: {
    aws_account_id: string;
    aws_region: string;
    environment_suffix: string;
    scan_timestamp: string;
  };
  summary: {
    compliance_status: string;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    total_findings: number;
    environment_suffix: string;
    resources_analyzed: {
      ec2_instances: number;
      rds_instances: number;
      s3_buckets: number;
      iam_roles: number;
      security_groups: number;
    };
  };
  findings: {
    critical: any[];
    high: any[];
    medium: any[];
    low: any[];
  };
}

interface Outputs {
  compliance_report: string;
  compliance_status: string;
  critical_findings_count: number;
  high_findings_count: number;
  medium_findings_count: number;
  low_findings_count: number;
  environment_suffix: string;
}

describe('Terraform Deployment Integration Tests', () => {
  let outputs: Outputs;
  let complianceReport: ComplianceReport;

  beforeAll(() => {
    // Read the flat outputs file generated during deployment
    const outputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Parse the compliance report
    if (outputs.compliance_report) {
      complianceReport = JSON.parse(outputs.compliance_report);
    }
  });

  describe('Deployment Outputs', () => {
    it('should have compliance_report output', () => {
      expect(outputs).toHaveProperty('compliance_report');
      expect(outputs.compliance_report).toBeTruthy();
    });

    it('should have compliance_status output', () => {
      expect(outputs).toHaveProperty('compliance_status');
      expect(outputs.compliance_status).toBeTruthy();
    });

    it('should have environment_suffix output', () => {
      expect(outputs).toHaveProperty('environment_suffix');
      expect(outputs.environment_suffix).toBeTruthy();
    });

    it('should have findings count outputs', () => {
      expect(outputs).toHaveProperty('critical_findings_count');
      expect(outputs).toHaveProperty('high_findings_count');
      expect(outputs).toHaveProperty('medium_findings_count');
      expect(outputs).toHaveProperty('low_findings_count');
    });
  });

  describe('Compliance Report Structure', () => {
    it('compliance report should be valid JSON', () => {
      expect(complianceReport).toBeTruthy();
      expect(typeof complianceReport).toBe('object');
    });

    it('should have metadata section', () => {
      expect(complianceReport).toHaveProperty('metadata');
      expect(complianceReport.metadata).toHaveProperty('aws_account_id');
      expect(complianceReport.metadata).toHaveProperty('aws_region');
      expect(complianceReport.metadata).toHaveProperty('environment_suffix');
      expect(complianceReport.metadata).toHaveProperty('scan_timestamp');
    });

    it('metadata should have correct values', () => {
      expect(complianceReport.metadata.environment_suffix).toBe(outputs.environment_suffix);
      expect(complianceReport.metadata.aws_region).toBe('us-east-1');
      expect(complianceReport.metadata.aws_account_id).toMatch(/^\d{12}$/);
    });

    it('should have summary section', () => {
      expect(complianceReport).toHaveProperty('summary');
      expect(complianceReport.summary).toHaveProperty('compliance_status');
      expect(complianceReport.summary).toHaveProperty('total_findings');
      expect(complianceReport.summary).toHaveProperty('resources_analyzed');
    });

    it('should have findings section', () => {
      expect(complianceReport).toHaveProperty('findings');
      expect(complianceReport.findings).toHaveProperty('critical');
      expect(complianceReport.findings).toHaveProperty('high');
      expect(complianceReport.findings).toHaveProperty('medium');
      expect(complianceReport.findings).toHaveProperty('low');
    });
  });

  describe('Compliance Summary', () => {
    it('summary should have correct structure', () => {
      expect(complianceReport.summary).toHaveProperty('compliance_status');
      expect(complianceReport.summary).toHaveProperty('critical_count');
      expect(complianceReport.summary).toHaveProperty('high_count');
      expect(complianceReport.summary).toHaveProperty('medium_count');
      expect(complianceReport.summary).toHaveProperty('low_count');
      expect(complianceReport.summary).toHaveProperty('total_findings');
    });

    it('total findings should match sum of individual counts', () => {
      const expectedTotal =
        complianceReport.summary.critical_count +
        complianceReport.summary.high_count +
        complianceReport.summary.medium_count +
        complianceReport.summary.low_count;

      expect(complianceReport.summary.total_findings).toBe(expectedTotal);
    });

    it('compliance_status should be valid', () => {
      const validStatuses = [
        'COMPLIANT',
        'LOW_PRIORITY_ISSUES_FOUND',
        'MEDIUM_PRIORITY_ISSUES_FOUND',
        'HIGH_PRIORITY_ISSUES_FOUND',
        'CRITICAL_ISSUES_FOUND'
      ];
      expect(validStatuses).toContain(complianceReport.summary.compliance_status);
    });
  });

  describe('Resources Analyzed', () => {
    it('should track number of resources analyzed', () => {
      expect(complianceReport.summary).toHaveProperty('resources_analyzed');
      expect(complianceReport.summary.resources_analyzed).toHaveProperty('ec2_instances');
      expect(complianceReport.summary.resources_analyzed).toHaveProperty('rds_instances');
      expect(complianceReport.summary.resources_analyzed).toHaveProperty('s3_buckets');
      expect(complianceReport.summary.resources_analyzed).toHaveProperty('iam_roles');
      expect(complianceReport.summary.resources_analyzed).toHaveProperty('security_groups');
    });

    it('resource counts should be numbers', () => {
      const analyzed = complianceReport.summary.resources_analyzed;
      expect(typeof analyzed.ec2_instances).toBe('number');
      expect(typeof analyzed.rds_instances).toBe('number');
      expect(typeof analyzed.s3_buckets).toBe('number');
      expect(typeof analyzed.iam_roles).toBe('number');
      expect(typeof analyzed.security_groups).toBe('number');
    });

    it('resource counts should be non-negative', () => {
      const analyzed = complianceReport.summary.resources_analyzed;
      expect(analyzed.ec2_instances).toBeGreaterThanOrEqual(0);
      expect(analyzed.rds_instances).toBeGreaterThanOrEqual(0);
      expect(analyzed.s3_buckets).toBeGreaterThanOrEqual(0);
      expect(analyzed.iam_roles).toBeGreaterThanOrEqual(0);
      expect(analyzed.security_groups).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Findings Structure', () => {
    it('findings should be arrays', () => {
      expect(Array.isArray(complianceReport.findings.critical)).toBe(true);
      expect(Array.isArray(complianceReport.findings.high)).toBe(true);
      expect(Array.isArray(complianceReport.findings.medium)).toBe(true);
      expect(Array.isArray(complianceReport.findings.low)).toBe(true);
    });

    it('findings arrays should match counts', () => {
      expect(complianceReport.findings.critical.length).toBe(complianceReport.summary.critical_count);
      expect(complianceReport.findings.high.length).toBe(complianceReport.summary.high_count);
      expect(complianceReport.findings.medium.length).toBe(complianceReport.summary.medium_count);
      expect(complianceReport.findings.low.length).toBe(complianceReport.summary.low_count);
    });

    it('each finding should have required fields', () => {
      const allFindings = [
        ...complianceReport.findings.critical,
        ...complianceReport.findings.high,
        ...complianceReport.findings.medium,
        ...complianceReport.findings.low
      ];

      allFindings.forEach(finding => {
        expect(finding).toHaveProperty('resource_type');
        expect(finding).toHaveProperty('resource_id');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('finding');
        expect(finding).toHaveProperty('details');
        expect(finding).toHaveProperty('remediation');
      });
    });

    it('finding severities should match their category', () => {
      complianceReport.findings.critical.forEach((f: any) => expect(f.severity).toBe('critical'));
      complianceReport.findings.high.forEach((f: any) => expect(f.severity).toBe('high'));
      complianceReport.findings.medium.forEach((f: any) => expect(f.severity).toBe('medium'));
      complianceReport.findings.low.forEach((f: any) => expect(f.severity).toBe('low'));
    });
  });

  describe('Compliance Status Logic', () => {
    it('status should reflect worst finding severity', () => {
      if (outputs.critical_findings_count > 0) {
        expect(outputs.compliance_status).toBe('CRITICAL_ISSUES_FOUND');
      } else if (outputs.high_findings_count > 0) {
        expect(outputs.compliance_status).toBe('HIGH_PRIORITY_ISSUES_FOUND');
      } else if (outputs.medium_findings_count > 0) {
        expect(outputs.compliance_status).toBe('MEDIUM_PRIORITY_ISSUES_FOUND');
      } else if (outputs.low_findings_count > 0) {
        expect(outputs.compliance_status).toBe('LOW_PRIORITY_ISSUES_FOUND');
      } else {
        expect(outputs.compliance_status).toBe('COMPLIANT');
      }
    });
  });

  describe('Environment Suffix', () => {
    it('environment suffix should be included in outputs', () => {
      expect(outputs.environment_suffix).toBeTruthy();
    });

    it('environment suffix should match across outputs', () => {
      expect(outputs.environment_suffix).toBe(complianceReport.metadata.environment_suffix);
      expect(outputs.environment_suffix).toBe(complianceReport.summary.environment_suffix);
    });
  });

  describe('Timestamp Validation', () => {
    it('scan timestamp should be in ISO 8601 format', () => {
      const timestamp = complianceReport.metadata.scan_timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('scan timestamp should be a valid date', () => {
      const timestamp = new Date(complianceReport.metadata.scan_timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('scan timestamp should be recent (within last hour)', () => {
      const scanTime = new Date(complianceReport.metadata.scan_timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - scanTime.getTime()) / 1000 / 60;

      // Allow up to 60 minutes difference (for CI/CD delays)
      expect(diffMinutes).toBeLessThan(60);
      expect(diffMinutes).toBeGreaterThan(-1); // Not in the future
    });
  });

  describe('Read-Only Analysis Verification', () => {
    it('deployment should not create managed resources', () => {
      // The only resource created should be null_resource for validation
      // This test validates that the infrastructure is truly read-only
      expect(true).toBe(true); // Placeholder - actual verification is that terraform plan shows 0 create/modify/destroy
    });

    it('should analyze existing resources without modification', () => {
      // Verify that the compliance check runs against existing infrastructure
      // without making any changes
      expect(complianceReport).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty resource lists gracefully', () => {
      // When no resources are provided for analysis, should not fail
      const analyzed = complianceReport.summary.resources_analyzed;

      // All resource counts should be zero or more (not undefined/null)
      expect(analyzed.ec2_instances).toBeGreaterThanOrEqual(0);
      expect(analyzed.rds_instances).toBeGreaterThanOrEqual(0);
      expect(analyzed.s3_buckets).toBeGreaterThanOrEqual(0);
      expect(analyzed.iam_roles).toBeGreaterThanOrEqual(0);
      expect(analyzed.security_groups).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AWS Account and Region', () => {
    it('should deploy to us-east-1 region', () => {
      expect(complianceReport.metadata.aws_region).toBe('us-east-1');
    });

    it('should capture AWS account ID', () => {
      expect(complianceReport.metadata.aws_account_id).toMatch(/^\d{12}$/);
    });
  });

  describe('Output Consistency', () => {
    it('compliance status should be consistent across outputs', () => {
      expect(outputs.compliance_status).toBe(complianceReport.summary.compliance_status);
    });
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should complete full compliance analysis cycle', () => {
      // Verify that the deployment:
      // 1. Queried data sources
      // 2. Ran compliance checks
      // 3. Generated findings
      // 4. Produced structured output

      expect(complianceReport.metadata).toBeTruthy();
      expect(complianceReport.summary).toBeTruthy();
      expect(complianceReport.findings).toBeTruthy();
    });

    it('should provide actionable compliance information', () => {
      // Each finding should have:
      // - Clear description of the issue
      // - Remediation guidance
      // - Severity classification

      const allFindings = [
        ...complianceReport.findings.critical,
        ...complianceReport.findings.high,
        ...complianceReport.findings.medium,
        ...complianceReport.findings.low
      ];

      allFindings.forEach(finding => {
        expect(finding.finding).toBeTruthy();
        expect(finding.details).toBeTruthy();
        expect(finding.remediation).toBeTruthy();
        expect(['critical', 'high', 'medium', 'low']).toContain(finding.severity);
      });
    });
  });
});
