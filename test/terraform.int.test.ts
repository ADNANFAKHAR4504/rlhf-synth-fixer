import { execSync } from "child_process";
import * as path from "path";

describe("Terraform Integration Tests", () => {
  const tfDir = path.resolve(__dirname, "../lib");

  beforeAll(() => {
    execSync("terraform init -input=false -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
  });

  it("should apply without errors", () => {
    const result = execSync("terraform apply -auto-approve -no-color", {
      cwd: tfDir,
      encoding: "utf-8",
    });
    expect(result).toMatch(/Apply complete!/);
  });

  afterAll(() => {
    execSync("terraform destroy -auto-approve -no-color", {
      cwd: tfDir,
      stdio: "inherit",
    });
  });
});
