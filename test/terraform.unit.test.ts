import * as fs from "fs";
import * as path from "path";

let plan: any;
let planFilePath: string;

beforeAll(() => {
  // Allow path override via environment variable
  const defaultPath = path.resolve(__dirname, "../lib/main.json");
  planFilePath = process.env.PLAN_JSON || defaultPath;

  if (!fs.existsSync(planFilePath)) {
    throw new Error(`Terraform plan JSON file not found: ${planFilePath}`);
  }

  const raw = fs.readFileSync(planFilePath, "utf8");
  plan = JSON.parse(raw);
});

describe("Terraform plan.json structure", () => {
  it("VPC should have correct CIDR", () => {
    const vpcResource = plan.resource_changes.find(
      (r: any) => r.type === "aws_vpc" && r.name === "main"
    );
    expect(vpcResource).toBeDefined();
    expect(vpcResource.change.after.cidr_block).toBe("10.0.0.0/16");
  });

  it("Should create a public subnet with correct CIDR", () => {
    const publicSubnet = plan.resource_changes.find(
      (r: any) => r.type === "aws_subnet" && r.name === "public"
    );
    expect(publicSubnet).toBeDefined();
    expect(publicSubnet.change.after.cidr_block).toBe("10.0.1.0/24");
  });

  it("Should create a private subnet with correct CIDR", () => {
    const privateSubnet = plan.resource_changes.find(
      (r: any) => r.type === "aws_subnet" && r.name === "private"
    );
    expect(privateSubnet).toBeDefined();
    expect(privateSubnet.change.after.cidr_block).toBe("10.0.2.0/24");
  });

  it("Bastion host should have IAM instance profile", () => {
    const bastionInstance = plan.resource_changes.find(
      (r: any) => r.type === "aws_instance" && r.name === "bastion"
    );
    expect(bastionInstance).toBeDefined();
    expect(bastionInstance.change.after.iam_instance_profile).toBeDefined();
  });

  it("Secrets Manager secret should exist", () => {
    const secret = plan.resource_changes.find(
      (r: any) => r.type === "aws_secretsmanager_secret" && r.name === "app_secrets"
    );
    expect(secret).toBeDefined();
  });

  it("Does not contain hardcoded AWS credentials in plan JSON", () => {
    const planString = JSON.stringify(plan);
    expect(/aws_access_key_id\s*=/.test(planString)).toBe(false);
    expect(/aws_secret_access_key\s*=/.test(planString)).toBe(false);
  });
});
