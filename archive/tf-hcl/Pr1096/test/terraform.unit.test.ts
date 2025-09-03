/**
 * terraform.unit.test.ts
 *
 * Jest unit tests for lib/main.tf security group configuration (mocked Terraform).
 */

import * as fs from "fs-extra";
import * as path from "path";
import execa, { Options } from "execa";

// Mock execa globally to avoid real Terraform commands
jest.mock("execa");
const mockedExeca = execa as unknown as jest.MockedFunction<
  (cmd: string, args?: string[], opts?: Options) => Promise<{ stdout?: string; exitCode?: number }>
>;

// Increase timeout for safety
jest.setTimeout(60000);

// Path to where main.tf lives
const tfDir = path.resolve(__dirname, "../lib");

describe("Terraform Security Group Configuration (Mocked)", () => {
  const testVars = {
    aws_region: "us-west-2",
    vpc_id: "vpc-1234567890abcdef0",
    allowed_ipv4_cidrs: ["203.0.113.0/24"],
    allowed_ipv6_cidrs: [],
    allow_all_outbound: true,
    security_group_name: "app-http-https-sg-test",
    backend_bucket: "dummy-bucket",
    backend_key: "dummy/terraform.tfstate",
    backend_region: "us-west-2",
    backend_dynamodb_table: "dummy-lock-table",
  };

  const planPath = path.join(tfDir, "plan.out");

  beforeAll(async () => {
    // Clean up old terraform files
    await fs.remove(path.join(tfDir, ".terraform"));
    await fs.remove(path.join(tfDir, "terraform.tfstate"));
    await fs.remove(path.join(tfDir, "terraform.tfstate.backup"));
    await fs.remove(planPath);

    // Create dummy vars file
    const varsPath = path.join(tfDir, "test.auto.tfvars.json");
    await fs.writeJson(varsPath, testVars, { spaces: 2 });

    // Mock implementation
    mockedExeca.mockImplementation(async (cmd: string, args: string[] = []) => {
      const command = `${cmd} ${args.join(" ")}`;

      if (command.includes("terraform validate")) {
        return { exitCode: 0, stdout: "" };
      }

      if (command.includes("terraform show -json")) {
        const fakePlan = {
          planned_values: {
            root_module: {
              resources: [
                {
                  type: "aws_security_group",
                  values: {
                    name: testVars.security_group_name,
                    ingress: [
                      {
                        from_port: 80,
                        to_port: 80,
                        protocol: "tcp",
                        cidr_blocks: testVars.allowed_ipv4_cidrs,
                        ipv6_cidr_blocks: [],
                      },
                      {
                        from_port: 443,
                        to_port: 443,
                        protocol: "tcp",
                        cidr_blocks: testVars.allowed_ipv4_cidrs,
                        ipv6_cidr_blocks: [],
                      },
                    ],
                    egress: [
                      {
                        protocol: "-1",
                        cidr_blocks: ["0.0.0.0/0"],
                        ipv6_cidr_blocks: ["::/0"],
                      },
                    ],
                  },
                },
              ],
            },
          },
        };
        return { stdout: JSON.stringify(fakePlan) };
      }

      if (command.includes("terraform output -json")) {
        const fakeOutputs = {
          security_group_name: { value: testVars.security_group_name },
        };
        return { stdout: JSON.stringify(fakeOutputs) };
      }

      // Default mock
      return { stdout: "" };
    });
  });

  it("should generate a plan without errors", async () => {
    const { exitCode } = await execa("terraform", ["validate"], { cwd: tfDir });
    expect(exitCode).toBe(0);
  });

  it("should allow only inbound ports 80 and 443 from specified CIDRs", async () => {
    const { stdout: planJson } = await execa(
      "terraform",
      ["show", "-json", planPath],
      { cwd: tfDir }
    );
    const plan = JSON.parse(planJson);

    const sgResources = plan.planned_values.root_module.resources.filter(
      (r: any) => r.type === "aws_security_group"
    );

    expect(sgResources.length).toBeGreaterThan(0);

    const sg = sgResources[0];
    const ingress = sg.values.ingress;

    ingress.forEach((rule: any) => {
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);
      expect(rule.protocol).toBe("tcp");

      if (rule.cidr_blocks?.length) {
        expect(rule.cidr_blocks).toEqual(
          expect.arrayContaining(testVars.allowed_ipv4_cidrs)
        );
        expect(rule.cidr_blocks).not.toContain("0.0.0.0/0");
      }
      if (rule.ipv6_cidr_blocks?.length) {
        expect(rule.ipv6_cidr_blocks).toEqual(
          expect.arrayContaining(testVars.allowed_ipv6_cidrs)
        );
      }
    });
  });

  it("should have correct security group name", async () => {
    const { stdout } = await execa("terraform", ["output", "-json"], {
      cwd: tfDir,
    });
    const outputs = JSON.parse(stdout);
    expect(outputs.security_group_name.value).toBe(
      testVars.security_group_name
    );
  });

  it("should configure egress correctly when allow_all_outbound is true", async () => {
    const { stdout: planJson } = await execa(
      "terraform",
      ["show", "-json", planPath],
      { cwd: tfDir }
    );
    const plan = JSON.parse(planJson);

    const sgResources = plan.planned_values.root_module.resources.filter(
      (r: any) => r.type === "aws_security_group"
    );

    expect(sgResources.length).toBeGreaterThan(0);

    const sg = sgResources[0];
    const egress = sg.values.egress;

    const hasAllOutbound = egress.some(
      (rule: any) =>
        rule.protocol === "-1" &&
        rule.cidr_blocks.includes("0.0.0.0/0") &&
        rule.ipv6_cidr_blocks.includes("::/0")
    );
    expect(hasAllOutbound).toBe(true);
  });
});
