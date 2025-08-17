import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; 
const VARS_REL = "../lib/vars.tf"; 

const stackPath = path.resolve(__dirname, STACK_REL);
const varsPath = path.resolve(__dirname, VARS_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(stackPath, "utf8");

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // --- Data sources ---
  test("declares AWS availability zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("declares AWS AMI data source", () => {
    expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
  });

  // --- Resources ---
  test("declares random_password for db", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });

  test("declares Secrets Manager secret and version", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_secrets"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"app_secrets_version"/);
  });

  test("declares VPC", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("declares Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares Public and Private Subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("declares EIP and NAT Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares Route Tables (public & private)", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("declares Route Table Associations", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
  });

  test("declares Security Groups", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"bastion"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"private_instance"/);
  });

  test("declares IAM Role, Policy, and Attachments", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_secrets_role"/);
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_secrets_policy"/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_secrets_attachment"/);
  });

  test("declares IAM Instance Profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
  });

  test("declares Bastion and Private EC2 instances", () => {
    expect(content).toMatch(/resource\s+"aws_instance"\s+"bastion"/);
    expect(content).toMatch(/resource\s+"aws_instance"\s+"private"/);
  });
});

describe("Terraform variables file: vars.tf", () => {
  test("vars.tf exists", () => {
    const exists = fs.existsSync(varsPath);
    if (!exists) {
      console.error(`[unit] Expected vars at: ${varsPath}`);
    }
    expect(exists).toBe(true);
  });

  const varsContent = fs.readFileSync(varsPath, "utf8");

  test("declares aws_region variable", () => {
    expect(varsContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares project variable", () => {
    expect(varsContent).toMatch(/variable\s+"project"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares subnet variables", () => {
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidr"\s*{/);
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidr"\s*{/);
  });

  test("declares EC2 instance type and key pair variables", () => {
    expect(varsContent).toMatch(/variable\s+"ec2_instance_type"\s*{/);
    expect(varsContent).toMatch(/variable\s+"key_pair_name"\s*{/);
  });

  test("declares db_password_length variable", () => {
    expect(varsContent).toMatch(/variable\s+"db_password_length"\s*{/);
  });
});
