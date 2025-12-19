// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure in ../lib/tap_stack.tf
// Tests validate the presence and configuration of all AWS resources

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Highly Available Web Application Infrastructure - tap_stack.tf", () => {
  let tapStackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(TAP_STACK_PATH)) {
      throw new Error(`tap_stack.tf not found at: ${TAP_STACK_PATH}`);
    }
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
  });

  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf file exists and is not empty", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
      expect(tapStackContent.length).toBeGreaterThan(5000);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf handles it)", () => {
      expect(tapStackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block in tap_stack.tf (provider.tf handles it)", () => {
      expect(tapStackContent).not.toMatch(/\bterraform\s*{\s*required_version/);
    });

    test("file is properly formatted with comments", () => {
      expect(tapStackContent).toMatch(/# tap_stack\.tf - Secure, Highly Available Web Application Infrastructure/);
    });

    test("file contains proper resource organization", () => {
      expect(tapStackContent).toMatch(/# Variable definitions/);
      expect(tapStackContent).toMatch(/# VPC Configuration/);
      expect(tapStackContent).toMatch(/# Security Group/);
      expect(tapStackContent).toMatch(/# Outputs for reference/);
    });
  });

  describe("Variables Configuration", () => {
    test("declares aws_region variable with default us-west-2", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
      expect(tapStackContent).toMatch(/type\s*=\s*string/);
    });

    test("declares db_password variable with sensitive flag", () => {
      expect(tapStackContent).toMatch(/variable\s+"db_password"\s*{/);
      expect(tapStackContent).toMatch(/sensitive\s*=\s*true/);
      expect(tapStackContent).toMatch(/type\s*=\s*string/);
    });

    test("db_password variable has proper description", () => {
      const varSection = tapStackContent.match(/variable\s+"db_password"\s*{[\s\S]*?^}/m);
      expect(varSection).toBeTruthy();
      if (varSection) {
        expect(varSection[0]).toMatch(/description.*RDS database master password/i);
      }
    });
  });

  describe("Data Sources", () => {
    test("declares aws_availability_zones data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(tapStackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("declares aws_ami data source for Amazon Linux 2", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
      expect(tapStackContent).toMatch(/most_recent\s*=\s*true/);
      expect(tapStackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(tapStackContent).toMatch(/amzn2-ami-hvm-\*-x86_64-gp2/);
    });
  });

  describe("VPC Configuration", () => {
    test("creates VPC resource with correct CIDR", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS hostnames and DNS support", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has proper tags", () => {
      const vpcSection = tapStackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(vpcSection).toBeTruthy();
      if (vpcSection) {
        expect(vpcSection[0]).toMatch(/Name\s*=\s*"webapp-vpc"/);
        expect(vpcSection[0]).toMatch(/Environment\s*=\s*"Production"/);
        expect(vpcSection[0]).toMatch(/Project\s*=\s*"WebApp"/);
      }
    });
  });

  describe("Subnets Configuration", () => {
    test("creates public subnet 1 in AZ 0", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"\s*{/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    });

    test("creates public subnet 2 in AZ 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"\s*{/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnet1 = tapStackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?^}/m);
      expect(publicSubnet1).toBeTruthy();
      if (publicSubnet1) {
        expect(publicSubnet1[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });

    test("creates private subnet 1 in AZ 0", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"\s*{/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    });

    test("creates private subnet 2 in AZ 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"\s*{/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.12\.0\/24"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
    });

    test("subnets have proper Type tags", () => {
      const publicSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(publicSubnetSection).toBeTruthy();
      if (publicSubnetSection) {
        expect(publicSubnetSection[0]).toMatch(/Type\s*=\s*"Public"/);
      }

      const privateSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"private_1"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(privateSubnetSection).toBeTruthy();
      if (privateSubnetSection) {
        expect(privateSubnetSection[0]).toMatch(/Type\s*=\s*"Private"/);
      }
    });
  });

  describe("Internet Gateway", () => {
    test("creates Internet Gateway attached to VPC", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("Internet Gateway has proper tags", () => {
      const igwSection = tapStackContent.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(igwSection).toBeTruthy();
      if (igwSection) {
        expect(igwSection[0]).toMatch(/Name\s*=\s*"webapp-igw"/);
        expect(igwSection[0]).toMatch(/Environment\s*=\s*"Production"/);
      }
    });
  });

  describe("NAT Gateways and Elastic IPs", () => {
    test("creates Elastic IP 1 for NAT Gateway 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"\s*{/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates Elastic IP 2 for NAT Gateway 2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"\s*{/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("EIPs depend on Internet Gateway", () => {
      const eip1Section = tapStackContent.match(/resource\s+"aws_eip"\s+"nat_1"\s*{[\s\S]*?depends_on\s*=\s*\[[\s\S]*?\]/m);
      expect(eip1Section).toBeTruthy();
      if (eip1Section) {
        expect(eip1Section[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      }
    });

    test("creates NAT Gateway 1 in public subnet 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"\s*{/);
      expect(tapStackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_1\.id/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
    });

    test("creates NAT Gateway 2 in public subnet 2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"\s*{/);
      expect(tapStackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_2\.id/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_2\.id/);
    });

    test("NAT Gateways depend on Internet Gateway", () => {
      const nat1Section = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"nat_1"\s*{[\s\S]*?depends_on\s*=\s*\[[\s\S]*?\]/m);
      expect(nat1Section).toBeTruthy();
      if (nat1Section) {
        expect(nat1Section[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      }
    });
  });

  describe("Route Tables", () => {
    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("public route table routes to Internet Gateway", () => {
      const publicRtSection = tapStackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?route\s*{[\s\S]*?}/m);
      expect(publicRtSection).toBeTruthy();
      if (publicRtSection) {
        expect(publicRtSection[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
        expect(publicRtSection[0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      }
    });

    test("creates private route table 1 for AZ 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("private route table 1 routes to NAT Gateway 1", () => {
      const privateRt1Section = tapStackContent.match(/resource\s+"aws_route_table"\s+"private_1"\s*{[\s\S]*?route\s*{[\s\S]*?}/m);
      expect(privateRt1Section).toBeTruthy();
      if (privateRt1Section) {
        expect(privateRt1Section[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
        expect(privateRt1Section[0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
      }
    });

    test("creates private route table 2 for AZ 2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"\s*{/);
    });

    test("private route table 2 routes to NAT Gateway 2", () => {
      const privateRt2Section = tapStackContent.match(/resource\s+"aws_route_table"\s+"private_2"\s*{[\s\S]*?route\s*{[\s\S]*?}/m);
      expect(privateRt2Section).toBeTruthy();
      if (privateRt2Section) {
        expect(privateRt2Section[0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
      }
    });
  });

  describe("Route Table Associations", () => {
    test("creates public subnet 1 route table association", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"\s*{/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
      expect(tapStackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });

    test("creates public subnet 2 route table association", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"\s*{/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_2\.id/);
    });

    test("creates private subnet 1 route table association", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"\s*{/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1\.id/);
      expect(tapStackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.private_1\.id/);
    });

    test("creates private subnet 2 route table association", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"\s*{/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_2\.id/);
      expect(tapStackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.private_2\.id/);
    });
  });

  describe("Security Groups", () => {
    test("creates EC2 security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-ec2-sg"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("EC2 security group allows HTTP from anywhere", () => {
      const ec2SgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?(?=resource\s+"aws_security_group"\s+"rds"|$)/);
      expect(ec2SgSection).toBeTruthy();
      if (ec2SgSection) {
        expect(ec2SgSection[0]).toMatch(/from_port\s*=\s*80/);
        expect(ec2SgSection[0]).toMatch(/to_port\s*=\s*80/);
        expect(ec2SgSection[0]).toMatch(/protocol\s*=\s*"tcp"/);
        expect(ec2SgSection[0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      }
    });

    test("EC2 security group allows SSH from anywhere", () => {
      const ec2SgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?(?=resource\s+"aws_security_group"\s+"rds"|$)/);
      expect(ec2SgSection).toBeTruthy();
      if (ec2SgSection) {
        expect(ec2SgSection[0]).toMatch(/from_port\s*=\s*22/);
        expect(ec2SgSection[0]).toMatch(/to_port\s*=\s*22/);
      }
    });

    test("EC2 security group allows all egress", () => {
      const ec2SgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?(?=resource\s+"aws_security_group"\s+"rds"|$)/);
      expect(ec2SgSection).toBeTruthy();
      if (ec2SgSection) {
        expect(ec2SgSection[0]).toMatch(/egress\s*{/);
        expect(ec2SgSection[0]).toMatch(/from_port\s*=\s*0/);
        expect(ec2SgSection[0]).toMatch(/protocol\s*=\s*"-1"/);
      }
    });

    test("creates RDS security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-rds-sg"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("RDS security group allows MySQL from EC2 security group only", () => {
      const rdsSgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?(?=resource\s+"|$)/);
      expect(rdsSgSection).toBeTruthy();
      if (rdsSgSection) {
        expect(rdsSgSection[0]).toMatch(/from_port\s*=\s*3306/);
        expect(rdsSgSection[0]).toMatch(/to_port\s*=\s*3306/);
        expect(rdsSgSection[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
      }
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates S3 bucket with prefix", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"webapp_storage"\s*{/);
      expect(tapStackContent).toMatch(/bucket_prefix\s*=\s*"webapp-storage-"/);
    });

    test("S3 bucket has proper tags", () => {
      const s3Section = tapStackContent.match(/resource\s+"aws_s3_bucket"\s+"webapp_storage"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(s3Section).toBeTruthy();
      if (s3Section) {
        expect(s3Section[0]).toMatch(/Name\s*=\s*"webapp-storage-bucket"/);
        expect(s3Section[0]).toMatch(/Environment\s*=\s*"Production"/);
      }
    });

    test("enables S3 bucket public access block", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"webapp_storage"\s*{/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.webapp_storage\.id/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enables S3 bucket versioning", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"webapp_storage"\s*{/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.webapp_storage\.id/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 bucket server-side encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"webapp_storage"\s*{/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.webapp_storage\.id/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe("IAM Resources", () => {
    test("creates EC2 IAM role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-ec2-role"/);
    });

    test("EC2 IAM role has EC2 assume role policy", () => {
      const iamRoleSection = tapStackContent.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?assume_role_policy[\s\S]*?}\)/);
      expect(iamRoleSection).toBeTruthy();
      if (iamRoleSection) {
        expect(iamRoleSection[0]).toMatch(/ec2\.amazonaws\.com/);
        expect(iamRoleSection[0]).toMatch(/sts:AssumeRole/);
      }
    });

    test("creates EC2 S3 policy with least privilege", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_policy"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-ec2-s3-policy"/);
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.id/);
    });

    test("EC2 S3 policy allows only GetObject and ListBucket", () => {
      const policySection = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_policy"\s*{[\s\S]*?policy[\s\S]*?}\)/);
      expect(policySection).toBeTruthy();
      if (policySection) {
        expect(policySection[0]).toMatch(/s3:GetObject/);
        expect(policySection[0]).toMatch(/s3:ListBucket/);
        expect(policySection[0]).toMatch(/aws_s3_bucket\.webapp_storage\.arn/);
      }
    });

    test("creates IAM instance profile", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-ec2-profile"/);
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test("attaches CloudWatch Agent policy to EC2 role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"\s*{/);
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
      expect(tapStackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/);
    });
  });

  describe("CloudWatch Log Group", () => {
    test("creates CloudWatch log group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"webapp_logs"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"\/aws\/webapp\/application"/);
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test("CloudWatch log group has proper tags", () => {
      const logGroupSection = tapStackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"webapp_logs"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(logGroupSection).toBeTruthy();
      if (logGroupSection) {
        expect(logGroupSection[0]).toMatch(/Name\s*=\s*"webapp-log-group"/);
        expect(logGroupSection[0]).toMatch(/Environment\s*=\s*"Production"/);
      }
    });
  });

  describe("EC2 Instances", () => {
    test("creates EC2 instance 1 in public subnet 1", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"webapp_1"\s*{/);
      expect(tapStackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(tapStackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
    });

    test("EC2 instance 1 has security group attached", () => {
      const ec2_1Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_1"\s*{[\s\S]*?(?=resource\s+"aws_instance"\s+"webapp_2"|$)/);
      expect(ec2_1Section).toBeTruthy();
      if (ec2_1Section) {
        expect(ec2_1Section[0]).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
      }
    });

    test("EC2 instance 1 has IAM instance profile", () => {
      const ec2_1Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_1"\s*{[\s\S]*?(?=resource\s+"aws_instance"\s+"webapp_2"|$)/);
      expect(ec2_1Section).toBeTruthy();
      if (ec2_1Section) {
        expect(ec2_1Section[0]).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
      }
    });

    test("EC2 instance 1 has detailed monitoring enabled", () => {
      const ec2_1Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_1"\s*{[\s\S]*?(?=resource\s+"aws_instance"\s+"webapp_2"|$)/);
      expect(ec2_1Section).toBeTruthy();
      if (ec2_1Section) {
        expect(ec2_1Section[0]).toMatch(/monitoring\s*=\s*true/);
      }
    });

    test("EC2 instance 1 has user data with CloudWatch agent", () => {
      const ec2_1Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_1"\s*{[\s\S]*?(?=resource\s+"aws_instance"\s+"webapp_2"|$)/);
      expect(ec2_1Section).toBeTruthy();
      if (ec2_1Section) {
        expect(ec2_1Section[0]).toMatch(/user_data\s*=/);
        expect(ec2_1Section[0]).toMatch(/amazon-cloudwatch-agent/);
        expect(ec2_1Section[0]).toMatch(/httpd/);
        expect(ec2_1Section[0]).toMatch(/WebApp Server 1/);
      }
    });

    test("creates EC2 instance 2 in public subnet 2", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"webapp_2"\s*{/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_2\.id/);
    });

    test("EC2 instance 2 has user data with different server name", () => {
      const ec2_2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_2"\s*{[\s\S]*?(?=resource\s+"aws_db_subnet_group"|$)/);
      expect(ec2_2Section).toBeTruthy();
      if (ec2_2Section) {
        expect(ec2_2Section[0]).toMatch(/WebApp Server 2/);
      }
    });

    test("EC2 instances have proper tags", () => {
      const ec2_1Section = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_1"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(ec2_1Section).toBeTruthy();
      if (ec2_1Section) {
        expect(ec2_1Section[0]).toMatch(/Name\s*=\s*"webapp-ec2-1"/);
        expect(ec2_1Section[0]).toMatch(/Environment\s*=\s*"Production"/);
      }
    });
  });

  describe("RDS Database", () => {
    test("creates RDS subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"rds"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"webapp-rds-subnet-group"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_1\.id,\s*aws_subnet\.private_2\.id\]/);
    });

    test("creates RDS MySQL instance", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{/);
      expect(tapStackContent).toMatch(/identifier\s*=\s*"webapp-db"/);
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tapStackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS uses t3.micro instance class", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
      }
    });

    test("RDS has 20GB gp3 storage with encryption", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/allocated_storage\s*=\s*20/);
        expect(rdsSection[0]).toMatch(/storage_type\s*=\s*"gp3"/);
        expect(rdsSection[0]).toMatch(/storage_encrypted\s*=\s*true/);
      }
    });

    test("RDS database is named webapp with admin user", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/db_name\s*=\s*"webapp"/);
        expect(rdsSection[0]).toMatch(/username\s*=\s*"admin"/);
      }
    });

    test("RDS uses db_password variable (not hardcoded)", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/password\s*=\s*var\.db_password/);
        expect(rdsSection[0]).not.toMatch(/password\s*=\s*"[^v]/);
      }
    });

    test("RDS has Multi-AZ enabled", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/multi_az\s*=\s*true/);
      }
    });

    test("RDS uses correct subnet group and security group", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.rds\.name/);
        expect(rdsSection[0]).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
      }
    });

    test("RDS has backup retention of 7 days", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/backup_retention_period\s*=\s*7/);
        expect(rdsSection[0]).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
        expect(rdsSection[0]).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
      }
    });

    test("RDS is not publicly accessible", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/publicly_accessible\s*=\s*false/);
      }
    });

    test("RDS has CloudWatch log exports enabled", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
      }
    });

    test("RDS has Performance Insights enabled", () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"webapp_db"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"|$)/);
      expect(rdsSection).toBeTruthy();
      if (rdsSection) {
        expect(rdsSection[0]).toMatch(/performance_insights_enabled\s*=\s*true/);
        expect(rdsSection[0]).toMatch(/performance_insights_retention_period\s*=\s*7/);
      }
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates EC2 instance 1 CPU alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_1"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-ec2-1-cpu-high"/);
      expect(tapStackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(tapStackContent).toMatch(/threshold\s*=\s*"80"/);
    });

    test("EC2 CPU alarm 1 monitors correct instance", () => {
      const alarm1Section = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_1"\s*{[\s\S]*?dimensions\s*=\s*{[\s\S]*?}/m);
      expect(alarm1Section).toBeTruthy();
      if (alarm1Section) {
        expect(alarm1Section[0]).toMatch(/InstanceId\s*=\s*aws_instance\.webapp_1\.id/);
      }
    });

    test("creates EC2 instance 2 CPU alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_2"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-ec2-2-cpu-high"/);
    });

    test("creates EC2 instance 1 health check alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_health_1"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-ec2-1-health-check"/);
      expect(tapStackContent).toMatch(/metric_name\s*=\s*"StatusCheckFailed"/);
    });

    test("EC2 health alarms have proper treat_missing_data", () => {
      const healthAlarm1Section = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_health_1"\s*{[\s\S]*?(?=resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_health_2"|$)/);
      expect(healthAlarm1Section).toBeTruthy();
      if (healthAlarm1Section) {
        expect(healthAlarm1Section[0]).toMatch(/treat_missing_data\s*=\s*"breaching"/);
      }
    });

    test("creates EC2 instance 2 health check alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_health_2"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-ec2-2-health-check"/);
    });

    test("creates RDS CPU alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-rds-cpu-high"/);
      expect(tapStackContent).toMatch(/threshold\s*=\s*"75"/);
    });

    test("RDS CPU alarm monitors correct database", () => {
      const rdsAlarmSection = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{[\s\S]*?dimensions\s*=\s*{[\s\S]*?}/m);
      expect(rdsAlarmSection).toBeTruthy();
      if (rdsAlarmSection) {
        expect(rdsAlarmSection[0]).toMatch(/DBInstanceIdentifier\s*=\s*aws_db_instance\.webapp_db\.identifier/);
      }
    });

    test("creates RDS storage alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"\s*{/);
      expect(tapStackContent).toMatch(/alarm_name\s*=\s*"webapp-rds-free-storage-low"/);
      expect(tapStackContent).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
      expect(tapStackContent).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
    });

    test("RDS storage alarm threshold is 2GB", () => {
      const storageAlarmSection = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"\s*{[\s\S]*?(?=resource\s+"output"|$)/);
      expect(storageAlarmSection).toBeTruthy();
      if (storageAlarmSection) {
        expect(storageAlarmSection[0]).toMatch(/threshold\s*=\s*"2147483648"/);
      }
    });

    test("CloudWatch alarms have proper tags", () => {
      const alarmSection = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu_1"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/m);
      expect(alarmSection).toBeTruthy();
      if (alarmSection) {
        expect(alarmSection[0]).toMatch(/Name\s*=\s*"webapp-ec2-1-cpu-alarm"/);
        expect(alarmSection[0]).toMatch(/Environment\s*=\s*"Production"/);
      }
    });
  });

  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(tapStackContent).toMatch(/description\s*=\s*"The ID of the VPC"/);
    });

    test("declares ec2_instance_1_public_ip output", () => {
      expect(tapStackContent).toMatch(/output\s+"ec2_instance_1_public_ip"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_instance\.webapp_1\.public_ip/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Public IP of EC2 instance 1"/);
    });

    test("declares ec2_instance_2_public_ip output", () => {
      expect(tapStackContent).toMatch(/output\s+"ec2_instance_2_public_ip"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_instance\.webapp_2\.public_ip/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Public IP of EC2 instance 2"/);
    });

    test("declares rds_endpoint output as sensitive", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_db_instance\.webapp_db\.endpoint/);
      expect(tapStackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("declares s3_bucket_name output", () => {
      expect(tapStackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_s3_bucket\.webapp_storage\.id/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Name of the S3 bucket"/);
    });
  });

  describe("High Availability Requirements", () => {
    test("infrastructure spans 2 Availability Zones", () => {
      const azReferences = tapStackContent.match(/data\.aws_availability_zones\.available\.names\[[01]\]/g);
      expect(azReferences).toBeTruthy();
      expect(azReferences!.length).toBeGreaterThanOrEqual(4);
    });

    test("has dual NAT Gateways for no single point of failure", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"/);
    });

    test("each private subnet has its own route table to specific NAT Gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"/);
      expect(tapStackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
      expect(tapStackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
    });

    test("RDS Multi-AZ is enabled", () => {
      expect(tapStackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("EC2 instances distributed across both AZs", () => {
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_2\.id/);
    });
  });

  describe("Security Best Practices", () => {
    test("S3 bucket encryption is configured with AES256", () => {
      expect(tapStackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("S3 bucket public access is completely blocked", () => {
      expect(tapStackContent).toMatch(/aws_s3_bucket_public_access_block/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("EC2 instances use IAM roles, not access keys", () => {
      expect(tapStackContent).toMatch(/iam_instance_profile/);
      expect(tapStackContent).not.toMatch(/access_key/);
      expect(tapStackContent).not.toMatch(/secret_key/);
    });

    test("RDS storage is encrypted at rest", () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS is in private subnets and not publicly accessible", () => {
      expect(tapStackContent).toMatch(/publicly_accessible\s*=\s*false/);
      const rdsSubnetGroupSection = tapStackContent.match(/resource\s+"aws_db_subnet_group"\s+"rds"\s*{[\s\S]*?}/);
      expect(rdsSubnetGroupSection).toBeTruthy();
      if (rdsSubnetGroupSection) {
        expect(rdsSubnetGroupSection[0]).toMatch(/aws_subnet\.private_1\.id/);
        expect(rdsSubnetGroupSection[0]).toMatch(/aws_subnet\.private_2\.id/);
      }
    });

    test("RDS security group only allows access from EC2 security group", () => {
      const rdsSgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?(?=resource\s+"|$)/);
      expect(rdsSgSection).toBeTruthy();
      if (rdsSgSection) {
        expect(rdsSgSection[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
        // RDS security group has egress with 0.0.0.0/0 which is acceptable for outbound
        // Only check that ingress does not use 0.0.0.0/0 for database access
        const ingressSection = rdsSgSection[0].match(/ingress\s*{[\s\S]*?}/);
        expect(ingressSection).toBeTruthy();
        if (ingressSection) {
          expect(ingressSection[0]).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
        }
      }
    });

    test("IAM follows least privilege principle", () => {
      const iamPolicySection = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_policy"\s*{[\s\S]*?}\)/);
      expect(iamPolicySection).toBeTruthy();
      if (iamPolicySection) {
        expect(iamPolicySection[0]).toMatch(/s3:GetObject/);
        expect(iamPolicySection[0]).toMatch(/s3:ListBucket/);
        expect(iamPolicySection[0]).not.toMatch(/s3:\*/);
        expect(iamPolicySection[0]).not.toMatch(/\*:\*/);
      }
    });

    test("no hardcoded passwords in infrastructure code", () => {
      expect(tapStackContent).not.toMatch(/password\s*=\s*"[^v]/);
      expect(tapStackContent).toMatch(/password\s*=\s*var\.db_password/);
    });

    test("db_password variable is marked as sensitive", () => {
      const dbPasswordVar = tapStackContent.match(/variable\s+"db_password"\s*{[\s\S]*?}/);
      expect(dbPasswordVar).toBeTruthy();
      if (dbPasswordVar) {
        expect(dbPasswordVar[0]).toMatch(/sensitive\s*=\s*true/);
      }
    });
  });

  describe("Tagging Strategy", () => {
    test("all major resources have Environment tag", () => {
      const environmentTags = tapStackContent.match(/Environment\s*=\s*"Production"/g);
      expect(environmentTags).toBeTruthy();
      expect(environmentTags!.length).toBeGreaterThanOrEqual(20);
    });

    test("all major resources have Project tag", () => {
      const projectTags = tapStackContent.match(/Project\s*=\s*"WebApp"/g);
      expect(projectTags).toBeTruthy();
      expect(projectTags!.length).toBeGreaterThanOrEqual(20);
    });

    test("resources have descriptive Name tags", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"webapp-vpc"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"webapp-igw"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"webapp-ec2-sg"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"webapp-rds-sg"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"webapp-storage-bucket"/);
    });
  });

  describe("Infrastructure Requirements Compliance", () => {
    test("region is us-west-2", () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("VPC CIDR is 10.0.0.0/16", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("has 2 public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
    });

    test("has 2 private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
    });

    test("uses t3.micro for EC2 instances", () => {
      expect(tapStackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test("uses db.t3.micro for RDS", () => {
      expect(tapStackContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("uses MySQL 8.0 for RDS", () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tapStackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("creates exactly 2 EC2 instances", () => {
      const ec2Instances = tapStackContent.match(/resource\s+"aws_instance"\s+"webapp_[12]"/g);
      expect(ec2Instances).toBeTruthy();
      expect(ec2Instances!.length).toBe(2);
    });

    test("creates exactly 6 CloudWatch alarms", () => {
      const alarms = tapStackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
      expect(alarms).toBeTruthy();
      expect(alarms!.length).toBe(6);
    });
  });
});
