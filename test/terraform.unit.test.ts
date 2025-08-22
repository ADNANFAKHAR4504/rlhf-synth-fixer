import { execSync } from "child_process";

describe("Terraform Unit Tests", () => {
  it("should validate Terraform configuration", () => {
    execSync("terraform validate -no-color -chdir=.", { stdio: "inherit" });
  });

  it("should plan without errors", () => {
    execSync("terraform init -input=false -no-color -chdir=.", { stdio: "inherit" });
    const result = execSync("terraform plan -input=false -no-color -chdir=.", { encoding: "utf-8" });
    expect(result).toMatch(/Plan:/);
  });
});
