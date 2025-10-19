// test/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// These tests validate the Terraform configuration without executing Terraform commands


import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap-stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("provider.tf structure", () => {
    test("provider.tf contains terraform block with required_version and required_providers", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      expect(providerContent).toMatch(/required_providers/);
    });
    test("provider.tf configures AWS provider with region variable", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var.aws_region/);
    });
    test("provider.tf configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  describe("tap-stack.tf resources", () => {
    test("contains S3 bucket resource with unique name", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
      expect(stackContent).toMatch(/prod_app_bucket/);
      expect(stackContent).toMatch(/random_id\.bucket_suffix/);
    });
    test("contains EC2 instance resource with correct type and AMI", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(stackContent).toMatch(/ami\s*=\s*data.aws_ami.amazon_linux_2.id/);
    });
    test("contains security group with SSH ingress", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
      expect(stackContent).toMatch(/ingress[\s\S]*from_port\s*=\s*22/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var.allowed_ip\]/);
    });
    test("contains IAM role and policy for EC2 S3 access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
      expect(stackContent).toMatch(/s3:ListBucket/);
      expect(stackContent).toMatch(/s3:GetObject/);
    });
    test("outputs S3 bucket name and EC2 instance info", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(stackContent).toMatch(/output\s+"ec2_instance_public_dns"/);
    });
    test("outputs EC2 instance public IP", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_public_ip"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.prod_server\.public_ip/);
    });
    test("outputs EC2 instance ID", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.prod_server\.id/);
    });
    test("outputs security group ID", () => {
      expect(stackContent).toMatch(/output\s+"security_group_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.prod_ec2_sg\.id/);
    });
    test("outputs IAM role ARN", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_arn"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_iam_role\.prod_ec2_role\.arn/);
    });
    test("outputs SSH connection command", () => {
      expect(stackContent).toMatch(/output\s+"ssh_connection_command"/);
      expect(stackContent).toMatch(/value\s*=\s*"ssh -i ~\/\.ssh\/\${var\.key_name}\.pem ec2-user@\${aws_instance\.prod_server\.public_dns}"/);
    });
  });

  describe("Best practices", () => {
    test("all resources are tagged with Environment = Production", () => {
      const envTags = stackContent.match(/Environment\s*=\s*"Production"/g);
      expect(envTags).toBeTruthy();
      expect(envTags!.length).toBeGreaterThanOrEqual(5);
    });
    test("no provider or backend blocks in tap-stack.tf", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"/);
      expect(stackContent).not.toMatch(/terraform\s*{/);
      expect(stackContent).not.toMatch(/backend\s+"s3"/);
    });
    test("uses Prod prefix in resource names", () => {
      expect(stackContent).toMatch(/ProdAppBucket/);
      expect(stackContent).toMatch(/ProdEC2SecurityGroup/);
      expect(stackContent).toMatch(/ProdEC2S3AccessRole/);
      expect(stackContent).toMatch(/ProdApplicationServer/);
    });
    test("includes security best practice comments", () => {
      expect(stackContent).toMatch(/# Best practice:/);
      expect(stackContent).toMatch(/principle of least privilege/i);
    });
    test("does not use Retain deletion policy", () => {
      expect(stackContent).not.toMatch(/deletion_policy\s*=\s*"Retain"/i);
      expect(stackContent).not.toMatch(/DeletionPolicy:\s*Retain/);
    });
  });
});
