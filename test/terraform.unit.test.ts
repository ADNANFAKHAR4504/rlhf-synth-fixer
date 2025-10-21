// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure in ../lib/tap_stack.tf
// Tests validate the presence and configuration of all AWS resources

import fs from "fs";
import path from "path";

const TAP_STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform VPC Infrastructure Unit Tests - tap_stack.tf", () => {
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
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf handles it)", () => {
      expect(tapStackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block in tap_stack.tf (provider.tf handles it)", () => {
      expect(tapStackContent).not.toMatch(/\bterraform\s*{\s*required_version/);
    });
  });

  describe("Variables Configuration", () => {
    test("declares aws_region variable with default us-west-2", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("declares region variable for compatibility", () => {
      expect(tapStackContent).toMatch(/variable\s+"region"\s*{/);
    });

    test("declares vpc_cidr variable with default 10.0.0.0/16", () => {
      expect(tapStackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares public_subnet_cidrs variable with 3 subnets", () => {
      expect(tapStackContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(tapStackContent).toMatch(/type\s*=\s*list\(string\)/);
      expect(tapStackContent).toMatch(/"10\.0\.1\.0\/24"/);
      expect(tapStackContent).toMatch(/"10\.0\.2\.0\/24"/);
      expect(tapStackContent).toMatch(/"10\.0\.3\.0\/24"/);
    });

    test("declares private_subnet_cidrs variable with 3 subnets", () => {
      expect(tapStackContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
      expect(tapStackContent).toMatch(/"10\.0\.101\.0\/24"/);
      expect(tapStackContent).toMatch(/"10\.0\.102\.0\/24"/);
      expect(tapStackContent).toMatch(/"10\.0\.103\.0\/24"/);
    });

    test("declares allowed_ssh_ip variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"allowed_ssh_ip"\s*{/);
    });

    test("declares instance_type variable with default t2.micro", () => {
      expect(tapStackContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(tapStackContent).toMatch(/default\s*=\s*"t2\.micro"/);
    });

    test("declares bucket_name variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"bucket_name"\s*{/);
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
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("enables DNS hostnames and DNS support", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC has appropriate tags", () => {
      const vpcSection = tapStackContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
      expect(vpcSection).toBeTruthy();
      if (vpcSection) {
        expect(vpcSection[0]).toMatch(/tags\s*=\s*{/);
        expect(vpcSection[0]).toMatch(/Name\s*=\s*"main-vpc-\$\{var\.environment_suffix\}"/);
      }
    });
  });

  describe("Internet Gateway", () => {
    test("creates Internet Gateway resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe("Elastic IPs for NAT Gateways", () => {
    test("creates Elastic IP resources with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(tapStackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("EIP depends on Internet Gateway", () => {
      const eipSection = tapStackContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?^}/m);
      expect(eipSection).toBeTruthy();
      if (eipSection) {
        expect(eipSection[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      }
    });
  });

  describe("Public Subnets", () => {
    test("creates public subnet resources with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    });

    test("public subnets reference VPC", () => {
      const publicSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetSection).toBeTruthy();
      if (publicSubnetSection) {
        expect(publicSubnetSection[0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      }
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetSection).toBeTruthy();
      if (publicSubnetSection) {
        expect(publicSubnetSection[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      }
    });

    test("public subnets distributed across AZs", () => {
      const publicSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetSection).toBeTruthy();
      if (publicSubnetSection) {
        expect(publicSubnetSection[0]).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
      }
    });
  });

  describe("Private Subnets", () => {
    test("creates private subnet resources with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("private subnets reference VPC", () => {
      const privateSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetSection).toBeTruthy();
      if (privateSubnetSection) {
        expect(privateSubnetSection[0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      }
    });

    test("private subnets distributed across AZs", () => {
      const privateSubnetSection = tapStackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetSection).toBeTruthy();
      if (privateSubnetSection) {
        expect(privateSubnetSection[0]).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
      }
    });
  });

  describe("NAT Gateways", () => {
    test("creates NAT Gateway resources with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    });

    test("NAT Gateways use allocated Elastic IPs", () => {
      const natSection = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natSection).toBeTruthy();
      if (natSection) {
        expect(natSection[0]).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      }
    });

    test("NAT Gateways deployed in public subnets", () => {
      const natSection = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natSection).toBeTruthy();
      if (natSection) {
        expect(natSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      }
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      const natSection = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natSection).toBeTruthy();
      if (natSection) {
        expect(natSection[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      }
    });
  });

  describe("Route Tables", () => {
    test("creates public route table", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("public route table routes to Internet Gateway", () => {
      const publicRtSection = tapStackContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicRtSection).toBeTruthy();
      if (publicRtSection) {
        expect(publicRtSection[0]).toMatch(/route\s*{/);
        expect(publicRtSection[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
        expect(publicRtSection[0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      }
    });

    test("creates private route tables with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("private route tables route to NAT Gateways", () => {
      const privateRtSection = tapStackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateRtSection).toBeTruthy();
      if (privateRtSection) {
        expect(privateRtSection[0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
      }
    });
  });

  describe("Route Table Associations", () => {
    test("creates public route table associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    });

    test("public associations link subnets to public route table", () => {
      const publicRtaSection = tapStackContent.match(/resource\s+"aws_route_table_association"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicRtaSection).toBeTruthy();
      if (publicRtaSection) {
        expect(publicRtaSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
        expect(publicRtaSection[0]).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
      }
    });

    test("creates private route table associations", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("private associations link subnets to private route tables", () => {
      const privateRtaSection = tapStackContent.match(/resource\s+"aws_route_table_association"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateRtaSection).toBeTruthy();
      if (privateRtaSection) {
        expect(privateRtaSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
        expect(privateRtaSection[0]).toMatch(/route_table_id\s*=\s*aws_route_table\.private\[count\.index\]\.id/);
      }
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("creates S3 bucket resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*"\$\{var\.bucket_name\}-\$\{var\.environment_suffix\}"/);
    });

    test("S3 bucket has force_destroy enabled", () => {
      const s3Section = tapStackContent.match(/resource\s+"aws_s3_bucket"\s+"main"\s*{[\s\S]*?^}/m);
      expect(s3Section).toBeTruthy();
      if (s3Section) {
        expect(s3Section[0]).toMatch(/force_destroy\s*=\s*true/);
      }
    });

    test("enables S3 bucket versioning", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("blocks all public access to S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enables server-side encryption with AES256", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"\s*{/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates IAM role for EC2 S3 access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_s3_access"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"ec2-s3-access-role-\$\{var\.environment_suffix\}"/);
    });

    test("IAM role has correct assume role policy", () => {
      const iamRoleSection = tapStackContent.match(/resource\s+"aws_iam_role"\s+"ec2_s3_access"\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/);
      expect(iamRoleSection).toBeTruthy();
      if (iamRoleSection) {
        expect(iamRoleSection[0]).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
        expect(iamRoleSection[0]).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
      }
    });

    test("creates IAM role policy for S3 access", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_access"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"ec2-s3-access-policy-\$\{var\.environment_suffix\}"/);
    });

    test("IAM policy includes S3 permissions", () => {
      const iamPolicySection = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_access"\s*{[\s\S]*?policy\s*=\s*jsonencode[\s\S]*?Resource\s*=\s*\[/);
      expect(iamPolicySection).toBeTruthy();
      if (iamPolicySection) {
        expect(iamPolicySection[0]).toMatch(/s3:GetObject/);
        expect(iamPolicySection[0]).toMatch(/s3:PutObject/);
        expect(iamPolicySection[0]).toMatch(/s3:DeleteObject/);
        expect(iamPolicySection[0]).toMatch(/s3:ListBucket/);
      }
    });

    test("creates IAM instance profile", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_s3_access"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"ec2-s3-access-profile-\$\{var\.environment_suffix\}"/);
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_s3_access\.name/);
    });
  });

  describe("S3 Bucket Policy", () => {
    test("creates S3 bucket policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"main"\s*{/);
    });

    test("bucket policy allows IAM role access", () => {
      const bucketPolicySection = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"main"\s*{[\s\S]*?depends_on/);
      expect(bucketPolicySection).toBeTruthy();
      if (bucketPolicySection) {
        expect(bucketPolicySection[0]).toMatch(/AllowVPCAndRoleAccess/);
        expect(bucketPolicySection[0]).toMatch(/aws_iam_role\.ec2_s3_access\.arn/);
      }
    });

    test("bucket policy denies insecure transport", () => {
      const bucketPolicySection = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"main"\s*{[\s\S]*?depends_on/);
      expect(bucketPolicySection).toBeTruthy();
      if (bucketPolicySection) {
        expect(bucketPolicySection[0]).toMatch(/DenyInsecureTransport/);
        expect(bucketPolicySection[0]).toMatch(/aws:SecureTransport/);
      }
    });

    test("bucket policy depends on public access block", () => {
      const bucketPolicySection = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"main"\s*{[\s\S]*?^}/m);
      expect(bucketPolicySection).toBeTruthy();
      if (bucketPolicySection) {
        expect(bucketPolicySection[0]).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_public_access_block\.main\]/);
      }
    });
  });

  describe("Security Group", () => {
    test("creates EC2 security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*"ec2-security-group-\$\{var\.environment_suffix\}"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("security group allows SSH from specified IP", () => {
      const sgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^}/m);
      expect(sgSection).toBeTruthy();
      if (sgSection) {
        expect(sgSection[0]).toMatch(/ingress\s*{/);
        expect(sgSection[0]).toMatch(/from_port\s*=\s*22/);
        expect(sgSection[0]).toMatch(/to_port\s*=\s*22/);
        expect(sgSection[0]).toMatch(/protocol\s*=\s*"tcp"/);
        expect(sgSection[0]).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_ip\]/);
      }
    });

    test("security group allows internal VPC traffic", () => {
      const sgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^}/m);
      expect(sgSection).toBeTruthy();
      if (sgSection) {
        expect(sgSection[0]).toMatch(/cidr_blocks\s*=\s*\[var\.vpc_cidr\]/);
      }
    });

    test("security group allows all outbound traffic", () => {
      const sgSection = tapStackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^}/m);
      expect(sgSection).toBeTruthy();
      if (sgSection) {
        expect(sgSection[0]).toMatch(/egress\s*{/);
        expect(sgSection[0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      }
    });
  });

  describe("EC2 Instances", () => {
    test("creates EC2 instances with count", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_instance"\s+"private"\s*{/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("EC2 instances use specified AMI and instance type", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
        expect(ec2Section[0]).toMatch(/instance_type\s*=\s*var\.instance_type/);
      }
    });

    test("EC2 instances deployed in private subnets", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
      }
    });

    test("EC2 instances use security group", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
      }
    });

    test("EC2 instances have IAM instance profile attached", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_s3_access\.name/);
      }
    });

    test("EC2 instances have user_data script", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/user_data\s*=\s*<<-EOF/);
      }
    });

    test("EC2 instances have IMDSv2 enabled", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/metadata_options\s*{/);
        expect(ec2Section[0]).toMatch(/http_tokens\s*=\s*"required"/);
      }
    });

    test("EC2 instances have encrypted root volumes", () => {
      const ec2Section = tapStackContent.match(/resource\s+"aws_instance"\s+"private"\s*{[\s\S]*?^}/m);
      expect(ec2Section).toBeTruthy();
      if (ec2Section) {
        expect(ec2Section[0]).toMatch(/root_block_device\s*{/);
        expect(ec2Section[0]).toMatch(/encrypted\s*=\s*true/);
      }
    });
  });

  describe("VPC Endpoint", () => {
    test("creates S3 VPC endpoint", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("S3 VPC endpoint uses correct service name", () => {
      const vpcEndpointSection = tapStackContent.match(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{[\s\S]*?^}/m);
      expect(vpcEndpointSection).toBeTruthy();
      if (vpcEndpointSection) {
        expect(vpcEndpointSection[0]).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
      }
    });

    test("S3 VPC endpoint associated with private route tables", () => {
      const vpcEndpointSection = tapStackContent.match(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{[\s\S]*?^}/m);
      expect(vpcEndpointSection).toBeTruthy();
      if (vpcEndpointSection) {
        expect(vpcEndpointSection[0]).toMatch(/route_table_ids\s*=\s*aws_route_table\.private\[\*\]\.id/);
      }
    });
  });

  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("declares public_subnet_ids output", () => {
      expect(tapStackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("declares private_subnet_ids output", () => {
      expect(tapStackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("declares nat_gateway_ids output", () => {
      expect(tapStackContent).toMatch(/output\s+"nat_gateway_ids"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_nat_gateway\.main\[\*\]\.id/);
    });

    test("declares ec2_instance_ids output", () => {
      expect(tapStackContent).toMatch(/output\s+"ec2_instance_ids"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_instance\.private\[\*\]\.id/);
    });

    test("declares s3_bucket_name output", () => {
      expect(tapStackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_s3_bucket\.main\.id/);
    });

    test("declares ec2_private_ips output", () => {
      expect(tapStackContent).toMatch(/output\s+"ec2_private_ips"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_instance\.private\[\*\]\.private_ip/);
    });

    test("declares security_group_id output", () => {
      expect(tapStackContent).toMatch(/output\s+"security_group_id"\s*{/);
      expect(tapStackContent).toMatch(/value\s*=\s*aws_security_group\.ec2\.id/);
    });
  });

  describe("Security Best Practices", () => {
    test("S3 bucket encryption is configured", () => {
      expect(tapStackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test("S3 bucket public access is blocked", () => {
      expect(tapStackContent).toMatch(/aws_s3_bucket_public_access_block/);
    });

    test("EC2 instances use IAM roles (not access keys)", () => {
      expect(tapStackContent).toMatch(/iam_instance_profile/);
      expect(tapStackContent).not.toMatch(/access_key/);
      expect(tapStackContent).not.toMatch(/secret_key/);
    });

    test("EBS volumes are encrypted", () => {
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("IMDSv2 is enforced on EC2 instances", () => {
      expect(tapStackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("S3 bucket policy enforces secure transport", () => {
      expect(tapStackContent).toMatch(/aws:SecureTransport/);
    });
  });

  describe("Infrastructure Requirements Compliance", () => {
    test("VPC CIDR is 10.0.0.0/16", () => {
      expect(tapStackContent).toMatch(/10\.0\.0\.0\/16/);
    });

    test("has exactly 3 public subnets", () => {
      const publicSubnets = tapStackContent.match(/"10\.0\.[1-3]\.0\/24"/g);
      expect(publicSubnets).toBeTruthy();
      expect(publicSubnets?.length).toBe(3);
    });

    test("has exactly 3 private subnets", () => {
      const privateSubnets = tapStackContent.match(/"10\.0\.10[1-3]\.0\/24"/g);
      expect(privateSubnets).toBeTruthy();
      expect(privateSubnets?.length).toBe(3);
    });

    test("NAT Gateways are in public subnets", () => {
      const natSection = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natSection).toBeTruthy();
      if (natSection) {
        expect(natSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public/);
      }
    });

    test("private subnets do not have direct Internet Gateway routes", () => {
      const privateRtSection = tapStackContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateRtSection).toBeTruthy();
      if (privateRtSection) {
        expect(privateRtSection[0]).not.toMatch(/gateway_id\s*=\s*aws_internet_gateway/);
        expect(privateRtSection[0]).toMatch(/nat_gateway_id/);
      }
    });

    test("region is us-west-2", () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("instance type is t2.micro", () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"t2\.micro"/);
    });

    test("S3 versioning is enabled", () => {
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });
});
