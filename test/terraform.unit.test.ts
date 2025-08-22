import { execSync } from "child_process";
import * as path from "path";

describe("Terraform Unit Tests", () => {
  const tfDir = path.resolve(__dirname, "../lib");

  it("should validate Terraform configuration", () => {
    execSync("terraform init -backend=false -input=false -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
    execSync("terraform validate -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
  });

  it("should plan without errors (mocked backend)", () => {
    const result = execSync(
      "terraform plan -input=false -no-color -refresh=false -lock=false",
      { cwd: tfDir, encoding: "utf-8" }
    );
    expect(result).toMatch(/Plan:/);
  });
});
