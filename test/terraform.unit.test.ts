// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates the presence and configuration of all required resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read the stack file content once for all tests
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure Tests", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns terraform block)", () => {
      expect(stackContent).not.toMatch(/\bterraform\s*{/);
    });

    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf declares random provider requirement", () => {
      expect(providerContent).toMatch(/random\s*=/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region variable has default value", () => {
      const varMatch = stackContent.match(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"([^"]+)"/);
      expect(varMatch).not.toBeNull();
      expect(varMatch?.[1]).toBeDefined();
    });
  });

  describe("VPC and Network Configuration", () => {
    test("creates VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has proper CIDR block", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC enables DNS hostnames and support", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("creates public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("creates database subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
    });

    test("creates NAT Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test("creates Elastic IPs for NAT Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test("creates public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    });

    test("creates private route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("creates route table associations for public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    });

    test("creates route table associations for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("creates EC2 security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("EC2 security group allows HTTPS (port 443) inbound", () => {
      const ec2SgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
      expect(ec2SgMatch).not.toBeNull();
    });

    test("EC2 security group allows all outbound traffic", () => {
      const ec2SgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?egress[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/);
      expect(ec2SgMatch).not.toBeNull();
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
    });

    test("RDS security group allows database access from EC2 security group", () => {
      const rdsSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
      expect(rdsSgMatch).not.toBeNull();
    });
  });

  describe("EC2 and Auto Scaling Configuration", () => {
    test("creates Launch Template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
    });

    test("Launch Template uses t3.micro instance type", () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("Launch Template references Amazon Linux 2 AMI", () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("Launch Template has IAM instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*{[\s\S]*?arn\s*=\s*aws_iam_instance_profile\.ec2\.arn/);
    });

    test("Launch Template has monitoring enabled", () => {
      expect(stackContent).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("creates Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"\s*{/);
    });

    test("Auto Scaling Group has proper capacity settings", () => {
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*3/);
    });

    test("Auto Scaling Group references Launch Template", () => {
      expect(stackContent).toMatch(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.app\.id/);
    });
  });

  describe("RDS Database Configuration", () => {
    test("creates KMS key for RDS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"\s*{/);
    });

    test("KMS key has key rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"\s*{/);
    });

    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test("creates RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    });

    test("RDS uses MySQL engine", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS has storage encryption enabled with KMS CMK", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test("RDS is not publicly accessible", () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has multi-AZ enabled", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS has NO deletion protection (as per requirements)", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("RDS has skip_final_snapshot enabled", () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has CloudWatch logs exports enabled", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates main S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"\s*{/);
    });

    test("creates random ID for bucket suffix", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
    });

    test("S3 bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket has public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 bucket has server-side encryption enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("creates CloudTrail S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"\s*{/);
    });

    test("creates S3 bucket policy for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"\s*{/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates IAM role for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("EC2 IAM role has proper assume role policy", () => {
      const ec2RoleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?Service.*ec2\.amazonaws\.com/);
      expect(ec2RoleMatch).not.toBeNull();
    });

    test("creates S3 read access policy named 'S3ReadAccess'", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_read_access"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"S3ReadAccess"/);
    });

    test("S3ReadAccess policy does NOT contain wildcard (*) permissions", () => {
      const s3PolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"s3_read_access"\s*{[\s\S]*?policy\s*=\s*jsonencode\([\s\S]*?\)\s*}/);
      if (s3PolicyMatch) {
        const policyContent = s3PolicyMatch[0];
        // Check that it doesn't have Action = "*" or Resource = "*" (alone)
        expect(policyContent).not.toMatch(/Action\s*=\s*"\*"/);
        // Specific S3 actions should be listed
        expect(policyContent).toMatch(/s3:GetObject/);
        expect(policyContent).toMatch(/s3:ListBucket/);
      }
    });

    test("creates CloudWatch Logs policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"\s*{/);
    });

    test("CloudWatch Logs policy does NOT contain wildcard (*) permissions", () => {
      const cwLogsPolicy = stackContent.match(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"\s*{[\s\S]*?policy\s*=\s*jsonencode\([\s\S]*?\)\s*}/);
      if (cwLogsPolicy) {
        const policyContent = cwLogsPolicy[0];
        expect(policyContent).not.toMatch(/Action\s*=\s*"\*"/);
        // Specific CloudWatch actions should be listed
        expect(policyContent).toMatch(/logs:CreateLogGroup/);
        expect(policyContent).toMatch(/logs:CreateLogStream/);
        expect(policyContent).toMatch(/logs:PutLogEvents/);
      }
    });

    test("attaches S3 read policy to EC2 role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_read"\s*{/);
    });

    test("attaches CloudWatch policy to EC2 role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"\s*{/);
    });

    test("creates IAM instance profile for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
    });

    test("creates IAM role for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"\s*{/);
    });

    test("creates IAM policy for CloudTrail CloudWatch integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cloudtrail_cloudwatch"\s*{/);
    });

    test("attaches CloudWatch policy to CloudTrail role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudtrail_cloudwatch"\s*{/);
    });
  });

  describe("CloudWatch and CloudTrail Configuration", () => {
    test("creates CloudWatch Log Group for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
    });

    test("CloudWatch Log Group has retention period set", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });

    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    });

    test("CloudTrail has logging enabled", () => {
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("CloudTrail is multi-region", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail has CloudWatch Logs integration", () => {
      expect(stackContent).toMatch(/cloud_watch_logs_group_arn/);
      expect(stackContent).toMatch(/cloud_watch_logs_role_arn/);
    });

    test("CloudTrail has event selector for S3 data events", () => {
      expect(stackContent).toMatch(/event_selector\s*{/);
      expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
    });
  });

  describe("Data Sources", () => {
    test("declares availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("declares Amazon Linux 2 AMI data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
    });

    test("AMI data source filters for Amazon Linux 2", () => {
      expect(stackContent).toMatch(/amzn2-ami-hvm/);
    });
  });

  describe("Outputs", () => {
    test("declares VPC ID output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares public subnet IDs output", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    });

    test("declares private subnet IDs output", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test("declares S3 bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("declares RDS endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
    });

    test("RDS endpoint output is marked as sensitive", () => {
      const rdsOutputMatch = stackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?sensitive\s*=\s*true/);
      expect(rdsOutputMatch).not.toBeNull();
    });

    test("declares CloudTrail name output", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_name"\s*{/);
    });

    test("declares ASG name output", () => {
      expect(stackContent).toMatch(/output\s+"asg_name"\s*{/);
    });
  });

  describe("Security and Compliance Requirements", () => {
    test("NO resource has retention/deletion protection enabled", () => {
      // Should not find deletion_protection = true anywhere
      expect(stackContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test("subnets are distributed across multiple availability zones", () => {
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("all IAM policies avoid wildcard (*) actions", () => {
      // Extract all IAM policy definitions
      const policies = stackContent.match(/resource\s+"aws_iam_policy"[\s\S]*?policy\s*=\s*jsonencode\([^)]+\)/g);
      if (policies) {
        policies.forEach((policy) => {
          // Should not have Action = "*" (but can have resources with wildcards)
          expect(policy).not.toMatch(/Action\s*=\s*"\*"/);
        });
      }
    });

    test("EC2 instances use launch template (not direct EC2 instances)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"/);
    });
  });

  describe("Resource Counts and Coverage", () => {
    test("has all required resource types", () => {
      const requiredResources = [
        "aws_vpc",
        "aws_subnet",
        "aws_internet_gateway",
        "aws_nat_gateway",
        "aws_route_table",
        "aws_security_group",
        "aws_launch_template",
        "aws_autoscaling_group",
        "aws_db_instance",
        "aws_kms_key",
        "aws_s3_bucket",
        "aws_iam_role",
        "aws_iam_policy",
        "aws_cloudtrail",
        "aws_cloudwatch_log_group",
      ];

      requiredResources.forEach((resource) => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${resource}"`));
      });
    });

    test("file is not empty and has substantial content", () => {
      expect(stackContent.length).toBeGreaterThan(5000);
    });
  });

  describe("Detailed VPC Network Configuration", () => {
    test("public subnets use count parameter", () => {
      const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?count\s*=\s*2/);
      expect(publicSubnetMatch).not.toBeNull();
    });

    test("private subnets use count parameter", () => {
      const privateSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?count\s*=\s*2/);
      expect(privateSubnetMatch).not.toBeNull();
    });

    test("database subnets use count parameter", () => {
      const dbSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"database"\s*{[\s\S]*?count\s*=\s*2/);
      expect(dbSubnetMatch).not.toBeNull();
    });

    test("public subnets have proper CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test("private subnets have proper CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 10\}\.0\/24"/);
    });

    test("database subnets have proper CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 20\}\.0\/24"/);
    });

    test("public subnets map public IP on launch", () => {
      const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
      expect(publicSubnetMatch).not.toBeNull();
    });

    test("NAT Gateway uses count for multiple AZs", () => {
      const natMatch = stackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?count\s*=\s*2/);
      expect(natMatch).not.toBeNull();
    });

    test("Elastic IPs use count for multiple NAT Gateways", () => {
      const eipMatch = stackContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?count\s*=\s*2/);
      expect(eipMatch).not.toBeNull();
    });

    test("Elastic IPs specify VPC domain", () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("public route table has route to Internet Gateway", () => {
      const routeMatch = stackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id/);
      expect(routeMatch).not.toBeNull();
    });

    test("private route tables have route to NAT Gateway", () => {
      const routeMatch = stackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?nat_gateway_id/);
      expect(routeMatch).not.toBeNull();
    });

    test("VPC has tags", () => {
      const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?tags\s*=/);
      expect(vpcMatch).not.toBeNull();
    });

    test("Internet Gateway references VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("subnets reference availability zones data source", () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names/);
    });
  });

  describe("Detailed Security Group Rules", () => {
    test("EC2 security group has description", () => {
      const sgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?description\s*=/);
      expect(sgMatch).not.toBeNull();
    });

    test("EC2 security group ingress rule has description", () => {
      const ingressMatch = stackContent.match(/ingress\s*{[\s\S]*?description\s*=\s*"HTTPS from anywhere"/);
      expect(ingressMatch).not.toBeNull();
    });

    test("EC2 security group egress rule has description", () => {
      const egressMatch = stackContent.match(/egress\s*{[\s\S]*?description\s*=/);
      expect(egressMatch).not.toBeNull();
    });

    test("EC2 security group HTTPS uses TCP protocol", () => {
      const protocolMatch = stackContent.match(/ingress\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"/);
      expect(protocolMatch).not.toBeNull();
    });

    test("EC2 security group allows HTTPS from 0.0.0.0/0", () => {
      const cidrMatch = stackContent.match(/ingress\s*{[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      expect(cidrMatch).not.toBeNull();
    });

    test("RDS security group has description", () => {
      const rdsSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?description\s*=/);
      expect(rdsSgMatch).not.toBeNull();
    });

    test("RDS security group references EC2 security group", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("RDS security group uses MySQL port 3306", () => {
      const portMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
      expect(portMatch).not.toBeNull();
    });

    test("RDS security group uses TCP protocol", () => {
      const rdsTcpMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?protocol\s*=\s*"tcp"/);
      expect(rdsTcpMatch).not.toBeNull();
    });

    test("security groups reference VPC", () => {
      const sgRefs = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/g);
      expect(sgRefs).not.toBeNull();
      expect(sgRefs!.length).toBeGreaterThanOrEqual(2);
    });

    test("security groups have names defined", () => {
      expect(stackContent).toMatch(/name\s*=\s*"ec2-security-group"/);
      expect(stackContent).toMatch(/name\s*=\s*"rds-security-group"/);
    });
  });

  describe("Detailed IAM Configuration", () => {
    test("EC2 IAM role has name", () => {
      expect(stackContent).toMatch(/name\s*=\s*"ec2-instance-role"/);
    });

    test("EC2 IAM role assume policy uses 2012-10-17 version", () => {
      const roleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"[\s\S]*?Version.*2012-10-17/);
      expect(roleMatch).not.toBeNull();
    });

    test("EC2 IAM role allows sts:AssumeRole action", () => {
      const assumeMatch = stackContent.match(/Action.*sts:AssumeRole/);
      expect(assumeMatch).not.toBeNull();
    });

    test("S3ReadAccess policy has description", () => {
      const descMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"s3_read_access"[\s\S]*?description\s*=/);
      expect(descMatch).not.toBeNull();
    });

    test("S3ReadAccess policy includes s3:GetObject action", () => {
      expect(stackContent).toMatch(/s3:GetObject/);
    });

    test("S3ReadAccess policy includes s3:ListBucket action", () => {
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test("S3ReadAccess policy includes s3:GetBucketLocation action", () => {
      expect(stackContent).toMatch(/s3:GetBucketLocation/);
    });

    test("S3ReadAccess policy includes s3:GetObjectVersion action", () => {
      expect(stackContent).toMatch(/s3:GetObjectVersion/);
    });

    test("S3ReadAccess policy includes s3:ListBucketVersions action", () => {
      expect(stackContent).toMatch(/s3:ListBucketVersions/);
    });

    test("S3ReadAccess policy references S3 bucket ARN", () => {
      expect(stackContent).toMatch(/aws_s3_bucket\.main\.arn/);
    });

    test("CloudWatch Logs policy has description", () => {
      const cwDescMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"cloudwatch_logs"[\s\S]*?description\s*=/);
      expect(cwDescMatch).not.toBeNull();
    });

    test("CloudWatch Logs policy includes logs:CreateLogGroup action", () => {
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
    });

    test("CloudWatch Logs policy includes logs:CreateLogStream action", () => {
      expect(stackContent).toMatch(/logs:CreateLogStream/);
    });

    test("CloudWatch Logs policy includes logs:PutLogEvents action", () => {
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("CloudWatch Logs policy includes logs:DescribeLogStreams action", () => {
      expect(stackContent).toMatch(/logs:DescribeLogStreams/);
    });

    test("IAM instance profile has name", () => {
      expect(stackContent).toMatch(/name\s*=\s*"ec2-instance-profile"/);
    });

    test("IAM instance profile references EC2 role", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test("CloudTrail IAM role has proper service principal", () => {
      const ctRoleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"cloudtrail"[\s\S]*?Service.*cloudtrail\.amazonaws\.com/);
      expect(ctRoleMatch).not.toBeNull();
    });

    test("CloudTrail IAM policy references CloudWatch Log Group ARN", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_log_group\.cloudtrail\.arn/);
    });

    test("IAM policy attachments reference correct policy ARNs", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.s3_read_access\.arn/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*aws_iam_policy\.cloudwatch_logs\.arn/);
    });

    test("IAM policy attachments reference correct role names", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.cloudtrail\.name/);
    });
  });

  describe("Detailed RDS Configuration", () => {
    test("RDS instance has identifier", () => {
      expect(stackContent).toMatch(/identifier\s*=\s*"secure-mysql-db"/);
    });

    test("RDS uses MySQL 8.0 engine version", () => {
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS uses db.t3.micro instance class", () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("RDS has allocated storage defined", () => {
      expect(stackContent).toMatch(/allocated_storage\s*=\s*20/);
    });

    test("RDS uses gp3 storage type", () => {
      expect(stackContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test("RDS has database name defined", () => {
      expect(stackContent).toMatch(/db_name\s*=\s*"secureapp"/);
    });

    test("RDS has username defined", () => {
      expect(stackContent).toMatch(/username\s*=\s*"admin"/);
    });

    test("RDS has password from random_password resource (no hardcoded password)", () => {
      expect(stackContent).toMatch(/password\s*=\s*random_password\.rds_password\.result/);
      expect(stackContent).not.toMatch(/password\s*=\s*"[A-Z]/); // No hardcoded passwords like "ChangeMePlease"
    });

    test("RDS references DB subnet group", () => {
      expect(stackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test("RDS references security group", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test("RDS has backup retention period set", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });

    test("RDS has backup window defined", () => {
      expect(stackContent).toMatch(/backup_window\s*=\s*"[^"]+"/);
    });

    test("RDS has maintenance window defined", () => {
      expect(stackContent).toMatch(/maintenance_window\s*=\s*"[^"]+"/);
    });

    test("RDS exports error logs to CloudWatch", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports[\s\S]*?"error"/);
    });

    test("RDS exports general logs to CloudWatch", () => {
      expect(stackContent).toMatch(/"general"/);
    });

    test("RDS exports slow query logs to CloudWatch", () => {
      expect(stackContent).toMatch(/"slowquery"/);
    });

    test("DB subnet group references database subnets", () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test("KMS key has deletion window defined", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
    });

    test("KMS alias has proper name format", () => {
      expect(stackContent).toMatch(/name\s*=\s*"alias\/rds-encryption-key"/);
    });

    test("KMS alias references KMS key", () => {
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.rds\.key_id/);
    });
  });

  describe("Detailed S3 Configuration", () => {
    test("main S3 bucket uses random suffix", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"secure-app-bucket-\$\{random_id\.bucket_suffix\.hex\}"/);
    });

    test("CloudTrail S3 bucket uses random suffix", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"cloudtrail-logs-\$\{random_id\.cloudtrail_bucket_suffix\.hex\}"/);
    });

    test("random_id for bucket has byte_length defined", () => {
      expect(stackContent).toMatch(/byte_length\s*=\s*8/);
    });

    test("S3 versioning references main bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"[\s\S]*?bucket\s*=\s*aws_s3_bucket\.main\.id/);
    });

    test("S3 public access block references main bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"[\s\S]*?bucket\s*=\s*aws_s3_bucket\.main\.id/);
    });

    test("S3 encryption configuration references main bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"[\s\S]*?bucket\s*=\s*aws_s3_bucket\.main\.id/);
    });

    test("S3 bucket policy references CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"[\s\S]*?bucket\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
    });

    test("S3 bucket policy allows CloudTrail service", () => {
      const policyMatch = stackContent.match(/Service.*cloudtrail\.amazonaws\.com/);
      expect(policyMatch).not.toBeNull();
    });

    test("S3 bucket policy includes GetBucketAcl action", () => {
      expect(stackContent).toMatch(/s3:GetBucketAcl/);
    });

    test("S3 bucket policy includes PutObject action", () => {
      expect(stackContent).toMatch(/s3:PutObject/);
    });

    test("main S3 bucket has Environment tag", () => {
      const tagMatch = stackContent.match(/resource\s+"aws_s3_bucket"\s+"main"[\s\S]*?Environment\s*=\s*"production"/);
      expect(tagMatch).not.toBeNull();
    });
  });

  describe("Detailed CloudTrail Configuration", () => {
    test("CloudTrail has name defined", () => {
      expect(stackContent).toMatch(/name\s*=\s*"main-trail"/);
    });

    test("CloudTrail references S3 bucket", () => {
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
    });

    test("CloudTrail references CloudWatch Log Group ARN", () => {
      expect(stackContent).toMatch(/cloud_watch_logs_group_arn\s*=\s*"\$\{aws_cloudwatch_log_group\.cloudtrail\.arn\}:\*"/);
    });

    test("CloudTrail references IAM role ARN", () => {
      expect(stackContent).toMatch(/cloud_watch_logs_role_arn\s*=\s*aws_iam_role\.cloudtrail\.arn/);
    });

    test("CloudTrail has dependencies defined", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail\]/);
    });

    test("CloudTrail event selector includes data resources", () => {
      expect(stackContent).toMatch(/data_resource\s*{/);
    });

    test("CloudTrail tracks S3 object events", () => {
      expect(stackContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
    });

    test("CloudTrail tracks all S3 buckets", () => {
      expect(stackContent).toMatch(/values\s*=\s*\["arn:aws:s3:::\*\/\*"\]/);
    });

    test("CloudWatch Log Group has name defined", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/cloudtrail\/api-activity"/);
    });

    test("CloudWatch Log Group references retention period", () => {
      const retentionMatch = stackContent.match(/retention_in_days\s*=\s*7/);
      expect(retentionMatch).not.toBeNull();
    });
  });

  describe("Detailed Launch Template and ASG Configuration", () => {
    test("Launch Template has name_prefix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"secure-app-template"/);
    });

    test("Launch Template references security group", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("Launch Template has user_data defined", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test("Launch Template user_data includes Apache installation", () => {
      expect(stackContent).toMatch(/httpd/);
    });

    test("Launch Template user_data includes SSL configuration", () => {
      expect(stackContent).toMatch(/mod_ssl/);
    });

    test("Launch Template has tag specifications", () => {
      expect(stackContent).toMatch(/tag_specifications\s*{/);
    });

    test("Launch Template tags instances", () => {
      expect(stackContent).toMatch(/resource_type\s*=\s*"instance"/);
    });

    test("Auto Scaling Group has name defined", () => {
      expect(stackContent).toMatch(/name\s*=\s*"secure-app-asg"/);
    });

    test("Auto Scaling Group references public subnets", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("Auto Scaling Group has desired capacity", () => {
      expect(stackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("Auto Scaling Group has health check type", () => {
      expect(stackContent).toMatch(/health_check_type\s*=\s*"EC2"/);
    });

    test("Auto Scaling Group has health check grace period", () => {
      expect(stackContent).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test("Auto Scaling Group references latest launch template version", () => {
      expect(stackContent).toMatch(/version\s*=\s*"\$Latest"/);
    });

    test("Auto Scaling Group has tags", () => {
      const asgMatch = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?tag\s*{/);
      expect(asgMatch).not.toBeNull();
    });

    test("Auto Scaling Group tag propagates at launch", () => {
      expect(stackContent).toMatch(/propagate_at_launch\s*=\s*true/);
    });
  });

  describe("Data Source Validations", () => {
    test("availability zones data source filters available state", () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("AMI data source uses most_recent flag", () => {
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
    });

    test("AMI data source specifies Amazon owner", () => {
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("AMI data source filters by name pattern", () => {
      expect(stackContent).toMatch(/name\s*=\s*"name"/);
    });

    test("AMI data source filters by virtualization type", () => {
      expect(stackContent).toMatch(/name\s*=\s*"virtualization-type"/);
      expect(stackContent).toMatch(/values\s*=\s*\["hvm"\]/);
    });
  });

  describe("Output Validations", () => {
    test("vpc_id output has description", () => {
      const vpcOutMatch = stackContent.match(/output\s+"vpc_id"\s*{[\s\S]*?description\s*=/);
      expect(vpcOutMatch).not.toBeNull();
    });

    test("public_subnet_ids output has description", () => {
      const pubOutMatch = stackContent.match(/output\s+"public_subnet_ids"\s*{[\s\S]*?description\s*=/);
      expect(pubOutMatch).not.toBeNull();
    });

    test("private_subnet_ids output has description", () => {
      const privOutMatch = stackContent.match(/output\s+"private_subnet_ids"\s*{[\s\S]*?description\s*=/);
      expect(privOutMatch).not.toBeNull();
    });

    test("s3_bucket_name output has description", () => {
      const s3OutMatch = stackContent.match(/output\s+"s3_bucket_name"\s*{[\s\S]*?description\s*=/);
      expect(s3OutMatch).not.toBeNull();
    });

    test("rds_endpoint output has description", () => {
      const rdsOutMatch = stackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?description\s*=/);
      expect(rdsOutMatch).not.toBeNull();
    });

    test("cloudtrail_name output has description", () => {
      const ctOutMatch = stackContent.match(/output\s+"cloudtrail_name"\s*{[\s\S]*?description\s*=/);
      expect(ctOutMatch).not.toBeNull();
    });

    test("asg_name output has description", () => {
      const asgOutMatch = stackContent.match(/output\s+"asg_name"\s*{[\s\S]*?description\s*=/);
      expect(asgOutMatch).not.toBeNull();
    });

    test("vpc_id output references VPC resource", () => {
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("s3_bucket_name output references S3 bucket", () => {
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.main\.id/);
    });

    test("rds_endpoint output references RDS instance", () => {
      expect(stackContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    });
  });
});
