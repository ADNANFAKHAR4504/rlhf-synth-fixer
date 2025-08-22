import { execSync } from "child_process";
import * as path from "path";

describe("Terraform Unit Tests", () => {
  // point to the folder containing tap_stack.tf
  const tfDir = path.resolve(__dirname, "../lib");

  it("should validate Terraform configuration", () => {
    execSync("terraform validate -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
  });

  it("should plan without errors", () => {
    execSync("terraform init -input=false -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
    const result = execSync("terraform plan -input=false -no-color", {
      cwd: tfDir,
      encoding: "utf-8",
    });
    expect(result).toMatch(/Plan:/);
  });
});
