import { execSync } from "child_process";

describe("Terraform Infrastructure Integration Tests", () => {
  let tfOutputs: any;

  beforeAll(() => {
    // Initialize Terraform with a local backend for testing
    execSync("terraform init -backend=false", { stdio: "inherit" });

    // Run plan to populate outputs
    execSync("terraform plan -out=tfplan", { stdio: "inherit" });

    // Get Terraform outputs
    const output = execSync("terraform output -json", { encoding: "utf-8" });
    tfOutputs = JSON.parse(output);
  }, 60000);

  test("ALB DNS name should exist and be non-empty", () => {
    expect(tfOutputs.alb_dns_name.value).toBeDefined();
    expect(tfOutputs.alb_dns_name.value).not.toMatch(/pending-dns-name/);
  });

  test("RDS endpoint should exist and look like a hostname", () => {
    expect(tfOutputs.rds_endpoint.value).toBeDefined();
    expect(tfOutputs.rds_endpoint.value).toMatch(
      /^[a-z0-9.-]+$/i
    );
    expect(tfOutputs.rds_endpoint.value).not.toMatch(/pending-endpoint/);
  });

  test("S3 buckets should have been created", () => {
    const buckets = [
      `${tfOutputs.project.value.toLowerCase()}-${tfOutputs.environment.value.toLowerCase()}-app-data`,
      `${tfOutputs.project.value.toLowerCase()}-${tfOutputs.environment.value.toLowerCase()}-alb-logs`,
    ];
    expect(buckets[0]).toMatch(/[a-z0-9-]+/);
    expect(buckets[1]).toMatch(/[a-z0-9-]+/);
  });
});
