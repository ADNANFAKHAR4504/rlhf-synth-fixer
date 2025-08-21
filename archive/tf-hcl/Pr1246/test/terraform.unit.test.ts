import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Unit Tests", () => {
  const libPath = path.resolve(__dirname, "../lib");
  const tapStackPath = path.join(libPath, "tap_stack.tf");
  const providerPath = path.join(libPath, "provider.tf");
  const outputsPath = path.join(libPath, "outputs.tf");

  let tapStackContent: string;
  let providerContent: string;
  let outputsContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(tapStackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
      expect(tapStackContent).toBeTruthy();
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(providerContent).toBeTruthy();
    });

    test("outputs.tf exists and is readable", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(outputsContent).toBeTruthy();
    });
  });

  describe("Variable Configuration", () => {
    test("declares environment_suffix variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares aws_region variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("has default values for variables", () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"dev"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"us-east-2"/);
    });
  });

  describe("Provider Configuration", () => {
    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(tapStackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf contains random provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"random"\s*{/);
    });
  });

  describe("Resource Validation", () => {
    test("contains VPC resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("contains subnets (public and private)", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private/);
    });

    test("contains security groups", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test("contains RDS instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"/);
    });

    test("contains launch template and auto scaling group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"/);
    });

    test("contains CloudTrail configuration", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("contains S3 bucket for CloudTrail logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
    });

    test("contains Auto Scaling Group for compute resources", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"/);
    });
  });

  describe("Security Configuration", () => {
    test("CloudTrail has proper S3 bucket configuration", () => {
      expect(tapStackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs\.bucket/);
    });

    test("CloudTrail event selector uses specific bucket ARN", () => {
      expect(tapStackContent).toMatch(/\${aws_s3_bucket\.cloudtrail_logs\.arn}\/\*/);
      expect(tapStackContent).not.toMatch(/arn:aws:s3:::\*\/\*/);
    });

    test("S3 bucket has force_destroy enabled for cleanup", () => {
      expect(tapStackContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test("RDS instance has deletion protection disabled for testing", () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Naming Conventions", () => {
    test("uses project_name variable in resource names", () => {
      expect(tapStackContent).toMatch(/\${local\.project_name}/);
    });

    test("project_name includes environment suffix and random suffix", () => {
      expect(tapStackContent).toMatch(/project_name\s*=\s*"secure-infra-\${var\.environment_suffix}-\${random_string\.suffix\.result}"/);
    });

    test("has random_string resource for uniqueness", () => {
      expect(tapStackContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
    });
  });

  describe("Tagging", () => {
    test("defines common_tags with EnvironmentSuffix", () => {
      expect(tapStackContent).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
    });

    test("resources use common_tags or merge with additional tags", () => {
      expect(tapStackContent).toMatch(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf contains VPC ID output", () => {
      expect(outputsContent).toMatch(/output.*vpc_id/i);
    });

    test("outputs.tf contains autoscaling group output", () => {
      expect(outputsContent).toMatch(/output.*autoscaling_group/i);
    });

    test("outputs contain descriptions", () => {
      expect(outputsContent).toMatch(/description\s*=/);
    });
  });
});
