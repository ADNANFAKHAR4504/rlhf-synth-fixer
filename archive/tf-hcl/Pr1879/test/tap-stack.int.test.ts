import * as fs from "fs";
import * as path from "path";

// Senior recommendation: use cfn-outputs/all-outputs.json as the primary path for structured outputs
const allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

// Optionally support legacy flat outputs for backward compatibility
const flatPath = path.resolve(process.cwd(), 'cfn-outputs.json');

let deploymentOutputs: any = {};
let outputFormat: 'flat' | 'all' = 'all';

if (fs.existsSync(allOutputsPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
  outputFormat = 'all';
} else if (fs.existsSync(flatPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(flatPath, "utf8"));
  outputFormat = 'flat';
} else {
  throw new Error("No Terraform outputs file found at cfn-outputs/all-outputs.json or cfn-outputs.json.");
}

function getOutput(key: string): any {
  if (!deploymentOutputs[key]) return undefined;
  if (outputFormat === 'flat') {
    return deploymentOutputs[key];
  } else if (outputFormat === 'all') {
    return deploymentOutputs[key].value !== undefined ? deploymentOutputs[key].value : deploymentOutputs[key];
  }
  return undefined;
}

describe("Terraform High Availability Web App E2E Deployment Outputs", () => {
  it("should include all expected output keys", () => {
    const expectedKeys = [
      "autoscaling_group_name",
      "availability_zones",
      "elb_security_group_id",
      "load_balancer_dns_name",
      "load_balancer_zone_id",
      "private_subnet_ids",
      "public_subnet_ids",
      "sns_topic_arn",
      "vpc_id",
      "web_servers_security_group_id",
    ];
    expectedKeys.forEach((key) => {
      expect(deploymentOutputs).toHaveProperty(key);
      expect(deploymentOutputs[key]).toBeDefined();
    });
  });

  it("should have valid formats for IDs and ARNs", () => {
    expect(getOutput("vpc_id")).toMatch(/^vpc-[a-z0-9]+$/);
    expect(getOutput("elb_security_group_id")).toMatch(/^sg-[a-z0-9]+$/);
    expect(getOutput("web_servers_security_group_id")).toMatch(/^sg-[a-z0-9]+$/);
    expect(getOutput("sns_topic_arn")).toMatch(/^arn:aws:sns:us-east-1:/);

    // Arrays may be JSON strings (flat) or arrays (structured)
    const publicSubnets = typeof getOutput("public_subnet_ids") === "string"
      ? JSON.parse(getOutput("public_subnet_ids"))
      : getOutput("public_subnet_ids");
    publicSubnets.forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    const privateSubnets = typeof getOutput("private_subnet_ids") === "string"
      ? JSON.parse(getOutput("private_subnet_ids"))
      : getOutput("private_subnet_ids");
    privateSubnets.forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  it("should have correct values for environment and region", () => {
    expect(getOutput("autoscaling_group_name")).toContain("-dev");
    expect(getOutput("load_balancer_dns_name")).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);

    const azs = typeof getOutput("availability_zones") === "string"
      ? JSON.parse(getOutput("availability_zones"))
      : getOutput("availability_zones");
    expect(azs).toEqual(expect.arrayContaining(["us-east-1a", "us-east-1b"]));
  });

  it("should expose a reachable DNS for the load balancer", () => {
    expect(getOutput("load_balancer_dns_name")).toMatch(
      /^ha-web-app-alb-dev-[a-z0-9\-]+\.us-east-1\.elb\.amazonaws\.com$/
    );
  });

  // Add more resource-level E2E checks as needed
});