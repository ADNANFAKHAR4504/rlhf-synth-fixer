// tests/unit/unit-tests.ts
// Terraform file structure validation tests
// Validates presence and basic structure of Terraform HCL files

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_TF = path.join(LIB_DIR, "main.tf");
const VARIABLES_TF = path.join(LIB_DIR, "variables.tf");
const OUTPUTS_TF = path.join(LIB_DIR, "outputs.tf");

describe("Terraform Infrastructure Files", () => {
  test("lib/main.tf exists", () => {
    const exists = fs.existsSync(MAIN_TF);
    if (!exists) {
      console.error(`[unit] Expected main.tf at: ${MAIN_TF}`);
    }
    expect(exists).toBe(true);
  });

  test("lib/variables.tf exists", () => {
    const exists = fs.existsSync(VARIABLES_TF);
    if (!exists) {
      console.error(`[unit] Expected variables.tf at: ${VARIABLES_TF}`);
    }
    expect(exists).toBe(true);
  });

  test("lib/outputs.tf exists", () => {
    const exists = fs.existsSync(OUTPUTS_TF);
    if (!exists) {
      console.error(`[unit] Expected outputs.tf at: ${OUTPUTS_TF}`);
    }
    expect(exists).toBe(true);
  });

  test("main.tf declares AWS provider", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("main.tf declares VPC resource", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("main.tf declares ALB resource", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
  });

  test("main.tf declares Auto Scaling Group", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
  });

  test("variables.tf declares environment_suffix variable", () => {
    const content = fs.readFileSync(VARIABLES_TF, "utf8");
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("variables.tf declares aws_region variable", () => {
    const content = fs.readFileSync(VARIABLES_TF, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("outputs.tf declares alb_dns_name output", () => {
    const content = fs.readFileSync(OUTPUTS_TF, "utf8");
    expect(content).toMatch(/output\s+"alb_dns_name"\s*{/);
  });

  test("outputs.tf declares autoscaling_group_name output", () => {
    const content = fs.readFileSync(OUTPUTS_TF, "utf8");
    expect(content).toMatch(/output\s+"autoscaling_group_name"\s*{/);
  });

  test("main.tf uses environment_suffix in resource naming", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/\$\{var\.environment_suffix\}/);
  });

  test("main.tf configures CloudWatch alarms for scaling", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("main.tf has security groups for ALB and EC2", () => {
    const content = fs.readFileSync(MAIN_TF, "utf8");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });
});
