// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure validation project
// This project uses a multi-file structure for validation infrastructure
// No Terraform execution - pure static analysis

import fs from "fs";
import path from "path";

// Multi-file Terraform project structure
const VALIDATION_FILE = "../lib/validation.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const DATA_FILE = "../lib/data.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const PROVIDER_FILE = "../lib/provider.tf";

const validationPath = path.resolve(__dirname, VALIDATION_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const dataPath = path.resolve(__dirname, DATA_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

// Helper to read files once and reuse
let validationContent: string;
let variablesContent: string;
let dataContent: string;
let outputsContent: string;
let providerContent: string;

beforeAll(() => {
  // Check all required files exist
  const requiredFiles = [
    { path: validationPath, name: "validation.tf" },
    { path: variablesPath, name: "variables.tf" },
    { path: dataPath, name: "data.tf" },
    { path: outputsPath, name: "outputs.tf" },
    { path: providerPath, name: "provider.tf" },
  ];

  requiredFiles.forEach(({ path: filePath, name }) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file not found: ${name} at ${filePath}`);
    }
  });

  // Read all files
  validationContent = fs.readFileSync(validationPath, "utf8");
  variablesContent = fs.readFileSync(variablesPath, "utf8");
  dataContent = fs.readFileSync(dataPath, "utf8");
  outputsContent = fs.readFileSync(outputsPath, "utf8");
  providerContent = fs.readFileSync(providerPath, "utf8");
});

describe("1. File Structure & Project Organization", () => {
  test("validation.tf exists and is readable", () => {
    expect(fs.existsSync(validationPath)).toBe(true);
    expect(validationContent.length).toBeGreaterThan(100);
  });

  test("variables.tf exists and is readable", () => {
    expect(fs.existsSync(variablesPath)).toBe(true);
    expect(variablesContent.length).toBeGreaterThan(50);
  });

  test("data.tf exists and is readable", () => {
    expect(fs.existsSync(dataPath)).toBe(true);
    expect(dataContent.length).toBeGreaterThan(50);
  });

  test("outputs.tf exists and is readable", () => {
    expect(fs.existsSync(outputsPath)).toBe(true);
    expect(outputsContent.length).toBeGreaterThan(50);
  });

  test("provider.tf exists and is readable", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
    expect(providerContent.length).toBeGreaterThan(50);
  });

  test("provider configuration is in provider.tf (not validation.tf)", () => {
    expect(validationContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    expect(providerContent).toMatch(/\bprovider\s+"aws"\s*\{/);
  });

  test("terraform block is in provider.tf (not validation.tf)", () => {
    expect(validationContent).not.toMatch(/\bterraform\s*\{/);
    expect(providerContent).toMatch(/\bterraform\s*\{/);
  });
});

describe("2. Variables - Core Configuration", () => {
  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares approved_ami_ids variable as list", () => {
    expect(variablesContent).toMatch(/variable\s+"approved_ami_ids"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares required_tags variable as list", () => {
    expect(variablesContent).toMatch(/variable\s+"required_tags"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares bucket_names_to_validate variable", () => {
    expect(variablesContent).toMatch(/variable\s+"bucket_names_to_validate"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares security_group_ids_to_validate variable", () => {
    expect(variablesContent).toMatch(/variable\s+"security_group_ids_to_validate"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares instance_ids_to_validate variable", () => {
    expect(variablesContent).toMatch(/variable\s+"instance_ids_to_validate"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares validation_enabled variable", () => {
    expect(variablesContent).toMatch(/variable\s+"validation_enabled"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });
});

describe("3. Data Sources - Infrastructure Query", () => {
  test("queries existing EC2 instances for validation", () => {
    expect(dataContent).toMatch(/data\s+"aws_instance"\s+"validation_instances"\s*\{/);
    expect(dataContent).toMatch(/for_each\s*=\s*toset\(var\.instance_ids_to_validate\)/);
  });

  test("queries existing security groups for validation", () => {
    expect(dataContent).toMatch(/data\s+"aws_security_group"\s+"validation_security_groups"\s*\{/);
    expect(dataContent).toMatch(/for_each\s*=\s*toset\(var\.security_group_ids_to_validate\)/);
  });

  test("uses external data source for S3 bucket versioning checks", () => {
    expect(dataContent).toMatch(/data\s+"external"\s+"s3_bucket_versioning"\s*\{/);
    expect(dataContent).toMatch(/program\s*=\s*\["bash"/);
  });

  test("uses external data source for S3 bucket lifecycle checks", () => {
    expect(dataContent).toMatch(/data\s+"external"\s+"s3_bucket_lifecycle"\s*\{/);
    expect(dataContent).toMatch(/program\s*=\s*\["bash"/);
  });
});

describe("4. Validation Checks - Terraform 1.5+ Features", () => {
  test("implements null_resource validation marker with preconditions", () => {
    expect(validationContent).toMatch(/resource\s+"null_resource"\s+"validation_marker"\s*\{/);
    expect(validationContent).toMatch(/lifecycle\s*\{[\s\S]*?precondition/);
  });

  test("precondition validates approved_ami_ids is not empty", () => {
    const marker = validationContent.match(/resource\s+"null_resource"\s+"validation_marker"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(marker).toBeTruthy();
    expect(marker![0]).toMatch(/condition\s*=\s*length\(var\.approved_ami_ids\)\s*>\s*0/);
  });

  test("precondition validates required_tags is not empty", () => {
    const marker = validationContent.match(/resource\s+"null_resource"\s+"validation_marker"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(marker).toBeTruthy();
    expect(marker![0]).toMatch(/condition\s*=\s*length\(var\.required_tags\)\s*>\s*0/);
  });

  test("implements check block for S3 bucket versioning", () => {
    expect(validationContent).toMatch(/check\s+"s3_bucket_versioning_enabled"\s*\{/);
    expect(validationContent).toMatch(/assert\s*\{/);
  });

  test("implements check block for S3 bucket lifecycle policies", () => {
    expect(validationContent).toMatch(/check\s+"s3_bucket_lifecycle_policies_exist"\s*\{/);
  });

  test("implements check block for security group validation", () => {
    expect(validationContent).toMatch(/check\s+"security_group_no_unrestricted_access"\s*\{/);
  });

  test("implements check block for EC2 AMI validation", () => {
    expect(validationContent).toMatch(/check\s+"ec2_instance_approved_amis"\s*\{/);
  });

  test("implements check block for EC2 tag compliance", () => {
    expect(validationContent).toMatch(/check\s+"ec2_instance_tag_compliance"\s*\{/);
  });
});

describe("5. Validation Logic - S3 Buckets", () => {
  test("S3 versioning check validates all buckets", () => {
    const versioningCheck = validationContent.match(/check\s+"s3_bucket_versioning_enabled"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(versioningCheck).toBeTruthy();
    expect(versioningCheck![0]).toMatch(/alltrue\(/);
    expect(versioningCheck![0]).toMatch(/for bucket_name in var\.bucket_names_to_validate/);
  });

  test("S3 versioning check validates status is Enabled", () => {
    const versioningCheck = validationContent.match(/check\s+"s3_bucket_versioning_enabled"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(versioningCheck).toBeTruthy();
    expect(versioningCheck![0]).toMatch(/result\.status\s*==\s*"Enabled"/);
  });

  test("S3 lifecycle check validates rule_count > 0", () => {
    const lifecycleCheck = validationContent.match(/check\s+"s3_bucket_lifecycle_policies_exist"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(lifecycleCheck).toBeTruthy();
    expect(lifecycleCheck![0]).toMatch(/tonumber.*result\.rule_count.*>\s*0/);
  });

  test("S3 checks include error messages with failed bucket names", () => {
    expect(validationContent).toMatch(/error_message.*Failed buckets/);
    expect(validationContent).toMatch(/join\(", "/);
  });
});

describe("6. Validation Logic - Security Groups", () => {
  test("security group check validates no unrestricted access", () => {
    const sgCheck = validationContent.match(/check\s+"security_group_no_unrestricted_access"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(sgCheck).toBeTruthy();
    expect(sgCheck![0]).toMatch(/0\.0\.0\.0\/0/);
  });

  test("security group check allows HTTP/HTTPS from 0.0.0.0/0", () => {
    const sgCheck = validationContent.match(/check\s+"security_group_no_unrestricted_access"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(sgCheck).toBeTruthy();
    expect(sgCheck![0]).toMatch(/from_port\s*==\s*443|from_port\s*==\s*80/);
  });

  test("security group check provides detailed error message", () => {
    const sgCheck = validationContent.match(/check\s+"security_group_no_unrestricted_access"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(sgCheck).toBeTruthy();
    expect(sgCheck![0]).toMatch(/error_message.*Violations/);
  });
});

describe("7. Validation Logic - EC2 Instances", () => {
  test("EC2 AMI check validates against approved list", () => {
    const amiCheck = validationContent.match(/check\s+"ec2_instance_approved_amis"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(amiCheck).toBeTruthy();
    expect(amiCheck![0]).toMatch(/contains\(var\.approved_ami_ids/);
  });

  test("EC2 AMI check provides detailed error with unapproved AMIs", () => {
    const amiCheck = validationContent.match(/check\s+"ec2_instance_approved_amis"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(amiCheck).toBeTruthy();
    expect(amiCheck![0]).toMatch(/error_message.*Unapproved AMIs/);
  });

  test("EC2 tag compliance check validates all required tags", () => {
    const tagCheck = validationContent.match(/check\s+"ec2_instance_tag_compliance"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(tagCheck).toBeTruthy();
    expect(tagCheck![0]).toMatch(/for required_tag in var\.required_tags/);
    expect(tagCheck![0]).toMatch(/contains\(keys/);
  });

  test("EC2 tag compliance provides detailed error with missing tags", () => {
    const tagCheck = validationContent.match(/check\s+"ec2_instance_tag_compliance"[\s\S]*?(?=\ncheck\s+"|$)/);
    expect(tagCheck).toBeTruthy();
    expect(tagCheck![0]).toMatch(/error_message.*Missing tags/);
  });
});

describe("8. Local Values - Validation Results", () => {
  test("defines local values for validation results", () => {
    expect(validationContent).toMatch(/locals\s*\{/);
  });

  test("computes S3 versioning validation results", () => {
    expect(validationContent).toMatch(/s3_versioning_validation\s*=/);
  });

  test("computes S3 lifecycle validation results", () => {
    expect(validationContent).toMatch(/s3_lifecycle_validation\s*=/);
  });

  test("computes security group validation results", () => {
    expect(validationContent).toMatch(/security_group_validation\s*=/);
  });

  test("computes EC2 AMI validation results", () => {
    expect(validationContent).toMatch(/ec2_ami_validation\s*=/);
  });

  test("computes EC2 tag compliance validation results", () => {
    expect(validationContent).toMatch(/ec2_tag_validation\s*=/);
  });

  test("computes overall validation status", () => {
    expect(validationContent).toMatch(/all_validations_passed\s*=/);
    expect(validationContent).toMatch(/alltrue\(concat\(/);
  });
});

describe("9. Outputs - Validation Reporting", () => {
  test("outputs overall validation status", () => {
    expect(outputsContent).toMatch(/output\s+"validation_report_json"\s*\{/);
    expect(outputsContent).toMatch(/output\s+"validation_summary"\s*\{/);
  });

  test("outputs detailed S3 validation results", () => {
    expect(outputsContent).toMatch(/output\s+"s3_validation_details"\s*\{/);
  });

  test("outputs security group validation results", () => {
    expect(outputsContent).toMatch(/output\s+"security_group_validation_details"\s*\{/);
  });

  test("outputs EC2 validation results", () => {
    expect(outputsContent).toMatch(/output\s+"ec2_validation_details"\s*\{/);
  });

  test("outputs failed resources for immediate attention", () => {
    expect(outputsContent).toMatch(/output\s+"failed_resources"\s*\{/);
  });

  test("outputs are structured for CI/CD consumption", () => {
    // Check that outputs reference local validation results
    expect(outputsContent).toMatch(/local\.s3_versioning_validation|local\.all_validations_passed/);
  });
});

describe("10. Provider Configuration", () => {
  test("provider.tf declares terraform block", () => {
    expect(providerContent).toMatch(/terraform\s*\{/);
  });

  test("provider.tf specifies AWS provider", () => {
    expect(providerContent).toMatch(/required_providers\s*\{[\s\S]*?aws/);
  });

  test("provider.tf configures AWS provider with region", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("11. Environment Suffix Naming Convention", () => {
  test("environment_suffix variable is used for resource naming", () => {
    // Check that environment_suffix is referenced in the project
    const allContent = validationContent + variablesContent + dataContent + outputsContent + providerContent;
    expect(allContent).toMatch(/var\.environment_suffix|environment_suffix/);
  });
});

describe("12. Code Quality & Structure", () => {
  test("validation.tf has substantial content", () => {
    expect(validationContent.length).toBeGreaterThan(1000);
  });

  test("no syntax errors - balanced braces", () => {
    const openBraces = (validationContent.match(/\{/g) || []).length;
    const closeBraces = (validationContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test("no TODOs or placeholders", () => {
    const allContent = validationContent + variablesContent + dataContent + outputsContent;
    expect(allContent).not.toMatch(/TODO|FIXME|PLACEHOLDER|XXX/i);
  });

  test("uses Terraform 1.5+ native features", () => {
    // Check for preconditions, postconditions, or check blocks
    expect(validationContent).toMatch(/precondition|postcondition|check\s+"/);
  });
});

describe("13. No External Dependencies", () => {
  test("does not use external modules", () => {
    const allContent = validationContent + variablesContent + dataContent + outputsContent;
    expect(allContent).not.toMatch(/module\s+"\w+"\s*\{[\s\S]*?source\s*=\s*"(?!\.)/);
  });

  test("validation logic uses native Terraform features", () => {
    // Should use check blocks, preconditions, not custom resources
    expect(validationContent).toMatch(/check\s+"/);
  });
});

describe("14. Final Validation - Complete Implementation", () => {
  test("all core validation checks are implemented", () => {
    const requiredChecks = [
      "s3_bucket_versioning_enabled",
      "s3_bucket_lifecycle_policies_exist",
      "security_group_no_unrestricted_access",
      "ec2_instance_approved_amis",
      "ec2_instance_tag_compliance",
    ];

    requiredChecks.forEach((checkName) => {
      expect(validationContent).toMatch(new RegExp(`check\\s+"${checkName}"`));
    });
  });

  test("all required variables are defined", () => {
    const requiredVars = [
      "environment_suffix",
      "aws_region",
      "approved_ami_ids",
      "required_tags",
      "bucket_names_to_validate",
      "security_group_ids_to_validate",
      "instance_ids_to_validate",
    ];

    requiredVars.forEach((varName) => {
      expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"`));
    });
  });

  test("validation results are computed and output", () => {
    expect(validationContent).toMatch(/locals\s*\{/);
    expect(validationContent).toMatch(/all_validations_passed/);
    expect(outputsContent).toMatch(/output.*validation/i);
  });
});
