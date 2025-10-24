// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform multi-file structure
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const mainTfPath = path.join(LIB_DIR, "main.tf");
const providerTfPath = path.join(LIB_DIR, "provider.tf");
const variableTfPath = path.join(LIB_DIR, "variable.tf");
const outputsTfPath = path.join(LIB_DIR, "outputs.tf");

describe("Terraform multi-file structure", () => {
  test("main.tf exists", () => {
    expect(fs.existsSync(mainTfPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(providerTfPath)).toBe(true);
  });

  test("variable.tf exists", () => {
    expect(fs.existsSync(variableTfPath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    expect(fs.existsSync(outputsTfPath)).toBe(true);
  });

  test("main.tf does NOT declare provider (provider.tf owns it)", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).not.toMatch(/^provider\s+"aws"\s*{/m);
  });

  test("main.tf does NOT declare terraform block (provider.tf owns it)", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).not.toMatch(/^terraform\s*{/m);
  });

  test("provider.tf declares terraform block", () => {
    const content = fs.readFileSync(providerTfPath, "utf8");
    expect(content).toMatch(/terraform\s*{/);
  });

  test("provider.tf declares AWS provider", () => {
    const content = fs.readFileSync(providerTfPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf declares random provider", () => {
    const content = fs.readFileSync(providerTfPath, "utf8");
    expect(content).toMatch(/provider\s+"random"\s*{/);
  });

  test("variable.tf declares region variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"region"\s*{/);
  });

  test("variable.tf declares vpc_cidr variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("variable.tf declares environment variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"environment"\s*{/);
  });

  test("variable.tf declares cloudhsm_cluster_id variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"cloudhsm_cluster_id"\s*{/);
  });

  test("variable.tf declares notification_email variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"notification_email"\s*{/);
  });

  test("variable.tf declares allowed_ips variable", () => {
    const content = fs.readFileSync(variableTfPath, "utf8");
    expect(content).toMatch(/variable\s+"allowed_ips"\s*{/);
  });

  test("main.tf declares VPC resource", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("main.tf declares KMS key resource", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"master"\s*{/);
  });

  test("main.tf declares CloudHSM custom key store", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_custom_key_store"\s+"cloudhsm"\s*{/);
  });

  test("main.tf declares Network Firewall", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_networkfirewall_firewall"\s+"main"\s*{/);
  });

  test("main.tf declares GuardDuty detector", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"\s*{/);
  });

  test("main.tf declares Security Hub account", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_securityhub_account"\s+"main"\s*{/);
  });

  test("main.tf declares AWS Config recorder", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
  });

  test("main.tf declares CloudTrail", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
  });

  test("main.tf declares Macie account", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_macie2_account"\s+"main"\s*{/);
  });

  test("main.tf declares Aurora RDS cluster", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
  });

  test("main.tf declares FSx Lustre filesystem", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_fsx_lustre_file_system"\s+"main"\s*{/);
  });

  test("main.tf declares Lambda security response function", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"security_response"\s*{/);
  });

  test("main.tf declares EC2 host resources", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_ec2_host"\s+"main"\s*{/);
  });

  test("main.tf uses aws_s3_object (not deprecated aws_s3_bucket_object)", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_object"\s+"threat_list"\s*{/);
    expect(content).not.toMatch(/resource\s+"aws_s3_bucket_object"/);
  });

  test("main.tf uses aws_s3_bucket_server_side_encryption_configuration", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).not.toMatch(/resource\s+"aws_s3_bucket_encryption"\s+/);
  });

  test("main.tf declares Lambda rotate secret function", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"rotate_secret"\s*{/);
  });

  test("main.tf declares SNS topic for security alerts", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
  });

  test("main.tf declares Secrets Manager secret", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_master"\s*{/);
  });

  test("main.tf declares random password resources", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/resource\s+"random_password"/);
  });

  test("outputs.tf declares vpc_id output", () => {
    const content = fs.readFileSync(outputsTfPath, "utf8");
    expect(content).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("outputs.tf declares kms_key_arn output", () => {
    const content = fs.readFileSync(outputsTfPath, "utf8");
    expect(content).toMatch(/output\s+"kms_key_arn"\s*{/);
  });

  test("outputs.tf declares aurora_cluster_endpoint output", () => {
    const content = fs.readFileSync(outputsTfPath, "utf8");
    expect(content).toMatch(/output\s+"aurora_cluster_endpoint"\s*{/);
  });

  test("outputs.tf declares fsx_dns_name output", () => {
    const content = fs.readFileSync(outputsTfPath, "utf8");
    expect(content).toMatch(/output\s+"fsx_dns_name"\s*{/);
  });

  test("required files exist (customerCA.crt)", () => {
    expect(fs.existsSync(path.join(LIB_DIR, "customerCA.crt"))).toBe(true);
  });

  test("required files exist (threat_list.txt)", () => {
    expect(fs.existsSync(path.join(LIB_DIR, "threat_list.txt"))).toBe(true);
  });

  test("required files exist (security_response.zip)", () => {
    expect(fs.existsSync(path.join(LIB_DIR, "security_response.zip"))).toBe(true);
  });

  test("required files exist (rotate_secret.zip)", () => {
    expect(fs.existsSync(path.join(LIB_DIR, "rotate_secret.zip"))).toBe(true);
  });
});