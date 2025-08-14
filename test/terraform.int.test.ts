import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface IngressRule {
  protocol: string;
  from_port: number;
  to_port: number;
  cidr_v4?: string;
  cidr_v6?: string;
}

describe("Terraform Security Group Integration Test", () => {
  const originalTfDir = path.resolve(__dirname, "../lib"); // directory containing TF code
  const tmpTfDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-test-"));
  const planFile = "tfplan.json";

  beforeAll(() => {
    if (!fs.existsSync(originalTfDir)) {
      throw new Error(`Terraform directory not found: ${originalTfDir}`);
    }

    // Copy TF files to temp dir
    fs.cpSync(originalTfDir, tmpTfDir, { recursive: true });

    // Replace backend "s3" with backend "local" in both main.tf and provider.tf
    const tfFiles = ["main.tf", "provider.tf"];
    tfFiles.forEach((file) => {
      const filePath = path.join(tmpTfDir, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf-8");
        content = content.replace(
          /backend\s+"s3"\s*\{[^}]+\}/gs,
          'backend "local" {\n    path = "terraform.tfstate"\n  }'
        );
        fs.writeFileSync(filePath, content);
      }
    });

    // Inject dummy AWS credentials to satisfy provider block
    process.env.AWS_ACCESS_KEY_ID = "dummy";
    process.env.AWS_SECRET_ACCESS_KEY = "dummy";
    process.env.AWS_DEFAULT_REGION = "us-west-2";

    // Run terraform init with local backend
    const initResult = spawnSync("terraform", ["init", "-input=false"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (initResult.status !== 0) {
      throw new Error(`Terraform init failed:\n${initResult.stdout}\n${initResult.stderr}`);
    }

    // Run terraform plan
    const planOut = spawnSync("terraform", ["plan", "-input=false", "-out=tfplan"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (planOut.status !== 0) {
      throw new Error(`Terraform plan failed:\n${planOut.stdout}\n${planOut.stderr}`);
    }

    // Convert plan to JSON
    const showOut = spawnSync("terraform", ["show", "-json", "tfplan"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (showOut.status !== 0) {
      throw new Error(`Terraform show failed:\n${showOut.stdout}\n${showOut.stderr}`);
    }

    fs.writeFileSync(path.join(tmpTfDir, planFile), showOut.stdout);
  });

  afterAll(() => {
    // Cleanup temp dir
    fs.rmSync(tmpTfDir, { recursive: true, force: true });
  });

  it("should allow only ports 80 and 443 from specified CIDRs", () => {
    const planPath = path.join(tmpTfDir, planFile);
    const jsonData = JSON.parse(fs.readFileSync(planPath, "utf-8"));

    const resources = jsonData?.planned_values?.root_module?.resources || [];
    const sgResource = resources.find((r: any) => r.type === "aws_security_group");
    expect(sgResource).toBeDefined();

    const ingressRules: IngressRule[] = (sgResource.values.ingress || []).map((rule: any) => {
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
        if (first.includes(":")) r.cidr_v6 = first;
        else r.cidr_v4 = first;
      }

      return r;
    });

    ingressRules.forEach((rule) => {
      expect(["tcp", "6", "-1"]).toContain(rule.protocol);
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);
      expect(rule.cidr_v4 || rule.cidr_v6).toBeDefined();
    });
  });
});
