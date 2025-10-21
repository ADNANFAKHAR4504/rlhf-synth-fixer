// test/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// These tests validate the Terraform configuration without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Production Infrastructure - tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    // Read the Terraform configuration file once for all tests
    expect(fs.existsSync(STACK_PATH)).toBe(true);
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("File Structure and Basic Configuration", () => {
    test("tap_stack.tf file exists and is not empty", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("contains valid Terraform configuration block", () => {
      expect(stackContent).toMatch(/terraform\s*{/);
      expect(stackContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      expect(stackContent).toMatch(/required_providers/);
    });

    test("requires AWS provider version >= 5.0", () => {
      expect(stackContent).toMatch(/aws\s*=\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(stackContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("requires random provider version ~> 3.0", () => {
      expect(stackContent).toMatch(/random\s*=\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(stackContent).toMatch(/version\s*=\s*"~>\s*3\.0"/);
    });

    test("configures S3 backend", () => {
      expect(stackContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("provider.tf file does not exist (all code in single file)", () => {
      const providerFile = path.resolve(__dirname, "../lib/provider.tf");
      expect(fs.existsSync(providerFile)).toBe(false);
    });
  });

  describe("AWS Provider Configuration", () => {
    test("declares AWS provider with us-west-2 region", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{/);
      expect(stackContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("configures default tags at provider level", () => {
      expect(stackContent).toMatch(/default_tags\s*{/);
      expect(stackContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Input Variables", () => {
    test("declares key_name variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"key_name"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/description\s*=\s*"Name of the AWS key pair/);
      expect(stackContent).toMatch(/validation\s*{/);
      expect(stackContent).toMatch(/length\(var\.key_name\)\s*>\s*0/);
    });

    test("declares allowed_ip variable with CIDR validation", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ip"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/description\s*=\s*"IP address allowed to SSH/);
      expect(stackContent).toMatch(/validation\s*{/);
      expect(stackContent).toMatch(/can\(regex\(/);
      expect(stackContent).toMatch(/CIDR format/);
    });
  });

  describe("Data Sources", () => {
    test("configures Amazon Linux 2 AMI data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("AMI data source filters for correct attributes", () => {
      expect(stackContent).toMatch(/name\s*=\s*"name"/);
      expect(stackContent).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
      expect(stackContent).toMatch(/virtualization-type/);
      expect(stackContent).toMatch(/hvm/);
      expect(stackContent).toMatch(/root-device-type/);
      expect(stackContent).toMatch(/ebs/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates random_id resource for bucket name uniqueness", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
      expect(stackContent).toMatch(/byte_length\s*=\s*8/);
    });

    test("creates S3 bucket with proper naming and tags", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_app_bucket"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*"prod-app-bucket-\${random_id\.bucket_suffix\.hex}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"ProdAppBucket"/);
      expect(stackContent).toMatch(/Environment\s*=\s*"Production"/);
    });

    test("configures lifecycle policy for bucket", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
      expect(stackContent).toMatch(/prevent_destroy\s*=\s*false/);
    });

    test("enables S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"prod_app_bucket_versioning"\s*{/);
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.prod_app_bucket\.id/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables S3 bucket server-side encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod_app_bucket_encryption"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("blocks all public access to S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod_app_bucket_pab"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("Security Group Configuration", () => {
    test("creates security group with proper name and description", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"prod_ec2_sg"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdEC2SecurityGroup"/);
      expect(stackContent).toMatch(/description\s*=\s*"Production security group/);
    });

    test("configures SSH ingress rule with variable-based IP restriction", () => {
      expect(stackContent).toMatch(/ingress\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"SSH from allowed IP"/);
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ip\]/);
    });

    test("configures egress rule to allow all outbound traffic", () => {
      expect(stackContent).toMatch(/egress\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"Allow all outbound traffic"/);
      expect(stackContent).toMatch(/from_port\s*=\s*0/);
      expect(stackContent).toMatch(/to_port\s*=\s*0/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("security group has proper tags", () => {
      const sgSection = stackContent.match(/resource\s+"aws_security_group"\s+"prod_ec2_sg"[\s\S]*?(?=\nresource|$)/);
      expect(sgSection).toBeTruthy();
      expect(sgSection![0]).toMatch(/Name\s*=\s*"ProdEC2SecurityGroup"/);
      expect(sgSection![0]).toMatch(/Environment\s*=\s*"Production"/);
    });
  });

  describe("IAM Role and Policy Configuration", () => {
    test("creates IAM role for EC2 with proper name", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"prod_ec2_role"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdEC2S3AccessRole"/);
    });

    test("IAM role has correct assume role policy for EC2", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
      expect(stackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
      expect(stackContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test("creates IAM role policy with S3 read permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"prod_ec2_s3_policy"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdEC2S3ReadPolicy"/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.prod_ec2_role\.id/);
    });

    test("IAM policy grants ListBucket and GetBucketLocation permissions", () => {
      expect(stackContent).toMatch(/s3:ListBucket/);
      expect(stackContent).toMatch(/s3:GetBucketLocation/);
      expect(stackContent).toMatch(/Resource\s*=\s*aws_s3_bucket\.prod_app_bucket\.arn/);
    });

    test("IAM policy grants GetObject and GetObjectVersion permissions", () => {
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:GetObjectVersion/);
      expect(stackContent).toMatch(/Resource\s*=\s*"\${aws_s3_bucket\.prod_app_bucket\.arn}\/\*"/);
    });

    test("creates IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"prod_ec2_profile"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdEC2InstanceProfile"/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.prod_ec2_role\.name/);
    });
  });

  describe("EC2 Instance Configuration", () => {
    test("creates EC2 instance with correct resource type", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"prod_server"\s*{/);
      expect(stackContent).not.toMatch(/resource\s+"aws_ec2_instance"/);
    });

    test("uses t3.micro instance type", () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("references AMI data source correctly", () => {
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("uses key_name variable for SSH access", () => {
      expect(stackContent).toMatch(/key_name\s*=\s*var\.key_name/);
    });

    test("attaches security group to instance", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.prod_ec2_sg\.id\]/);
    });

    test("attaches IAM instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.prod_ec2_profile\.name/);
    });

    test("enables detailed monitoring", () => {
      expect(stackContent).toMatch(/monitoring\s*=\s*true/);
    });

    test("configures termination protection", () => {
      expect(stackContent).toMatch(/disable_api_termination\s*=\s*false/);
    });

    test("configures IMDSv2 metadata options", () => {
      expect(stackContent).toMatch(/metadata_options\s*{/);
      expect(stackContent).toMatch(/http_endpoint\s*=\s*"enabled"/);
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(stackContent).toMatch(/http_put_response_hop_limit\s*=\s*1/);
    });

    test("configures encrypted root block device", () => {
      expect(stackContent).toMatch(/root_block_device\s*{/);
      expect(stackContent).toMatch(/volume_type\s*=\s*"gp3"/);
      expect(stackContent).toMatch(/volume_size\s*=\s*20/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("includes user data script", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*<<-EOF/);
      expect(stackContent).toMatch(/yum update -y/);
      expect(stackContent).toMatch(/yum install -y aws-cli/);
    });

    test("has explicit dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
      expect(stackContent).toMatch(/aws_iam_role_policy\.prod_ec2_s3_policy/);
      expect(stackContent).toMatch(/aws_security_group\.prod_ec2_sg/);
    });

    test("instance has proper tags", () => {
      const ec2Section = stackContent.match(/resource\s+"aws_instance"\s+"prod_server"[\s\S]*?(?=\n(?:resource|output|#\s+Best\s+practice:\s+Create\s+CloudWatch)|$)/);
      expect(ec2Section).toBeTruthy();
      expect(ec2Section![0]).toMatch(/Name\s*=\s*"ProdApplicationServer"/);
      expect(ec2Section![0]).toMatch(/Environment\s*=\s*"Production"/);
    });
  });

  describe("CloudWatch Configuration", () => {
    test("creates CloudWatch log group for application logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"prod_app_logs"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/ec2\/prod-application"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });
  });

  describe("Output Configuration", () => {
    test("outputs S3 bucket name", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.prod_app_bucket\.id/);
    });

    test("outputs S3 bucket ARN", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.prod_app_bucket\.arn/);
    });

    test("outputs EC2 instance public DNS", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_public_dns"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.prod_server\.public_dns/);
    });

    test("outputs EC2 instance public IP", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_public_ip"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.prod_server\.public_ip/);
    });

    test("outputs EC2 instance ID", () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_id"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.prod_server\.id/);
    });

    test("outputs security group ID", () => {
      expect(stackContent).toMatch(/output\s+"security_group_id"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.prod_ec2_sg\.id/);
    });

    test("outputs IAM role ARN", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_iam_role\.prod_ec2_role\.arn/);
    });

    test("outputs SSH connection command", () => {
      expect(stackContent).toMatch(/output\s+"ssh_connection_command"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*"ssh -i ~\/\.ssh\/\${var\.key_name}\.pem ec2-user@\${aws_instance\.prod_server\.public_dns}"/);
    });
  });

  describe("Best Practices and Security", () => {
    test("uses Prod prefix in resource names", () => {
      expect(stackContent).toMatch(/ProdAppBucket/);
      expect(stackContent).toMatch(/ProdEC2SecurityGroup/);
      expect(stackContent).toMatch(/ProdEC2S3AccessRole/);
      expect(stackContent).toMatch(/ProdApplicationServer/);
    });

    test("applies Environment = Production tag to resources", () => {
      const environmentTags = stackContent.match(/Environment\s*=\s*"Production"/g);
      expect(environmentTags).toBeTruthy();
      expect(environmentTags!.length).toBeGreaterThanOrEqual(5);
    });

    test("includes security best practice comments", () => {
      expect(stackContent).toMatch(/# Best practice:/);
      expect(stackContent).toMatch(/principle of least privilege/i);
    });

    test("does not use Retain deletion policy", () => {
      expect(stackContent).not.toMatch(/deletion_policy\s*=\s*"Retain"/i);
      expect(stackContent).not.toMatch(/DeletionPolicy:\s*Retain/);
    });

    test("configures all required resources in single file", () => {
      // Verify all core resources are present
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
      expect(stackContent).toMatch(/resource\s+"aws_instance"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });
  });
});
