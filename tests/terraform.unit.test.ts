import { execSync } from "child_process";

describe("Terraform Unit Tests", () => {
  it("should validate Terraform configuration", () => {
    const result = execSync("terraform validate", { encoding: "utf-8" });
    expect(result).toContain("Success");
  });

  it("should plan without errors", () => {
    const result = execSync("terraform plan -input=false -no-color", { encoding: "utf-8" });
    expect(result).toMatch(/Plan:/);
  });
});
