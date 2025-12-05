// Terraform Infrastructure Analysis Module - Unit Tests
// Validates Terraform configuration structure, syntax, and validation logic

import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Analysis Module - Unit Tests", () => {
  const libDir = path.resolve(__dirname, "../lib");
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
    variablesTfContent = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
    outputsTfContent = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
    providerTfContent = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
  });

  describe("File Structure", () => {
    test("main.tf exists and is readable", () => {
      expect(fs.existsSync(path.join(libDir, "main.tf"))).toBe(true);
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test("variables.tf exists and is readable", () => {
      expect(fs.existsSync(path.join(libDir, "variables.tf"))).toBe(true);
      expect(variablesTfContent.length).toBeGreaterThan(0);
    });

    test("outputs.tf exists and is readable", () => {
      expect(fs.existsSync(path.join(libDir, "outputs.tf"))).toBe(true);
      expect(outputsTfContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(path.join(libDir, "provider.tf"))).toBe(true);
      expect(providerTfContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("declares terraform required_version", () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test("declares aws provider with version constraint", () => {
      expect(providerTfContent).toMatch(/aws\s*=\s*{[\s\S]*?version\s*=\s*"[>=~]+\s*5\.0"/);
    });

    test("declares external provider for S3 checks", () => {
      expect(providerTfContent).toMatch(/external\s*=\s*{[\s\S]*?version\s*=\s*"~>\s*2\.0"/);
    });

    test("configures aws provider with region variable", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*var\.aws_region/);
    });
  });

  describe("Input Variables", () => {
    test("declares aws_region variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares ec2_instance_ids variable as list", () => {
      expect(variablesTfContent).toMatch(/variable\s+"ec2_instance_ids"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("declares rds_db_instance_ids variable as list", () => {
      expect(variablesTfContent).toMatch(/variable\s+"rds_db_instance_ids"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("declares s3_bucket_names variable as list", () => {
      expect(variablesTfContent).toMatch(/variable\s+"s3_bucket_names"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("declares security_group_ids variable as list", () => {
      expect(variablesTfContent).toMatch(/variable\s+"security_group_ids"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_instance data source with for_each", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_instance"\s+"ec2_instances"\s*{[\s\S]*?for_each\s*=\s*toset\(var\.ec2_instance_ids\)/);
    });

    test("declares aws_db_instance data source with for_each", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_db_instance"\s+"rds_instances"\s*{[\s\S]*?for_each\s*=\s*toset\(var\.rds_db_instance_ids\)/);
    });

    test("declares aws_s3_bucket data source with for_each", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_s3_bucket"\s+"s3_buckets"\s*{[\s\S]*?for_each\s*=\s*toset\(var\.s3_bucket_names\)/);
    });

    test("declares aws_security_group data source with for_each", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_security_group"\s+"security_groups"\s*{[\s\S]*?for_each\s*=\s*toset\(var\.security_group_ids\)/);
    });

    test("declares external data source for S3 versioning", () => {
      expect(mainTfContent).toMatch(/data\s+"external"\s+"s3_versioning"\s*{/);
    });

    test("declares external data source for S3 encryption", () => {
      expect(mainTfContent).toMatch(/data\s+"external"\s+"s3_encryption"\s*{/);
    });
  });

  describe("Local Values - EC2 Validation", () => {
    test("defines approved_instance_types list", () => {
      expect(mainTfContent).toMatch(/approved_instance_types\s*=\s*\["t3\.micro",\s*"t3\.small",\s*"t3\.medium"\]/);
    });

    test("defines instance_costs map with pricing", () => {
      expect(mainTfContent).toMatch(/instance_costs\s*=\s*{/);
      expect(mainTfContent).toMatch(/"t3\.micro"\s*=\s*7\.30/);
      expect(mainTfContent).toMatch(/"t3\.small"\s*=\s*14\.60/);
      expect(mainTfContent).toMatch(/"t3\.medium"\s*=\s*29\.20/);
    });

    test("processes ec2_instances with instance_type and state", () => {
      expect(mainTfContent).toMatch(/ec2_instances\s*=\s*{[\s\S]*?instance_type\s*=[\s\S]*?state\s*=/);
    });

    test("calculates ec2_type_violations for unapproved types", () => {
      expect(mainTfContent).toMatch(/ec2_type_violations\s*=\s*{[\s\S]*?!contains\(local\.approved_instance_types/);
    });

    test("calculates ec2_costs for running instances", () => {
      expect(mainTfContent).toMatch(/ec2_costs\s*=\s*{[\s\S]*?lookup\(local\.instance_costs/);
    });

    test("calculates ec2_cost_warnings for expensive instances", () => {
      expect(mainTfContent).toMatch(/ec2_cost_warnings\s*=\s*{[\s\S]*?if\s+cost\s*>\s*100\.0/);
    });

    test("calculates total_ec2_cost using sum function", () => {
      expect(mainTfContent).toMatch(/total_ec2_cost\s*=\s*sum\(\[for\s+cost\s+in\s+values\(local\.ec2_costs\)/);
    });
  });

  describe("Local Values - RDS Validation", () => {
    test("processes rds_databases with backup settings", () => {
      expect(mainTfContent).toMatch(/rds_databases\s*=\s*{[\s\S]*?backup_enabled\s*=[\s\S]*?backup_retention_period\s*=/);
    });

    test("calculates rds_backup_violations for insufficient backups", () => {
      expect(mainTfContent).toMatch(/rds_backup_violations\s*=\s*{[\s\S]*?backup_retention_period\s*<\s*7/);
    });
  });

  describe("Local Values - S3 Validation", () => {
    test("processes s3_buckets with versioning and encryption", () => {
      expect(mainTfContent).toMatch(/s3_buckets\s*=\s*{[\s\S]*?versioning_enabled\s*=[\s\S]*?encryption_enabled\s*=/);
    });

    test("calculates s3_compliance_violations for non-compliant buckets", () => {
      expect(mainTfContent).toMatch(/s3_compliance_violations\s*=\s*{[\s\S]*?!bucket\.versioning_enabled\s*\|\|\s*!bucket\.encryption_enabled/);
    });
  });

  describe("Local Values - Security Group Validation", () => {
    test("defines allowed_public_ports list (80, 443)", () => {
      expect(mainTfContent).toMatch(/allowed_public_ports\s*=\s*\[80,\s*443\]/);
    });

    test("processes security_groups with ingress rules", () => {
      expect(mainTfContent).toMatch(/security_groups\s*=\s*{[\s\S]*?ingress\s*=/);
    });

    test("calculates sg_violations for unrestricted access", () => {
      expect(mainTfContent).toMatch(/sg_violations\s*=\s*merge\(\[[\s\S]*?0\.0\.0\.0\/0[\s\S]*?!contains\(local\.allowed_public_ports/);
    });
  });

  describe("Local Values - Tagging Validation", () => {
    test("defines required_tags list", () => {
      expect(mainTfContent).toMatch(/required_tags\s*=\s*\["Environment",\s*"Owner",\s*"CostCenter",\s*"Project"\]/);
    });

    test("merges all_resources from EC2, RDS, S3", () => {
      expect(mainTfContent).toMatch(/all_resources\s*=\s*merge\(/);
      expect(mainTfContent).toMatch(/ec2-\$\{id\}/);
      expect(mainTfContent).toMatch(/rds-\$\{id\}/);
      expect(mainTfContent).toMatch(/s3-\$\{name\}/);
    });

    test("calculates resources_with_tag_violations", () => {
      expect(mainTfContent).toMatch(/resources_with_tag_violations\s*=\s*{[\s\S]*?!contains\(keys\(tags\),\s*required_tag\)/);
    });

    test("calculates compliance_percentage", () => {
      expect(mainTfContent).toMatch(/compliance_percentage\s*=[\s\S]*?floor\(\(local\.compliant_resources\s*\/\s*local\.total_resources\)\s*\*\s*100\)/);
    });
  });

  describe("Local Values - Overall Metrics", () => {
    test("calculates total_resources", () => {
      expect(mainTfContent).toMatch(/total_resources\s*=\s*length\(local\.all_resources\)/);
    });

    test("calculates compliant_resources", () => {
      expect(mainTfContent).toMatch(/compliant_resources\s*=\s*local\.total_resources\s*-\s*length\(local\.resources_with_tag_violations\)/);
    });

    test("calculates total_violations", () => {
      expect(mainTfContent).toMatch(/total_violations\s*=\s*\(/);
      expect(mainTfContent).toMatch(/length\(local\.ec2_type_violations\)/);
      expect(mainTfContent).toMatch(/length\(local\.rds_backup_violations\)/);
      expect(mainTfContent).toMatch(/length\(local\.s3_compliance_violations\)/);
      expect(mainTfContent).toMatch(/length\(local\.sg_violations\)/);
      expect(mainTfContent).toMatch(/length\(local\.resources_with_tag_violations\)/);
    });
  });

  describe("Output Structure", () => {
    test("declares ec2_instance_analysis output", () => {
      expect(outputsTfContent).toMatch(/output\s+"ec2_instance_analysis"\s*{/);
      expect(outputsTfContent).toMatch(/total_instances\s*=\s*length\(local\.ec2_instances\)/);
      expect(outputsTfContent).toMatch(/compliance_status\s*=[\s\S]*?PASS[\s\S]*?FAIL/);
    });

    test("declares rds_database_analysis output", () => {
      expect(outputsTfContent).toMatch(/output\s+"rds_database_analysis"\s*{/);
      expect(outputsTfContent).toMatch(/total_databases\s*=\s*length\(local\.rds_databases\)/);
    });

    test("declares s3_bucket_analysis output", () => {
      expect(outputsTfContent).toMatch(/output\s+"s3_bucket_analysis"\s*{/);
      expect(outputsTfContent).toMatch(/total_buckets\s*=\s*length\(local\.s3_buckets\)/);
    });

    test("declares security_group_analysis output", () => {
      expect(outputsTfContent).toMatch(/output\s+"security_group_analysis"\s*{/);
      expect(outputsTfContent).toMatch(/total_security_groups\s*=\s*length\(local\.security_groups\)/);
    });

    test("declares tagging_compliance_analysis output", () => {
      expect(outputsTfContent).toMatch(/output\s+"tagging_compliance_analysis"\s*{/);
      expect(outputsTfContent).toMatch(/compliance_percentage\s*=\s*local\.compliance_percentage/);
    });

    test("declares compliance_summary output", () => {
      expect(outputsTfContent).toMatch(/output\s+"compliance_summary"\s*{/);
      expect(outputsTfContent).toMatch(/total_resources_analyzed\s*=\s*local\.total_resources/);
      expect(outputsTfContent).toMatch(/total_violations\s*=\s*local\.total_violations/);
    });

    test("declares cost_summary output", () => {
      expect(outputsTfContent).toMatch(/output\s+"cost_summary"\s*{/);
      expect(outputsTfContent).toMatch(/ec2_total_monthly_cost\s*=\s*local\.total_ec2_cost/);
    });

    test("declares cicd_report output with jsonencode", () => {
      expect(outputsTfContent).toMatch(/output\s+"cicd_report"\s*{/);
      expect(outputsTfContent).toMatch(/jsonencode\(/);
      expect(outputsTfContent).toMatch(/report_timestamp\s*=\s*timestamp\(\)/);
    });
  });

  describe("Analysis Module - Non-Destructive", () => {
    test("does not declare any resource blocks", () => {
      expect(mainTfContent).not.toMatch(/resource\s+"[^"]+"\s+"[^"]+"\s*{/);
    });

    test("uses only data sources for reading infrastructure", () => {
      const dataSourceCount = (mainTfContent.match(/data\s+"[^"]+"\s+"[^"]+"\s*{/g) || []).length;
      expect(dataSourceCount).toBeGreaterThan(0);
    });

    test("uses try() function for graceful error handling", () => {
      const tryCount = (mainTfContent.match(/try\(/g) || []).length;
      expect(tryCount).toBeGreaterThan(5);
    });
  });

  describe("Best Practices", () => {
    test("uses for_each instead of count for data sources", () => {
      expect(mainTfContent).toMatch(/for_each\s*=\s*toset\(/);
      expect(mainTfContent).not.toMatch(/count\s*=/);
    });

    test("uses descriptive variable descriptions", () => {
      expect(variablesTfContent).toMatch(/description\s*=\s*"[^"]+"/);
    });

    test("provides default values for optional variables", () => {
      expect(variablesTfContent).toMatch(/default\s*=\s*\[\]/);
    });

    test("uses structured outputs with nested objects", () => {
      expect(outputsTfContent).toMatch(/value\s*=\s*{/);
    });
  });
});
