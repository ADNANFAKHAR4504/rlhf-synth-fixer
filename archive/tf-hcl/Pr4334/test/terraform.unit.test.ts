// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed - only static code analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Secure AWS VPC Infrastructure - Unit Tests", () => {
  let configContent: string;

  beforeAll(() => {
    configContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Existence and Basic Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("declares provider in tap_stack.tf (all-in-one file)", () => {
      expect(configContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("configures us-east-1 region", () => {
      expect(configContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test("has terraform configuration block", () => {
      expect(configContent).toContain("terraform {");
      expect(configContent).toContain("required_providers");
    });
  });

  describe("Data Sources", () => {
    test("has data source for AWS account ID", () => {
      expect(configContent).toContain('data "aws_caller_identity" "current"');
    });

    test("has data source for Amazon Linux 2 AMI", () => {
      expect(configContent).toContain('data "aws_ami" "amazon_linux_2"');
      expect(configContent).toMatch(/most_recent\s*=\s*true/);
      expect(configContent).toContain("amzn2-ami-hvm-*-x86_64-gp2");
    });
  });

  describe("VPC Configuration", () => {
    test("creates VPC with correct CIDR block 10.0.0.0/16", () => {
      expect(configContent).toContain('resource "aws_vpc" "main_vpc"');
      expect(configContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS support and hostnames", () => {
      expect(configContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(configContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has Environment = Production tag", () => {
      const vpcBlock = configContent.match(/resource "aws_vpc" "main_vpc"[\s\S]*?^}/m);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toContain('Environment = "Production"');
    });
  });

  describe("Subnet Configuration", () => {
    test("creates two public subnets", () => {
      expect(configContent).toContain('resource "aws_subnet" "public_subnet_1"');
      expect(configContent).toContain('resource "aws_subnet" "public_subnet_2"');
    });

    test("public subnets have correct CIDR blocks", () => {
      expect(configContent).toMatch(/public_subnet_1"[\s\S]*?cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(configContent).toMatch(/public_subnet_2"[\s\S]*?cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("public subnets are in different availability zones", () => {
      expect(configContent).toMatch(/public_subnet_1"[\s\S]*?availability_zone\s*=\s*"us-east-1a"/);
      expect(configContent).toMatch(/public_subnet_2"[\s\S]*?availability_zone\s*=\s*"us-east-1b"/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnet1 = configContent.match(/resource "aws_subnet" "public_subnet_1"[\s\S]*?^}/m);
      const publicSubnet2 = configContent.match(/resource "aws_subnet" "public_subnet_2"[\s\S]*?^}/m);
      expect(publicSubnet1![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(publicSubnet2![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates two private subnets", () => {
      expect(configContent).toContain('resource "aws_subnet" "private_subnet_1"');
      expect(configContent).toContain('resource "aws_subnet" "private_subnet_2"');
    });

    test("private subnets have correct CIDR blocks", () => {
      expect(configContent).toMatch(/private_subnet_1"[\s\S]*?cidr_block\s*=\s*"10\.0\.3\.0\/24"/);
      expect(configContent).toMatch(/private_subnet_2"[\s\S]*?cidr_block\s*=\s*"10\.0\.4\.0\/24"/);
    });

    test("private subnets are in different availability zones", () => {
      expect(configContent).toMatch(/private_subnet_1"[\s\S]*?availability_zone\s*=\s*"us-east-1a"/);
      expect(configContent).toMatch(/private_subnet_2"[\s\S]*?availability_zone\s*=\s*"us-east-1b"/);
    });

    test("has proper subnet naming conventions", () => {
      expect(configContent).toContain('Name        = "public_subnet_az1"');
      expect(configContent).toContain('Name        = "public_subnet_az2"');
      expect(configContent).toContain('Name        = "private_subnet_az1"');
      expect(configContent).toContain('Name        = "private_subnet_az2"');
    });

    test("all subnets have Environment = Production tag", () => {
      const subnetMatches = configContent.match(/resource "aws_subnet"[\s\S]*?^}/gm);
      expect(subnetMatches).toBeTruthy();
      expect(subnetMatches!.length).toBeGreaterThanOrEqual(4);
      subnetMatches!.forEach(subnet => {
        expect(subnet).toContain('Environment = "Production"');
      });
    });
  });

  describe("Internet Gateway and NAT Gateway", () => {
    test("creates Internet Gateway", () => {
      expect(configContent).toContain('resource "aws_internet_gateway" "main_igw"');
    });

    test("Internet Gateway is attached to VPC", () => {
      const igwBlock = configContent.match(/resource "aws_internet_gateway" "main_igw"[\s\S]*?^}/m);
      expect(igwBlock![0]).toContain("vpc_id = aws_vpc.main_vpc.id");
    });

    test("creates Elastic IP for NAT Gateway", () => {
      expect(configContent).toContain('resource "aws_eip" "nat_eip"');
      expect(configContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateway in public subnet", () => {
      expect(configContent).toContain('resource "aws_nat_gateway" "main_nat_gw"');
      const natBlock = configContent.match(/resource "aws_nat_gateway" "main_nat_gw"[\s\S]*?^}/m);
      expect(natBlock![0]).toContain("allocation_id = aws_eip.nat_eip.id");
      expect(natBlock![0]).toContain("subnet_id     = aws_subnet.public_subnet_1.id");
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      const natBlock = configContent.match(/resource "aws_nat_gateway" "main_nat_gw"[\s\S]*?^}/m);
      expect(natBlock![0]).toContain("depends_on = [aws_internet_gateway.main_igw]");
    });

    test("Internet Gateway and NAT Gateway have Environment = Production tag", () => {
      const igwBlock = configContent.match(/resource "aws_internet_gateway" "main_igw"[\s\S]*?^}/m);
      const natBlock = configContent.match(/resource "aws_nat_gateway" "main_nat_gw"[\s\S]*?^}/m);
      expect(igwBlock![0]).toContain('Environment = "Production"');
      expect(natBlock![0]).toContain('Environment = "Production"');
    });
  });

  describe("Route Tables", () => {
    test("creates public route table", () => {
      expect(configContent).toContain('resource "aws_route_table" "public_rt"');
    });

    test("public route table routes to Internet Gateway", () => {
      const publicRt = configContent.match(/resource "aws_route_table" "public_rt"[\s\S]*?^}/m);
      expect(publicRt![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRt![0]).toContain("gateway_id = aws_internet_gateway.main_igw.id");
    });

    test("creates private route table", () => {
      expect(configContent).toContain('resource "aws_route_table" "private_rt"');
    });

    test("private route table routes to NAT Gateway", () => {
      const privateRt = configContent.match(/resource "aws_route_table" "private_rt"[\s\S]*?^}/m);
      expect(privateRt![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(privateRt![0]).toContain("nat_gateway_id = aws_nat_gateway.main_nat_gw.id");
    });

    test("associates public subnets with public route table", () => {
      expect(configContent).toContain('resource "aws_route_table_association" "public_subnet_1_association"');
      expect(configContent).toContain('resource "aws_route_table_association" "public_subnet_2_association"');
    });

    test("associates private subnets with private route table", () => {
      expect(configContent).toContain('resource "aws_route_table_association" "private_subnet_1_association"');
      expect(configContent).toContain('resource "aws_route_table_association" "private_subnet_2_association"');
    });

    test("route tables have Environment = Production tag", () => {
      const publicRt = configContent.match(/resource "aws_route_table" "public_rt"[\s\S]*?^}/m);
      const privateRt = configContent.match(/resource "aws_route_table" "private_rt"[\s\S]*?^}/m);
      expect(publicRt![0]).toContain('Environment = "Production"');
      expect(privateRt![0]).toContain('Environment = "Production"');
    });
  });

  describe("Security Groups", () => {
    test("creates public SSH security group", () => {
      expect(configContent).toContain('resource "aws_security_group" "sg_public_ssh"');
    });

    test("public security group allows SSH from 203.0.113.0/24", () => {
      const publicSg = configContent.match(/resource "aws_security_group" "sg_public_ssh"[\s\S]*?^}/m);
      expect(publicSg![0]).toMatch(/from_port\s*=\s*22/);
      expect(publicSg![0]).toMatch(/to_port\s*=\s*22/);
      expect(publicSg![0]).toMatch(/protocol\s*=\s*"tcp"/);
      expect(publicSg![0]).toContain('cidr_blocks = ["203.0.113.0/24"]');
    });

    test("public security group allows all outbound traffic", () => {
      const publicSg = configContent.match(/resource "aws_security_group" "sg_public_ssh"[\s\S]*?^}/m);
      expect(publicSg![0]).toMatch(/egress[\s\S]*?from_port\s*=\s*0/);
      expect(publicSg![0]).toMatch(/egress[\s\S]*?to_port\s*=\s*0/);
      expect(publicSg![0]).toMatch(/egress[\s\S]*?protocol\s*=\s*"-1"/);
    });

    test("creates private EC2 security group", () => {
      expect(configContent).toContain('resource "aws_security_group" "sg_private_ec2"');
    });

    test("private security group allows SSH from public security group", () => {
      const privateSg = configContent.match(/resource "aws_security_group" "sg_private_ec2"[\s\S]*?^}/m);
      expect(privateSg![0]).toMatch(/from_port\s*=\s*22/);
      expect(privateSg![0]).toMatch(/to_port\s*=\s*22/);
      expect(privateSg![0]).toMatch(/protocol\s*=\s*"tcp"/);
      expect(privateSg![0]).toContain("security_groups = [aws_security_group.sg_public_ssh.id]");
    });

    test("private security group allows all outbound traffic", () => {
      const privateSg = configContent.match(/resource "aws_security_group" "sg_private_ec2"[\s\S]*?^}/m);
      expect(privateSg![0]).toMatch(/egress[\s\S]*?from_port\s*=\s*0/);
      expect(privateSg![0]).toMatch(/egress[\s\S]*?to_port\s*=\s*0/);
      expect(privateSg![0]).toMatch(/egress[\s\S]*?protocol\s*=\s*"-1"/);
    });

    test("security groups have Environment = Production tag", () => {
      const publicSg = configContent.match(/resource "aws_security_group" "sg_public_ssh"[\s\S]*?^}/m);
      const privateSg = configContent.match(/resource "aws_security_group" "sg_private_ec2"[\s\S]*?^}/m);
      expect(publicSg![0]).toContain('Environment = "Production"');
      expect(privateSg![0]).toContain('Environment = "Production"');
    });
  });

  describe("S3 Buckets for CloudTrail", () => {
    test("creates S3 bucket for CloudTrail access logs", () => {
      expect(configContent).toContain('resource "aws_s3_bucket" "cloudtrail_access_logs"');
      expect(configContent).toContain("cloudtrail-logs-access-bucket-");
    });

    test("creates S3 bucket for CloudTrail logs", () => {
      expect(configContent).toContain('resource "aws_s3_bucket" "cloudtrail_logs"');
      expect(configContent).toContain("cloudtrail-logs-bucket-");
    });

    test("S3 buckets have force_destroy enabled", () => {
      const accessLogsBucket = configContent.match(/resource "aws_s3_bucket" "cloudtrail_access_logs"[\s\S]*?^}/m);
      const logsBucket = configContent.match(/resource "aws_s3_bucket" "cloudtrail_logs"[\s\S]*?^}/m);
      expect(accessLogsBucket![0]).toContain("force_destroy = true");
      expect(logsBucket![0]).toContain("force_destroy = true");
    });

    test("enables versioning for both S3 buckets", () => {
      expect(configContent).toContain('resource "aws_s3_bucket_versioning" "cloudtrail_access_logs_versioning"');
      expect(configContent).toContain('resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning"');
      expect(configContent).toMatch(/cloudtrail_access_logs_versioning"[\s\S]*?status\s*=\s*"Enabled"/);
      expect(configContent).toMatch(/cloudtrail_logs_versioning"[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("enables encryption for both S3 buckets", () => {
      expect(configContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_access_logs_encryption"');
      expect(configContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption"');
      expect(configContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("blocks public access to both S3 buckets", () => {
      expect(configContent).toContain('resource "aws_s3_bucket_public_access_block" "cloudtrail_access_logs_pab"');
      expect(configContent).toContain('resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab"');
      
      const pabMatches = configContent.match(/resource "aws_s3_bucket_public_access_block"[\s\S]*?^}/gm);
      expect(pabMatches!.length).toBeGreaterThanOrEqual(2);
      pabMatches!.forEach(pab => {
        expect(pab).toMatch(/block_public_acls\s*=\s*true/);
        expect(pab).toMatch(/block_public_policy\s*=\s*true/);
        expect(pab).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(pab).toMatch(/restrict_public_buckets\s*=\s*true/);
      });
    });

    test("enables access logging for CloudTrail logs bucket", () => {
      expect(configContent).toContain('resource "aws_s3_bucket_logging" "cloudtrail_logs_logging"');
      const loggingBlock = configContent.match(/resource "aws_s3_bucket_logging" "cloudtrail_logs_logging"[\s\S]*?^}/m);
      expect(loggingBlock![0]).toContain("target_bucket = aws_s3_bucket.cloudtrail_access_logs.id");
      expect(loggingBlock![0]).toContain('target_prefix = "cloudtrail-logs/"');
    });

    test("has bucket policy for CloudTrail", () => {
      expect(configContent).toContain('resource "aws_s3_bucket_policy" "cloudtrail_logs_policy"');
      expect(configContent).toContain("AWSCloudTrailAclCheck");
      expect(configContent).toContain("AWSCloudTrailWrite");
      expect(configContent).toContain("cloudtrail.amazonaws.com");
    });

    test("S3 buckets have Environment = Production tag", () => {
      const accessLogsBucket = configContent.match(/resource "aws_s3_bucket" "cloudtrail_access_logs"[\s\S]*?^}/m);
      const logsBucket = configContent.match(/resource "aws_s3_bucket" "cloudtrail_logs"[\s\S]*?^}/m);
      expect(accessLogsBucket![0]).toContain('Environment = "Production"');
      expect(logsBucket![0]).toContain('Environment = "Production"');
    });
  });

  describe("CloudTrail Configuration", () => {
    test("creates CloudTrail", () => {
      expect(configContent).toContain('resource "aws_cloudtrail" "main_trail"');
      expect(configContent).toMatch(/name\s*=\s*"main-cloudtrail"/);
    });

    test("CloudTrail uses S3 bucket for logs", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toContain("s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id");
    });

    test("CloudTrail has logging enabled", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toMatch(/enable_logging\s*=\s*true/);
    });

    test("CloudTrail is multi-region", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has event selector for S3 data events", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toContain("event_selector");
      expect(cloudtrail![0]).toContain("data_resource");
      expect(cloudtrail![0]).toContain("AWS::S3::Object");
    });

    test("CloudTrail depends on S3 bucket policy", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toContain("depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]");
    });

    test("CloudTrail has Environment = Production tag", () => {
      const cloudtrail = configContent.match(/resource "aws_cloudtrail" "main_trail"[\s\S]*?^}/m);
      expect(cloudtrail![0]).toContain('Environment = "Production"');
    });
  });

  describe("IAM Configuration", () => {
    test("has IAM assume role policy for EC2", () => {
      expect(configContent).toContain('data "aws_iam_policy_document" "ec2_assume_role"');
      expect(configContent).toMatch(/actions\s*=\s*\["sts:AssumeRole"\]/);
      expect(configContent).toMatch(/identifiers\s*=\s*\["ec2\.amazonaws\.com"\]/);
    });

    test("has IAM policy document for S3 read access", () => {
      expect(configContent).toContain('data "aws_iam_policy_document" "s3_read_policy"');
      expect(configContent).toContain("s3:GetObject");
      expect(configContent).toContain("s3:ListBucket");
    });

    test("creates IAM role for EC2", () => {
      expect(configContent).toContain('resource "aws_iam_role" "ec2_s3_role"');
      expect(configContent).toMatch(/name\s*=\s*"ec2-s3-read-role"/);
    });

    test("IAM role has inline policy attached", () => {
      const roleBlock = configContent.match(/resource "aws_iam_role" "ec2_s3_role"[\s\S]*?^}/m);
      expect(roleBlock![0]).toContain("inline_policy");
      expect(roleBlock![0]).toContain("s3-read-policy");
    });

    test("creates IAM instance profile", () => {
      expect(configContent).toContain('resource "aws_iam_instance_profile" "ec2_profile"');
      expect(configContent).toMatch(/name\s*=\s*"ec2-s3-read-profile"/);
      expect(configContent).toContain("role = aws_iam_role.ec2_s3_role.name");
    });

    test("IAM resources have Environment = Production tag", () => {
      const roleBlock = configContent.match(/resource "aws_iam_role" "ec2_s3_role"[\s\S]*?^}/m);
      const profileBlock = configContent.match(/resource "aws_iam_instance_profile" "ec2_profile"[\s\S]*?^}/m);
      expect(roleBlock![0]).toContain('Environment = "Production"');
      expect(profileBlock![0]).toContain('Environment = "Production"');
    });
  });

  describe("EC2 Instance Configuration", () => {
    test("creates EC2 instance in private subnet", () => {
      expect(configContent).toContain('resource "aws_instance" "app_private_instance"');
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("subnet_id              = aws_subnet.private_subnet_1.id");
    });

    test("EC2 instance uses Amazon Linux 2 AMI", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("ami                    = data.aws_ami.amazon_linux_2.id");
    });

    test("EC2 instance uses appropriate instance type", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toMatch(/instance_type\s*=\s*"t[23]\.(micro|small|medium)"/);
    });

    test("EC2 instance has IAM instance profile attached", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name");
    });

    test("EC2 instance has private security group attached", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("vpc_security_group_ids = [aws_security_group.sg_private_ec2.id]");
    });

    test("EC2 instance has encrypted root volume", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("root_block_device");
      expect(ec2Block![0]).toMatch(/encrypted\s*=\s*true/);
    });

    test("EC2 instance has IMDSv2 enabled", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain("metadata_options");
      expect(ec2Block![0]).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("EC2 instance has Environment = Production tag", () => {
      const ec2Block = configContent.match(/resource "aws_instance" "app_private_instance"[\s\S]*?^}/m);
      expect(ec2Block![0]).toContain('Environment = "Production"');
    });
  });

  describe("Tagging Policy", () => {
    test("all resources have Environment = Production tag", () => {
      const productionTagCount = (configContent.match(/Environment\s*=\s*"Production"/g) || []).length;
      expect(productionTagCount).toBeGreaterThanOrEqual(15);
    });

    test("VPC and networking resources are tagged", () => {
      expect(configContent).toMatch(/resource "aws_vpc"[\s\S]*?Environment = "Production"/);
      expect(configContent).toMatch(/resource "aws_internet_gateway"[\s\S]*?Environment = "Production"/);
      expect(configContent).toMatch(/resource "aws_nat_gateway"[\s\S]*?Environment = "Production"/);
    });

    test("all subnets are tagged", () => {
      const subnetBlocks = configContent.match(/resource "aws_subnet"[\s\S]*?^}/gm);
      expect(subnetBlocks).toBeTruthy();
      subnetBlocks!.forEach(subnet => {
        expect(subnet).toContain('Environment = "Production"');
      });
    });

    test("security groups are tagged", () => {
      const sgBlocks = configContent.match(/resource "aws_security_group"[\s\S]*?^}/gm);
      expect(sgBlocks).toBeTruthy();
      sgBlocks!.forEach(sg => {
        expect(sg).toContain('Environment = "Production"');
      });
    });

    test("S3 buckets are tagged", () => {
      const s3Blocks = configContent.match(/resource "aws_s3_bucket" "cloudtrail[\s\S]*?^}/gm);
      expect(s3Blocks).toBeTruthy();
      s3Blocks!.forEach(bucket => {
        expect(bucket).toContain('Environment = "Production"');
      });
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS credentials", () => {
      expect(configContent).not.toMatch(/aws_access_key_id/i);
      expect(configContent).not.toMatch(/aws_secret_access_key/i);
      expect(configContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test("no prevent_destroy lifecycle rules", () => {
      expect(configContent).not.toContain("prevent_destroy = true");
      expect(configContent).not.toMatch(/lifecycle\s*\{[\s\S]*?prevent_destroy\s*=\s*true/);
    });

    test("S3 buckets have force_destroy enabled for cleanup", () => {
      const s3Buckets = configContent.match(/resource "aws_s3_bucket"[\s\S]*?^}/gm);
      expect(s3Buckets).toBeTruthy();
      s3Buckets!.forEach(bucket => {
        expect(bucket).toContain("force_destroy = true");
      });
    });

    test("all S3 buckets block public access", () => {
      const publicAccessBlocks = configContent.match(/resource "aws_s3_bucket_public_access_block"/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(2);
    });

    test("all S3 buckets have encryption enabled", () => {
      const encryptionConfigs = configContent.match(/resource "aws_s3_bucket_server_side_encryption_configuration"/g);
      expect(encryptionConfigs).toBeTruthy();
      expect(encryptionConfigs!.length).toBeGreaterThanOrEqual(2);
    });

    test("all S3 buckets have versioning enabled", () => {
      const versioningConfigs = configContent.match(/resource "aws_s3_bucket_versioning"/g);
      expect(versioningConfigs).toBeTruthy();
      expect(versioningConfigs!.length).toBeGreaterThanOrEqual(2);
    });

    test("EC2 instance root volume is encrypted", () => {
      expect(configContent).toMatch(/root_block_device[\s\S]*?encrypted\s*=\s*true/);
    });

    test("EC2 instance uses IMDSv2 (required)", () => {
      expect(configContent).toMatch(/http_tokens\s*=\s*"required"/);
    });
  });

  describe("Resource Dependencies", () => {
    test("NAT Gateway depends on Internet Gateway", () => {
      const natBlock = configContent.match(/resource "aws_nat_gateway"[\s\S]*?^}/m);
      expect(natBlock![0]).toContain("depends_on = [aws_internet_gateway.main_igw]");
    });

    test("CloudTrail depends on S3 bucket policy", () => {
      const cloudtrailBlock = configContent.match(/resource "aws_cloudtrail"[\s\S]*?^}/m);
      expect(cloudtrailBlock![0]).toContain("depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]");
    });

    test("resources reference correct VPC", () => {
      expect(configContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main_vpc\.id/);
    });

    test("subnets reference correct VPC", () => {
      const subnetCount = (configContent.match(/vpc_id\s*=\s*aws_vpc\.main_vpc\.id/g) || []).length;
      expect(subnetCount).toBeGreaterThanOrEqual(4);
    });

    test("route tables reference correct gateways", () => {
      expect(configContent).toContain("gateway_id = aws_internet_gateway.main_igw.id");
      expect(configContent).toContain("nat_gateway_id = aws_nat_gateway.main_nat_gw.id");
    });

    test("security group references are correct", () => {
      expect(configContent).toContain("security_groups = [aws_security_group.sg_public_ssh.id]");
      expect(configContent).toContain("vpc_security_group_ids = [aws_security_group.sg_private_ec2.id]");
    });
  });

  describe("Naming Conventions", () => {
    test("resources have descriptive names", () => {
      expect(configContent).toContain("main-vpc");
      expect(configContent).toContain("main-igw");
      expect(configContent).toContain("main-nat-gw");
      expect(configContent).toContain("public_subnet_az1");
      expect(configContent).toContain("private_subnet_az1");
      expect(configContent).toContain("public-route-table");
      expect(configContent).toContain("private-route-table");
      expect(configContent).toContain("public-ssh-sg");
      expect(configContent).toContain("private-ec2-sg");
      expect(configContent).toContain("main-cloudtrail");
      expect(configContent).toContain("app-private-instance");
    });

    test("IAM resources have descriptive names", () => {
      expect(configContent).toContain("ec2-s3-read-role");
      expect(configContent).toContain("ec2-s3-read-profile");
      expect(configContent).toContain("s3-read-policy");
    });

    test("S3 buckets have descriptive names with account ID", () => {
      expect(configContent).toContain("cloudtrail-logs-bucket-");
      expect(configContent).toContain("cloudtrail-logs-access-bucket-");
      expect(configContent).toContain("data.aws_caller_identity.current.account_id");
    });
  });
});
