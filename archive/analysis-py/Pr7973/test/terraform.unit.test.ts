// Infrastructure Analysis Module - Unit Tests
// Validates Python analysis script structure and logic

import fs from "fs";
import path from "path";

describe("Infrastructure Analysis Module - Unit Tests", () => {
  const libDir = path.resolve(__dirname, "../lib");
  let analyseContent: string;

  beforeAll(() => {
    analyseContent = fs.readFileSync(path.join(libDir, "analyse.py"), "utf8");
  });

  describe("File Structure", () => {
    test("analyse.py exists and is readable", () => {
      expect(fs.existsSync(path.join(libDir, "analyse.py"))).toBe(true);
      expect(analyseContent.length).toBeGreaterThan(0);
    });

    test("analyse.py is executable", () => {
      const stats = fs.statSync(path.join(libDir, "analyse.py"));
      const isExecutable = (stats.mode & parseInt("111", 8)) !== 0;
      expect(isExecutable).toBe(true);
    });

    test("has shebang for Python 3", () => {
      expect(analyseContent).toMatch(/^#!.*python3/);
    });
  });

  describe("Module Imports", () => {
    test("imports json module", () => {
      expect(analyseContent).toMatch(/import json/);
    });

    test("imports boto3 for AWS SDK", () => {
      expect(analyseContent).toMatch(/import boto3/);
    });

    test("imports logging module", () => {
      expect(analyseContent).toMatch(/import logging/);
    });

    test("imports datetime for timestamps", () => {
      expect(analyseContent).toMatch(/from datetime import datetime, timezone/);
    });

    test("imports typing for type hints", () => {
      expect(analyseContent).toMatch(/from typing import Dict, List, Any/);
    });

    test("imports os for environment variables", () => {
      expect(analyseContent).toMatch(/import os/);
    });

    test("imports ClientError from botocore.exceptions", () => {
      expect(analyseContent).toMatch(/from botocore\.exceptions import ClientError/);
    });
  });

  describe("Class Definition", () => {
    test("defines InfrastructureAnalysisAnalyzer class", () => {
      expect(analyseContent).toMatch(/class InfrastructureAnalysisAnalyzer:/);
    });

    test("class has __init__ method with region parameter", () => {
      expect(analyseContent).toMatch(/def __init__\(self,\s*region='us-east-1'/);
    });

    test("class has endpoint_url parameter for testing", () => {
      expect(analyseContent).toMatch(/endpoint_url=None/);
    });

    test("initializes timestamp in constructor", () => {
      expect(analyseContent).toMatch(/self\.timestamp\s*=\s*datetime\.now\(timezone\.utc\)\.isoformat\(\)/);
    });
  });

  describe("AWS Client Initialization", () => {
    test("initializes EC2 client", () => {
      expect(analyseContent).toMatch(/self\.ec2_client\s*=\s*boto3\.client\('ec2'/);
    });

    test("initializes RDS client", () => {
      expect(analyseContent).toMatch(/self\.rds_client\s*=\s*boto3\.client\('rds'/);
    });

    test("initializes S3 client", () => {
      expect(analyseContent).toMatch(/self\.s3_client\s*=\s*boto3\.client\('s3'/);
    });

    test("supports custom endpoint URL for local testing", () => {
      expect(analyseContent).toMatch(/if endpoint_url:/);
      expect(analyseContent).toMatch(/client_config\['endpoint_url'\]/);
    });
  });

  describe("EC2 Analysis Method", () => {
    test("defines analyze_ec2_instances method", () => {
      expect(analyseContent).toMatch(/def analyze_ec2_instances\(self,\s*environment_suffix:\s*str\)/);
    });

    test("defines approved_types list with t3.micro, t3.small, t3.medium", () => {
      expect(analyseContent).toMatch(/approved_types\s*=\s*\['t3\.micro',\s*'t3\.small',\s*'t3\.medium'\]/);
    });

    test("includes instance cost estimates", () => {
      expect(analyseContent).toMatch(/instance_costs\s*=\s*{/);
      expect(analyseContent).toMatch(/'t3\.micro':\s*7\.30/);
      expect(analyseContent).toMatch(/'t3\.small':\s*14\.60/);
      expect(analyseContent).toMatch(/'t3\.medium':\s*29\.20/);
    });

    test("filters EC2 instances by environment tag", () => {
      expect(analyseContent).toMatch(/Filters=\[[\s\S]*?'Name':\s*'tag:Environment'/);
    });

    test("returns type_violations for unapproved instance types", () => {
      expect(analyseContent).toMatch(/type_violations.*append/);
      expect(analyseContent).toMatch(/instance_type not in approved_types/);
    });

    test("only checks running instances for type violations", () => {
      expect(analyseContent).toMatch(/if state == 'running' and instance_type not in approved_types/);
    });

    test("returns cost_warnings for expensive instances", () => {
      expect(analyseContent).toMatch(/cost_warnings.*append/);
      expect(analyseContent).toMatch(/estimated_cost > 100\.0/);
    });

    test("handles API errors gracefully", () => {
      expect(analyseContent).toMatch(/except Exception as e:/);
      expect(analyseContent).toMatch(/EC2 analysis error/);
    });
  });

  describe("RDS Analysis Method", () => {
    test("defines analyze_rds_databases method", () => {
      expect(analyseContent).toMatch(/def analyze_rds_databases\(self,\s*environment_suffix:\s*str\)/);
    });

    test("uses describe_db_instances API call", () => {
      expect(analyseContent).toMatch(/self\.rds_client\.describe_db_instances\(\)/);
    });

    test("checks backup retention period >= 7 days", () => {
      expect(analyseContent).toMatch(/backup_retention < 7/);
    });

    test("returns backup_violations for non-compliant databases", () => {
      expect(analyseContent).toMatch(/backup_violations.*append/);
    });

    test("filters databases by environment suffix in identifier", () => {
      expect(analyseContent).toMatch(/if environment_suffix in db_identifier/);
    });

    test("handles API errors gracefully", () => {
      expect(analyseContent).toMatch(/RDS analysis error/);
    });
  });

  describe("S3 Analysis Method", () => {
    test("defines analyze_s3_buckets method", () => {
      expect(analyseContent).toMatch(/def analyze_s3_buckets\(self,\s*environment_suffix:\s*str\)/);
    });

    test("uses list_buckets API call", () => {
      expect(analyseContent).toMatch(/self\.s3_client\.list_buckets\(\)/);
    });

    test("checks versioning status", () => {
      expect(analyseContent).toMatch(/get_bucket_versioning/);
      expect(analyseContent).toMatch(/versioning\.get\('Status'\)\s*==\s*'Enabled'/);
    });

    test("checks encryption configuration", () => {
      expect(analyseContent).toMatch(/get_bucket_encryption/);
    });

    test("returns compliance_violations for non-compliant buckets", () => {
      expect(analyseContent).toMatch(/compliance_violations.*append/);
    });

    test("handles ServerSideEncryptionConfigurationNotFoundError", () => {
      expect(analyseContent).toMatch(/ServerSideEncryptionConfigurationNotFoundError/);
    });

    test("filters buckets by environment suffix in name", () => {
      expect(analyseContent).toMatch(/if environment_suffix in bucket_name/);
    });

    test("handles API errors gracefully", () => {
      expect(analyseContent).toMatch(/S3 analysis error/);
    });
  });

  describe("Security Group Analysis Method", () => {
    test("defines analyze_security_groups method", () => {
      expect(analyseContent).toMatch(/def analyze_security_groups\(self,\s*environment_suffix:\s*str\)/);
    });

    test("defines allowed_public_ports as [80, 443]", () => {
      expect(analyseContent).toMatch(/allowed_public_ports\s*=\s*\[80,\s*443\]/);
    });

    test("uses describe_security_groups API call", () => {
      expect(analyseContent).toMatch(/self\.ec2_client\.describe_security_groups/);
    });

    test("filters by environment tag", () => {
      expect(analyseContent).toMatch(/Filters=\[[\s\S]*?'Name':\s*'tag:Environment'/);
    });

    test("checks for 0.0.0.0/0 CIDR in ingress rules", () => {
      expect(analyseContent).toMatch(/CidrIp.*==.*0\.0\.0\.0\/0/);
    });

    test("returns unrestricted_violations for non-allowed ports", () => {
      expect(analyseContent).toMatch(/unrestricted_violations.*append/);
    });

    test("allows public access only on ports 80 and 443", () => {
      expect(analyseContent).toMatch(/from_port not in allowed_public_ports/);
    });

    test("handles API errors gracefully", () => {
      expect(analyseContent).toMatch(/Security group analysis error/);
    });
  });

  describe("Tagging Compliance Method", () => {
    test("defines analyze_tagging_compliance method", () => {
      expect(analyseContent).toMatch(/def analyze_tagging_compliance\(self,\s*ec2_results:\s*Dict,\s*rds_results:\s*Dict,\s*s3_results:\s*Dict\)/);
    });

    test("defines required_tags as Environment, Owner, CostCenter, Project", () => {
      expect(analyseContent).toMatch(/'required_tags':\s*\['Environment',\s*'Owner',\s*'CostCenter',\s*'Project'\]/);
    });

    test("aggregates resources from EC2, RDS, and S3", () => {
      expect(analyseContent).toMatch(/ec2-\{instance\['id'\]\}/);
      expect(analyseContent).toMatch(/rds-\{db\['id'\]\}/);
      expect(analyseContent).toMatch(/s3-\{bucket\['name'\]\}/);
    });

    test("returns resources_with_violations for missing tags", () => {
      expect(analyseContent).toMatch(/resources_with_violations.*append/);
    });

    test("calculates compliance_percentage", () => {
      expect(analyseContent).toMatch(/compliance_percentage.*round/);
      expect(analyseContent).toMatch(/compliant_count \/ results\['total_resources'\] \* 100/);
    });

    test("handles division by zero for empty resources", () => {
      expect(analyseContent).toMatch(/if results\['total_resources'\] > 0 else 0/);
    });
  });

  describe("Report Generation Method", () => {
    test("defines generate_report method", () => {
      expect(analyseContent).toMatch(/def generate_report\(self,\s*environment_suffix:\s*str\)/);
    });

    test("calls all analysis methods", () => {
      expect(analyseContent).toMatch(/ec2_results = self\.analyze_ec2_instances\(environment_suffix\)/);
      expect(analyseContent).toMatch(/rds_results = self\.analyze_rds_databases\(environment_suffix\)/);
      expect(analyseContent).toMatch(/s3_results = self\.analyze_s3_buckets\(environment_suffix\)/);
      expect(analyseContent).toMatch(/sg_results = self\.analyze_security_groups\(environment_suffix\)/);
      expect(analyseContent).toMatch(/tagging_results = self\.analyze_tagging_compliance\(ec2_results, rds_results, s3_results\)/);
    });

    test("calculates total_violations", () => {
      expect(analyseContent).toMatch(/total_violations\s*=\s*\(/);
      expect(analyseContent).toMatch(/len\(ec2_results\.get\('type_violations', \[\]\)\)/);
      expect(analyseContent).toMatch(/len\(rds_results\.get\('backup_violations', \[\]\)\)/);
      expect(analyseContent).toMatch(/len\(s3_results\.get\('compliance_violations', \[\]\)\)/);
      expect(analyseContent).toMatch(/len\(sg_results\.get\('unrestricted_violations', \[\]\)\)/);
    });

    test("includes timestamp in report", () => {
      expect(analyseContent).toMatch(/'timestamp':\s*self\.timestamp/);
    });

    test("includes environment_suffix in report", () => {
      expect(analyseContent).toMatch(/'environment_suffix':\s*environment_suffix/);
    });

    test("includes region in report", () => {
      expect(analyseContent).toMatch(/'region':\s*self\.region/);
    });

    test("includes compliance_status for each category", () => {
      expect(analyseContent).toMatch(/'compliance_status':\s*'PASS' if/);
    });

    test("includes overall_status in summary", () => {
      expect(analyseContent).toMatch(/'overall_status':\s*'PASS' if total_violations == 0 else 'FAIL'/);
    });

    test("includes compliance_by_category in summary", () => {
      expect(analyseContent).toMatch(/'compliance_by_category':\s*{/);
      expect(analyseContent).toMatch(/'ec2_instances':/);
      expect(analyseContent).toMatch(/'rds_databases':/);
      expect(analyseContent).toMatch(/'s3_buckets':/);
      expect(analyseContent).toMatch(/'security_groups':/);
      expect(analyseContent).toMatch(/'tagging':/);
    });
  });

  describe("Main Function", () => {
    test("defines main function", () => {
      expect(analyseContent).toMatch(/def main\(\):/);
    });

    test("reads AWS_REGION from environment", () => {
      expect(analyseContent).toMatch(/region = os\.getenv\('AWS_REGION', 'us-east-1'\)/);
    });

    test("reads AWS_ENDPOINT_URL from environment for testing", () => {
      expect(analyseContent).toMatch(/endpoint_url = os\.getenv\('AWS_ENDPOINT_URL'\)/);
    });

    test("reads ENVIRONMENT_SUFFIX from environment", () => {
      expect(analyseContent).toMatch(/environment_suffix = os\.getenv\('ENVIRONMENT_SUFFIX', 'dev'\)/);
    });

    test("saves report to analysis-results.txt", () => {
      expect(analyseContent).toMatch(/output_file = 'analysis-results\.txt'/);
    });

    test("uses json.dump for report output", () => {
      expect(analyseContent).toMatch(/json\.dump\(report,\s*f,\s*indent=2/);
    });

    test("returns exit code based on violations", () => {
      expect(analyseContent).toMatch(/return 0 if report\['summary'\]\['total_violations'\] == 0 else 1/);
    });

    test("has if __name__ == '__main__' block", () => {
      expect(analyseContent).toMatch(/if __name__ == '__main__':/);
    });
  });

  describe("Logging Configuration", () => {
    test("configures logging with INFO level", () => {
      expect(analyseContent).toMatch(/logging\.basicConfig\(level=logging\.INFO/);
    });

    test("creates named logger", () => {
      expect(analyseContent).toMatch(/logger = logging\.getLogger\(__name__\)/);
    });

    test("uses logger.info for status messages", () => {
      expect(analyseContent).toMatch(/logger\.info\(/);
    });

    test("uses logger.error for error messages", () => {
      expect(analyseContent).toMatch(/logger\.error\(/);
    });

    test("uses logger.warning for warnings", () => {
      expect(analyseContent).toMatch(/logger\.warning\(/);
    });
  });

  describe("Type Hints", () => {
    test("uses Dict type hint for return values", () => {
      expect(analyseContent).toMatch(/-> Dict\[str, Any\]:/);
    });

    test("uses str type hint for parameters", () => {
      expect(analyseContent).toMatch(/environment_suffix: str/);
    });
  });

  describe("Error Handling", () => {
    test("has try-except blocks in analysis methods", () => {
      const tryCount = (analyseContent.match(/try:/g) || []).length;
      expect(tryCount).toBeGreaterThanOrEqual(5);
    });

    test("catches generic Exception for robustness", () => {
      const exceptCount = (analyseContent.match(/except Exception as e:/g) || []).length;
      expect(exceptCount).toBeGreaterThanOrEqual(4);
    });

    test("appends errors to issues list", () => {
      expect(analyseContent).toMatch(/results\['issues'\]\.append/);
    });
  });

  describe("Code Quality", () => {
    test("has docstrings for class", () => {
      expect(analyseContent).toMatch(/class InfrastructureAnalysisAnalyzer:[\s\S]*?"""/);
    });

    test("has docstrings for methods", () => {
      // Check that methods have docstrings (triple-quoted strings after method definition)
      const docstringCount = (analyseContent.match(/"""[\s\S]*?"""/g) || []).length;
      expect(docstringCount).toBeGreaterThanOrEqual(6);
    });

    test("uses meaningful variable names", () => {
      expect(analyseContent).toMatch(/environment_suffix/);
      expect(analyseContent).toMatch(/backup_retention/);
      expect(analyseContent).toMatch(/compliance_percentage/);
    });

    test("does not contain emojis", () => {
      // Check for common emoji patterns
      const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
      expect(analyseContent).not.toMatch(emojiPattern);
    });
  });

  describe("Compliance Thresholds", () => {
    test("uses 7 days minimum for RDS backup retention", () => {
      expect(analyseContent).toMatch(/backup_retention < 7/);
    });

    test("uses $100 threshold for cost warnings", () => {
      expect(analyseContent).toMatch(/estimated_cost > 100\.0/);
    });

    test("requires 4 tags: Environment, Owner, CostCenter, Project", () => {
      expect(analyseContent).toMatch(/'Environment',\s*'Owner',\s*'CostCenter',\s*'Project'/);
    });

    test("allows only ports 80 and 443 for public access", () => {
      expect(analyseContent).toMatch(/allowed_public_ports\s*=\s*\[80,\s*443\]/);
    });
  });
});
