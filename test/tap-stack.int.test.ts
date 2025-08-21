import * as fs from "fs";
import * as path from "path";

const outputsPath = path.join(__dirname, "../cfn-outputs.json");
const deploymentOutputs = fs.existsSync(outputsPath) ? JSON.parse(fs.readFileSync(outputsPath, "utf8")) : {};

function getOutput(key: string): any {
  // Handles both flat and structured outputs
  if (!deploymentOutputs[key]) return undefined;
  return deploymentOutputs[key].value !== undefined ? deploymentOutputs[key].value : deploymentOutputs[key];
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

    JSON.parse(getOutput("public_subnet_ids")).forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
    JSON.parse(getOutput("private_subnet_ids")).forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  it("should have correct values for environment and region", () => {
    expect(getOutput("autoscaling_group_name")).toContain("-dev");
    expect(getOutput("load_balancer_dns_name")).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);

    expect(JSON.parse(getOutput("availability_zones"))).toEqual(
      expect.arrayContaining(["us-east-1a", "us-east-1b"])
    );
  });

  it("should expose a reachable DNS for the load balancer", () => {
    expect(getOutput("load_balancer_dns_name")).toMatch(
      /^ha-web-app-alb-dev-[a-z0-9\-]+\.us-east-1\.elb\.amazonaws\.com$/
    );
  });

  // Add more resource-level E2E checks as needed
});