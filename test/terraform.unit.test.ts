import * as fs from "fs";
import * as path from "path";

describe("Terraform main.tf static validation", () => {
  const mainTfPath = path.resolve(__dirname, "../lib/main.tf");
  let mainTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(mainTfPath, "utf8");
  });

  it("should declare aws_region variable", () => {
    expect(mainTfContent).toMatch(/variable\s+"aws_region"/);
  });

  it("should not contain a provider block", () => {
    expect(mainTfContent).not.toMatch(/provider\s+"/);
  });

  it("should not use external modules", () => {
    expect(mainTfContent).not.toMatch(/module\s+"/);
  });

  it("should define outputs", () => {
    expect(mainTfContent).toMatch(/output\s+"/);
  });

  it("should use locals for tags", () => {
    expect(mainTfContent).toMatch(/locals\s+{[^}]*tag/i);
  });

  // Add more static checks as needed (e.g., IAM, encryption, etc.)
});