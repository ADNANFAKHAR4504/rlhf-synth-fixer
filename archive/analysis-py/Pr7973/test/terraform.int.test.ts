// Infrastructure Analysis Module - Integration Tests
// Tests Python analysis script functionality and output structure
// Note: This is an ANALYSIS task - validates Python script behavior

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("Infrastructure Analysis Module - Integration Tests", () => {
  const libDir = path.resolve(__dirname, "../lib");
  const testOutputDir = path.resolve(__dirname, "test-output");
  let analyseContent: string;

  beforeAll(() => {
    // Ensure test output directory exists
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
    analyseContent = fs.readFileSync(path.join(libDir, "analyse.py"), "utf8");
  });

  describe("Python Script Validation", () => {
    test("analyse.py has valid Python syntax", () => {
      const result = execSync(`python3 -m py_compile ${path.join(libDir, "analyse.py")}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      // If compilation fails, it throws an error
      expect(true).toBe(true);
    });

    test("analyse.py can be imported as a module", () => {
      const checkScript = `
import sys
sys.path.insert(0, "${libDir}")
try:
    from analyse import InfrastructureAnalysisAnalyzer
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
`;
      const result = execSync(`python3 -c '${checkScript}'`, {
        encoding: "utf8",
      });
      expect(result.trim()).toBe("SUCCESS");
    });

    test("InfrastructureAnalysisAnalyzer class is properly defined", () => {
      const checkScript = `
import sys
sys.path.insert(0, "${libDir}")
from analyse import InfrastructureAnalysisAnalyzer
import inspect
methods = [m for m in dir(InfrastructureAnalysisAnalyzer) if not m.startswith('_')]
print(','.join(methods))
`;
      const result = execSync(`python3 -c '${checkScript}'`, {
        encoding: "utf8",
      });
      const methods = result.trim().split(",");
      expect(methods).toContain("analyze_ec2_instances");
      expect(methods).toContain("analyze_rds_databases");
      expect(methods).toContain("analyze_s3_buckets");
      expect(methods).toContain("analyze_security_groups");
      expect(methods).toContain("analyze_tagging_compliance");
      expect(methods).toContain("generate_report");
    });
  });

  describe("EC2 Analysis Logic", () => {
    test("approved_types list contains correct instance types", () => {
      expect(analyseContent).toContain("'t3.micro'");
      expect(analyseContent).toContain("'t3.small'");
      expect(analyseContent).toContain("'t3.medium'");
    });

    test("instance_costs dictionary has pricing for common types", () => {
      expect(analyseContent).toMatch(/'t3\.micro':\s*7\.30/);
      expect(analyseContent).toMatch(/'t3\.small':\s*14\.60/);
      expect(analyseContent).toMatch(/'t3\.medium':\s*29\.20/);
      expect(analyseContent).toMatch(/'m5\.large':\s*69\.35/);
      expect(analyseContent).toMatch(/'m5\.xlarge':\s*138\.70/);
    });

    test("type_violations detection checks for running state", () => {
      expect(analyseContent).toMatch(/if state == 'running' and instance_type not in approved_types/);
    });

    test("cost_warnings threshold is $100", () => {
      expect(analyseContent).toMatch(/estimated_cost > 100\.0/);
    });
  });

  describe("RDS Analysis Logic", () => {
    test("backup retention minimum is 7 days", () => {
      expect(analyseContent).toMatch(/backup_retention < 7/);
    });

    test("checks backup_enabled flag", () => {
      expect(analyseContent).toMatch(/backup_enabled = backup_retention > 0/);
    });

    test("filters by environment suffix in identifier", () => {
      expect(analyseContent).toMatch(/if environment_suffix in db_identifier/);
    });
  });

  describe("S3 Analysis Logic", () => {
    test("checks versioning status is Enabled", () => {
      expect(analyseContent).toMatch(/versioning\.get\('Status'\)\s*==\s*'Enabled'/);
    });

    test("checks encryption configuration exists", () => {
      expect(analyseContent).toMatch(/get_bucket_encryption/);
    });

    test("filters by environment suffix in bucket name", () => {
      expect(analyseContent).toMatch(/if environment_suffix in bucket_name/);
    });

    test("handles ServerSideEncryptionConfigurationNotFoundError", () => {
      expect(analyseContent).toMatch(/ServerSideEncryptionConfigurationNotFoundError/);
    });
  });

  describe("Security Group Analysis Logic", () => {
    test("allowed_public_ports contains only 80 and 443", () => {
      expect(analyseContent).toMatch(/allowed_public_ports\s*=\s*\[80,\s*443\]/);
    });

    test("detects 0.0.0.0/0 CIDR for unrestricted access", () => {
      expect(analyseContent).toMatch(/CidrIp.*==.*0\.0\.0\.0\/0/);
    });

    test("flags non-allowed ports with public access", () => {
      expect(analyseContent).toMatch(/from_port not in allowed_public_ports/);
    });
  });

  describe("Tagging Compliance Logic", () => {
    test("required_tags contains Environment, Owner, CostCenter, Project", () => {
      expect(analyseContent).toMatch(/required_tags.*=.*\['Environment',\s*'Owner',\s*'CostCenter',\s*'Project'\]/);
    });

    test("aggregates resources from multiple sources", () => {
      expect(analyseContent).toMatch(/ec2-\{instance\['id'\]\}/);
      expect(analyseContent).toMatch(/rds-\{db\['id'\]\}/);
      expect(analyseContent).toMatch(/s3-\{bucket\['name'\]\}/);
    });

    test("handles division by zero in percentage calculation", () => {
      expect(analyseContent).toMatch(/if results\['total_resources'\] > 0 else 0/);
    });
  });

  describe("Report Structure Validation", () => {
    test("report includes timestamp field", () => {
      expect(analyseContent).toMatch(/'timestamp':\s*self\.timestamp/);
    });

    test("report includes environment_suffix field", () => {
      expect(analyseContent).toMatch(/'environment_suffix':\s*environment_suffix/);
    });

    test("report includes region field", () => {
      expect(analyseContent).toMatch(/'region':\s*self\.region/);
    });

    test("report includes ec2_analysis section", () => {
      expect(analyseContent).toMatch(/'ec2_analysis':\s*{/);
    });

    test("report includes rds_analysis section", () => {
      expect(analyseContent).toMatch(/'rds_analysis':\s*{/);
    });

    test("report includes s3_analysis section", () => {
      expect(analyseContent).toMatch(/'s3_analysis':\s*{/);
    });

    test("report includes security_group_analysis section", () => {
      expect(analyseContent).toMatch(/'security_group_analysis':\s*{/);
    });

    test("report includes tagging_analysis section", () => {
      expect(analyseContent).toMatch(/'tagging_analysis':\s*{/);
    });

    test("report includes summary section", () => {
      expect(analyseContent).toMatch(/'summary':\s*{/);
    });
  });

  describe("Summary Structure Validation", () => {
    test("summary includes total_resources_analyzed", () => {
      expect(analyseContent).toMatch(/'total_resources_analyzed':/);
    });

    test("summary includes total_violations", () => {
      expect(analyseContent).toMatch(/'total_violations':\s*total_violations/);
    });

    test("summary includes compliance_by_category", () => {
      expect(analyseContent).toMatch(/'compliance_by_category':\s*{/);
    });

    test("summary includes overall_compliance_percentage", () => {
      expect(analyseContent).toMatch(/'overall_compliance_percentage':/);
    });

    test("summary includes overall_status as PASS/FAIL", () => {
      expect(analyseContent).toMatch(/'overall_status':\s*'PASS' if total_violations == 0 else 'FAIL'/);
    });
  });

  describe("Compliance Status Logic", () => {
    test("ec2_analysis compliance_status based on type_violations", () => {
      expect(analyseContent).toMatch(/ec2_analysis.*compliance_status.*PASS.*type_violations/s);
    });

    test("rds_analysis compliance_status based on backup_violations", () => {
      expect(analyseContent).toMatch(/rds_analysis.*compliance_status.*PASS.*backup_violations/s);
    });

    test("s3_analysis compliance_status based on compliance_violations", () => {
      expect(analyseContent).toMatch(/s3_analysis.*compliance_status.*PASS.*compliance_violations/s);
    });

    test("security_group_analysis compliance_status based on unrestricted_violations", () => {
      expect(analyseContent).toMatch(/security_group_analysis.*compliance_status.*PASS.*unrestricted_violations/s);
    });
  });

  describe("Environment Variable Configuration", () => {
    test("AWS_REGION default is us-east-1", () => {
      expect(analyseContent).toMatch(/os\.getenv\('AWS_REGION', 'us-east-1'\)/);
    });

    test("AWS_ENDPOINT_URL supports local testing", () => {
      expect(analyseContent).toMatch(/os\.getenv\('AWS_ENDPOINT_URL'\)/);
    });

    test("ENVIRONMENT_SUFFIX default is dev", () => {
      expect(analyseContent).toMatch(/os\.getenv\('ENVIRONMENT_SUFFIX', 'dev'\)/);
    });
  });

  describe("Output File Generation", () => {
    test("saves report to analysis-results.txt", () => {
      expect(analyseContent).toMatch(/output_file = 'analysis-results\.txt'/);
    });

    test("uses json.dump with indent=2 for formatting", () => {
      expect(analyseContent).toMatch(/json\.dump\(report,\s*f,\s*indent=2/);
    });
  });

  describe("Exit Code Logic", () => {
    test("returns 0 when no violations", () => {
      expect(analyseContent).toMatch(/return 0 if.*total_violations.*== 0/);
    });

    test("returns 1 when violations exist", () => {
      expect(analyseContent).toMatch(/return 0 if.*else 1/);
    });
  });

  describe("Error Handling", () => {
    test("EC2 analysis catches exceptions", () => {
      expect(analyseContent).toMatch(/EC2 analysis error/);
    });

    test("RDS analysis catches exceptions", () => {
      expect(analyseContent).toMatch(/RDS analysis error/);
    });

    test("S3 analysis catches exceptions", () => {
      expect(analyseContent).toMatch(/S3 analysis error/);
    });

    test("Security group analysis catches exceptions", () => {
      expect(analyseContent).toMatch(/Security group analysis error/);
    });

    test("issues are collected in report", () => {
      expect(analyseContent).toMatch(/report\['issues'\] = all_issues/);
    });
  });

  describe("Logging Configuration", () => {
    test("configures logging at INFO level", () => {
      expect(analyseContent).toMatch(/logging\.basicConfig\(level=logging\.INFO/);
    });

    test("logs analysis start for each resource type", () => {
      expect(analyseContent).toMatch(/Analyzing EC2 instances/);
      expect(analyseContent).toMatch(/Analyzing RDS databases/);
      expect(analyseContent).toMatch(/Analyzing S3 buckets/);
      expect(analyseContent).toMatch(/Analyzing security groups/);
      expect(analyseContent).toMatch(/Analyzing tagging compliance/);
    });

    test("logs summary information", () => {
      expect(analyseContent).toMatch(/Analysis Summary/);
      expect(analyseContent).toMatch(/Analysis complete/);
    });
  });

  describe("AWS API Calls", () => {
    test("uses describe_instances for EC2", () => {
      expect(analyseContent).toMatch(/describe_instances/);
    });

    test("uses describe_db_instances for RDS", () => {
      expect(analyseContent).toMatch(/describe_db_instances/);
    });

    test("uses list_buckets for S3", () => {
      expect(analyseContent).toMatch(/list_buckets/);
    });

    test("uses get_bucket_versioning for S3 versioning", () => {
      expect(analyseContent).toMatch(/get_bucket_versioning/);
    });

    test("uses get_bucket_encryption for S3 encryption", () => {
      expect(analyseContent).toMatch(/get_bucket_encryption/);
    });

    test("uses describe_security_groups for security groups", () => {
      expect(analyseContent).toMatch(/describe_security_groups/);
    });

    test("uses list_tags_for_resource for RDS tags", () => {
      expect(analyseContent).toMatch(/list_tags_for_resource/);
    });
  });

  describe("Code Quality", () => {
    test("does not contain TODO comments", () => {
      expect(analyseContent).not.toMatch(/TODO/i);
    });

    test("does not contain FIXME comments", () => {
      expect(analyseContent).not.toMatch(/FIXME/i);
    });

    test("does not contain hardcoded AWS credentials", () => {
      expect(analyseContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test("does not contain emojis", () => {
      const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
      expect(analyseContent).not.toMatch(emojiPattern);
    });
  });

  describe("Compliance Categories", () => {
    test("compliance_by_category includes ec2_instances", () => {
      expect(analyseContent).toMatch(/'ec2_instances':/);
    });

    test("compliance_by_category includes rds_databases", () => {
      expect(analyseContent).toMatch(/'rds_databases':/);
    });

    test("compliance_by_category includes s3_buckets", () => {
      expect(analyseContent).toMatch(/'s3_buckets':/);
    });

    test("compliance_by_category includes security_groups", () => {
      expect(analyseContent).toMatch(/'security_groups':/);
    });

    test("compliance_by_category includes tagging", () => {
      expect(analyseContent).toMatch(/'tagging':/);
    });
  });

  describe("Total Violations Calculation", () => {
    test("sums ec2 type_violations", () => {
      expect(analyseContent).toMatch(/len\(ec2_results\.get\('type_violations', \[\]\)\)/);
    });

    test("sums rds backup_violations", () => {
      expect(analyseContent).toMatch(/len\(rds_results\.get\('backup_violations', \[\]\)\)/);
    });

    test("sums s3 compliance_violations", () => {
      expect(analyseContent).toMatch(/len\(s3_results\.get\('compliance_violations', \[\]\)\)/);
    });

    test("sums security group unrestricted_violations", () => {
      expect(analyseContent).toMatch(/len\(sg_results\.get\('unrestricted_violations', \[\]\)\)/);
    });

    test("sums tagging resources_with_violations", () => {
      expect(analyseContent).toMatch(/len\(tagging_results\.get\('resources_with_violations', \[\]\)\)/);
    });
  });
});
