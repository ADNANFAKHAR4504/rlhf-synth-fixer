import { execSync } from "child_process";

describe("Terraform Integration Tests", () => {
  it("should have a VPC in the state", () => {
    const output = execSync("terraform state list", { encoding: "utf-8" });
    expect(output).toContain("aws_vpc.main");
  });

  it("should have at least one public subnet", () => {
    const output = execSync("terraform state list", { encoding: "utf-8" });
    expect(output).toMatch(/aws_subnet.public/);
  });

  it("should have an internet gateway", () => {
    const output = execSync("terraform state list", { encoding: "utf-8" });
    expect(output).toContain("aws_internet_gateway.main");
  });
});
