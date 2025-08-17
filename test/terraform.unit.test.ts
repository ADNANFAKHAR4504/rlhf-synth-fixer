import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Plan: main.json", () => {
  test("main.json exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected Terraform plan at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // Load and parse the plan JSON (only once)
  let plan: any;
  beforeAll(() => {
    const planData = fs.readFileSync(stackPath, "utf8");
    plan = JSON.parse(planData);
  });

  // --- Sanity checks ---
  test("VPC should have correct CIDR", () => {
    const vpcResource = plan.resource_changes.find(
      (r: any) => r.type === "aws_vpc" && r.name === "main"
    );
    expect(vpcResource?.change?.after?.cidr_block).toBe("172.31.0.0/16");
  });

  test("Should create a public subnet with correct CIDR", () => {
    const publicSubnet = plan.resource_changes.find(
      (r: any) => r.type === "aws_subnet" && r.name === "public"
    );
    expect(publicSubnet?.change?.after?.cidr_block).toBe("172.31.0.0/20");
  });

  test("Should create a private subnet with correct CIDR", () => {
    const privateSubnet = plan.resource_changes.find(
      (r: any) => r.type === "aws_subnet" && r.name === "private"
    );
    expect(privateSubnet?.change?.after?.cidr_block).toBe("172.31.16.0/20");
  });

  test("Bastion host should have IAM instance profile", () => {
    const bastionInstance = plan.resource_changes.find(
      (r: any) => r.type === "aws_instance" && r.name === "bastion"
    );
    expect(bastionInstance?.change?.after?.iam_instance_profile).toBeDefined();
  });

  test("Secrets Manager secret should exist", () => {
    const secret = plan.resource_changes.find(
      (r: any) => r.type === "aws_secretsmanager_secret" && r.name === "app_secrets"
    );
    expect(secret).toBeDefined();
  });
});
