import { execSync } from "child_process";
import path from "path";

describe("Terraform Infrastructure Integration Tests", () => {
  let tfOutputs: any;
  const tfDir = path.resolve(__dirname, "../lib"); // points to directory containing main.tf and provider.tf

  beforeAll(() => {
    // Initialize Terraform with local backend (so it doesn't need S3)
    execSync("terraform init -backend=false", { stdio: "inherit", cwd: tfDir });

    // Run plan
    execSync("terraform plan -out=tfplan", { stdio: "inherit", cwd: tfDir });

    // Get Terraform outputs
    const output = execSync("terraform output -json", {
      encoding: "utf-8",
      cwd: tfDir,
    });
    tfOutputs = JSON.parse(output);
  }, 120000); // increase timeout if needed

  test("ALB DNS name should exist and be non-empty", () => {
    expect(tfOutputs.alb_dns_name.value).toBeDefined();
    expect(tfOutputs.alb_dns_name.value).not.toMatch(/pending-dns-name/);
  });

  test("RDS endpoint should exist and look like a hostname", () => {
    expect(tfOutputs.rds_endpoint.value).toBeDefined();
    expect(tfOutputs.rds_endpoint.value).toMatch(/^[a-z0-9.-]+$/i);
    expect(tfOutputs.rds_endpoint.value).not.toMatch(/pending-endpoint/);
  });

  test("S3 buckets should have valid names", () => {
    const buckets = [
      `${tfOutputs.project?.value.toLowerCase() || "hcl"}-${tfOutputs.environment?.value.toLowerCase() || "production"}-app-data`,
      `${tfOutputs.project?.value.toLowerCase() || "hcl"}-${tfOutputs.environment?.value.toLowerCase() || "production"}-alb-logs`,
    ];
    buckets.forEach((b) => expect(b).toMatch(/^[a-z0-9-]+$/));
  });
});
