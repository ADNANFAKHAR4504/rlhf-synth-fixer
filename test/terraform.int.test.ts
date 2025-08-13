// test/terraform.int.test.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Integration Tests", () => {
  const tfDir = path.resolve(__dirname, "../lib");
  let tfOutputs: any;

  beforeAll(() => {
    // 1️⃣ Create a temporary backend override to force local state
    const backendOverridePath = path.join(tfDir, "backend_override.tf");
    fs.writeFileSync(
      backendOverridePath,
      `terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}`
    );

    // 2️⃣ Initialize Terraform with local backend
    execSync("terraform init -input=false", { stdio: "inherit", cwd: tfDir });

    // 3️⃣ Run plan (does not apply anything) to populate outputs
    execSync("terraform plan -out=tfplan -input=false", { stdio: "inherit", cwd: tfDir });

    // 4️⃣ Get Terraform outputs as JSON
    const output = execSync("terraform output -json", { encoding: "utf-8", cwd: tfDir });
    tfOutputs = JSON.parse(output);

    // Optional: remove the temporary backend override after init
    fs.unlinkSync(backendOverridePath);
  });

  test("ALB DNS name should exist and be non-empty", () => {
    const albDns = tfOutputs.alb_dns_name.value;
    expect(albDns).toBeDefined();
    expect(albDns).not.toBe("");
    console.log("ALB DNS:", albDns);
  });

  test("RDS endpoint should exist and look like a hostname", () => {
    const rdsEndpoint = tfOutputs.rds_endpoint.value;
    expect(rdsEndpoint).toBeDefined();
    expect(rdsEndpoint).not.toBe("");
    expect(rdsEndpoint).toMatch(/^[a-z0-9.-]+$/i);
    console.log("RDS Endpoint:", rdsEndpoint);
  });

  test("S3 buckets should have valid names", () => {
    const appDataBucket = tfOutputs.app_data_bucket?.value;
    const albLogsBucket = tfOutputs.alb_logs_bucket?.value;

    if (appDataBucket) {
      expect(appDataBucket).toMatch(/^[a-z0-9.-]+$/);
      console.log("App Data Bucket:", appDataBucket);
    }

    if (albLogsBucket) {
      expect(albLogsBucket).toMatch(/^[a-z0-9.-]+$/);
      console.log("ALB Logs Bucket:", albLogsBucket);
    }
  });
});
