import { execSync } from "child_process";
import * as path from "path";

const tfDir = path.resolve(__dirname, "../lib");

describe("Terraform Unit Tests", () => {
  it("should validate Terraform configuration", () => {
    execSync("terraform validate -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
  });

  it("should plan without errors (mocked backend)", () => {
    // Re-init with dummy backend instead of real S3
    execSync(
      `terraform init -input=false -no-color -backend-config="bucket=dummy" -backend-config="key=dummy.tfstate" -backend-config="region=us-east-1" -reconfigure`,
      { cwd: tfDir, stdio: "inherit" }
    );

    const result = execSync(
      "terraform plan -input=false -no-color -refresh=false -lock=false",
      { cwd: tfDir, encoding: "utf-8" }
    );

    expect(result).toMatch(/Plan:/);
  });
});
