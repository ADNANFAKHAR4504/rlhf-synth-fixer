import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; 
const VARS_REL = "../lib/vars.tf"; 

const stackPath = path.resolve(__dirname, STACK_REL);
const varsPath = path.resolve(__dirname, VARS_REL);

describe("Terraform modularized stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(stackPath, "utf8");

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // --- Data sources now live inside modules, so root should call modules ---
  test("calls VPC module", () => {
    expect(content).toMatch(/module\s+"vpc"\s*{/);
  });

  test("calls Security Group module", () => {
    expect(content).toMatch(/module\s+"security_group"\s*{/);
  });

  test("calls IAM module", () => {
    expect(content).toMatch(/module\s+"iam"\s*{/);
  });

  test("calls Secrets module", () => {
    expect(content).toMatch(/module\s+"secrets"\s*{/);
  });

  test("calls EC2 module", () => {
    expect(content).toMatch(/module\s+"ec2"\s*{/);
  });
});

describe("Terraform variables file: vars.tf", () => {
  test("vars.tf exists", () => {
    const exists = fs.existsSync(varsPath);
    if (!exists) {
      console.error(`[unit] Expected vars at: ${varsPath}`);
    }
    expect(exists).toBe(true);
  });

  const varsContent = fs.readFileSync(varsPath, "utf8");

  // Note: aws_region was removed (provider.tf owns it)

  test("declares project variable", () => {
    expect(varsContent).toMatch(/variable\s+"project"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(varsContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares subnet variables", () => {
    expect(varsContent).toMatch(/variable\s+"public_subnet_cidr"\s*{/);
    expect(varsContent).toMatch(/variable\s+"private_subnet_cidr"\s*{/);
  });

  test("declares EC2 instance type and key pair variables", () => {
    expect(varsContent).toMatch(/variable\s+"ec2_instance_type"\s*{/);
    expect(varsContent).toMatch(/variable\s+"key_pair_name"\s*{/);
  });

  test("declares db_password_length variable", () => {
    expect(varsContent).toMatch(/variable\s+"db_password_length"\s*{/);
  });
});
