import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const BACKEND_REL = "../lib/backend.conf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });

  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("declares required AWS provider version", () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("declares required Terraform version", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*\{\s*\}/);
    });

    test("declares multiple AWS provider aliases", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"us_east_1"/);
      expect(providerContent).toMatch(/alias\s*=\s*"us_west_2"/);
      expect(providerContent).toMatch(/alias\s*=\s*"eu_central_1"/);
    });

    test("configures default tags for all providers", () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(providerContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Main Stack Configuration", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("declares required variables", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"/);
      expect(stackContent).toMatch(/variable\s+"environment"/);
      expect(stackContent).toMatch(/variable\s+"log_retention_days"/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr_blocks"/);
    });

    test("declares random password resources for all regions", () => {
      expect(stackContent).toMatch(/random_password\.db_passwords\["us-east-1"\]/);
      expect(stackContent).toMatch(/random_password\.db_passwords\["us-west-2"\]/);
      expect(stackContent).toMatch(/random_password\.db_passwords\["eu-central-1"\]/);
    });

    test("declares central logging module", () => {
      expect(stackContent).toMatch(/module\s+"central_logging"/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/logging"/);
    });

    test("declares secrets modules for all regions", () => {
      expect(stackContent).toMatch(/module\s+"secrets_us_east_1"/);
      expect(stackContent).toMatch(/module\s+"secrets_us_west_2"/);
      expect(stackContent).toMatch(/module\s+"secrets_eu_central_1"/);
    });

    test("declares VPC modules for all regions", () => {
      expect(stackContent).toMatch(/module\s+"vpc_us_east_1"/);
      expect(stackContent).toMatch(/module\s+"vpc_us_west_2"/);
      expect(stackContent).toMatch(/module\s+"vpc_eu_central_1"/);
    });

    test("configures correct provider aliases for all modules", () => {
      expect(stackContent).toMatch(/aws\s*=\s*aws\.us_east_1/);
      expect(stackContent).toMatch(/aws\s*=\s*aws\.us_west_2/);
      expect(stackContent).toMatch(/aws\s*=\s*aws\.eu_central_1/);
    });

    test("declares outputs for all resources", () => {
      expect(stackContent).toMatch(/output\s+"vpc_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"database_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"central_logging_bucket"/);
      expect(stackContent).toMatch(/output\s+"secrets_arns"/);
    });

    test("passes required variables to modules", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
    });

    test("configures VPC CIDR blocks for each region", () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr_blocks\["us-east-1"\]/);
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr_blocks\["us-west-2"\]/);
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr_blocks\["eu-central-1"\]/);
    });

    test("configures database passwords for secrets modules", () => {
      expect(stackContent).toMatch(/db_password\s*=\s*random_password\.db_passwords\["us-east-1"\]\.result/);
      expect(stackContent).toMatch(/db_password\s*=\s*random_password\.db_passwords\["us-west-2"\]\.result/);
      expect(stackContent).toMatch(/db_password\s*=\s*random_password\.db_passwords\["eu-central-1"\]\.result/);
    });

    test("configures central logging bucket for VPC modules", () => {
      expect(stackContent).toMatch(/central_logging_bucket\s*=\s*module\.central_logging\.bucket_name/);
    });
  });

  describe("Module Structure", () => {
    const modulesDir = path.resolve(__dirname, "../lib/modules");

    test("modules directory exists", () => {
      const exists = fs.existsSync(modulesDir);
      expect(exists).toBe(true);
    });

    test("logging module exists", () => {
      const loggingModule = path.join(modulesDir, "logging");
      const exists = fs.existsSync(loggingModule);
      expect(exists).toBe(true);
    });

    test("secrets module exists", () => {
      const secretsModule = path.join(modulesDir, "secrets");
      const exists = fs.existsSync(secretsModule);
      expect(exists).toBe(true);
    });

    test("vpc module exists", () => {
      const vpcModule = path.join(modulesDir, "vpc");
      const exists = fs.existsSync(vpcModule);
      expect(exists).toBe(true);
    });

    test("each module has required files", () => {
      const modules = ["logging", "secrets", "vpc"];

      modules.forEach(moduleName => {
        const modulePath = path.join(modulesDir, moduleName);
        expect(fs.existsSync(path.join(modulePath, "main.tf"))).toBe(true);
        expect(fs.existsSync(path.join(modulePath, "variables.tf"))).toBe(true);
        expect(fs.existsSync(path.join(modulePath, "outputs.tf"))).toBe(true);
      });
    });
  });

  describe("Security and Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("uses random passwords for database credentials", () => {
      expect(stackContent).toMatch(/random_password/);
    });

    test("configures log retention", () => {
      expect(stackContent).toMatch(/log_retention_days/);
    });

    test("uses proper naming conventions", () => {
      expect(stackContent).toMatch(/secure-infra/);
      expect(stackContent).toMatch(/production/);
    });

    test("configures multiple regions for high availability", () => {
      const regionCount = (stackContent.match(/us-east-1|us-west-2|eu-central-1/g) || []).length;
      expect(regionCount).toBeGreaterThan(0);
    });
  });
});
