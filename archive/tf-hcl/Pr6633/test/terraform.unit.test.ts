import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

const requiredFiles = [
  "main.tf",
  "variables.tf",
  "outputs.tf",
  "providers.tf",
  "alb.tf",
  "vpc.tf",
  "security_groups.tf"
];

describe("Terraform multi-file stack layout", () => {
  test("core Terraform files exist", () => {
    requiredFiles.forEach(file => {
      const filePath = path.join(LIB_DIR, file);
      const exists = fs.existsSync(filePath);
      if (!exists) {
        console.error(`[unit] Missing expected Terraform file: ${filePath}`);
      }
      expect(exists).toBe(true);
    });
  });

  test("modules directory is present", () => {
    const modulesPath = path.join(LIB_DIR, "modules");
    expect(fs.existsSync(modulesPath)).toBe(true);
  });
});

describe("Terraform configuration sanity checks", () => {
  const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
  const variablesTf = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
  const outputsTf = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");

  test("main.tf references critical modules", () => {
    expect(mainTf).toMatch(/module\s+"ec2_autoscaling"/);
    expect(mainTf).toMatch(/module\s+"rds_postgres"/);
  });

  test("variables.tf defines environment suffix and RDS settings", () => {
    expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    expect(variablesTf).toMatch(/variable\s+"rds_master_password"/);
    expect(variablesTf).toMatch(/variable\s+"use_existing_vpc"/);
  });

  test("outputs.tf exposes key infrastructure values", () => {
    expect(outputsTf).toMatch(/output\s+"alb_dns_name"/);
    expect(outputsTf).toMatch(/output\s+"rds_endpoint"/);
    expect(outputsTf).toMatch(/output\s+"vpc_id"/);
  });
});
