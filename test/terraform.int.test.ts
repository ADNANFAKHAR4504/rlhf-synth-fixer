import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface IngressRule {
  protocol: string;
  from_port: number;
  to_port: number;
  cidr_v4?: string;
  cidr_v6?: string;
}

describe("Terraform Security Group Integration Test", () => {
  // ✅ Point this to the folder with your .tf files
  const tfDir = path.resolve(__dirname, "../lib");
  const planFile = "tfplan.json";

  beforeAll(() => {
    if (!fs.existsSync(tfDir)) {
      throw new Error(`Terraform directory not found: ${tfDir}`);
    }

    // ✅ Run `terraform init` with backend disabled so S3 is not used in tests
    const initResult = spawnSync(
      "terraform",
      ["init", "-input=false", "-backend=false"],
      { cwd: tfDir, encoding: "utf-8" }
    );
    if (initResult.status !== 0) {
      throw new Error(
        `Terraform init failed:\n${initResult.stdout}\n${initResult.stderr}`
      );
    }

    // ✅ Plan without needing remote backend
    const planOut = spawnSync(
      "terraform",
      ["plan", "-input=false", "-out=tfplan"],
      { cwd: tfDir, encoding: "utf-8" }
    );
    if (planOut.status !== 0) {
      throw new Error(
        `Terraform plan failed:\n${planOut.stdout}\n${planOut.stderr}`
      );
    }

    const showOut = spawnSync(
      "terraform",
      ["show", "-json", "tfplan"],
      { cwd: tfDir, encoding: "utf-8" }
    );
    if (showOut.status !== 0) {
      throw new Error(
        `Terraform show failed:\n${showOut.stdout}\n${showOut.stderr}`
      );
    }

    fs.writeFileSync(path.join(tfDir, planFile), showOut.stdout);
  });

  afterAll(() => {
    const planPath = path.join(tfDir, planFile);
    if (fs.existsSync(planPath)) {
      fs.unlinkSync(planPath);
    }
    const tfPlan = path.join(tfDir, "tfplan");
    if (fs.existsSync(tfPlan)) {
      fs.unlinkSync(tfPlan);
    }
  });

  it("should allow only ports 80 and 443 from specified CIDRs", () => {
    const planPath = path.join(tfDir, planFile);
    const jsonData = JSON.parse(fs.readFileSync(planPath, "utf-8"));

    const resources =
      jsonData?.planned_values?.root_module?.resources || [];
    const sgResource = resources.find(
      (r: any) => r.type === "aws_security_group"
    );
    expect(sgResource).toBeDefined();

    const ingressRules: IngressRule[] =
      (sgResource.values.ingress || []).map((rule: any) => {
        const r: IngressRule = {
          protocol: rule.protocol,
          from_port: rule.from_port,
          to_port: rule.to_port,
          cidr_v4: rule.cidr_blocks?.[0] ?? undefined,
          cidr_v6: rule.ipv6_cidr_blocks?.[0] ?? undefined,
        };

        if (r.cidr_v4 && r.cidr_v6) {
          r.cidr_v6 = undefined;
        }
        if (!r.cidr_v4 && !r.cidr_v6 && Array.isArray(rule.cidr_blocks) && rule.cidr_blocks.length > 0) {
          const first = rule.cidr_blocks[0];
          if (first.includes(":")) {
            r.cidr_v6 = first;
          } else {
            r.cidr_v4 = first;
          }
        }
        return r;
      }) || [];

    ingressRules.forEach((rule) => {
      expect(["tcp", "6", "-1"]).toContain(rule.protocol);
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);
      expect(rule.cidr_v4 || rule.cidr_v6).toBeDefined();
    });
  });
});
