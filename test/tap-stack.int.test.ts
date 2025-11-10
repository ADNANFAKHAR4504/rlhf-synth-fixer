import * as fs from "fs";
import * as path from "path";

describe("Financial Services VPC Integration Tests", () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(
      process.cwd(),
      "cfn-outputs",
      "flat-outputs.json"
    );

    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
    }
  });

  describe("Stack Outputs Validation", () => {
    test("Outputs file exists", () => {
      const outputsPath = path.join(
        process.cwd(),
        "cfn-outputs",
        "flat-outputs.json"
      );
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("VPC ID output is present", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs.vpc_id).toMatch(/^vpc-/);
    });

    test("Public subnet IDs output is present and valid", () => {
      expect(outputs).toHaveProperty("public_subnet_ids");
      const subnetIds = JSON.parse(outputs.public_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      subnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
    });

    test("Private subnet IDs output is present and valid", () => {
      expect(outputs).toHaveProperty("private_subnet_ids");
      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      subnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
    });

    test("NAT Gateway IDs output is present and valid", () => {
      expect(outputs).toHaveProperty("nat_gateway_ids");
      const natIds = JSON.parse(outputs.nat_gateway_ids);
      expect(Array.isArray(natIds)).toBe(true);
      expect(natIds.length).toBe(3);
      natIds.forEach((id: string) => {
        expect(id).toMatch(/^nat-/);
      });
    });

    test("Internet Gateway ID output is present", () => {
      expect(outputs).toHaveProperty("internet_gateway_id");
      expect(outputs.internet_gateway_id).toMatch(/^igw-/);
    });

    test("Flow logs bucket output is present", () => {
      expect(outputs).toHaveProperty("flow_logs_bucket");
      expect(outputs.flow_logs_bucket).toContain("vpc-flow-logs");
    });
  });

  describe("Resource Naming Conventions", () => {
    test("Resources include environment suffix in names", () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

      if (outputs.flow_logs_bucket) {
        expect(outputs.flow_logs_bucket).toContain(environmentSuffix);
      }
    });
  });
});
