/**
 * Unit tests for Terraform Compliance Checker
 */

import { TerraformComplianceChecker } from '../lib/terraform-compliance';

describe('TerraformComplianceChecker', () => {
  let checker: TerraformComplianceChecker;

  beforeEach(() => {
    checker = new TerraformComplianceChecker();
  });

  describe('runComplianceCheck', () => {
    it('should run full compliance check', () => {
      const report = checker.runComplianceCheck();
      
      expect(report).toBeDefined();
      expect(report.totalRequirements).toBe(12);
      expect(report.passedRequirements).toBeGreaterThan(0);
      expect(report.details).toHaveLength(12);
    });

    it('should have high compliance percentage', () => {
      const report = checker.runComplianceCheck();
      expect(report.compliance).toBeGreaterThan(90);
    });

    it('should include all requirement details', () => {
      const report = checker.runComplianceCheck();
      
      const requirementNames = report.details.map(d => d.requirement);
      expect(requirementNames).toContain('1. Region Compliance');
      expect(requirementNames).toContain('2. Terraform Version');
      expect(requirementNames).toContain('3. Environment Configurations');
      expect(requirementNames).toContain('4. Cost Estimation');
      expect(requirementNames).toContain('5. Network Architecture');
      expect(requirementNames).toContain('6. SSH Restrictions');
      expect(requirementNames).toContain('7. Remote State');
      expect(requirementNames).toContain('8. S3 Security');
      expect(requirementNames).toContain('9. CI Pipeline');
      expect(requirementNames).toContain('10. Naming Conventions');
      expect(requirementNames).toContain('11. Modular Configuration');
      expect(requirementNames).toContain('12. No Hardcoded Secrets');
    });
  });

  describe('checkEnvironmentSuffix', () => {
    it('should verify environment suffix is configured', () => {
      const hasSuffix = checker.checkEnvironmentSuffix();
      expect(hasSuffix).toBe(true);
    });
  });

  describe('checkDeletionProtection', () => {
    it('should verify deletion protection is disabled for testing', () => {
      const isDisabled = checker.checkDeletionProtection();
      expect(isDisabled).toBe(true);
    });
  });

  describe('validateOutputsFile', () => {
    it('should validate outputs file structure', () => {
      const isValid = checker.validateOutputsFile();
      expect(isValid).toBe(true);
    });
  });

  describe('getCompliancePercentage', () => {
    it('should calculate compliance percentage', () => {
      const percentage = checker.getCompliancePercentage();
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('isFullyCompliant', () => {
    it('should check if fully compliant', () => {
      const fullyCompliant = checker.isFullyCompliant();
      expect(typeof fullyCompliant).toBe('boolean');
    });
  });

  describe('getFailedRequirements', () => {
    it('should return list of failed requirements', () => {
      const failed = checker.getFailedRequirements();
      expect(Array.isArray(failed)).toBe(true);
      
      // Should have very few or no failures
      expect(failed.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateComplianceMarkdown', () => {
    it('should generate markdown report', () => {
      const markdown = checker.generateComplianceMarkdown();
      
      expect(markdown).toContain('# Terraform Compliance Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('## Details');
      expect(markdown).toContain('Total Requirements: 12');
      expect(markdown).toContain('Compliance:');
    });

    it('should include pass/fail icons in markdown', () => {
      const markdown = checker.generateComplianceMarkdown();
      
      // Should have at least some passing requirements
      expect(markdown).toContain('✅');
    });
  });

  describe('Individual requirement checks', () => {
    it('should pass region compliance', () => {
      const report = checker.runComplianceCheck();
      const regionCheck = report.details.find(d => d.requirement.includes('Region Compliance'));
      expect(regionCheck?.status).toBe('PASS');
    });

    it('should pass Terraform version check', () => {
      const report = checker.runComplianceCheck();
      const versionCheck = report.details.find(d => d.requirement.includes('Terraform Version'));
      expect(versionCheck?.status).toBe('PASS');
    });

    it('should pass environment configurations check', () => {
      const report = checker.runComplianceCheck();
      const envCheck = report.details.find(d => d.requirement.includes('Environment Configurations'));
      expect(envCheck?.status).toBe('PASS');
    });

    it('should pass cost estimation check', () => {
      const report = checker.runComplianceCheck();
      const costCheck = report.details.find(d => d.requirement.includes('Cost Estimation'));
      expect(costCheck?.status).toBe('PASS');
    });

    it('should pass network architecture check', () => {
      const report = checker.runComplianceCheck();
      const networkCheck = report.details.find(d => d.requirement.includes('Network Architecture'));
      expect(networkCheck?.status).toBe('PASS');
    });

    it('should pass SSH restrictions check', () => {
      const report = checker.runComplianceCheck();
      const sshCheck = report.details.find(d => d.requirement.includes('SSH Restrictions'));
      expect(sshCheck?.status).toBe('PASS');
    });

    it('should pass remote state check', () => {
      const report = checker.runComplianceCheck();
      const stateCheck = report.details.find(d => d.requirement.includes('Remote State'));
      expect(stateCheck?.status).toBe('PASS');
    });

    it('should pass S3 security check', () => {
      const report = checker.runComplianceCheck();
      const s3Check = report.details.find(d => d.requirement.includes('S3 Security'));
      expect(s3Check?.status).toBe('PASS');
    });

    it('should pass CI pipeline check', () => {
      const report = checker.runComplianceCheck();
      const ciCheck = report.details.find(d => d.requirement.includes('CI Pipeline'));
      expect(ciCheck?.status).toBe('PASS');
    });

    it('should pass naming conventions check', () => {
      const report = checker.runComplianceCheck();
      const namingCheck = report.details.find(d => d.requirement.includes('Naming Conventions'));
      expect(namingCheck?.status).toBe('PASS');
    });

    it('should pass modular configuration check', () => {
      const report = checker.runComplianceCheck();
      const modularCheck = report.details.find(d => d.requirement.includes('Modular Configuration'));
      expect(modularCheck?.status).toBe('PASS');
    });

    it('should pass no hardcoded secrets check', () => {
      const report = checker.runComplianceCheck();
      const secretsCheck = report.details.find(d => d.requirement.includes('No Hardcoded Secrets'));
      expect(secretsCheck?.status).toBe('PASS');
    });
  });
});